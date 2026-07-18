import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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
        const res = await apiFetch('/api/projects');
        if (res && res.data) {
          let loadedProjects = res.data;

          if (searchQuery) {
            setProjects(loadedProjects.filter(p => 
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            ));
          } else {
            setProjects(loadedProjects);
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
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Discovery</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Explore Projects</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">
              {searchQuery ? (
                <>Search results for <span className="text-primary font-bold">"{searchQuery}"</span></>
              ) : "Discover research topics and ongoing theses across the institution."}
            </p>
          </div>
          
          <div className="relative w-full md:w-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
            <input 
              type="text" 
              defaultValue={searchQuery}
              placeholder="Search by keywords..." 
              className="pl-12 pr-4 py-3 bg-surface/50 backdrop-blur-xl border border-outline-variant/50 rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full md:w-72 shadow-sm transition-all" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/explore?search=${e.target.value}`;
                }
              }}
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-16 rounded-[32px] shadow-sm max-w-2xl mx-auto mt-8">
            <div className="w-20 h-20 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6 border border-outline-variant/20">
              <span className="material-symbols-outlined text-[40px] text-secondary">search_off</span>
            </div>
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-2">No projects found</h3>
            <p className="font-body-md text-[15px] text-secondary">We couldn't find any projects matching your current criteria. Try adjusting your search terms.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {projects.map((proj, idx) => {
              const statusColor = proj.status === 'COMPLETED' ? 'bg-[#10B981]' : proj.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-tertiary';
              
              return (
                <motion.div 
                  key={proj._id || idx} 
                  variants={itemVariants} 
                  className="bg-surface/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col relative overflow-hidden group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-30 ${statusColor}`}></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className={`px-3 py-1.5 ${statusColor}/10 ${statusColor.replace('bg-','text-')} border border-current/20 rounded-lg font-label-md text-[11px] font-bold uppercase tracking-widest`}>
                      {proj.status ? proj.status.replace('_', ' ') : 'UNKNOWN'}
                    </span>
                    <span className="font-label-md text-[12px] font-semibold text-secondary">
                      {new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-3 leading-tight relative z-10 group-hover:text-primary transition-colors">{proj.title}</h3>
                  <p className="font-body-sm text-[14px] text-secondary line-clamp-3 mb-8 flex-1 leading-relaxed relative z-10">{proj.description}</p>
                  
                  <div className="mt-auto border-t border-outline-variant/30 pt-5 flex items-center justify-between relative z-10">
                    <div className="flex -space-x-2">
                       {/* Mock avatars */}
                       {[1,2,3].map(i => (
                         <div key={i} className={`w-8 h-8 rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface`}>
                           S{i}
                         </div>
                       ))}
                    </div>
                    <button className="text-primary font-label-md text-[13px] font-bold flex items-center gap-1 group-hover:underline decoration-2 underline-offset-4">
                      View Details <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ExploreProjects;
