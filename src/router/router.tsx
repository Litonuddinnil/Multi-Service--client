import React, { lazy, Suspense, useEffect } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
  useRouteError,
  Link,
  type LoaderFunction,
} from 'react-router-dom';
import { ShieldAlert, RotateCcw } from 'lucide-react';

// --- Layouts (eagerly loaded — small, always needed) -----------------------
import Main from '../Layout/Main';
import DashBoard from '../Layout/DashBoard';

// --- Pages (lazy loaded — code-split per route) ----------------------------
import Loading from '../Pages/Loading';
import HomeView from '../Pages/HomeView';
import ServicesCatalogView from '../Pages/ServicesCatalogView';
import ServiceDetailView from '../Pages/ServiceDetailView';
import BookingPage from '../Pages/BookingPage';
import ExpertDetailView from '../Pages/ExpertDetailView';
import CommerceView from '../Pages/CommerceView';
import AuthView from '../Pages/AuthView';
import LoginView from '../Pages/LoginView';
import RegisterView from '../Pages/RegisterView';
import CustomerPortalView from '../Pages/CustomerPortalView';
import ExpertPortalView from '../Pages/ExpertPortalView';
import AdminPortalView from '../Pages/AdminPortalView';
import BecomeExpertView from '../Pages/BecomeExpertView';
import PrescriptionPrintView from '../Pages/PrescriptionPrintView';
import CheckoutView from '../Pages/CheckoutView';
// F18 CMS — public Blog index + detail + FAQ
import Blog from '../Pages/Blog';
import BlogPost from '../Pages/BlogPost';
import Faq from '../Pages/Faq'; 
import CoursePlayer from '../Pages/Commerce/CoursePlayer'; 
// Customer
import { CustomerDashboard } from '../Pages/CustomerDashboard';
import CustomerAppointmentsTab from '../Pages/CustomerDashboard/Appointments';
import CustomerProjectsTab from '../Pages/CustomerDashboard/Projects';
import CustomerPilgrimageTab from '../Pages/CustomerDashboard/Pilgrimage';
import CustomerRetainersTab from '../Pages/CustomerDashboard/Retainers';
import CustomerOrdersTab from '../Pages/CustomerDashboard/Orders';
import CustomerThreadsTab from '../Pages/CustomerDashboard/Threads';
import CustomerCertificatesTab from '../Pages/CustomerDashboard/Certificates';
// Expert
import { ExpertDashboard } from '../Pages/ExpertDashboard';
import ExpertOverviewTab from '../Pages/ExpertDashboard/Overview';
import ExpertConsultationsTab from '../Pages/ExpertDashboard/Consultations';
import ExpertProjectsTab from '../Pages/ExpertDashboard/Projects';
import ExpertThreadsTab from '../Pages/ExpertDashboard/Threads';
import ExpertReviewsTab from '../Pages/ExpertDashboard/Reviews';
import ExpertAgreementTab from '../Pages/ExpertDashboard/Agreement';
import ExpertServicesTab from '../Pages/ExpertDashboard/Services';
import ExpertEarningsTab from '../Pages/ExpertDashboard/Earnings';
// Admin
import { AdminDashboard } from '../Pages/AdminDashboard';
import AdminOverviewTab from '../Pages/AdminDashboard/Overview';
import AdminBookingsTab from '../Pages/AdminDashboard/Bookings';
import AdminKYCTab from '../Pages/AdminDashboard/KYC';
import AdminKYCDetailTab from '../Pages/AdminDashboard/KYCDetail';
import AdminContentTab from '../Pages/AdminDashboard/Content';
import AdminDatabaseTab from '../Pages/AdminDashboard/Database';
import AdminReviewsTab from '../Pages/AdminDashboard/ReviewModeration';
import AdminCmsTab from '../Pages/AdminDashboard/Cms';
import AdminCommerceTab from '../Pages/AdminDashboard/Commerce';

// --- Route guards ----------------------------------------------------------
import PrivateRoutes from '../guards/PrivateRoutes';
import AdminRoutes from '../guards/AdminRoutes';
import ExpertRoutesGuard from '../guards/ExpertRoutes';
import CustomerRoutes from '../guards/CustomerRoutes';

/**
 * `withSuspense` wraps a (possibly lazy) component in a `<Suspense>`
 * boundary that falls back to the shared `<Loading />` spinner.
 */
const withSuspense = (node: React.ReactNode): React.ReactElement => (
  <Suspense fallback={<Loading />}>{node}</Suspense>
);
 
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

 
const lazyGuard = (
  importFn: () => Promise<{ default: React.ComponentType<unknown> }>,
  Guard: React.FC<{ children: React.ReactNode }>,
): React.ReactElement => {
  const Page = lazy(importFn);
  return (
    <Guard>
      <Suspense fallback={<Loading />}>
        <Page />
      </Suspense>
    </Guard>
  );
};

 
export const safeBookLoader = <T extends Record<string, unknown>>(
  loader: () => T | Promise<T>,
): LoaderFunction => {
  return async () => {
    try {
      return await loader();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown loader error';
      const status = /not\s*found/i.test(message) ? 404 : 500;
      throw new Response(message, { status });
    }
  };
};

