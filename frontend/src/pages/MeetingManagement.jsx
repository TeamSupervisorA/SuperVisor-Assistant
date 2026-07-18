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

const MeetingManagement = () => {
  const { activeProject } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', type: 'Online' });

  useEffect(() => {
    if (activeProject) {
      loadMeetings();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/meetings?project=${activeProject._id}`);
      if (res && res.data) {
        setMeetings(res.data);
      }
    } catch (error) {
      console.error('Failed to load meetings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const res = await apiFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...newMeeting, project: activeProject._id })
      });
      
      if (res.success) {
        setShowModal(false);
        setNewMeeting({ title: '', date: '', time: '', type: 'Online' });
        if (res.data) {
          setMeetings([...meetings, res.data]);
        } else {
          loadMeetings();
        }
      }
    } catch (error) {
      alert('Error creating meeting: ' + error.message);
    }
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${today.getFullYear()}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayMeetings = meetings.filter(m => m.date.startsWith(dateStr));
      days.push({ day: i, dateStr, meetings: dayMeetings, isToday: i === today.getDate() });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner">
             <span className="material-symbols-outlined text-[40px] text-primary">event_busy</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to view and schedule meetings.</p>
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
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Collaboration</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Meeting Management</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Schedule and manage supervision meetings and reviews.</p>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
          {/* Calendar Section */}
          <motion.section variants={itemVariants} className="flex-1 bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 p-6 md:p-8 flex flex-col min-h-[700px]">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-[22px] font-bold text-on-surface leading-tight">{today.toLocaleString('default', { month: 'long' })} {today.getFullYear()}</h2>
                  <p className="font-body-sm text-[13px] text-secondary">Academic Calendar</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/40 rounded-[12px] p-1 shadow-sm">
                <button className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button className="px-4 py-1.5 font-label-md text-[13px] font-bold rounded-[8px] hover:bg-surface-variant text-on-surface transition-colors">Today</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[20px] border border-outline-variant/30 bg-surface-container-lowest/50">
              <div className="grid grid-cols-7 gap-[1px] bg-outline-variant/30 text-center font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/30">
                <div className="bg-surface/80 py-3">Mon</div>
                <div className="bg-surface/80 py-3">Tue</div>
                <div className="bg-surface/80 py-3">Wed</div>
                <div className="bg-surface/80 py-3">Thu</div>
                <div className="bg-surface/80 py-3">Fri</div>
                <div className="bg-surface/80 py-3">Sat</div>
                <div className="bg-surface/80 py-3">Sun</div>
              </div>
              <div className="grid grid-cols-7 gap-[1px] bg-outline-variant/30 flex-1 overflow-y-auto">
                {/* Filler for start of month (simplified) */}
                <div className="bg-surface/50 min-h-[120px] p-2"></div>
                
                {calendarDays.map((d, i) => (
                  <div key={i} className={`bg-surface/50 min-h-[120px] p-2 hover:bg-surface/80 transition-colors flex flex-col group ${d.isToday ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full font-label-md text-[13px] font-bold ${d.isToday ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                        {d.day}
                      </span>
                      {d.meetings.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-1"></span>}
                    </div>
                    <div className="mt-2 space-y-1 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      {d.meetings.map(m => (
                        <div key={m._id} className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-2 py-1.5 rounded-lg text-[11px] font-medium truncate shadow-sm hover:border-primary/40 transition-colors" title={`${m.time} - ${m.title}`}>
                          <span className="text-primary font-bold mr-1">{m.time}</span>
                          {m.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Sidebar / Upcoming & Form */}
          <motion.div variants={itemVariants} className="w-full lg:w-[420px] flex flex-col gap-6 lg:gap-8">
            
            {/* Action Button */}
            <button onClick={() => setShowModal(true)} className="w-full bg-primary text-on-primary py-4 px-6 rounded-[20px] font-title-md text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-[0_8px_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_12px_25px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-1 active:translate-y-0 group">
              <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform">add</span>
              Schedule New Meeting
            </button>

            {/* Upcoming Meetings */}
            <section className="bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary text-[24px]">upcoming</span>
                <h3 className="font-title-lg text-[22px] font-bold text-on-surface">Upcoming</h3>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-10 bg-surface-container-lowest/50 rounded-[20px] border border-outline-variant/30">
                   <span className="material-symbols-outlined text-[32px] text-outline mb-2">event_available</span>
                   <p className="font-body-sm text-[14px] text-secondary">No upcoming meetings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting, idx) => {
                    const typeColor = meeting.type === 'Online' ? 'bg-primary' : meeting.type === 'In-Person' ? 'bg-[#10B981]' : 'bg-tertiary';
                    
                    return (
                      <motion.div key={meeting._id || idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface hover:shadow-sm hover:border-outline-variant/80 transition-all group cursor-pointer relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeColor}`}></div>
                        
                        <div className="flex justify-between items-start mb-3 ml-2">
                          <h4 className="font-title-md text-[16px] font-bold text-on-surface truncate pr-2 group-hover:text-primary transition-colors">{meeting.title}</h4>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${typeColor}/10 ${typeColor.replace('bg-','text-')}`}>{meeting.type}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-2">
                          <p className="font-body-sm text-[13px] text-secondary flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">event</span>
                            {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="font-body-sm text-[13px] text-secondary flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">schedule</span>
                            {meeting.time}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </section>
          </motion.div>
        </div>

        {/* Add Meeting Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-surface rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden relative z-10 border border-outline-variant/30 flex flex-col"
              >
                <div className="p-8 pb-6 border-b border-surface-container relative">
                  <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                     <span className="material-symbols-outlined text-[24px]">event_note</span>
                  </div>
                  <h3 className="font-display text-[26px] font-black text-on-surface">Schedule Meeting</h3>
                  <p className="font-body-sm text-[14px] text-secondary mt-1">Set up a new supervision session or review.</p>
                </div>
                
                <form onSubmit={handleCreateMeeting} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Meeting Title</label>
                    <input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="e.g. Chapter 3 Review" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Date</label>
                      <input required type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Time</label>
                      <input required type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Meeting Type</label>
                    <select value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
                      <option>Online</option>
                      <option>In-Person</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-outline-variant/30">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold text-on-surface border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors shadow-sm hover:shadow-md active:scale-95">Schedule</button>
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

export default MeetingManagement;
