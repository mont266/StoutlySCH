import React from 'react';
import { supabase } from '../services/supabaseClient';

const AccessDenied: React.FC = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold text-amber-500 mb-4">Access Denied</h1>
      <p className="text-gray-300 max-w-md text-center mb-8">
        You do not have the required permissions to access this application. Please contact an administrator if you believe this is an error.
      </p>
      <button
        onClick={handleSignOut}
        className="px-6 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200"
      >
        Sign Out
      </button>
    </div>
  );
};

export default AccessDenied;
