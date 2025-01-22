import { createRouter } from '@/lib/create-app';

import * as handlers from './tmdb.handlers';
import * as routes from './tmdb.routes';

const router = createRouter().openapi(routes.searchMovie, handlers.searchMovie);
// .openapi(routes.list, handlers.list)
// .openapi(routes.create, handlers.create)
// .openapi(routes.getOne, handlers.getOne)
// .openapi(routes.patch, handlers.patch)
// .openapi(routes.remove, handlers.remove);

export default router;
