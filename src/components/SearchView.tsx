import React, { useState, useEffect } from 'react';
import { Search, X, Flame } from 'lucide-react';
import { Movie } from '../types/movie';
import { searchMovies, getTrendingMovies } from '../api/tmdb';
import { MovieGrid } from './MovieGrid';

interface SearchViewProps {
  initialQuery?: string;
  onSelectMovie: (movie: Movie) => void;
  onWatchMovie?: (movie: Movie) => void;
  onDownloadMovie?: (movie: Movie) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onSelectMovie,
  onWatchMovie,
  onDownloadMovie,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    async function loadTrending() {
      try {
        const trend = await getTrendingMovies('day');
        setTrending(trend.slice(0, 12));
      } catch (err) {
        console.warn('Could not load trending:', err);
      }
    }
    loadTrending();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchMovies(query);
        if (isCurrent) {
          setResults(res.results || []);
          setTotalResults(res.total_results || 0);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query]);

  const popularTags = [
    'Avatar',
    'Spider-Man',
    'Avengers',
    'Fast and Furious',
    'John Wick',
    'Batman',
    'Inception',
    'Interstellar',
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
          Search Movies & Series
        </h1>
        <p className="text-sm text-gray-400">
          Search through thousands of cinema releases and exclusive streaming titles.
        </p>
      </div>

      {/* Main Search Input Box */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#ff6b35]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, director, or cast member..."
            autoFocus
            className="w-full bg-[#141414] text-white pl-13 pr-12 py-4 rounded-2xl border-2 border-[#262626] focus:border-[#ff6b35] focus:outline-none text-base placeholder:text-gray-500 shadow-2xl transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#262626] text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#ff6b35]" />
            Trending searches:
          </span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#262626] hover:text-[#ff6b35] text-gray-300 rounded-full text-xs font-medium border border-[#262626] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Searching cinema database...</p>
        </div>
      ) : query.trim() ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              Search Results for: <span className="text-[#ff6b35]">"{query}"</span>
            </h2>
            <span className="text-xs text-gray-400">
              Total titles: {totalResults}
            </span>
          </div>

          <MovieGrid
            movies={results}
            onSelect={onSelectMovie}
            onWatch={onWatchMovie}
            onDownload={onDownloadMovie}
            emptyMessage={`No titles found matching "${query}". Try searching with different keywords.`}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="text-xl font-bold text-white">
              Trending Recommendations
            </h2>
          </div>
          <MovieGrid
            movies={trending}
            onSelect={onSelectMovie}
            onWatch={onWatchMovie}
            onDownload={onDownloadMovie}
          />
        </div>
      )}
    </div>
  );
};
