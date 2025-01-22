import type { Context } from 'hono';
import { z } from 'zod';
import axios from 'axios';
import * as HttpStatusCodes from 'stoker/http-status-codes';

// Internal Dependencies
import { AppRouteHandler } from '@/lib/types';
import {
  SearchMovieRoute,
  MovieSearchResultSchema,
  MovieSchema,
} from './tmdb.routes';

const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_READ_ACCESS_TOKEN) {
  throw new Error('TMDB_READ_ACCESS_TOKEN environment variable is not set');
}

const searchQuerySchema = z.object({
  query: z.string().min(1),
});

const showEpisodeParamsSchema = z.object({
  showId: z.string(),
  seasonNumber: z.string(),
  episodeNumber: z.string(),
});

const movieIdParamsSchema = z.object({
  movieId: z.string(),
});

export const searchMovie: AppRouteHandler<SearchMovieRoute> = async (c) => {
  try {
    const title = c.req.query('title');

    // if (!title) {
    //   return c.json(
    //     { error: 'Movie title is required' },
    //     HttpStatusCodes.BAD_REQUEST
    //   );
    // }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        query: title ?? 'Interstellar',
        include_adult: false,
      },
      headers: {
        Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
      },
    });

    const data = MovieSearchResultSchema.parse(response.data);

    const movie = data.results.find((movie) => movie.title === title);

    if (!movie) {
      return c.json(
        { error: 'Movie not found', title: title },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(movie, HttpStatusCodes.OK);
  } catch (error) {
    console.error('Error searching movie:', error);
    return c.json(
      {
        error: {
          issues: [
            {
              code: 'internal_error',
              path: [],
              message: 'Failed to search movie',
            },
          ],
          name: 'InternalError',
        },
        success: false,
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export async function searchTVShow(c: Context) {
  try {
    const query = c.req.query('query');
    const result = searchQuerySchema.safeParse({ query });

    if (!result.success) {
      return c.json(
        { error: 'TV show title is required' },
        HttpStatusCodes.BAD_REQUEST as 400
      );
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        // api_key: TMDB_API_KEY,
        query,
        include_adult: false,
      },
    });

    return c.json(response.data, HttpStatusCodes.OK as 200);
  } catch (error) {
    console.error('Error searching TV show:', error);
    return c.json(
      { error: 'Failed to search TV show' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR as 500
    );
  }
}
