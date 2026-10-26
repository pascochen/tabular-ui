import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('principles', 'routes/principles.tsx'),
  route('components', 'routes/components.tsx'),
  route('components/:name', 'routes/component.tsx'),
  route('vocabulary', 'routes/vocabulary.tsx'),
  route('foundations/color', 'routes/color.tsx'),
  route('foundations/typography', 'routes/typography.tsx'),
  route('foundations/density', 'routes/density.tsx'),
  route('getting-started', 'routes/getting-started.tsx'),
  // Any other path. Prerendered at /404 (react-router.config.ts) and copied to 404.html.
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
