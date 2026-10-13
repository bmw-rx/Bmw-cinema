import React, { useState, useEffect } from 'react';
import { Movie } from './types/movie';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MoviesView } from './components/MoviesView';
import { TVShowsView } from './components/TVShowsView';
import { FootballView } from './components/FootballView';
import { SearchView } from './components/SearchView';
import { FavoritesView } from './components/FavoritesView';
import { MovieDetailView } from './components/MovieDetailView';
import { AuthView } from './components/AuthView';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PushNotificationToast } from './components/PushNotificationToast';
import {
  subscribeToLiveNotifications,
  unlockNotificationAudio,
  AppNotification,
} from './services/notifications';
import { subscribeToAuth } from './services/auth';
import { User } from 'firebase/auth';

export type PageRoute = 'home' | 'movies' | 'tvshows' | 'football' | 'search' | 'favorites' | 'movie' | 'auth' | 'admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [filterGenreId, setFilterGenreId] = useState<number | undefined>(undefined);
  const [autoPlayPlayer, setAutoPlayPlayer] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePushToast, setActivePushToast] = useState<AppNotification | null>(null);

  // Auth observer
  useEffect(() => {
    const unsub = subscribeToAuth((user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Unlock audio context on user interaction (essential for mobile phones)
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockNotificationAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Real-time live push notification subscription
  useEffect(() => {
    const unsubscribe = subscribeToLiveNotifications(
      currentUser?.email,
      (newNotif) => {
        setActivePushToast(newNotif);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.email]);

  // Initialize route from window.location (pathname, search params, or hash)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      // Check for /admin or admin.html or ?page=admin or #admin
      if (
        path.includes('admin') ||
        path === '/admin' ||
        hash === '#admin' ||
        params.get('page') === 'admin'
      ) {
        setCurrentPage('admin');
        return;
      }

      const idParam = params.get('id');
      if (idParam) {
        setSelectedMovieId(Number(idParam));
        setCurrentPage('movie');
        return;
      }

      if (path.includes('movie.html')) {
        const id = params.get('id') || '550';
        setSelectedMovieId(Number(id));
        setCurrentPage('movie');
        return;
      }

      if (path.includes('football.html') || hash === '#football' || params.get('page') === 'football') {
        setCurrentPage('football');
        return;
      }

      if (path.includes('movies.html') || hash === '#movies' || params.get('page') === 'movies') {
        setCurrentPage('movies');
        return;
      }

      if (path.includes('tvshows.html') || hash === '#tvshows' || params.get('page') === 'tvshows') {
        setCurrentPage('tvshows');
        return;
      }

      if (path.includes('search.html') || hash === '#search' || params.get('page') === 'search') {
        setCurrentPage('search');
        return;
      }

      if (hash === '#favorites' || params.get('page') === 'favorites') {
        setCurrentPage('favorites');
        return;
      }

      if (path.includes('auth.html') || hash === '#auth' || params.get('page') === 'auth') {
        setCurrentPage('auth');
        return;
      }

      // Check if global page marker was set in standalone HTML file
      const bmwPage = (window as any).BMW_PAGE;
      if (bmwPage === 'admin') setCurrentPage('admin');
      else if (bmwPage === 'football') setCurrentPage('football');
      else if (bmwPage === 'movies') setCurrentPage('movies');
      else if (bmwPage === 'tvshows') setCurrentPage('tvshows');
      else if (bmwPage === 'search') setCurrentPage('search');
      else if (bmwPage === 'auth') setCurrentPage('auth');
      else if (bmwPage === 'movie') {
        setSelectedMovieId(Number(params.get('id') || 550));
        setCurrentPage('movie');
      } else {
        setCurrentPage('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (page: PageRoute, movieId?: number, movieObj?: Movie, autoPlay = false) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'movie' && movieId) {
      setSelectedMovieId(movieId);
      if (movieObj) setSelectedMovie(movieObj);
      setAutoPlayPlayer(autoPlay);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('id', String(movieId));
      if (movieObj?.title) {
        newUrl.searchParams.set('title', movieObj.title);
      }
      newUrl.searchParams.delete('page');
      window.history.pushState({}, '', newUrl.toString());
    } else {
      setSelectedMovieId(null);
      setSelectedMovie(null);
      setAutoPlayPlayer(false);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('id');
      newUrl.searchParams.delete('title');
      if (page === 'home') {
        newUrl.searchParams.delete('page');
      } else if (page === 'admin') {
        newUrl.searchParams.set('page', 'admin');
      } else {
        newUrl.searchParams.set('page', page);
      }
      window.history.pushState({}, '', newUrl.toString());
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    navigateTo('movie', movie.id, movie, false);
  };

  const handleWatchMovie = (movie: Movie) => {
    navigateTo('movie', movie.id, movie, true);
    setTimeout(() => {
      const el = document.getElementById('video-player-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const handleDownloadMovie = (movie: Movie) => {
    navigateTo('movie', movie.id, movie, false);
    setTimeout(() => {
      const el = document.getElementById('download-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  const handleNavigateToMovies = (genreId?: number) => {
    if (genreId) setFilterGenreId(genreId);
    navigateTo('movies');
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans selection:bg-[#ff6b35] selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        activePage={currentPage}
        onNavigate={(p) => navigateTo(p)}
        onOpenSearch={() => navigateTo('search')}
      />

      {/* Main View Container */}
      <main className="flex-grow pt-16">
        {currentPage === 'home' && (
          <HomeView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
            onDownloadMovie={handleDownloadMovie}
            onNavigateToMovies={handleNavigateToMovies}
            onNavigateToChannel={() => navigateTo('football')}
          />
        )}

        {currentPage === 'movies' && (
          <MoviesView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
            onDownloadMovie={handleDownloadMovie}
          />
        )}

        {currentPage === 'tvshows' && (
          <TVShowsView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
          />
        )}

        {currentPage === 'football' && (
          <FootballView />
        )}

        {currentPage === 'search' && (
          <SearchView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
            onDownloadMovie={handleDownloadMovie}
          />
        )}

        {currentPage === 'favorites' && (
          <FavoritesView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
            onDownloadMovie={handleDownloadMovie}
            onExploreMovies={() => navigateTo('movies')}
          />
        )}

        {currentPage === 'movie' && selectedMovieId && (
          <MovieDetailView
            movieId={selectedMovieId}
            initialMovie={selectedMovie || undefined}
            onBack={() => navigateTo('home')}
            onSelectMovie={handleSelectMovie}
            autoPlay={autoPlayPlayer}
          />
        )}

        {currentPage === 'auth' && (
          <AuthView
            onBackToHome={() => navigateTo('home')}
            onNavigateToFavorites={() => navigateTo('favorites')}
            onNavigateToMovies={() => navigateTo('movies')}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPanel
            onBackToHome={() => navigateTo('home')}
            onNavigateToMovie={(id) => navigateTo('movie', id)}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(p) => navigateTo(p)} />

      {/* Real-time Phone Push Notification Toast */}
      <PushNotificationToast
        notification={activePushToast}
        onClose={() => setActivePushToast(null)}
        onNavigate={(p) => navigateTo(p as any)}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
