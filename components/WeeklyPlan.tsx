import React from 'react';

const WeeklyPlan: React.FC = () => {
  const days = [
    { day: 'Monday', task: 'Pint of the Week', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    { day: 'Wednesday', task: 'Feature Highlight', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { day: 'Friday', task: 'Agency Post', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { day: 'Sunday', task: 'Pub Spotlight', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Weekly Content Plan
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map((item) => {
          const isToday = item.day === currentDay;
          return (
            <div 
              key={item.day} 
              className={`p-4 rounded-lg border ${item.bg} ${item.border} ${isToday ? 'ring-2 ring-white/20 shadow-lg scale-105 transition-transform' : ''}`}
            >
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex justify-between">
                {item.day}
                {isToday && <span className="text-white bg-gray-700 px-1.5 rounded text-[10px]">TODAY</span>}
              </div>
              <div className={`font-bold text-lg ${item.color}`}>
                {item.task}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlan;
