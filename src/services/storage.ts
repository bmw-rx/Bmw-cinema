/**
 * LocalStorage Service ya BMW CINEMA
 * Inahifadhi filamu zilizopendwa (Favorites) na historia ya kutazama
 */

import { Movie } from '../types/movie';

const FAVORITES_KEY = 'bmw_cinema_favorites_v1';
const HISTORY_KEY = 'bmw_cinema_history_v1';

export function getFavorites(): Movie[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Kushindwa kusoma favorites kutoka localStorage:', err);
    return [];
  }
}

export function isFavorite(movieId: number): boolean {
  const favs = getFavorites();
  return favs.some((m) => m.id === movieId);
}

export function toggleFavorite(movie: Movie): boolean {
  try {
    const favs = getFavorites();
    const exists = favs.some((m) => m.id === movie.id);
    let updated: Movie[];

    if (exists) {
      updated = favs.filter((m) => m.id !== movie.id);
    } else {
      updated = [movie, ...favs];
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    // Dispatch custom event for real-time reactive sync across components
    window.dispatchEvent(new Event('bmw_favorites_updated'));
    return !exists;
  } catch (err) {
    console.error('Kushindwa kubadili favorite:', err);
    return false;
  }
}

export function addToWatchHistory(movie: Movie): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    let history: Movie[] = raw ? JSON.parse(raw) : [];
    // Ondoa kama ilikuwepo
    history = history.filter((m) => m.id !== movie.id);
    // Weka mwanzo
    history.unshift(movie);
    // Weka kikomo cha 20
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Kushindwa kuongeza kwenye historia:', err);
  }
}
