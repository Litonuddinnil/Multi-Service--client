 import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Thin shell used by tests/storybook. The real app mounts RouterProvider in main.tsx.
 */
const App: React.FC = () => {
  return <Outlet />;
};

export default App;
