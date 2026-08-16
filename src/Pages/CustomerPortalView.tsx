import React from 'react';

/**
 * Legacy shim - the monolithic CustomerPortalView was decomposed into the
 * `CustomerDashboard/` folder. The router now mounts the dashboard shell
 * directly; this file is kept as a re-export so any external import path
 * (Storybook stories, test fixtures, etc.) keeps working during the
 * transition.
 *
 * Safe to delete once no consumer references this symbol.
 */
export { CustomerDashboard as CustomerPortalView } from './CustomerDashboard';

export interface CustomerPortalViewProps {
  initialTab?: string;
}

const CustomerPortalView: React.FC<CustomerPortalViewProps> = () => null;
export default CustomerPortalView;
