import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const TasksMilestones = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', dueDate: '' });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // Mocking project ID since it would normally come from context/URL
      const res = await apiFetch('/api/tasks');
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
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...newTask, project: '60d0fe4f5311236168a109ca' }) // Hardcoded mock project ID for now
      });
      if (res.success) {
        setShowModal(false);
        setNewTask({ title: '', description: '', status: 'todo', dueDate: '' });
        loadTasks();
      }
    } catch (error) {
      alert('Error creating task: ' + error.message);
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex flex-col gap-gutter">
      {/* Page Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface">Tasks & Milestones</h2>
          <p className="font-title-lg text-[20px] font-semibold text-on-surface-variant mt-1">SDP Project: <span className="text-primary font-bold">AI Health Monitor</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-body-md text-[16px] font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Task
        </button>
      </div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Overall Progress */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Overall Progress</h3>
            <span className="material-symbols-outlined text-outline">trending_up</span>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-headline-md text-[24px] font-semibold text-primary">{progress}%</span>
              <span className="font-body-sm text-[14px] text-on-surface-variant">{progress === 100 ? 'Completed' : 'On Track'}</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1">
              <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col justify-center">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Milestones</h3>
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface-container-lowest shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-primary mt-1">Proposal</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface-container-lowest shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-primary mt-1">Methodology</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-on-surface mt-1">Implement</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-surface-container-highest border-2 border-outline-variant shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant mt-1">Defense</span>
            </div>
          </div>
        </div>

        {/* AI Next-Task Suggestion */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border-l-[3px] border-l-primary relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">AI Suggestion</h3>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
            Based on your timeline, you should finalize the <strong className="text-on-surface font-semibold">Data Privacy documentation</strong> by Friday to remain on schedule for the Implementation phase.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="p-4 text-secondary">Loading tasks...</div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full items-start min-w-[1024px]">
            {/* Column: Pending */}
            <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Pending</h3>
                <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">{todoTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {todoTasks.map(task => (
                  <div key={task._id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-error-container text-on-error-container font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">High</span>
                    </div>
                    <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">{task.title}</h4>
                    {task.dueDate && (
                      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                          <span className="font-label-md text-[12px] font-semibold">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">In Progress</h3>
                </div>
                <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">{inProgressTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {inProgressTasks.map(task => (
                  <div key={task._id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group border-t-[3px] border-t-primary">
                    <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Column: Completed */}
            <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Completed</h3>
                <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">{completedTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {completedTasks.map(task => (
                  <div key={task._id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 opacity-70 group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary-container">check_circle</span>
                    </div>
                    <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-through line-clamp-2">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-2xl font-bold text-on-surface mb-4">Add New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Title</label>
                  <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Description</label>
                  <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface h-24"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary-container transition-colors">Create Task</button>
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
