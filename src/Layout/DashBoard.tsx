import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

 
const DashBoard: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1220] text-slate-100">
      <header className="border-b border-slate-800/70 bg-[#0B1220]/95 backdrop-blur">
      <Navbar></Navbar>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer></Footer>
    </div>
  );
};

export default DashBoard;