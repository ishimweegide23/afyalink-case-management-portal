import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
