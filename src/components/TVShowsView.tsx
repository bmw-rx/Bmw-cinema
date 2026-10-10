import React, { useState, useEffect } from 'react';
import { Tv, Star, Search, Play } from 'lucide-react';
import { TVShow, Movie } from '../types/movie';
import { getPopularTVShows, getTopRatedTVShows, searchTVShows, getPosterUrl } from '../api/tmdb';

interface TVShowsViewProps {
  onSelectMovie: (movie: Movie) => void;
  onWatchMovie?: (movie: Movie) => void;
}

export const TVShowsView: React.FC<TVShowsViewProps> = ({
  onSelectMovie,
  onWatchMovie,
}) => {
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'popular' | 'top_rated'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadShows() {
      setLoading(true);
      setError(null);
      try {
        if (searchQuery.trim()) {
          const res = await searchTVShows(searchQuery);
          if (isCurrent) setTvShows(res.results || []);
        } else if (tab === 'popular') {
          const res = await getPopularTVShows();
          if (isCurrent) setTvShows(res.results || []);
        } else {
          const res = await getTopRatedTVShows();
          if (isCurrent) setTvShows(res || []);
        }
      } catch (err: any) {
        if (isCurrent) {
          console.error('Failed to load TV shows:', err);
          setError('Unable to load television shows. Please verify your connection.');
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadShows();
    }, searchQuery ? 300 : 0);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [tab, searchQuery]);

  const handleSelectShow = (show: TVShow) => {
    const movieObj: Movie = {
      id: show.id,
      title: show.name,
      original_title: show.original_name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      release_date: show.first_air_date,
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      popularity: show.popularity,
      genres: show.genres,
    };
    onSelectMovie(movieObj);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#ff6b35] text-xs font-bold uppercase tracking-wider mb-1">
            <Tv className="w-4 h-4" />
            <span>BMW CINEMA SERIES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            TV Shows & Series
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Stream seasons and episodes of the world's most acclaimed series in Ultra HD.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-[#141414] border border-[#262626] rounded-xl self-start md:self-auto">
          <button
            onClick={() => {
              setTab('popular');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'popular' && !searchQuery
                ? 'bg-[#ff6b35] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Popular Series
          </button>
          <button
            onClick={() => {
              setTab('top_rated');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'top_rated' && !searchQuery
                ? 'bg-[#ff6b35] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      {/* Search TV Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for TV series (e.g., Breaking Bad, Stranger Things, Game of Thrones)..."
          className="w-full bg-[#141414] text-white pl-10 pr-4 py-3 rounded-xl border border-[#262626] focus:border-[#ff6b35] focus:outline-none text-sm placeholder:text-gray-500 shadow-md"
        />
      </div>

      {/* TV Shows Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading television shows...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-[#ff6b35] text-sm">{error}</div>
      ) : tvShows.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm">
          No television shows found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
          {tvShows.map((show) => {
            const poster = getPosterUrl(show.poster_path);
            const year = show.first_air_date
              ? new Date(show.first_air_date).getFullYear()
              : 'N/A';
            const rating = show.vote_average ? show.vote_average.toFixed(1) : 'NR';

            return (
              <div
                key={show.id}
                onClick={() => handleSelectShow(show)}
                className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,107,53,0.25)] flex flex-col"
              >
                {/* Poster 2:3 */}
                <div className="relative aspect-[2/3] w-full bg-[#141414] overflow-hidden">
                  <img
                    src={poster}
                    alt={show.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-black/70 backdrop-blur-md text-[#ff6b35] rounded border border-[#ff6b35]/30">
                    SERIES
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-10">
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-black bg-[#ff6b35] hover:bg-[#ff8354] rounded-lg shadow-md transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>▶ Watch Now</span>
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex flex-col flex-grow justify-between bg-[#1a1a1a]">
                  <h3
                    title={show.name}
                    className="text-white text-sm font-semibold tracking-normal line-clamp-1 group-hover:text-[#ff6b35] transition-colors"
                  >
                    {show.name}
                  </h3>

                  <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                    <span>{year}</span>
                    <div className="flex items-center gap-1 text-[#ff6b35] font-medium">
                      <Star className="w-3.5 h-3.5 fill-current text-[#ff6b35]" />
                      <span className="text-white text-xs">{rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
