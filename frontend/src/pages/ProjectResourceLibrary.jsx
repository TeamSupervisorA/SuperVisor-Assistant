import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const ProjectResourceLibrary = () => {
  const { activeProject } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', type: 'Document', category: 'General', url: '' });

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
      if (res.data) {
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
      const res = await apiFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ ...newResource, project: activeProject._id })
      });
      if (res.success) {
        setShowModal(false);
        setNewResource({ title: '', type: 'Document', category: 'General', url: '' });
        loadResources();
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
      case 'Code': return 'bg-inverse-surface text-inverse-on-surface';
      case 'Document': return 'bg-surface-variant text-on-surface';
      case 'PDF': return 'bg-error-container text-on-error-container';
      default: return 'bg-primary-container text-on-primary-container';
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">library_books</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project from the top navigation to view resources.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Resource Library</h1>
          <p className="font-body-lg text-[18px] text-on-surface-variant mt-2 max-w-2xl">Manage and discover shared assets, documentation, and tools across all active research projects.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[12px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md text-[12px] font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Upload Resource
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 hidden lg:flex">
          {/* Categories */}
          <div>
            <h3 className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider mb-4">Categories</h3>
            <ul className="flex flex-col gap-1">
              <li>
                <button className="w-full text-left px-3 py-2 rounded-md bg-primary-container text-on-primary-container font-body-md text-[16px] flex items-center justify-between">
                  All Resources
                  <span className="font-label-md text-[12px] font-semibold bg-surface-container-lowest text-primary px-2 py-0.5 rounded-full">{resources.length}</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Content Grid Area */}
        <div className="flex-1 w-full flex flex-col gap-10">
          {/* All Resources Grid */}
          <section>
            <h2 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Recent Uploads</h2>
            {loading ? (
              <p className="text-secondary">Loading...</p>
            ) : resources.length === 0 ? (
              <p className="text-secondary">No resources available. Click Upload to add one.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {resources.map((res) => (
                  <div key={res._id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-5 flex flex-col group hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer resource-card relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getColorClass(res.type)}`}>
                          <span className="material-symbols-outlined text-[18px]">{getIconForType(res.type)}</span>
                        </div>
                        <span className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wide">{res.category}</span>
                      </div>
                    </div>
                    <h4 className="font-headline-md text-[24px] font-semibold text-on-surface mb-1">{res.title}</h4>
                    <p className="font-body-sm text-[14px] text-on-surface-variant mb-4 line-clamp-2 truncate">{res.url}</p>
                    <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-[12px] font-semibold text-on-surface">{res.type}</span>
                      </div>
                      <span className="font-body-sm text-[14px] text-secondary">{new Date(res.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="card-actions-overlay absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <a href={res.url} target="_blank" rel="noreferrer" className="bg-surface border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">Open</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Add Resource Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-2xl font-bold text-on-surface mb-4">Upload Resource</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Title</label>
                  <input required value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">URL / Link</label>
                  <input required value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                    <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface">
                      <option>Document</option>
                      <option>PDF</option>
                      <option>Code</option>
                      <option>Link</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Category</label>
                    <select value={newResource.category} onChange={e => setNewResource({...newResource, category: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface">
                      <option>General</option>
                      <option>Research</option>
                      <option>Methodology</option>
                      <option>Implementation</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary-container transition-colors">Upload</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-20 w-full"></div>
    </div>
  );
};

export default ProjectResourceLibrary;
