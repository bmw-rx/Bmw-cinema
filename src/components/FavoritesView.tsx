import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Play } from 'lucide-react';
import { Movie } from '../types/movie';
import { getFavorites } from '../services/storage';
import { MovieGrid } from './MovieGrid';

interface FavoritesViewProps {
  onSelectMovie: (movie: Movie) => void;
  onWatchMovie?: (movie: Movie) => void;
  onDownloadMovie?: (movie: Movie) => void;
  onExploreMovies: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectMovie,
  onWatchMovie,
  onDownloadMovie,
  onExploreMovies,
}) => {
  const [favorites, setFavorites] = useState<Movie[]>([]);

  const refreshFavs = () => {
    setFavorites(getFavorites());
  };

  useEffect(() => {
    refreshFavs();
    window.addEventListener('bmw_favorites_updated', refreshFavs);
    return () => window.removeEventListener('bmw_favorites_updated', refreshFavs);
  }, []);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all titles from your list?')) {
      localStorage.removeItem('bmw_cinema_favorites_v1');
      setFavorites([]);
      window.dispatchEvent(new Event('bmw_favorites_updated'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#ff6b35] text-xs font-bold uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-current" />
            <span>MY COLLECTION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Saved Titles (My List)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Titles you have bookmarked on this device for instant streaming and downloading.
          </p>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 bg-[#141414] hover:bg-[#1a1a1a] rounded-lg border border-[#262626] transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="py-24 text-center bg-[#141414] rounded-2xl border border-[#262626] p-8 max-w-lg mx-auto">
          <Heart className="w-14 h-14 text-gray-600 mx-auto mb-4 stroke-1" />
          <h3 className="text-xl font-bold text-white mb-2">Your List is Currently Empty</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            While browsing movies and series, tap the heart icon ❤️ on any poster to save it here for fast access later.
          </p>
          <button
            onClick={onExploreMovies}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8354] text-black font-bold text-sm rounded-xl transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Explore Popular Movies</span>
          </button>
        </div>
      ) : (
        <MovieGrid
          movies={favorites}
          onSelect={onSelectMovie}
          onWatch={onWatchMovie}
          onDownload={onDownloadMovie}
        />
      )}
    </div>
  );
};
