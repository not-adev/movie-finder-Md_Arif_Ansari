"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Movie = {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  overview: string;
};

type MovieDetails = {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  overview: string;
  runtime: number;
  genres: { id: number; name: string }[];
};

const PAGE_SIZE = 12;
const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";  

export default function Home() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [selectedMovieLoading, setSelectedMovieLoading] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const fetchMovies = useCallback(
    async (nextPage: number, searchTerm: string) => {
      if (!apiKey) {
        setError(
          "Missing TMDB API key. Add NEXT_PUBLIC_TMDB_API_KEY to your environment."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const endpoint = searchTerm
          ? `${API_BASE}/search/movie?query=${encodeURIComponent(searchTerm)}&page=${nextPage}`
          : `${API_BASE}/movie/popular?page=${nextPage}`;

        const response = await fetch(
          `${endpoint}&api_key=${apiKey}&include_adult=false`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Unable to fetch movies right now.");
        }

        const data = await response.json();
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        setPage(nextPage);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading movies."
        );
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  useEffect(() => {
    const savedFavorites = localStorage.getItem("movie-favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    fetchMovies(1, query.trim());
  }, [fetchMovies, query]);

  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("movie-favorites", JSON.stringify(favorites));
    } else {
      localStorage.setItem("movie-favorites", JSON.stringify([]));
    }
  }, [favorites]);

  const openMovieDetails = async (movie: Movie) => {
    if (!apiKey) return;

    setSelectedMovieLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/movie/${movie.id}?api_key=${apiKey}`
      );
      if (!response.ok) {
        throw new Error("Unable to load movie details.");
      }
      const data = await response.json();
      setSelectedMovie(data);
    } catch {
      setSelectedMovie(null);
    } finally {
      setSelectedMovieLoading(false);
    }
  };

  const toggleFavorite = (movieId: number) => {
    setFavorites((current) =>
      current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId]
    );
  };

  const visibleMovies = movies.slice(0, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Movie Finder</p>
            <h1 className="mt-2 text-3xl font-semibold">Discover your next favorite film</h1>
          </div>
          <div className="relative w-full sm:max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-cyan-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center text-red-200">
            {error}
          </div>
        ) : visibleMovies.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-300">
            No movies found for your search.
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleMovies.map((movie) => {
                const isFavorite = favorites.includes(movie.id);
                return (
                  <article
                    key={movie.id}
                    className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg transition hover:-translate-y-1"
                  >
                    <button
                      type="button"
                      onClick={() => openMovieDetails(movie)}
                      className="block w-full text-left"
                    >
                      <div className="relative h-80 w-full overflow-hidden">
                        <Image
                          src={movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : "/placeholder.svg"}
                          alt={movie.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    </button>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => openMovieDetails(movie)}
                          className="text-left"
                        >
                          <h2 className="font-semibold text-white">{movie.title}</h2>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(movie.id)}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            isFavorite
                              ? "bg-rose-500 text-white"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {isFavorite ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>{movie.release_date?.slice(0, 4) || "N/A"}</span>
                        <span>⭐ {movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fetchMovies(page - 1, query.trim())}
                disabled={page === 1}
                className="rounded-full bg-slate-800 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => fetchMovies(page + 1, query.trim())}
                disabled={page === totalPages}
                className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>

      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-slate-900 shadow-2xl">
            <div className="relative h-72 w-full">
              <Image
                src={selectedMovie.poster_path ? `${IMAGE_BASE}${selectedMovie.poster_path}` : "/placeholder.svg"}
                alt={selectedMovie.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
                className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white"
              >
                Close
              </button>
            </div>
            {selectedMovieLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{selectedMovie.title}</h3>
                    <p className="text-sm text-slate-400">
                      {selectedMovie.release_date?.slice(0, 4) || "N/A"} • {selectedMovie.runtime} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedMovie.id)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      favorites.includes(selectedMovie.id)
                        ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {favorites.includes(selectedMovie.id) ? "★ Favorited" : "☆ Favorite"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMovie.genres?.map((genre) => (
                    <span key={genre.id} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                      {genre.name}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-6 text-slate-300">{selectedMovie.overview || "No overview available."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-4 text-center text-sm text-slate-400">
        Built for Jeevan — Md Arif Ansari
      </footer>
    </main>
  );
}