// =============================================================================
//  Inline error fallback — shown when any route throws or 404s
// =============================================================================
const RouteErrorFallback: React.FC = () => {
  const error = useRouteError();
  const isResponse = error instanceof Response;
  const status = isResponse ? error.status : 500;
  const message = isResponse
    ? error.statusText || 'Something went wrong'
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B1220] px-6 text-center text-slate-100">
      <ShieldAlert className="h-14 w-14 text-rose-400" aria-hidden />
      <h1 className="text-3xl font-semibold">{status}</h1>
      <p className="max-w-md text-sm text-slate-400">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
        >
          <RotateCcw className="h-4 w-4" /> Reload
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/20"
        >
          Go home
        </Link>
      </div>
    </div>
  );
};

// =============================================================================
//  Route configuration
// =============================================================================
export const router = createBrowserRouter([
  /* ---------- Public surface (Main layout w/ Navbar + Footer) ---------- */
  {
    path: '/',
    element: <Main />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <HomeView /> },
      { path: 'catalog', element: <ServicesCatalogView /> },
      { path: 'services/:serviceId', element: <ServiceDetailView /> },
      { path: 'book/:serviceId', element: <BookingPage /> },
      { path: 'experts/:expertId', element: <ExpertDetailView /> },
      { path: 'commerce', element: <CommerceView /> },
      { path: 'commerce/learn/:enrollmentId', element: <CoursePlayer /> },
      { path: 'checkout', element: <CheckoutView /> },
      { path: 'become-expert', element: <BecomeExpertView /> },

      // F18 CMS — public Blog index + detail + FAQ
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogPost /> },
      { path: 'faq', element: <Faq /> },

      // Auth screens — split into dedicated pages so login and registration
      // can evolve independently. `AuthView` is kept as a thin shim for the
      // legacy Navbar `onOpenAuth` modal flow.
      { path: 'login', element: <LoginView /> },
      { path: 'register', element: <RegisterView /> },

      // Legacy redirects — keep old URLs alive.
      { path: 'customer', element: <Navigate to="/portal/customer" replace /> },
      { path: 'expert', element: <Navigate to="/portal/expert" replace /> },
    ],
  },

  /* ---------- Authenticated dashboards (DashBoard layout) ---------- */
  {
    path: '/portal',
    element: <DashBoard />,
    errorElement: <RouteErrorFallback />,
    children: [
      /* ---- Customer dashboard ---- */
      {
        path: 'customer',
        element: (
          <CustomerRoutes>
            <ScrollToTop />
            <CustomerDashboard />
          </CustomerRoutes>
        ),
        children: [
          { index: true, element: <Navigate to="/portal/customer/appointments" replace /> },
          { path: 'appointments', element: <CustomerAppointmentsTab /> },
          { path: 'projects', element: <CustomerProjectsTab /> },
          { path: 'pilgrimage', element: <CustomerPilgrimageTab /> },
          { path: 'retainers', element: <CustomerRetainersTab /> },
          { path: 'threads', element: <CustomerThreadsTab /> },
          { path: 'orders', element: <CustomerOrdersTab /> },
          { path: 'certificates', element: <CustomerCertificatesTab /> },
        ],
      },

      /* ---- Expert dashboard ---- */
      {
        path: 'expert',
        element: (
          <ExpertRoutesGuard>
            <ScrollToTop />
            <ExpertDashboard />
          </ExpertRoutesGuard>
        ),
        children: [
          { index: true, element: <Navigate to="/portal/expert/overview" replace /> },
          { path: 'overview', element: <ExpertOverviewTab /> },
          { path: 'consultations', element: <ExpertConsultationsTab /> },
          { path: 'projects', element: <ExpertProjectsTab /> },
          { path: 'services', element: <ExpertServicesTab /> },
          { path: 'earnings', element: <ExpertEarningsTab /> },
          { path: 'reviews', element: <ExpertReviewsTab /> },
          { path: 'threads', element: <ExpertThreadsTab /> },
          { path: 'agreement', element: <ExpertAgreementTab /> },
        ],
      },
    ],
  },

  /* ---------- Admin surface (DashBoard layout + AdminRoutes guard) ---------- */
  {
    path: '/admin',
    element: (
      <PrivateRoutes>
        <DashBoard />
      </PrivateRoutes>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: '',
        element: (
          <AdminRoutes>
            <ScrollToTop />
            <AdminDashboard />
          </AdminRoutes>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/overview" replace /> },
          { path: 'overview', element: <AdminOverviewTab /> },
          { path: 'bookings', element: <AdminBookingsTab /> },
          { path: 'kyc', element: <AdminKYCTab /> },
          { path: 'kyc/:expertId', element: <AdminKYCDetailTab /> },
          { path: 'content', element: <AdminContentTab /> },
          { path: 'cms', element: <AdminCmsTab /> },
          { path: 'commerce', element: <AdminCommerceTab /> },
          { path: 'reviews', element: <AdminReviewsTab /> },
          { path: 'database', element: <AdminDatabaseTab /> },
        ],
      },
    ],
  },

  /* ---------- Print view (no chrome, no guards — opened in new tab) ---------- */
  {
    path: '/print/prescription/:prescriptionId',
    element: withSuspense(<PrescriptionPrintView />),
    errorElement: <RouteErrorFallback />,
  },

  /* ---------- Catch-all ---------- */
  { path: '*', element: <Navigate to="/" replace /> },
]);

// =============================================================================
//  Public exports
// =============================================================================
export const RouterRoot: React.FC = () => <RouterProvider router={router} />;

export default router;
