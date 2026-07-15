import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const SupervisorDashboard = () => {
  const [metrics, setMetrics] = useState({
    assignedTeams: 0,
    pendingReviews: 0,
    plagiarismAlerts: 0,
    upcomingMeetings: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch('/api/dashboard/supervisor');
        setMetrics(data.data);
      } catch (err) {
        console.error("Failed to fetch supervisor metrics", err);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-margin_mobile md:p-margin_desktop w-full max-w-[1440px] mx-auto pb-24"
    >
      
      <motion.div variants={itemVariants} className="mb-gutter">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Teacher Dashboard</h1>
        <p className="font-body-lg text-[18px] text-secondary">Good morning, Dr. Sarah. Here's an overview of your supervised works.</p>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="mb-gutter bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/20 hover:shadow-md border-l-4 border-l-primary flex items-start gap-4 transition-all hover:-translate-y-1 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="text-primary mt-1 bg-primary/10 p-2 rounded-xl">
          <span className="material-symbols-outlined icon-fill animate-pulse">auto_awesome</span>
        </div>
        <div className="flex-1 relative z-10">
          <h3 className="font-title-lg text-[20px] font-bold text-on-surface mb-1">AI Insight: Plagiarism Alert</h3>
          <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed max-w-3xl">Team Delta's Thesis Draft shows <span className="font-bold text-error">42% similarity</span>. A detailed review is highly recommended to ensure academic integrity before the final defense deadline.</p>
        </div>
        <button className="shrink-0 bg-primary/10 text-primary px-5 py-2.5 rounded-lg font-label-md text-[14px] font-semibold hover:bg-primary hover:text-on-primary transition-colors shadow-sm relative z-10">
          Review Report
        </button>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        {[
          { title: 'Assigned Teams', value: metrics.assignedTeams, icon: 'group', color: 'tertiary', bg: 'surface-container' },
          { title: 'Pending Reviews', value: metrics.pendingReviews, icon: 'pending_actions', color: 'tertiary', bg: 'surface-container' },
          { title: 'Plagiarism Alerts', value: metrics.plagiarismAlerts, icon: 'warning', color: 'error', bg: 'error-container' },
          { title: 'Upcoming Meetings', value: metrics.upcomingMeetings, icon: 'event', color: 'tertiary', bg: 'surface-container' },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            className={`bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-1 ${stat.color === 'error' ? 'hover:border-error/40' : 'hover:border-tertiary/30'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${stat.bg}`}>
                <span className={`material-symbols-outlined text-${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <div>
              <h4 className="font-body-sm text-[14px] font-semibold text-secondary mb-1 uppercase tracking-wider">{stat.title}</h4>
              <p className={`font-display text-[48px] font-bold ${stat.color === 'error' ? 'text-error' : 'text-on-surface'} leading-none`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/20 overflow-hidden mb-8 hover:shadow-md transition-shadow">
        <div className="p-6 md:p-8 border-b border-surface-container flex justify-between items-center bg-surface/50 backdrop-blur-sm">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Recent Submissions</h3>
          <button className="text-primary font-label-md text-[14px] font-semibold hover:text-primary-fixed-variant transition-colors flex items-center gap-1">
            View All <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">Student/Team</th>
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">Work Type</th>
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">Submission Date</th>
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">Plagiarism Score</th>
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">Status</th>
                <th className="p-4 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-[16px] text-on-surface divide-y divide-surface-container">
              {[
                { name: 'Team Delta', initials: 'TD', work: 'Thesis Draft', date: 'Oct 24, 2023', score: '42%', scoreColor: 'text-error bg-error/10', icon: 'warning', status: 'In Review', statusColor: 'bg-[#FEF3C7] text-[#92400E]' },
                { name: 'Alice Smith', initials: 'AS', work: 'SDP Proposal', date: 'Oct 23, 2023', score: '5%', scoreColor: 'text-[#059669] bg-[#059669]/10', icon: 'check_circle', status: 'Delayed', statusColor: 'bg-[#FEE2E2] text-[#991B1B]' },
                { name: 'Bob Jones', initials: 'BJ', work: 'Literature Review', date: 'Oct 20, 2023', score: '12%', scoreColor: 'text-[#059669] bg-[#059669]/10', icon: 'check_circle', status: 'Approved', statusColor: 'bg-[#D1FAE5] text-[#065F46]' }
              ].map((row, idx) => (
                <motion.tr 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="hover:bg-[#F1F5F9] transition-colors group cursor-pointer"
                >
                  <td className="p-4 px-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                      {row.initials}
                    </div>
                    <span className="font-semibold">{row.name}</span>
                  </td>
                  <td className="p-4 px-6 text-secondary font-medium group-hover:text-primary transition-colors">{row.work}</td>
                  <td className="p-4 px-6 text-secondary">{row.date}</td>
                  <td className="p-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-[12px] font-bold ${row.scoreColor}`}>
                      <span className="material-symbols-outlined text-[14px]">{row.icon}</span> {row.score}
                    </span>
                  </td>
                  <td className="p-4 px-6">
                    <span className={`${row.statusColor} px-3 py-1.5 rounded-full font-label-md text-[12px] font-bold uppercase tracking-wide`}>{row.status}</span>
                  </td>
                  <td className="p-4 px-6 text-right">
                    <button className="text-secondary hover:text-primary bg-surface p-2 rounded-full shadow-sm border border-outline-variant/30 hover:border-primary/50 transition-all"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_horiz</span></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SupervisorDashboard;
