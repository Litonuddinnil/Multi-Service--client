import React from 'react';

/**
 * Legacy shim - the monolithic AdminPortalView was decomposed into the
 * `AdminDashboard/` folder. The router now mounts the dashboard shell
 * directly; this file is kept as a re-export so any external import path
 * (Storybook stories, test fixtures, etc.) keeps working during the
 * transition.
 *
 * Safe to delete once no consumer references this symbol.
 */
export { AdminDashboard as AdminPortalView } from './AdminDashboard';

export interface AdminPortalViewProps {
  initialTab?: string;
}

const AdminPortalView: React.FC<AdminPortalViewProps> = () => null;
export default AdminPortalView;
