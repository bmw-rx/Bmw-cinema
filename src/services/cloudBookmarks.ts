import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Movie } from '../types/movie';

export async function saveMovieBookmarkToCloud(movie: Movie): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', String(movie.id));
  try {
    await setDoc(bookmarkRef, {
      movieId: String(movie.id),
      title: movie.title || '',
      posterPath: movie.poster_path || '',
      rating: movie.vote_average || 0,
      year: movie.release_date ? movie.release_date.split('-')[0] : '',
      addedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookmarks/${movie.id}`);
  }
}

export async function removeMovieBookmarkFromCloud(movieId: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', String(movieId));
  try {
    await deleteDoc(bookmarkRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bookmarks/${movieId}`);
  }
}

export async function fetchUserBookmarksFromCloud(): Promise<Movie[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const colRef = collection(db, 'users', user.uid, 'bookmarks');
  try {
    const snap = await getDocs(colRef);
    const movies: Movie[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      movies.push({
        id: Number(data.movieId),
        title: data.title || '',
        poster_path: data.posterPath || '',
        vote_average: data.rating || 0,
        release_date: data.year ? `${data.year}-01-01` : '',
        overview: '',
        genre_ids: [],
        vote_count: 0,
        popularity: 0,
        backdrop_path: '',
      });
    });
    return movies;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/bookmarks`);
  }
}
