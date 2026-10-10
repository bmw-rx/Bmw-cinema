import React, { useState, useEffect } from 'react';
import { Play, Download, Info, Star, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Movie } from '../types/movie';
import { getBackdropUrl } from '../api/tmdb';
import { isFavorite, toggleFavorite } from '../services/storage';

interface HeroBannerProps {
  featuredMovies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatch: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredMovies,
  onSelect,
  onWatch,
  onDownload,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);

  const movies = featuredMovies.slice(0, 6);
  const currentMovie = movies[currentIndex] || movies[0];

  useEffect(() => {
    if (!currentMovie) return;
    setFavorite(isFavorite(currentMovie.id));
  }, [currentMovie]);

  // Auto-advance hero banner every 8 seconds
  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!currentMovie) {
    return (
      <div className="relative w-full h-[65vh] min-h-[480px] bg-[#141414] animate-pulse flex items-center justify-center">
        <span className="text-[#ff6b35] font-semibold text-lg">BMW CINEMA...</span>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(currentMovie.backdrop_path);
  const releaseYear = currentMovie.release_date
    ? new Date(currentMovie.release_date).getFullYear()
    : '2026';
  const rating = currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : '8.5';

  const handleToggleFav = () => {
    const updated = toggleFavorite(currentMovie);
    setFavorite(updated);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  return (
    <div className="relative w-full h-[80vh] min-h-[550px] max-h-[820px] overflow-hidden select-none bg-[#0d0d0d]">
      {/* Background Image and Overlays */}
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={currentMovie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out transform scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/30 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d0d0d] to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Tag & Metadata */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-300">
            <span className="px-2 py-0.5 font-bold tracking-wider uppercase bg-[#ff6b35] text-black rounded text-[11px]">
              BMW PREMIERE
            </span>
            <span className="px-1.5 py-0.5 rounded border border-gray-600 text-gray-300 text-[11px] font-semibold">
              4K ULTRA HD
            </span>
            <span>{releaseYear}</span>
            <span>·</span>
            <div className="flex items-center gap-1 text-[#ff6b35]">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-white font-semibold">{rating}</span>
              <span className="text-gray-400 text-xs">/10</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
            {currentMovie.title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {currentMovie.overview || 'Featured blockbuster streaming now exclusively on BMW CINEMA.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onWatch(currentMovie)}
              className="flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-bold text-black bg-[#ff6b35] hover:bg-[#ff8354] rounded-lg shadow-[0_4px_20px_rgba(255,107,53,0.45)] transition-all transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>▶ Watch Now</span>
            </button>

            <button
              onClick={() => onDownload(currentMovie)}
              className="flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-semibold text-white bg-[#1a1a1a]/85 hover:bg-[#262626] border border-white/20 backdrop-blur-md rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>⬇ Download</span>
            </button>

            <button
              onClick={() => onSelect(currentMovie)}
              className="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white bg-black/40 hover:bg-black/60 rounded-lg transition-colors border border-white/10"
              title="Details"
            >
              <Info className="w-5 h-5" />
              <span className="hidden sm:inline">Details</span>
            </button>

            <button
              onClick={handleToggleFav}
              className={`p-3 rounded-lg border transition-all ${
                favorite
                  ? 'bg-[#ff6b35] text-black border-[#ff6b35]'
                  : 'bg-black/40 text-gray-300 hover:text-[#ff6b35] border-white/10'
              }`}
              title={favorite ? 'In My List' : 'Add to My List'}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-black' : ''}`} />
            </button>
          </div>
        </div>

        {/* Carousel indicators */}
        {movies.length > 1 && (
          <div className="absolute right-4 sm:right-8 bottom-6 flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-black/60 hover:bg-[#ff6b35] text-white hover:text-black transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {movies.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex ? 'w-6 bg-[#ff6b35]' : 'w-2 bg-gray-600'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-black/60 hover:bg-[#ff6b35] text-white hover:text-black transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
