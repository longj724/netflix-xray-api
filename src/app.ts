import configureOpenAPI from '@/lib/configure-open-api';
import createApp from '@/lib/create-app';
import tmdb from '@/routes/tmdb/tmdb.index';

const app = createApp();

configureOpenAPI(app);

const routes = [tmdb] as const;

routes.forEach((route) => {
  app.route('/', route);
});

export type AppType = (typeof routes)[number];

export default app;
