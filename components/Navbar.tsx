import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800/50 p-4">
      <div className="container mx-auto flex justify-center gap-6">
        <NavLink 
          to="/"
          className={({ isActive }) => 
            `px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200 ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`
          }
        >
          Content Feed
        </NavLink>
        <NavLink 
          to="/pint-of-the-week"
          className={({ isActive }) => 
            `px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200 ${isActive ? 'bg-purple-600' : 'hover:bg-gray-700'}`
          }
        >
          Pint of the Week
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
