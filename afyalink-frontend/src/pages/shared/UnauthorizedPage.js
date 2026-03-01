import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <HiOutlineShieldExclamation className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
        <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
        <Link to="/"><Button>Go Home</Button></Link>
      </div>
    </div>
  );
}
