import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import { createErrorSchema } from 'stoker/openapi/schemas';

const tags = ['TMDB'];

// Schema definitions
const SearchQuerySchema = z.object({
  query: z.string().min(1),
});

const ShowEpisodeParamsSchema = z.object({
  showId: z.string(),
  seasonNumber: z.string(),
  episodeNumber: z.string(),
});

const MovieIdParamsSchema = z.object({
  movieId: z.string(),
});

// Response schemas
const MovieSearchResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      overview: z.string().optional(),
      release_date: z.string().optional(),
      poster_path: z.string().nullable(),
    })
  ),
  total_results: z.number(),
  total_pages: z.number(),
});

const TVShowSearchResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      overview: z.string().optional(),
      first_air_date: z.string().optional(),
      poster_path: z.string().nullable(),
    })
  ),
  total_results: z.number(),
  total_pages: z.number(),
});

const EpisodeDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  overview: z.string().optional(),
  air_date: z.string().optional(),
  episode_number: z.number(),
  season_number: z.number(),
  still_path: z.string().nullable(),
});

const MovieDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  release_date: z.string(),
  runtime: z.number().optional(),
  credits: z.object({
    cast: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        character: z.string(),
        profile_path: z.string().nullable(),
      })
    ),
    crew: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        job: z.string(),
        profile_path: z.string().nullable(),
      })
    ),
  }),
  videos: z.object({
    results: z.array(
      z.object({
        key: z.string(),
        site: z.string(),
        type: z.string(),
      })
    ),
  }),
});

// Route definitions
export const searchMovie = createRoute({
  method: 'get',
  path: '/search/movie',
  tags,
  request: {
    query: SearchQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      MovieSearchResultSchema,
      'Movie search results'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createErrorSchema(SearchQuerySchema),
      'Invalid search query'
    ),
  },
});

export const searchTVShow = createRoute({
  method: 'get',
  path: '/search/tv',
  tags,
  request: {
    query: SearchQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      TVShowSearchResultSchema,
      'TV show search results'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createErrorSchema(SearchQuerySchema),
      'Invalid search query'
    ),
  },
});

export const getTVShowEpisode = createRoute({
  method: 'get',
  path: '/tv/{showId}/season/{seasonNumber}/episode/{episodeNumber}',
  tags,
  request: {
    params: ShowEpisodeParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      EpisodeDetailsSchema,
      'TV show episode details'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createErrorSchema(ShowEpisodeParamsSchema),
      'Invalid parameters'
    ),
  },
});

export const getMovieDetails = createRoute({
  method: 'get',
  path: '/movie/{movieId}',
  tags,
  request: {
    params: MovieIdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      MovieDetailsSchema,
      'Movie details including credits and videos'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createErrorSchema(MovieIdParamsSchema),
      'Invalid movie ID'
    ),
  },
});

export type SearchMovieRoute = typeof searchMovie;
export type SearchTVShowRoute = typeof searchTVShow;
export type GetTVShowEpisodeRoute = typeof getTVShowEpisode;
export type GetMovieDetailsRoute = typeof getMovieDetails;
