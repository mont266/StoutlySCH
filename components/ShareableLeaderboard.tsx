import React, { forwardRef } from 'react';
import Logo from './Logo';

interface SharableLeaderboardProps {
  topUsers: any[];
  newUsersCount: number;
}

const Medal = ({ color, children }: { color: string, children: React.ReactNode }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${color}`}>
    {children}
  </div>
);

const ShareableLeaderboard = forwardRef<HTMLDivElement, SharableLeaderboardProps>(({ topUsers, newUsersCount }, ref) => {
  return (
    <div
      ref={ref}
      className="w-[600px] bg-gradient-to-br from-gray-900 to-black text-white p-8 font-sans"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      }}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-widest text-amber-500 uppercase">Stoutly</h2>
        <h1 className="text-5xl font-extrabold tracking-wider uppercase text-white -mt-2">
            Weekly <span className="font-light text-3xl text-gray-300">Top Tasters</span>
        </h1>
      </div>

      <div className="space-y-4 mb-6">
        {topUsers.map((user, index) => (
          <div key={user.user_id} className="flex items-center bg-white/5 p-4 rounded-lg text-2xl">
            {index === 0 && <Medal color="bg-amber-500">1</Medal>}
            {index === 1 && <Medal color="bg-slate-400">2</Medal>}
            {index === 2 && <Medal color="bg-orange-700">3</Medal>}
            <span className="ml-4 flex-grow">{user.username}</span>
            <span className="font-bold text-purple-400">{user.post_count} posts</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center border-t-2 border-white/10 pt-6">
        <div className="text-center">
            <p className="text-5xl font-bold text-purple-400">{newUsersCount}</p>
            <p className="text-lg text-gray-300">New Members This Week</p>
        </div>
        <div className="text-right">
            <Logo className="w-16 h-16 ml-auto" />
            <p className="text-sm text-gray-500 mt-1 font-mono">
                www.stoutly.co.uk
            </p>
        </div>
      </div>
    </div>
  );
});

export default ShareableLeaderboard;
