// External Dependencies
import { createRouter } from '@/lib/create-app';

// Internal Dependencies
import * as handlers from './tmdb.handlers';
import * as routes from './tmdb.routes';

const router = createRouter()
  .openapi(routes.searchMovie, handlers.searchMovie)
  .openapi(routes.searchTVShow, handlers.searchTVShow);

export default router;
