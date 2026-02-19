import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-white">
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <HiOutlineHeart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AfyaLink
            </h1>
          </Link>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
