/**
 * TMDB API Service ya BMW CINEMA
 * Inachukua data halisi za filamu: trending, popular, top rated, sasa zinazocheza,
 * maelezo kamili ya filamu, video (trailers), na vipindi vya TV.
 */

import { Genre, Movie, TVShow } from '../types/movie';

const TMDB_API_KEY = 'bc96f3d21bf9384fe03ffe84bace0ac1';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_BACKDROP = 'https://image.tmdb.org/t/p/original';
export const TMDB_IMAGE_BASE_THUMB = 'https://image.tmdb.org/t/p/w300';

/**
 * Msaada wa kurejesha picha ya poster au fallback
 */
export function getPosterUrl(path: string | null | undefined): string {
  if (!path) {
    return 'https://images.placeholders.dev/?width=500&height=750&text=BMW+CINEMA&theme=dark';
  }
  return `${TMDB_IMAGE_BASE_POSTER}${path}`;
}

/**
 * Msaada wa kurejesha picha ya backdrop au fallback
 */
export function getBackdropUrl(path: string | null | undefined): string {
  if (!path) {
    return 'https://images.placeholders.dev/?width=1280&height=720&text=BMW+CINEMA+HD&theme=dark';
  }
  return `${TMDB_IMAGE_BASE_BACKDROP}${path}`;
}

/**
 * Helper function ya kuita TMDB API
 */
async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US'); // TMDB primary language

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hitilafu ya TMDB (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`[TMDB API Error] ${endpoint}:`, error);
    throw error;
  }
}

/**
 * 1. Filamu Zinazovuma Sasa (Trending)
 */
export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: Movie[] }>(`/trending/movie/${timeWindow}`);
  return data.results || [];
}

/**
 * 2. Filamu Maarufu (Popular Movies)
 */
export async function getPopularMovies(page: number = 1): Promise<{ results: Movie[]; total_pages: number; total_results: number }> {
  return await fetchFromTMDB<{ results: Movie[]; total_pages: number; total_results: number }>(
    '/movie/popular',
    { page }
  );
}

/**
 * 3. Filamu za Juu Zaidi (Top Rated Movies)
 */
export async function getTopRatedMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/movie/top_rated', { page });
  return data.results || [];
}

/**
 * 4. Filamu Mpya Zinazoonyeshwa (Now Playing / New Releases)
 */
export async function getNowPlayingMovies(page: number = 1): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: Movie[] }>('/movie/now_playing', { page });
  return data.results || [];
}

/**
 * 5. Orodha ya Aina za Filamu (Genres)
 */
export async function getGenres(): Promise<Genre[]> {
  const data = await fetchFromTMDB<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres || [];
}

/**
 * 6. Filamu kwa mujibu wa Genre, Mwaka na Rating
 */
export async function discoverMovies(options: {
  genreId?: number;
  year?: number | string;
  minRating?: number;
  sortBy?: string;
  page?: number;
}): Promise<{ results: Movie[]; total_pages: number; total_results: number }> {
  const params: Record<string, string | number> = {
    page: options.page || 1,
    sort_by: options.sortBy || 'popularity.desc',
  };

  if (options.genreId) {
    params.with_genres = options.genreId;
  }
  if (options.year) {
    params.primary_release_year = options.year;
  }
  if (options.minRating) {
    params['vote_average.gte'] = options.minRating;
    params['vote_count.gte'] = 50; // ensure meaningful ratings
  }

  return await fetchFromTMDB<{ results: Movie[]; total_pages: number; total_results: number }>(
    '/discover/movie',
    params
  );
}

/**
 * 7. Maelezo Kamili ya Filamu (Details, Credits, Videos, Similar)
 */
export async function getMovieDetails(movieId: number | string): Promise<Movie> {
  return await fetchFromTMDB<Movie>(`/movie/${movieId}`, {
    append_to_response: 'videos,credits,similar',
  });
}

/**
 * 8. Video / Trailers za Filamu
 */
export async function getMovieVideos(movieId: number | string) {
  const data = await fetchFromTMDB<{ results: { id: string; key: string; name: string; site: string; type: string }[] }>(
    `/movie/${movieId}/videos`
  );
  return data.results || [];
}

/**
 * 9. Tafuta Filamu (Search Movies)
 */
export async function searchMovies(query: string, page: number = 1): Promise<{ results: Movie[]; total_pages: number; total_results: number }> {
  if (!query.trim()) {
    return { results: [], total_pages: 0, total_results: 0 };
  }
  return await fetchFromTMDB<{ results: Movie[]; total_pages: number; total_results: number }>(
    '/search/movie',
    { query, page, include_adult: 'false' }
  );
}

/**
 * 10. Vipindi vya TV Maarufu (Popular TV Shows)
 */
export async function getPopularTVShows(page: number = 1): Promise<{ results: TVShow[]; total_pages: number; total_results: number }> {
  return await fetchFromTMDB<{ results: TVShow[]; total_pages: number; total_results: number }>(
    '/tv/popular',
    { page }
  );
}

/**
 * 11. Vipindi vya TV vya Juu (Top Rated TV Shows)
 */
export async function getTopRatedTVShows(page: number = 1): Promise<TVShow[]> {
  const data = await fetchFromTMDB<{ results: TVShow[] }>('/tv/top_rated', { page });
  return data.results || [];
}

/**
 * 12. Tafuta Vipindi vya TV (Search TV Shows)
 */
export async function searchTVShows(query: string, page: number = 1): Promise<{ results: TVShow[]; total_pages: number }> {
  if (!query.trim()) {
    return { results: [], total_pages: 0 };
  }
  return await fetchFromTMDB<{ results: TVShow[]; total_pages: number }>(
    '/search/tv',
    { query, page }
  );
}
