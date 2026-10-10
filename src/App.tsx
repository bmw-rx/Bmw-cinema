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
import { Footer } from './components/Footer';

export type PageRoute = 'home' | 'movies' | 'tvshows' | 'football' | 'search' | 'favorites' | 'movie';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [filterGenreId, setFilterGenreId] = useState<number | undefined>(undefined);
  const [autoPlayPlayer, setAutoPlayPlayer] = useState(false);

  // Initialize route from window.location (pathname, search params, or hash)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      const idParam = params.get('id');
      if (idParam) {
        setSelectedMovieId(Number(idParam));
        setCurrentPage('movie');
        return;
      }

      if (path.includes('movie.html')) {
        const id = params.get('id') || '550'; // Default fallback
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

      // Check if global page marker was set in standalone HTML file
      const bmwPage = (window as any).BMW_PAGE;
      if (bmwPage === 'football') setCurrentPage('football');
      else if (bmwPage === 'movies') setCurrentPage('movies');
      else if (bmwPage === 'tvshows') setCurrentPage('tvshows');
      else if (bmwPage === 'search') setCurrentPage('search');
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
      <main className="flex-grow">
        {currentPage === 'home' && (
          <HomeView
            onSelectMovie={handleSelectMovie}
            onWatchMovie={handleWatchMovie}
            onDownloadMovie={handleDownloadMovie}
            onNavigateToMovies={handleNavigateToMovies}
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
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(p) => navigateTo(p)} />
    </div>
  );
}
