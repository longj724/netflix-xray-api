// External Dependencies
import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import { createErrorSchema } from 'stoker/openapi/schemas';

const tags = ['TMDB'];

const SearchMovieQuerySchema = z.object({
  title: z.string().min(1),
});

const SearchTVShowQuerySchema = z.object({
  title: z.string().min(1),
  episodeTitle: z.string().min(1),
});

// Response schemas
const TVShowResultSchema = z.object({
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

export const searchMovie = createRoute({
  method: 'get',
  path: '/search/movie',
  tags,
  request: {
    query: SearchMovieQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        id: z.number(),
        title: z.string(),
        overview: z.string().optional(),
        release_date: z.string().optional(),
        poster_path: z.string().nullable(),
      }),
      'Exact movie match'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(SearchMovieQuerySchema),
      'No exact movie match found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createErrorSchema(z.object({})),
      'Internal server error'
    ),
  },
});

export const searchTVShow = createRoute({
  method: 'get',
  path: '/search/tv',
  tags,
  request: {
    query: SearchTVShowQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      TVShowResultSchema,
      'TV show search results'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      createErrorSchema(SearchTVShowQuerySchema),
      'No TV shows found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      createErrorSchema(z.object({})),
      'Internal server error'
    ),
  },
});

export type SearchMovieRoute = typeof searchMovie;
export type SearchTVShowRoute = typeof searchTVShow;
