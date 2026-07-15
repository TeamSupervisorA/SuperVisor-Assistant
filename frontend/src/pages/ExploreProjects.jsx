import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const ExploreProjects = () => {
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Extract search query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search') || '';

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // In a real app, you'd pass the search query to the backend: /api/projects/explore?search=...
        // For now, we'll fetch all and filter client-side.
        const res = await apiFetch('/api/projects');
        if (res.data) {
          if (searchQuery) {
            setProjects(res.data.filter(p => 
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            ));
          } else {
            setProjects(res.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [searchQuery]);

  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full">
      <div className="mb-8">
        <h1 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Explore Projects</h1>
        <p className="font-body-lg text-secondary mt-2">
          {searchQuery ? `Search results for "${searchQuery}"` : "Discover research topics and ongoing theses."}
        </p>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
          <p className="font-body-md text-secondary">No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(proj => (
            <div key={proj._id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-primary-container text-primary rounded text-[11px] font-bold uppercase tracking-wider">
                  {proj.status.replace('_', ' ')}
                </span>
                <span className="text-[12px] text-secondary">{new Date(proj.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-title-lg font-bold text-on-surface mb-2">{proj.title}</h3>
              <p className="font-body-sm text-secondary line-clamp-3 mb-4 flex-1">{proj.description}</p>
              
              <button className="text-primary font-label-md font-semibold mt-auto flex items-center gap-1 hover:underline">
                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
