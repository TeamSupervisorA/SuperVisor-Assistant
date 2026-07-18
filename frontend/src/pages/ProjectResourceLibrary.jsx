import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const ProjectResourceLibrary = () => {
  const { activeProject } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', type: 'Document', category: 'General', url: '', file: null });

  useEffect(() => {
    if (activeProject) {
      loadResources();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/resources?project=${activeProject._id}`);
      if (res && res.data) {
        setResources(res.data);
      }
    } catch (error) {
      console.error('Failed to load resources', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      let finalUrl = newResource.url;
      
      // If it's not a link and a file is selected, upload it
      if (newResource.type !== 'Link' && newResource.file) {
        const formData = new FormData();
        formData.append('file', newResource.file);
        
        const uploadRes = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload file');
        }
        finalUrl = uploadData.data.fileUrl;
      }

      const payload = { ...newResource, url: finalUrl, project: activeProject._id };
      delete payload.file; // don't send raw file object in JSON payload

      const res = await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.success) {
        setShowModal(false);
        setNewResource({ title: '', type: 'Document', category: 'General', url: '', file: null });
        if (res.data) {
          setResources([res.data, ...resources]);
        } else {
          loadResources();
        }
      }
    } catch (error) {
      alert('Error creating resource: ' + error.message);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'Code': return 'terminal';
      case 'Document': return 'description';
      case 'PDF': return 'picture_as_pdf';
      case 'Link': return 'link';
      default: return 'insert_drive_file';
    }
  };

  const getColorClass = (type) => {
    switch(type) {
      case 'Code': return 'bg-tertiary-container text-tertiary';
      case 'Document': return 'bg-primary-container text-primary';
      case 'PDF': return 'bg-error-container text-error';
      default: return 'bg-secondary-container text-secondary';
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner border border-outline-variant/30">
             <span className="material-symbols-outlined text-[40px] text-primary">library_books</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to view or upload resources.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8 h-full"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Knowledge Base</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Resource Library</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Manage and discover shared assets, documentation, and tools.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-[16px] border border-outline-variant/50 bg-surface/50 backdrop-blur-md text-on-surface font-title-sm text-[14px] font-bold hover:bg-surface-container hover:border-primary/50 transition-all shadow-sm flex items-center gap-2 group">
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">filter_list</span> Filter
            </button>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-primary text-on-primary rounded-[16px] font-title-sm text-[14px] font-bold hover:bg-primary-fixed-variant transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform">upload</span> Upload Resource
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
          {/* Content Grid Area */}
          <div className="flex-1 w-full flex flex-col gap-6 lg:gap-8">
            <motion.section variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 p-6 md:p-8 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
              
              <h2 className="font-title-lg text-[22px] font-bold text-on-surface mb-8 relative z-10 flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary text-[24px]">folder_open</span>
                 Recent Uploads
              </h2>
              
              {loading ? (
                <div className="flex-1 flex justify-center items-center py-20 relative z-10">
                   <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : resources.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 relative z-10 opacity-60">
                   <span className="material-symbols-outlined text-[64px] text-outline mb-4">cloud_off</span>
                   <p className="font-title-md text-secondary">No resources available.</p>
                   <p className="font-body-sm text-outline mt-1">Click Upload Resource to add your first file.</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                  {resources.map((res, idx) => (
                    <motion.div key={res._id || idx} variants={itemVariants} className="bg-surface-container-lowest/50 backdrop-blur-md rounded-[24px] shadow-sm border border-outline-variant/40 p-6 flex flex-col group hover:bg-surface hover:shadow-md hover:border-outline-variant/80 transition-all cursor-pointer relative overflow-hidden">
                      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-[24px] opacity-10 group-hover:opacity-30 transition-opacity ${getColorClass(res.type).split(' ')[0]}`}></div>
                      
                      <div className="flex items-start justify-between mb-5 relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${getColorClass(res.type)}`}>
                          <span className="material-symbols-outlined text-[24px]">{getIconForType(res.type)}</span>
                        </div>
                        <span className="font-label-md text-[11px] font-bold text-secondary uppercase tracking-widest border border-outline-variant/30 px-2 py-1 rounded-md bg-surface-container-low">{res.category}</span>
                      </div>
                      <h4 className="font-title-md text-[18px] font-bold text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors relative z-10">{res.title}</h4>
                      <p className="font-body-sm text-[13px] text-secondary line-clamp-1 mb-6 truncate relative z-10 group-hover:text-primary/70">
                        {res.url ? (res.url.startsWith('/uploads') ? <a href={`http://localhost:5000${res.url}`} target="_blank" rel="noreferrer" className="hover:underline">{res.url}</a> : <a href={res.url} target="_blank" rel="noreferrer" className="hover:underline">{res.url}</a>) : 'No file attached'}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between relative z-10">
                        <span className="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{res.type}</span>
                        <span className="font-label-sm text-[11px] font-semibold text-outline tracking-wider">{new Date(res.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          </div>
        </div>

        {/* Upload Modal Overlay */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={() => setShowModal(false)} 
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-surface rounded-[32px] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col"
              >
                <div className="p-8 pb-6 border-b border-surface-container relative">
                  <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                     <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <h3 className="font-display text-[26px] font-black text-on-surface">Upload Resource</h3>
                  <p className="font-body-sm text-[14px] text-secondary mt-1">Add a new file or link to the project library.</p>
                </div>
                
                <form onSubmit={handleUpload} className="p-8 space-y-6 flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Resource Title</label>
                    <input type="text" required value={newResource.title} onChange={(e) => setNewResource({...newResource, title: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="e.g. Survey Dataset v1" />
                  </div>
                  
                  {newResource.type === 'Link' ? (
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">URL / File Link</label>
                      <input type="url" required value={newResource.url} onChange={(e) => setNewResource({...newResource, url: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="https://..." />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Select File</label>
                      <input type="file" required onChange={(e) => setNewResource({...newResource, file: e.target.files[0]})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Resource Type</label>
                      <select value={newResource.type} onChange={(e) => setNewResource({...newResource, type: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
                        <option value="Document">Document</option>
                        <option value="PDF">PDF</option>
                        <option value="Code">Code Snippet</option>
                        <option value="Link">External Link</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Category</label>
                      <select value={newResource.category} onChange={(e) => setNewResource({...newResource, category: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
                        <option value="General">General</option>
                        <option value="Research">Research</option>
                        <option value="Dataset">Dataset</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-4 border-t border-outline-variant/30 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold text-on-surface border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold bg-primary text-on-primary shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">upload</span> Upload
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default ProjectResourceLibrary;
