import React, { Suspense, lazy } from 'react';

const ThreeCanvas3D = lazy(() =>
  import('./ThreeCanvas3D').then(m => ({ default: m.ThreeCanvas3D })),
);

interface LazyThreeCanvas3DProps {
  className?: string;
  particleCount?: number;
  theme?: string;
}

/**
 * Three.js background, loaded only once the page is on screen.
 *
 * The canvas is decorative, but importing it eagerly pulled ~514 kB of Three.js
 * into the first download on every route. Deferring it lets the sign-in form paint
 * immediately; the backdrop fades in a moment later, and nothing breaks if the
 * chunk never arrives.
 */
export const LazyThreeCanvas3D: React.FC<LazyThreeCanvas3DProps> = props => (
  <Suspense fallback={null}>
    <ThreeCanvas3D {...(props as any)} />
  </Suspense>
);
