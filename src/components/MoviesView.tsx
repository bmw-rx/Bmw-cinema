import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Star, Calendar, Clapperboard } from 'lucide-react';
import { Movie, Genre } from '../types/movie';
import { discoverMovies, getGenres } from '../api/tmdb';
import { MovieGrid } from './MovieGrid';

interface MoviesViewProps {
  onSelectMovie: (movie: Movie) => void;
  onWatchMovie?: (movie: Movie) => void;
  onDownloadMovie?: (movie: Movie) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  onSelectMovie,
  onWatchMovie,
  onDownloadMovie,
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load genres
  useEffect(() => {
    async function loadGenres() {
      try {
        const g = await getGenres();
        setGenres(g);
      } catch (err) {
        console.warn('Failed to load genres:', err);
      }
    }
    loadGenres();
  }, []);

  // Fetch movies on filter change
  useEffect(() => {
    let isCurrent = true;

    async function fetchFilteredMovies() {
      setLoading(true);
      setError(null);
      try {
        const res = await discoverMovies({
          genreId: selectedGenre,
          year: selectedYear || undefined,
          minRating: selectedRating,
          sortBy,
          page,
        });

        if (!isCurrent) return;
        setMovies(res.results || []);
        setTotalPages(Math.min(res.total_pages || 1, 50));
      } catch (err: any) {
        if (!isCurrent) return;
        console.error('Failed to load movies:', err);
        setError('Unable to load catalog movies. Please check your internet connection.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    fetchFilteredMovies();

    return () => {
      isCurrent = false;
    };
  }, [selectedGenre, selectedYear, selectedRating, sortBy, page]);

  const displayedMovies = searchQuery.trim()
    ? movies.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : movies;

  const handleResetFilters = () => {
    setSelectedGenre(undefined);
    setSelectedYear('');
    setSelectedRating(undefined);
    setSearchQuery('');
    setSortBy('popularity.desc');
    setPage(1);
  };

  const yearsList = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#ff6b35] text-xs font-bold uppercase tracking-wider mb-1">
          <Clapperboard className="w-4 h-4" />
          <span>BMW CINEMA ARCHIVE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          All Movies
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Browse through thousands of cinema hits available in 4K Ultra HD and 1080p.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#141414] rounded-2xl p-5 border border-[#262626] mb-8 space-y-4 shadow-xl">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search by title within current view..."
            className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#262626] focus:border-[#ff6b35] focus:outline-none text-sm placeholder:text-gray-500 transition-colors"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Genre
            </label>
            <select
              value={selectedGenre || ''}
              onChange={(e) => {
                setSelectedGenre(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-lg border border-[#262626] focus:border-[#ff6b35] text-xs focus:outline-none"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Release Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-lg border border-[#262626] focus:border-[#ff6b35] text-xs focus:outline-none"
            >
              <option value="">All Years</option>
              {yearsList.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Minimum Rating
            </label>
            <select
              value={selectedRating || ''}
              onChange={(e) => {
                setSelectedRating(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-lg border border-[#262626] focus:border-[#ff6b35] text-xs focus:outline-none"
            >
              <option value="">All Ratings</option>
              <option value="8">⭐⭐⭐⭐ 8.0+ (Masterpieces)</option>
              <option value="7">⭐⭐⭐ 7.0+ (Great)</option>
              <option value="6">⭐⭐ 6.0+ (Good)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1a1a1a] text-white px-3 py-2 rounded-lg border border-[#262626] focus:border-[#ff6b35] text-xs focus:outline-none"
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="primary_release_date.desc">Newest Releases</option>
            </select>
          </div>
        </div>

        {/* Reset Option */}
        {(selectedGenre || selectedYear || selectedRating || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#262626] text-xs">
            <span className="text-gray-400">
              Active filters applied.
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-[#ff6b35] hover:underline font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid State */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading movies from catalog...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-[#141414] rounded-2xl border border-[#262626] p-6 max-w-md mx-auto">
          <p className="text-[#ff6b35] font-semibold text-sm mb-3">{error}</p>
          <button
            onClick={() => setPage(1)}
            className="px-4 py-2 bg-[#ff6b35] text-black font-semibold text-xs rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <MovieGrid
            movies={displayedMovies}
            onSelect={onSelectMovie}
            onWatch={onWatchMovie}
            onDownload={onDownloadMovie}
            emptyMessage="No titles match your filter criteria. Try adjusting your selections."
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold rounded-lg border border-[#262626] hover:bg-[#262626] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                &larr; Previous Page
              </button>
              <span className="text-xs text-gray-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold rounded-lg border border-[#262626] hover:bg-[#262626] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next Page &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
