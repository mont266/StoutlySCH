import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import PintOfTheWeek from './components/PintOfTheWeek';
import Leaderboard from './components/Leaderboard';
import Branding from './components/Branding';
import AccessDenied from './components/AccessDenied';
import { type Profile } from '../types';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_team_member, is_developer')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
          setAuthorized(false);
        } else if (data) {
          const userProfile: Profile = data;
          setProfile(userProfile);
          if (userProfile.is_team_member || userProfile.is_developer) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } else {
          // No profile found for user
          setAuthorized(false);
        }
      } else {
        setProfile(null);
        setAuthorized(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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
      ) : authorized ? (
        <Layout page={page} setPage={setPage}>
          {page === 'dashboard' && <Dashboard key={session.user.id} session={session} />}
          {page === 'potw' && <PintOfTheWeek />}
          {page === 'leaderboard' && <Leaderboard />}
          {page === 'branding' && <Branding />}
        </Layout>
      ) : (
        <AccessDenied />
      )}
    </div>
  );
};

export default App;