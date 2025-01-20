import type { Context } from 'hono';
import { z } from 'zod';
import axios from 'axios';
import * as HttpStatusCodes from 'stoker/http-status-codes';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is not set');
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

export async function searchMovie(c: Context) {
  try {
    const query = c.req.query('query');
    const result = searchQuerySchema.safeParse({ query });

    if (!result.success) {
      return c.json(
        { error: 'Movie title is required' },
        HttpStatusCodes.BAD_REQUEST as 400
      );
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        include_adult: false,
      },
    });

    return c.json(response.data, HttpStatusCodes.OK as 200);
  } catch (error) {
    console.error('Error searching movie:', error);
    return c.json(
      { error: 'Failed to search movie' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR as 500
    );
  }
}

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
        api_key: TMDB_API_KEY,
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

export async function getTVShowEpisode(c: Context) {
  try {
    const params = c.req.param();
    const result = showEpisodeParamsSchema.safeParse(params);

    if (!result.success) {
      return c.json(
        { error: 'Invalid parameters' },
        HttpStatusCodes.BAD_REQUEST as 400
      );
    }

    const { showId, seasonNumber, episodeNumber } = result.data;

    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );

    return c.json(response.data, HttpStatusCodes.OK as 200);
  } catch (error) {
    console.error('Error fetching TV show episode:', error);
    return c.json(
      { error: 'Failed to fetch TV show episode' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR as 500
    );
  }
}

export async function getMovieDetails(c: Context) {
  try {
    const params = c.req.param();
    const result = movieIdParamsSchema.safeParse(params);

    if (!result.success) {
      return c.json(
        { error: 'Invalid movie ID' },
        HttpStatusCodes.BAD_REQUEST as 400
      );
    }

    const { movieId } = result.data;

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,videos',
      },
    });

    return c.json(response.data, HttpStatusCodes.OK as 200);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return c.json(
      { error: 'Failed to fetch movie details' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR as 500
    );
  }
}
