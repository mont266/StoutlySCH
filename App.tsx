import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import PintOfTheWeek from './components/PintOfTheWeek';
import Leaderboard from './components/Leaderboard';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      {!session ? (
        <Login />
      ) : (
        <Layout page={page} setPage={setPage}>
          {page === 'dashboard' && <Dashboard key={session.user.id} session={session} />}
          {page === 'potw' && <PintOfTheWeek />}
          {page === 'leaderboard' && <Leaderboard />}
        </Layout>
      )}
    </div>
  );
};

export default App;