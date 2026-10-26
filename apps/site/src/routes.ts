import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('components', 'routes/components.tsx'),
  route('foundations/color', 'routes/color.tsx'),
  route('foundations/typography', 'routes/typography.tsx'),
  route('foundations/density', 'routes/density.tsx'),
] satisfies RouteConfig;
