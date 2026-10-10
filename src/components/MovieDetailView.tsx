import React, { useState, useEffect } from 'react';
import {
  Play,
  Download,
  Star,
  Clock,
  Calendar,
  Heart,
  ChevronLeft,
  Film,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { Movie, VideoResult } from '../types/movie';
import {
  getMovieDetails,
  getPosterUrl,
} from '../api/tmdb';
import {
  fetchAutomaticDownloads,
  getAutoEmbedUrl,
  AutoDownloadOption,
} from '../api/davidCyril';
import { isFavorite, toggleFavorite, addToWatchHistory } from '../services/storage';
import { MovieGrid } from './MovieGrid';

interface MovieDetailViewProps {
  movieId: number;
  initialMovie?: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  autoPlay?: boolean;
}

export const MovieDetailView: React.FC<MovieDetailViewProps> = ({
  movieId,
  initialMovie,
  onBack,
  onSelectMovie,
}) => {
  const [movie, setMovie] = useState<Movie | null>(initialMovie || null);
  const [loading, setLoading] = useState<boolean>(!initialMovie || !initialMovie.runtime);
  const [error, setError] = useState<string | null>(null);

  // Player State
  const [activePlayer, setActivePlayer] = useState<'autoembed' | 'trailer'>('autoembed');
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // Automatic Download State
  const [downloads, setDownloads] = useState<AutoDownloadOption[]>([]);
  const [downloadsLoading, setDownloadsLoading] = useState<boolean>(true);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Favorite State
  const [favorite, setFavorite] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      setDownloadsLoading(true);

      try {
        // 1. Fetch TMDB details
        const details = await getMovieDetails(movieId);
        if (!isMounted) return;

        setMovie(details);
        setFavorite(isFavorite(details.id));
        addToWatchHistory(details);

        // Find YouTube Trailer
        const videos = details.videos?.results || [];
        const officialTrailer = videos.find(
          (v: VideoResult) =>
            v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        ) || videos.find((v: VideoResult) => v.site === 'YouTube');

        if (officialTrailer) {
          setTrailerKey(officialTrailer.key);
        }

        // 2. Automatically retrieve download links silently in background
        const movieTitle = details.title || details.original_title || '';
        try {
          const autoDl = await fetchAutomaticDownloads(movieTitle);
          if (isMounted) {
            setDownloads(autoDl);
          }
        } catch (dErr) {
          console.warn('Download fetch error:', dErr);
        } finally {
          if (isMounted) setDownloadsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching movie details:', err);
          setError(err.message || 'An error occurred while loading movie information.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  // Secure download trigger without showing raw URLs in UI
  const handleSecureDownload = (opt: AutoDownloadOption) => {
    if (!movie) return;
    setDownloadSuccessToast(`Connecting to download server for ${movie.title} (${opt.quality})...`);

    setTimeout(() => {
      if (opt.targetUrl) {
        window.open(opt.targetUrl, '_blank', 'noopener,noreferrer');
      }
    }, 400);

    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 4000);
  };

  const handleToggleFav = () => {
    if (!movie) return;
    const res = toggleFavorite(movie);
    setFavorite(res);
  };

  if (loading && !movie) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center bg-[#0d0d0d] text-white">
        <div className="w-12 h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 max-w-3xl mx-auto bg-[#0d0d0d] text-white text-center">
        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#ff6b35] flex items-center justify-center mx-auto mb-4 text-[#ff6b35]">
          !
        </div>
        <h2 className="text-2xl font-bold mb-2">Movie Load Error</h2>
        <p className="text-gray-400 mb-6">{error || 'The requested movie was not found.'}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#ff6b35] text-black font-semibold rounded-lg hover:bg-[#ff8354] transition-colors"
        >
          &larr; Back to Catalog
        </button>
      </div>
    );
  }

  const posterUrl = getPosterUrl(movie.poster_path);
  const autoEmbedStreamUrl = getAutoEmbedUrl(movie.id);
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '2026';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  const runtimeHours = movie.runtime ? Math.floor(movie.runtime / 60) : null;
  const runtimeMins = movie.runtime ? movie.runtime % 60 : null;
  const runtimeFormatted = runtimeHours !== null ? `${runtimeHours}h ${runtimeMins}m` : null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-20">
      {/* Toast Feedback */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#1a1a1a] border border-[#ff6b35] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#ff6b35]" />
          <span className="text-sm font-medium">{downloadSuccessToast}</span>
        </div>
      )}

      {/* Top Back Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#ff6b35] transition-colors py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>
      </div>

      {/* Movie Presentation */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 2:3 Large Poster */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-[340px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-[#262626] bg-[#1a1a1a]">
              <img
                src={posterUrl}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Metadata & Synopsis */}
          <div className="lg:col-span-8 space-y-5">
            {movie.tagline && (
              <p className="text-xs uppercase tracking-widest text-[#ff6b35] font-bold">
                {movie.tagline}
              </p>
            )}

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>

            {/* Quick Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <span className="px-2 py-0.5 bg-[#ff6b35] text-black font-bold text-xs rounded">
                4K ULTRA HD
              </span>
              <div className="flex items-center gap-1 text-[#ff6b35] font-semibold">
                <Star className="w-4 h-4 fill-current" />
                <span>{rating} / 10</span>
                <span className="text-xs text-gray-400">({movie.vote_count} votes)</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{releaseYear}</span>
              </div>
              {runtimeFormatted && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{runtimeFormatted}</span>
                  </div>
                </>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 bg-[#1a1a1a] text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-[#262626]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Synopsis:
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                {movie.overview || 'No synopsis available for this title.'}
              </p>
            </div>

            {/* Cast */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Starring:
                </h4>
                <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                  {movie.credits.cast.slice(0, 5).map((actor) => (
                    <span
                      key={actor.id}
                      className="px-2.5 py-1 bg-[#141414] rounded-md border border-[#262626]"
                    >
                      {actor.name} <span className="text-gray-500">as</span> {actor.character}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <a
                href="#video-player-section"
                className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff8354] text-black font-bold text-sm rounded-xl shadow-[0_4px_20px_rgba(255,107,53,0.4)] transition-all transform hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Movie Stream</span>
              </a>

              <a
                href="#download-section"
                className="flex items-center gap-2 px-5 py-3 bg-[#1a1a1a] hover:bg-[#262626] text-white font-semibold text-sm rounded-xl border border-white/10 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Options</span>
              </a>

              <button
                onClick={handleToggleFav}
                className={`p-3 rounded-xl border transition-all ${
                  favorite
                    ? 'bg-[#ff6b35] text-black border-[#ff6b35]'
                    : 'bg-[#1a1a1a] text-gray-300 hover:text-[#ff6b35] border-white/10'
                }`}
                title={favorite ? 'Saved in My List' : 'Add to My List'}
              >
                <Heart className={`w-5 h-5 ${favorite ? 'fill-black' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIDEO PLAYER SECTION (Powered by AutoEmbed) */}
      <section
        id="video-player-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-12"
      >
        <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ff6b35]" />
              <h2 className="text-lg font-bold text-white">
                Stream Player: <span className="text-[#ff6b35]">{movie.title}</span>
              </h2>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-2 p-1 bg-[#1a1a1a] rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setActivePlayer('autoembed')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activePlayer === 'autoembed'
                    ? 'bg-[#ff6b35] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AutoEmbed Cinema Player
              </button>
              <button
                onClick={() => setActivePlayer('trailer')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activePlayer === 'trailer'
                    ? 'bg-[#ff6b35] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Official HD Trailer
              </button>
            </div>
          </div>

          {/* Player Screen */}
          <div id="videoContainer" className="relative aspect-video w-full bg-black flex items-center justify-center">
            {activePlayer === 'autoembed' ? (
              <iframe
                id="streamIframe"
                src={autoEmbedStreamUrl}
                title={`${movie.title} AutoEmbed Stream`}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                className="w-full h-full border-0"
              />
            ) : trailerKey ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${movie.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="text-center p-8">
                <Film className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Trailer currently unavailable.</p>
              </div>
            )}
          </div>

          {/* Player Footer */}
          <div className="p-4 bg-[#141414] border-t border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Status: AutoEmbed Cinema Stream Active</span>
            </div>
            <span>Compatible with all modern browsers, mobile devices, and Smart TVs</span>
          </div>
        </div>
      </section>

      {/* AUTOMATIC DOWNLOAD SECTION */}
      <section
        id="download-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-12"
      >
        <div className="bg-[#141414] rounded-2xl border border-[#262626] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Download className="w-6 h-6 text-[#ff6b35]" />
                <span>Download Options</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Direct high-speed packages resolved automatically for {movie.title}.
              </p>
            </div>
          </div>

          {/* Download Options (Raw URLs kept private and never exposed until clicked) */}
          <div id="downloadList" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloadsLoading ? (
              <div className="col-span-full py-8 text-center text-xs text-gray-400">
                Resolving verified download links...
              </div>
            ) : (
              downloads.map((dl) => (
                <div
                  key={dl.id}
                  className="bg-[#1a1a1a] rounded-xl p-5 border border-[#262626] hover:border-[#ff6b35]/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs font-black bg-[#ff6b35] text-black rounded">
                        {dl.quality}
                      </span>
                      {dl.size && (
                        <span className="text-xs font-semibold text-gray-300">
                          {dl.size}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-4">
                      {dl.label}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleSecureDownload(dl)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#ff6b35] hover:bg-[#ff8354] text-black font-bold text-xs rounded-lg transition-all active:scale-95 shadow-[0_2px_10px_rgba(255,107,53,0.3)]"
                  >
                    <Download className="w-4 h-4" />
                    <span>⬇ Download Now</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-[#262626] flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
            <span>Direct fast-link downloads powered by BMW CINEMA cloud delivery network.</span>
            <span className="text-[#ff6b35]">BMW CINEMA Fast-Link Server v2</span>
          </div>
        </div>
      </section>

      {/* RELATED MOVIES */}
      {movie.similar?.results && movie.similar.results.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
            Related Titles
          </h2>
          <MovieGrid
            movies={movie.similar.results.slice(0, 12)}
            onSelect={onSelectMovie}
          />
        </section>
      )}
    </div>
  );
};
