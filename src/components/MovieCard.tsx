import React, { useState } from 'react';
import { Star, Play, Download, Heart, Check } from 'lucide-react';
import { Movie } from '../types/movie';
import { getPosterUrl } from '../api/tmdb';
import { isFavorite, toggleFavorite } from '../services/storage';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onWatch?: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onWatch,
  onDownload,
}) => {
  const [favorite, setFavorite] = useState<boolean>(() => isFavorite(movie.id));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const posterUrl = getPosterUrl(movie.poster_path);
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavorite(movie);
    setFavorite(updated);
  };

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWatch) {
      onWatch(movie);
    } else {
      onSelect(movie);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(movie);
    } else {
      onSelect(movie);
    }
  };

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:z-30 hover:shadow-[0_12px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,107,53,0.25)] flex flex-col"
    >
      {/* Container ya Picha yenye uwiano wa 2:3 (Portrait) */}
      <div className="relative aspect-[2/3] w-full bg-[#141414] overflow-hidden">
        {/* Placeholder skeleton wakati picha inapakia */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse flex items-center justify-center">
            <span className="text-xs text-neutral-500 font-medium">BMW CINEMA</span>
          </div>
        )}

        {/* Picha ya Filamu */}
        <img
          src={imageError ? 'https://images.placeholders.dev/?width=500&height=750&text=BMW+CINEMA&theme=dark' : posterUrl}
          alt={movie.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Kitufe cha Favorites (Kona ya Juu Kulia) */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-full backdrop-blur-md transition-all ${
            favorite
              ? 'bg-[#ff6b35] text-black shadow-md'
              : 'bg-black/60 text-white hover:text-[#ff6b35] hover:bg-black/80 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={favorite ? 'Ondoa kwenye favorites' : 'Weka kwenye favorites'}
          title={favorite ? 'Ipo kwenye favorites' : 'Weka kwenye favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-black' : ''}`} />
        </button>

        {/* HD Quality Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-black/70 backdrop-blur-md text-[#ff6b35] rounded border border-[#ff6b35]/30">
          HD
        </div>

        {/* Hover Action Overlay yenye Vitufe: ▶ Watch na ⬇ Download */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 z-10">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleWatchClick}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-black bg-[#ff6b35] hover:bg-[#ff8354] rounded-lg shadow-[0_2px_10px_rgba(255,107,53,0.5)] transition-colors active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>▶ Watch</span>
            </button>

            <button
              onClick={handleDownloadClick}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-lg transition-colors border border-white/10 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>⬇ Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chini ya picha: Jina la filamu (font-weight 600), mwaka, na rating (⭐) */}
      <div className="p-3 flex flex-col flex-grow justify-between bg-[#1a1a1a]">
        <h3
          title={movie.title}
          className="text-white text-sm font-semibold tracking-normal line-clamp-1 group-hover:text-[#ff6b35] transition-colors"
        >
          {movie.title}
        </h3>

        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
          <span className="font-normal">{releaseYear}</span>
          <div className="flex items-center gap-1 text-[#ff6b35] font-medium">
            <Star className="w-3.5 h-3.5 fill-current text-[#ff6b35]" />
            <span className="text-white text-xs">{rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
