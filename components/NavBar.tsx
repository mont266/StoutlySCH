import React from 'react';

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FeedIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3H9m-4 3h2m-4 3h2m-4 3h2" />
  </svg>
);

const StarIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LeaderboardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);


const NavItem = ({ label, id, activeTab, onTabChange, children }: any) => {
    const isActive = activeTab === id;
    const baseClasses = "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400";
    
    // Desktop classes
    const desktopClasses = `px-4 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

    // Mobile classes
    const mobileClasses = `flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs ${isActive ? 'text-purple-400' : 'text-gray-400 hover:text-purple-300'}`;
    
    return (
        <>
            {/* Desktop Button */}
            <button onClick={() => onTabChange(id)} className={`${baseClasses} ${desktopClasses} hidden md:inline-block`}>
                {label}
            </button>
            {/* Mobile Button */}
            <button onClick={() => onTabChange(id)} className={`${baseClasses} ${mobileClasses} md:hidden`}>
                {children}
                <span className="mt-1">{label}</span>
            </button>
        </>
    )
}


const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:block bg-gray-900/60 border-b border-gray-700">
        <div className="container mx-auto px-8 py-2">
          <div className="flex items-center space-x-4">
            <NavItem label="Content Feed" id="dashboard" activeTab={activeTab} onTabChange={onTabChange} />
                        <NavItem label="Pint of the Week" id="potw" activeTab={activeTab} onTabChange={onTabChange} />
            <NavItem label="Leaderboard" id="leaderboard" activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-20 h-16">
        <div className="flex justify-around items-center h-full">
            <NavItem label="Feed" id="dashboard" activeTab={activeTab} onTabChange={onTabChange}>
                <FeedIcon isActive={activeTab === 'dashboard'} />
            </NavItem>
            <NavItem label="Pint of Week" id="potw" activeTab={activeTab} onTabChange={onTabChange}>
                <StarIcon isActive={activeTab === 'potw'} />
            </NavItem>
            <NavItem label="Leaderboard" id="leaderboard" activeTab={activeTab} onTabChange={onTabChange}>
                <LeaderboardIcon isActive={activeTab === 'leaderboard'} />
            </NavItem>
        </div>
      </nav>
    </>
  );
};

export default NavBar;