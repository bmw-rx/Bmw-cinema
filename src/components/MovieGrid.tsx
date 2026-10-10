import React from 'react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatch?: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
  emptyMessage?: string;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  onSelect,
  onWatch,
  onDownload,
  emptyMessage = 'No titles currently available.',
}) => {
  if (!movies || movies.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onSelect={onSelect}
          onWatch={onWatch}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};
