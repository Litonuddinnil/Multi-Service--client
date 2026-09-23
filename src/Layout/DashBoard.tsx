import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import Loading from '../Pages/Loading';

const DashBoard: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar />

      <main className="flex-1">
      {/*
        One boundary for every lazy page beneath this layout. Putting it here
        rather than around each route means the chrome (navbar, footer) stays
        painted while the next page's chunk downloads, instead of the whole
        screen flashing to a spinner on every navigation.
      */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer></Footer>
    </div>
  );
};

export default DashBoard;