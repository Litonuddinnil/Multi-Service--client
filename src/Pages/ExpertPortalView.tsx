import React from 'react';

/**
 * Legacy shim - the monolithic ExpertPortalView was decomposed into the
 * `ExpertDashboard/` folder. The router now mounts the dashboard shell
 * directly; this file is kept as a re-export so any external import path
 * (Storybook stories, test fixtures, etc.) keeps working during the
 * transition.
 *
 * Safe to delete once no consumer references this symbol.
 */
export { ExpertDashboard as ExpertPortalView } from './ExpertDashboard';

export interface ExpertPortalViewProps {
  initialTab?: string;
}

const ExpertPortalView: React.FC<ExpertPortalViewProps> = () => null;
export default ExpertPortalView;
