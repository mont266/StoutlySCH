import React from 'react';
import { supabase } from '../services/supabaseClient';
import Logo from './Logo';
import Button from './Button';

const Header: React.FC = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <h1 className="text-xl md:text-2xl font-bold text-white">Stoutly Social Content Hub</h1>
        </div>
        <Button onClick={handleLogout} className="text-sm px-3 py-1.5">
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;