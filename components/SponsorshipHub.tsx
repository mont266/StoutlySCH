import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Button from './Button';
import Spinner from './Spinner';

interface SponsorLink {
  id: string;
  creator_name: string;
  created_at: string;
  active: boolean;
}

interface ClickData {
  creator_name: string;
  visitor_id: string;
}

const SponsorshipHub: React.FC = () => {
  const [links, setLinks] = useState<SponsorLink[]>([]);
  const [clickStats, setClickStats] = useState<Record<string, { total: number; unique: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newCreator, setNewCreator] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: linksData, error: linksError } = await supabase
        .from('sponsor_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      const { data: clicksData, error: clicksError } = await supabase
        .from('sponsor_clicks')
        .select('creator_name, visitor_id');

      if (clicksError) throw clicksError;

      setLinks(linksData || []);

      // Calculate stats
      const stats: Record<string, { total: number; unique: number; visitors: Set<string> }> = {};
      
      (linksData || []).forEach(link => {
        stats[link.creator_name] = { total: 0, unique: 0, visitors: new Set() };
      });

      (clicksData || []).forEach((click: ClickData) => {
        if (stats[click.creator_name]) {
          stats[click.creator_name].total += 1;
          stats[click.creator_name].visitors.add(click.visitor_id);
        }
      });

      // Format for state
      const finalStats: Record<string, { total: number; unique: number }> = {};
      for (const name in stats) {
        finalStats[name] = {
          total: stats[name].total,
          unique: stats[name].visitors.size
        };
      }
      setClickStats(finalStats);
    } catch (err: any) {
      console.error('Error fetching sponsorship data:', err);
      setError(err.message || 'Failed to load sponsorship data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreator.trim()) return;

    const formattedName = newCreator.trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

    setIsSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('sponsor_links')
        .insert([{ creator_name: formattedName }]);

      if (insertError) throw insertError;

      setNewCreator('');
      await fetchData();
    } catch (err: any) {
      console.error('Error creating link:', err);
      setError(err.message === 'duplicate key value violates unique constraint "sponsor_links_creator_name_key"' 
        ? 'A tracking link for this creator already exists.' 
        : err.message || 'Failed to create tracking link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLinkStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('sponsor_links')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setLinks(links.map(l => l.id === id ? { ...l, active: !currentStatus } : l));
    } catch (err: any) {
      console.error('Error updating link status:', err);
      alert('Failed to update status.');
    }
  };

  const copyToClipboard = (creatorName: string) => {
    const url = `https://www.stoutly.co.uk/c/${creatorName}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="text-center mb-12 relative">
        <h2 className="text-4xl font-bold text-white mb-4">Sponsorship Hub</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Manage creator tracking links and analyze campaign traffic.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Link Form */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Generate New Tracking Link</h3>
          <form onSubmit={handleCreateLink} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">/c/</span>
              <input
                type="text"
                placeholder="creatorname"
                value={newCreator}
                onChange={(e) => setNewCreator(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors placeholder-gray-600 font-mono"
              />
            </div>
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={!newCreator.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap px-8"
            >
              Generate Link
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">Use alphanumeric characters only. Spaces and special characters will be removed.</p>
        </div>

        {/* Links List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Active Campaigns</h3>
            <Button onClick={fetchData} className="bg-gray-700 hover:bg-gray-600 py-1.5 px-4 text-sm">
               Refresh Stats
            </Button>
          </div>
          
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Spinner size="h-8 w-8" />
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No tracking links have been generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Creator</th>
                    <th className="p-4 font-medium text-center">Total Clicks</th>
                    <th className="p-4 font-medium text-center">Unique Visitors</th>
                    <th className="p-4 font-medium text-center">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {links.map((link) => {
                    const stats = clickStats[link.creator_name] || { total: 0, unique: 0 };
                    return (
                      <tr key={link.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-lg">{link.creator_name}</div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                             https://www.stoutly.co.uk/c/{link.creator_name}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-2xl font-bold text-blue-400">{stats.total}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-2xl font-bold text-amber-400">{stats.unique}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleLinkStatus(link.id, link.active)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                              link.active 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            }`}
                          >
                            {link.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            onClick={() => copyToClipboard(link.creator_name)}
                            className="bg-gray-700 hover:bg-gray-600 py-1.5 px-3 text-sm text-gray-200"
                          >
                            Copy Link
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SponsorshipHub;
