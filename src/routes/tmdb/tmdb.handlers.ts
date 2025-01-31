// External Dependencies
import axios from 'axios';
import * as HttpStatusCodes from 'stoker/http-status-codes';

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

    const movieData = movieDetailsResponse.data;

    // Get detailed information for first 10 cast members only
    const castDetailsPromises = movieData.credits.cast
      .slice(0, 10)
      .map(async (castMember: any) => {
        const personResponse = await axios.get(
          `${TMDB_BASE_URL}/person/${castMember.id}`,
          {
            headers: {
              Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            },
          }
        );

        return {
          ...castMember,
          details: personResponse.data,
        };
      });

    // Wait for all person details requests to complete
    const castWithDetails = await Promise.all(castDetailsPromises);

    // Replace the first 10 cast members with detailed ones, keep the rest as is
    movieData.credits.cast = [
      ...castWithDetails,
      ...movieData.credits.cast.slice(10),
    ];

    return c.json(movieData, HttpStatusCodes.OK);
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
    const { title, episodeTitle } = c.req.valid('query');

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
      (show) => show.name.toLowerCase() === title.toLowerCase()
    );

    if (!exactMatch) {
      return c.json(
        {
          error: {
            issues: [
              {
                code: 'not_found',
                path: ['title'],
                message: 'No exact TV show match found',
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
      `${TMDB_BASE_URL}/tv/${showId}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
        },
      }
    );

    const { seasons } = showDetailsResponse.data;

    // Search through each season for the episode
    for (const season of seasons) {
      const seasonResponse = await axios.get(
        `${TMDB_BASE_URL}/tv/${showId}/season/${season.season_number}`,
        {
          headers: {
            Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
          },
        }
      );

      const episode = seasonResponse.data.episodes.find(
        (ep: any) => ep.name.toLowerCase() === episodeTitle.toLowerCase()
      );

      if (episode) {
        // Get episode details with credits
        const episodeResponse = await axios.get(
          `${TMDB_BASE_URL}/tv/${showId}/season/${season.season_number}/episode/${episode.episode_number}`,
          {
            params: {
              append_to_response: 'credits',
            },
            headers: {
              Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
            },
          }
        );

        const episodeData = episodeResponse.data;

        // Get detailed information for first 10 cast members only
        const castDetailsPromises = episodeData.credits.cast
          .slice(0, 10)
          .map(async (castMember: any) => {
            const personResponse = await axios.get(
              `${TMDB_BASE_URL}/person/${castMember.id}`,
              {
                headers: {
                  Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                },
              }
            );

            return {
              ...castMember,
              details: personResponse.data,
            };
          });

        // Wait for all person details requests to complete
        const castWithDetails = await Promise.all(castDetailsPromises);

        // Replace the first 10 cast members with detailed ones, keep the rest as is
        episodeData.credits.cast = [
          ...castWithDetails,
          ...episodeData.credits.cast.slice(10),
        ];

        return c.json(episodeData, HttpStatusCodes.OK);
      }
    }

    // If we get here, we didn't find the episode
    return c.json(
      {
        error: {
          issues: [
            {
              code: 'not_found',
              path: ['episodeTitle'],
              message: 'No episode found with this title',
            },
          ],
          name: 'NotFoundError',
        },
        success: false,
      },
      HttpStatusCodes.NOT_FOUND
    );
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
