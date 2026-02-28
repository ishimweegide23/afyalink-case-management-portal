import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHome, HiOutlineHeart } from 'react-icons/hi';
import { ROUTES } from '../../routes/routeConstants';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-sky-50/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(3,105,161,0.08),transparent)]" />
      <div className="relative max-w-lg mx-auto px-4 text-center">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 p-8 sm:p-10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <HiOutlineHeart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-6xl sm:text-7xl font-bold text-primary tracking-tight mb-2">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary/25 transition-all hover:scale-105"
          >
            <HiOutlineHome className="w-5 h-5" />
            Go to Home
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          AfyaLink Case Management Portal
        </p>
      </div>
    </div>
  );
}
