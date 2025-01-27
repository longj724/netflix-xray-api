// External Dependencies
import axios from 'axios';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as HttpStatusPhrases from 'stoker/http-status-phrases';

// Internal Dependencies
import type { AppRouteHandler } from '@/lib/types';
import type { SearchMovieRoute, SearchTVShowRoute } from './tmdb.routes';

const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_READ_ACCESS_TOKEN) {
  throw new Error('TMDB_READ_ACCESS_TOKEN environment variable is not set');
}

export const searchMovie: AppRouteHandler<SearchMovieRoute> = async (c) => {
  try {
    const { title } = c.req.valid('query');

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        query: title,
        include_adult: false,
      },
      headers: {
        Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
      },
    });

    const { results } = response.data;

    const exactMatch = results.find(
      // @ts-ignore
      (movie) => movie.title.toLowerCase() === title.toLowerCase()
    );

    if (!exactMatch) {
      return c.json(
        {
          error: {
            issues: [
              {
                code: 'not_found',
                path: ['title'],
                message: 'No exact movie title match found',
              },
            ],
            name: 'NotFoundError',
          },
          success: false,
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const { id: movieId } = exactMatch;

    const movieDetailsResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${movieId}`,
      {
        params: {
          append_to_response: 'credits',
        },
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
        },
      }
    );

    return c.json(movieDetailsResponse.data, HttpStatusCodes.OK);
  } catch (error) {
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

export const searchTVShow: AppRouteHandler<SearchTVShowRoute> = async (c) => {
  try {
    const { title, seasonNumber, episodeNumber } = c.req.valid('query');

    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        query: title,
        include_adult: false,
      },
      headers: {
        Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
      },
    });

    const { results } = response.data;

    if (results.length === 0) {
      return c.json(
        {
          error: {
            issues: [
              {
                code: 'not_found',
                path: ['title'],
                message: 'No TV shows found with this title',
              },
            ],
            name: 'NotFoundError',
          },
          success: false,
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const exactMatch = results.find(
      // @ts-ignore
      (show) => show.name === title
    );

    if (!exactMatch) {
      return c.json(
        {
          error: {
            issues: [
              {
                code: 'not_found',
                path: ['title'],
                message: 'No tv show found with this title',
              },
            ],
            name: 'NotFoundError',
          },
          success: false,
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    const { id: showId } = exactMatch;

    const showDetailsResponse = await axios.get(
      `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
      {
        params: {
          append_to_response: 'credits',
        },
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
        },
      }
    );

    return c.json(showDetailsResponse.data, HttpStatusCodes.OK);
  } catch (error) {
    return c.json(
      {
        error: {
          issues: [
            {
              code: 'internal_error',
              path: [],
              message: 'Failed to search TV show',
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
