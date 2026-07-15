import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

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
      if (res.data) {
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
        loadMeetings();
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
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">event_busy</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project from the top navigation to view and schedule meetings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <section className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col h-[800px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-headline-md text-[24px] font-semibold text-on-surface">Schedule</h2>
              <p className="font-body-sm text-[14px] text-on-surface-variant">{today.toLocaleString('default', { month: 'long' })} {today.getFullYear()}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="px-4 py-2 font-body-sm text-[14px] rounded hover:bg-surface-container-low text-on-surface-variant border border-outline-variant">Today</button>
              <button className="p-2 rounded hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 gap-1 bg-surface-variant border border-surface-variant rounded-t-lg text-center py-2 font-label-md text-[12px] font-semibold text-on-surface-variant">
              <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
            </div>
            <div className="grid grid-cols-7 gap-[1px] bg-surface-variant border-x border-b border-surface-variant rounded-b-lg flex-1 overflow-y-auto">
              {/* Filler for start of month (simplified) */}
              <div className="bg-surface-container-lowest min-h-[100px] p-2"></div>
              
              {calendarDays.map((d, i) => (
                <div key={i} className={`bg-surface-container-lowest min-h-[100px] p-2 ${d.isToday ? 'bg-primary/5 border border-primary/20' : ''}`}>
                  <span className={`font-label-md text-[12px] font-semibold ${d.isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{d.day}</span>
                  {d.meetings.map(m => (
                    <div key={m._id} className="mt-1 bg-primary-container/20 text-primary px-2 py-1 rounded text-[10px] truncate" title={m.title}>
                      {m.time} - {m.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar / Upcoming & Form */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          {/* Action Button */}
          <button onClick={() => setShowModal(true)} className="w-full bg-primary text-on-primary py-3 px-6 rounded-lg font-title-lg text-[20px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-opacity">
            <span className="material-symbols-outlined">add</span>
            Schedule Meeting
          </button>

          {/* Upcoming Meetings */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex-1 overflow-y-auto">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Upcoming</h3>
            {loading ? (
              <p className="text-secondary">Loading...</p>
            ) : meetings.length === 0 ? (
              <p className="text-secondary">No upcoming meetings.</p>
            ) : (
              <div className="space-y-4">
                {meetings.slice(0, 5).map(meeting => (
                  <div key={meeting._id} className="p-4 rounded-lg border border-surface-variant bg-surface hover:bg-surface-container-low transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-body-md text-[16px] font-semibold text-on-surface truncate pr-2">{meeting.title}</h4>
                      <span className="bg-tertiary-container/10 text-tertiary-container px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{meeting.type}</span>
                    </div>
                    <p className="font-body-sm text-[14px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add Meeting Modal */}
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
              <h3 className="text-2xl font-bold text-on-surface mb-4">Schedule Meeting</h3>
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Title</label>
                  <input required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Date</label>
                    <input required type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Time</label>
                    <input required type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                  <select value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface">
                    <option>Online</option>
                    <option>In-Person</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary-container transition-colors">Schedule</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeetingManagement;
