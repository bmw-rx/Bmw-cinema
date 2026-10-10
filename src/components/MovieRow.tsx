import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatch?: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
  onViewAll?: () => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  onSelect,
  onWatch,
  onDownload,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -700 : 700;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 sm:my-10 group/row">
      {/* Kichwa cha Sehemu (Section Header) */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-semibold text-[#ff6b35] hover:text-[#ff8354] transition-colors"
          >
            View All &rarr;
          </button>
        )}
      </div>

      {/* Slider Container na Navigation Buttons */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/80 hover:bg-[#ff6b35] text-white hover:text-black flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all shadow-xl disabled:opacity-0"
          aria-label="Rudi nyuma"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable list */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[155px] sm:w-[190px] md:w-[210px] shrink-0"
            >
              <MovieCard
                movie={movie}
                onSelect={onSelect}
                onWatch={onWatch}
                onDownload={onDownload}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/80 hover:bg-[#ff6b35] text-white hover:text-black flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all shadow-xl"
          aria-label="Endelea mbele"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};
