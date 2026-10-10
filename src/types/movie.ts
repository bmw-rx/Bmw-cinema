/**
 * Aina za Data (TypeScript Interfaces) za BMW CINEMA
 * Inashughulikia data kutoka TMDB API na David Cyril API
 */

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  status?: string;
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: VideoResult[];
  };
  similar?: {
    results: Movie[];
  };
}

export interface TVShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface DavidCyrilStreamResult {
  status: boolean;
  message?: string;
  streamUrl?: string;
  sources?: {
    quality: string;
    url: string;
    size?: string;
  }[];
  downloadUrl?: string;
}

export interface DownloadOption {
  quality: '480p' | '720p' | '1080p' | '4K';
  label: string;
  size: string;
  format: string;
  url?: string;
}
