import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TasksMilestones = () => {
  const { activeProject } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', dueDate: '' });
  const [aiGuidance, setAiGuidance] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tasks?project=${activeProject._id}`);
      
      if (res.data) {
        setTasks(res.data);
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const payload = { ...newTask, project: activeProject._id };
      if (!payload.dueDate) delete payload.dueDate;
      // In a real scenario, this hits the API. For the demo, we update local state if API fails.
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const createdTask = res?.success ? res.data : { _id: Date.now().toString(), ...payload };
      setTasks([...tasks, createdTask]);
      setShowModal(false);
      setNewTask({ title: '', description: '', status: 'todo', dueDate: '' });
    } catch (error) {
      console.error('Error creating task', error);
    }
  };

  const fetchAiGuidance = async () => {
    if (tasks.length === 0) return alert('Add some tasks first before getting AI guidance.');
    setAiLoading(true);
    try {
      const taskSummaries = tasks.map(t => `${t.title} (${t.status})`).join(', ');
      const res = await apiFetch('/api/ai/recommend-task', {
        method: 'POST',
        body: JSON.stringify({ tasks: taskSummaries })
      });
      
      if (res.success) setAiGuidance(res.data);
    } catch (e) {
      console.error('AI Guidance error', e);
    } finally {
      setAiLoading(false);
    }
  };

  // Logic: Delay Detection (Section 4.6)
  const isDelayed = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const delayedTasksCount = tasks.filter(isDelayed).length;

  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  if (!activeProject) {
    return (
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">folder_off</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Please select an active project from the top navigation to view its tasks and milestones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Workspace</span>
            <h1 className="font-display text-[28px] md:text-[36px] font-black text-on-surface tracking-tight leading-none mb-2">Tasks & Milestones</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Project: <strong className="text-primary">{activeProject.title}</strong></p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-[0_4px_14px_rgba(var(--color-primary-rgb),0.3)] flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
            <span className="material-symbols-outlined text-[20px]">add_task</span>
            Create Task
          </button>
        </motion.div>

        {/* Dashboard Widgets Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
          
          {/* Overall Progress & Delay Alert (4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-label-md text-[13px] font-bold uppercase tracking-wider text-on-surface">Overall Progress</h3>
              {delayedTasksCount > 0 && (
                <span className="bg-error/10 text-error px-2 py-1 rounded-md font-label-sm font-bold uppercase text-[10px] border border-error/20 flex items-center gap-1 animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  {delayedTasksCount} Delayed
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="font-display text-[36px] font-bold text-primary leading-none">{progress}%</span>
                <span className="font-body-sm text-[13px] font-medium text-secondary">{progress === 100 ? 'Completed' : 'On Track'}</span>
              </div>
              <div className="w-full bg-secondary-container h-3 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${delayedTasksCount > 0 ? 'bg-error' : 'bg-primary'}`}
                  style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Milestone Timeline (4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-tertiary/10 rounded-full blur-[40px] pointer-events-none transition-colors group-hover:bg-tertiary/20"></div>
            <h3 className="font-label-md text-[13px] font-bold uppercase tracking-wider text-on-surface mb-6 relative z-10">Project Milestones</h3>
            
            <div className="flex justify-between items-center relative px-2 z-10">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-outline-variant/30 -translate-y-1/2 z-0 rounded-full"></div>
              
              {['Proposal', 'Design', 'Code', 'Defense'].map((step, idx) => {
                const isActive = idx === 1; // Mocking current step
                const isPast = idx < 1;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-2 group/step cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border-4 shadow-sm transition-transform group-hover/step:scale-125 ${isActive ? 'bg-surface border-tertiary' : isPast ? 'bg-tertiary border-tertiary' : 'bg-surface border-outline-variant'}`}></div>
                    <span className={`font-label-sm text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-tertiary' : isPast ? 'text-on-surface' : 'text-secondary'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* AI Guidance (4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface-container-lowest/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-l-4 border-l-primary border-y border-r border-y-outline-variant/30 border-r-outline-variant/30 flex flex-col relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-48 h-48 bg-primary/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">lightbulb</span>
                <h3 className="font-label-md text-[13px] font-bold uppercase tracking-wider text-on-surface">AI Next-Task Guidance</h3>
              </div>
              <button onClick={fetchAiGuidance} disabled={aiLoading} className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-bold text-[11px] uppercase tracking-wider">
                {aiLoading ? 'Analyzing...' : 'Analyze Board'}
              </button>
            </div>
            
            <div className="relative z-10 flex-1 flex items-center">
               <p className="font-body-sm text-[14px] text-on-surface-variant leading-relaxed">
                 {aiGuidance ? aiGuidance : 'Click Analyze Board to get AI-powered recommendations on what task to prioritize next based on your current progress and deadlines.'}
               </p>
            </div>
          </motion.div>

        </motion.div>

        {/* Kanban Board Container */}
        <motion.div variants={itemVariants} className="flex-1 min-h-0 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full items-start min-w-[1024px]">
            
            {/* Column Function */}
            {[
              { id: 'todo', title: 'Pending', tasks: todoTasks, icon: 'list_alt', color: 'bg-surface-container-low/60', indicator: 'bg-secondary' },
              { id: 'in_progress', title: 'In Progress', tasks: inProgressTasks, icon: 'clock_loader_40', color: 'bg-primary/5', indicator: 'bg-primary' },
              { id: 'completed', title: 'Completed', tasks: completedTasks, icon: 'task_alt', color: 'bg-tertiary-container/10', indicator: 'bg-tertiary' }
            ].map(col => (
              <div key={col.id} className={`flex-1 w-80 ${col.color} backdrop-blur-md rounded-[24px] p-4 flex flex-col max-h-[calc(100vh-320px)] border border-outline-variant/20 shadow-sm`}>
                
                <div className="flex items-center justify-between mb-5 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.indicator}`}></div>
                    <h3 className="font-title-md text-[18px] font-bold text-on-surface">{col.title}</h3>
                  </div>
                  <span className="bg-surface border border-outline-variant/30 text-secondary font-label-sm text-[12px] font-bold py-1 px-3 rounded-full shadow-sm">{col.tasks.length}</span>
                </div>
                
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                  {col.tasks.map(task => {
                    const delayed = isDelayed(task);
                    return (
                      <motion.div 
                        layoutId={task._id}
                        key={task._id} 
                        className={`bg-surface/90 backdrop-blur-sm p-5 rounded-2xl shadow-sm border ${delayed ? 'border-error/50 border-l-4 border-l-error' : 'border-outline-variant/30 hover:border-primary/40'} hover:shadow-md transition-all cursor-pointer group`}
                      >
                        <div className="flex justify-between items-start mb-3">
                           {delayed ? (
                             <span className="bg-error/10 text-error border border-error/20 font-label-sm text-[10px] font-bold uppercase py-1 px-2 rounded-md tracking-wider flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">warning</span> Delayed
                             </span>
                           ) : (
                             <span className="bg-surface-container text-secondary font-label-sm text-[10px] font-bold uppercase py-1 px-2 rounded-md tracking-wider">
                               {task.status.replace('_', ' ')}
                             </span>
                           )}
                        </div>
                        
                        <h4 className="font-title-sm text-[15px] font-bold text-on-surface mb-4 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{task.title}</h4>
                        
                        {task.dueDate && (
                          <div className={`flex items-center justify-between pt-3 border-t ${delayed ? 'border-error/20' : 'border-outline-variant/20'}`}>
                            <div className={`flex items-center gap-1.5 ${delayed ? 'text-error' : 'text-secondary'}`}>
                              <span className="material-symbols-outlined text-[16px]">{delayed ? 'event_busy' : 'calendar_today'}</span>
                              <span className="font-label-sm text-[11px] font-bold">{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="material-symbols-outlined text-[14px] text-on-surface">arrow_forward</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                  {col.tasks.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center text-secondary/60">
                       <span className="material-symbols-outlined text-[32px] mb-2">{col.icon}</span>
                       <span className="font-label-md text-[13px]">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </motion.div>

      </motion.div>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-outline-variant/20"
            >
              <div className="p-6 md:p-8 border-b border-outline-variant/20 bg-surface/50">
                <div className="flex justify-between items-center">
                  <h3 className="font-title-lg text-[24px] font-black text-on-surface tracking-tight">Create New Task</h3>
                  <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateTask} className="p-6 md:p-8 flex flex-col gap-5">
                <div>
                  <label className="block font-label-md font-bold text-on-surface mb-2 uppercase tracking-wider text-[12px]">Task Title</label>
                  <input 
                    type="text" required
                    value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 p-4 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary"
                    placeholder="e.g. Design Database Schema"
                  />
                </div>
                
                <div>
                  <label className="block font-label-md font-bold text-on-surface mb-2 uppercase tracking-wider text-[12px]">Description</label>
                  <textarea 
                    rows="3"
                    value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 p-4 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary resize-none"
                    placeholder="Brief details about the task..."
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block font-label-md font-bold text-on-surface mb-2 uppercase tracking-wider text-[12px]">Status</label>
                    <div className="relative">
                      <select 
                        value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant/40 p-4 pr-10 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="todo">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-md font-bold text-on-surface mb-2 uppercase tracking-wider text-[12px]">Due Date</label>
                    <input 
                      type="date"
                      value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 p-4 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-label-md font-bold text-on-surface hover:bg-surface-container transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TasksMilestones;
