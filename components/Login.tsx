import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Logo from './Logo';
import Button from './Button';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign in the user
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (user) {
      // 2. Check for permissions in the 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_team_member, is_developer')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // If profile doesn't exist or there's an error, sign out and show error
        await supabase.auth.signOut();
        setError('Could not verify user permissions. Please contact support.');
        setLoading(false);
        return;
      }
      
      // 3. Verify permissions
      const hasPermission = profile.is_team_member || profile.is_developer;

      if (!hasPermission) {
        // If user doesn't have permissions, sign out and show error
        await supabase.auth.signOut();
        setError('Access denied. You do not have the required permissions.');
        setLoading(false);
        return;
      }

      // If we reach here, the user is authenticated and authorized.
      // The onAuthStateChange listener in App.tsx will handle redirecting to the dashboard.
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111827] p-4">
      <div className="w-full max-w-md bg-[#1F2937] rounded-lg shadow-xl p-8 space-y-6">
        <div className="text-center">
          <Logo className="w-20 h-20 mx-auto" />
          <h1 className="text-3xl font-bold text-white mt-4">Stoutly Social Content Hub</h1>
          <p className="text-gray-400 mt-2">Sign in to continue</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <Button type="submit" isLoading={loading} className="w-full">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;