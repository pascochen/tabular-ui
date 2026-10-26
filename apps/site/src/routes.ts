import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  // D3's comparison, unlinked and noindex, until the owner chooses (docs/site.md).
  route('plates', 'routes/plates.tsx'),
] satisfies RouteConfig;
