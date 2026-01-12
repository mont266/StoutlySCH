import React from 'react';
import Header from './Header';
import NavBar from './NavBar';

interface LayoutProps {
  children: React.ReactNode;
  page: string;
  setPage: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, page, setPage }) => {
  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 pb-20 md:pb-0">
      <Header />
      <NavBar activeTab={page} onTabChange={setPage} />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default Layout;