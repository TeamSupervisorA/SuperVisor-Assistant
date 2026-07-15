import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';

const ExploreProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProjects(initialSearch);
  }, [initialSearch]);

  const fetchProjects = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/projects/explore${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setProjects(res.data || []);
    } catch (err) {
      setError('Failed to load projects. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    fetchProjects(searchTerm);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop pb-24">
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Explore Projects</h2>
          <p className="font-body-lg text-[18px] text-secondary">Discover academic research and projects across the institution.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">search</span>
          <input 
            type="text" 
            placeholder="Search by title or description..." 
            className="w-full h-12 pl-10 pr-24 rounded-xl bg-surface-container border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-4 bg-primary text-on-primary rounded-lg font-label-md font-semibold hover:bg-primary-fixed-variant transition-colors"
            disabled={isSearching}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && !isSearching ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container p-6 rounded-xl text-center">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="font-title-md">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant border-dashed p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-secondary">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <h3 className="font-title-lg text-on-surface mb-2">No projects found</h3>
          <p className="font-body-md text-secondary max-w-md mx-auto">
            {searchTerm ? `We couldn't find any projects matching "${searchTerm}". Try a different keyword.` : "There are currently no projects available to explore."}
          </p>
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); fetchProjects(''); }}
              className="mt-6 font-label-md text-primary border border-primary px-6 py-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {projects.map((project) => (
            <motion.div 
              key={project._id} 
              variants={itemVariants}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 hover:border-primary/30 hover:shadow-md transition-all group flex flex-col h-full cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-md font-label-sm text-[11px] font-bold uppercase tracking-wider ${
                  project.status === 'completed' ? 'bg-tertiary-container text-on-tertiary-container' : 
                  project.status === 'in_progress' ? 'bg-primary-container text-on-primary-container' : 
                  'bg-surface-variant text-on-surface-variant'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
                <button className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary">
                  <span className="material-symbols-outlined">bookmark_add</span>
                </button>
              </div>
              
              <h3 className="font-title-lg text-[20px] font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              
              <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 line-clamp-3 flex-grow">
                {project.description}
              </p>
              
              <div className="mt-auto pt-4 border-t border-outline-variant/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary text-[16px]">supervisor_account</span>
                  <span className="font-label-md text-[13px] text-secondary">
                    {project.supervisor?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[16px]">group</span>
                  <span className="font-label-md text-[13px] text-secondary">
                    {project.students?.length || 0} Student(s)
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ExploreProjects;
