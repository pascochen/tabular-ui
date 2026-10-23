import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from 'tabular-ui';

import './index.css';
import { App } from './App';

// TooltipProvider at the root: IconButton self-wraps in a Tooltip, and
// tooltips share timing (300ms delay, instant within a group) via the
// provider. Without it every IconButton is silently tooltip-less.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
);
