import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Trophy, Layers, Play, AlertCircle } from 'lucide-react';
import { Movie, Genre } from '../types/movie';
import {
  getTrendingMovies,
  getNowPlayingMovies,
  getTopRatedMovies,
  getGenres,
  discoverMovies,
} from '../api/tmdb';
import { HeroBanner } from './HeroBanner';
import { MovieRow } from './MovieRow';
import { MovieGrid } from './MovieGrid';

interface HomeViewProps {
  onSelectMovie: (movie: Movie) => void;
  onWatchMovie: (movie: Movie) => void;
  onDownloadMovie: (movie: Movie) => void;
  onNavigateToMovies: (genreId?: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMovie,
  onWatchMovie,
  onDownloadMovie,
  onNavigateToMovies,
}) => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | undefined>(undefined);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);

  const [loading, setLoading] = useState(true);
  const [genreLoading, setGenreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadHomeData() {
      setLoading(true);
      setError(null);

      try {
        const [trendData, newRelData, topData, genresData] = await Promise.all([
          getTrendingMovies('day'),
          getNowPlayingMovies(1),
          getTopRatedMovies(1),
          getGenres(),
        ]);

        if (!isCurrent) return;
        setTrendingMovies(trendData);
        setNewReleases(newRelData);
        setTopRated(topData);
        setGenres(genresData);

        if (genresData.length > 0) {
          const firstGenre = genresData.find((g) => g.name === 'Action') || genresData[0];
          setSelectedGenreId(firstGenre.id);
        }
      } catch (err: any) {
        if (!isCurrent) return;
        console.error('Failed to load catalog data:', err);
        setError('Unable to load catalog titles. Please check your internet connection.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedGenreId) return;

    let isCurrent = true;
    async function loadGenreMovies() {
      setGenreLoading(true);
      try {
        const res = await discoverMovies({ genreId: selectedGenreId, page: 1 });
        if (isCurrent) {
          setGenreMovies(res.results.slice(0, 12));
        }
      } catch (err) {
        console.warn('Failed to load genre movies:', err);
      } finally {
        if (isCurrent) setGenreLoading(false);
      }
    }

    loadGenreMovies();

    return () => {
      isCurrent = false;
    };
  }, [selectedGenreId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
          <span>BMW</span>
          <span className="text-[#ff6b35]">CINEMA</span>
        </h2>
        <p className="text-gray-400 text-xs mt-1">Connecting to BMW CINEMA ultra HD catalog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="bg-[#141414] p-8 rounded-2xl border border-[#262626] max-w-md text-center text-white">
          <AlertCircle className="w-12 h-12 text-[#ff6b35] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#ff6b35] text-black font-semibold rounded-lg hover:bg-[#ff8354] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const selectedGenreName = genres.find((g) => g.id === selectedGenreId)?.name || 'Featured';

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* 1. Hero Section */}
      <HeroBanner
        featuredMovies={trendingMovies}
        onSelect={onSelectMovie}
        onWatch={onWatchMovie}
        onDownload={onDownloadMovie}
      />

      <div className="space-y-4 -mt-10 sm:-mt-14 relative z-20">
        {/* 2. Trending Now Section */}
        <MovieRow
          title="🔥 Trending Now"
          movies={trendingMovies}
          onSelect={onSelectMovie}
          onWatch={onWatchMovie}
          onDownload={onDownloadMovie}
          onViewAll={() => onNavigateToMovies()}
        />

        {/* 3. New Releases Section */}
        <MovieRow
          title="✨ New Releases"
          movies={newReleases}
          onSelect={onSelectMovie}
          onWatch={onWatchMovie}
          onDownload={onDownloadMovie}
          onViewAll={() => onNavigateToMovies()}
        />

        {/* 4. Top Rated Section */}
        <MovieRow
          title="🏆 Top Rated"
          movies={topRated}
          onSelect={onSelectMovie}
          onWatch={onWatchMovie}
          onDownload={onDownloadMovie}
          onViewAll={() => onNavigateToMovies()}
        />

        {/* 5. Genres Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-[#ff6b35] text-xs font-bold uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4" />
                <span>EXPLORE BY GENRE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Curated Genres
              </h2>
            </div>

            <button
              onClick={() => onNavigateToMovies(selectedGenreId || undefined)}
              className="text-xs sm:text-sm font-semibold text-[#ff6b35] hover:text-[#ff8354] self-start sm:self-auto"
            >
              View All {selectedGenreName} Movies &rarr;
            </button>
          </div>

          {/* Genre Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-6">
            {genres.map((genre) => {
              const isSelected = genre.id === selectedGenreId;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenreId(genre.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#ff6b35] text-black font-bold shadow-[0_2px_12px_rgba(255,107,53,0.4)]'
                      : 'bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626] border border-[#262626]'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>

          {/* Genre Movies Grid */}
          {genreLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading {selectedGenreName} titles...</p>
            </div>
          ) : (
            <MovieGrid
              movies={genreMovies}
              onSelect={onSelectMovie}
              onWatch={onWatchMovie}
              onDownload={onDownloadMovie}
            />
          )}
        </section>
      </div>
    </div>
  );
};
