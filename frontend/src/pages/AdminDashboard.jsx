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

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeProjects: 0,
    assignmentsSubmitted: 0,
    plagiarismAlerts: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch('/api/dashboard/admin');
        setMetrics(data.data);
      } catch (err) {
        console.error("Failed to fetch admin metrics", err);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="pt-6 px-margin_mobile md:px-margin_desktop pb-12 w-full max-w-[1440px] mx-auto"
    >
      
      <motion.div variants={itemVariants} className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface">Platform Overview</h2>
          <p className="font-body-lg text-[18px] text-secondary mt-1">Real-time metrics and system health monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-primary text-primary font-title-lg text-[14px] font-semibold hover:bg-primary/5 hover:border-primary/80 transition-all shadow-sm hover:shadow active:scale-95">
            Export Report
          </button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {[
          { title: 'Total Students', value: metrics.totalStudents, icon: 'groups', textClass: 'text-primary', bgClass: 'bg-surface-container', borderHoverClass: 'hover:border-primary/30' },
          { title: 'Total Teachers', value: metrics.totalTeachers, icon: 'badge', textClass: 'text-on-tertiary-container', bgClass: 'bg-tertiary-container', borderHoverClass: 'hover:border-tertiary/30' },
          { title: 'Active SDP Projects', value: metrics.activeProjects, icon: 'folder_open', textClass: 'text-primary', bgClass: 'bg-surface-container-high', borderHoverClass: 'hover:border-primary/30', special: true },
          { title: 'Assignments Submitted', value: metrics.assignmentsSubmitted, icon: 'task', textClass: 'text-on-secondary-container', bgClass: 'bg-secondary-container', borderHoverClass: 'hover:border-secondary/30' },
        ].map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants} className={`bg-surface-bright rounded-[24px] p-6 shadow-sm border border-outline-variant/20 ${stat.borderHoverClass} hover:shadow-md transition-all hover:-translate-y-1 ${stat.special ? 'shadow-[inset_1px_0px_0px_0px_#4f46e5] relative overflow-hidden' : 'flex flex-col justify-between'}`}>
            {stat.special && (
              <div className="absolute top-4 right-4 text-primary">
                <span className="material-symbols-outlined animate-pulse" style={{ fontSize: '18px' }}>auto_awesome</span>
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bgClass} ${stat.textClass} rounded-xl`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
            <div>
              <p className="font-body-md text-[16px] text-secondary">{stat.title}</p>
              <h3 className="font-headline-lg text-[32px] font-bold text-on-surface mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}

        <motion.div variants={itemVariants} className="bg-error-container/80 backdrop-blur-sm rounded-[24px] p-6 shadow-sm border border-error/30 hover:border-error/60 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-error text-on-error rounded-xl shadow-inner">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div>
            <p className="font-body-md text-[16px] text-on-error-container font-medium">Plagiarism Alerts</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="font-headline-lg text-[32px] font-bold text-on-error-container">{metrics.plagiarismAlerts}</h3>
              <span className="font-label-md text-[12px] font-bold text-error bg-error/10 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">High Priority</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div variants={itemVariants} className="bg-surface-bright rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Submission Status</h3>
          <div className="h-64 flex items-center justify-center relative">
            <motion.div 
              initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-48 h-48 rounded-full border-[16px] border-surface-container relative hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full border-[16px] border-primary transition-all duration-500 hover:border-[20px]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)", margin: "-16px" }}></div>
              <div className="absolute inset-0 rounded-full border-[16px] border-tertiary-container transition-all duration-500 hover:border-[20px]" style={{ clipPath: "polygon(100% 100%, 0 100%, 0 50%)", margin: "-16px" }}></div>
            </motion.div>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="font-headline-md text-[32px] font-bold text-on-surface">312</span>
              <span className="font-label-md text-[14px] font-semibold text-secondary uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-8">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary shadow-sm"></div><span className="font-body-sm text-[14px] font-medium text-secondary">Graded (65%)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary-container shadow-sm"></div><span className="font-body-sm text-[14px] font-medium text-secondary">Pending (25%)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface-container shadow-sm border border-outline-variant/30"></div><span className="font-body-sm text-[14px] font-medium text-secondary">Overdue (10%)</span></div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface-bright rounded-[24px] p-8 shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Monthly Activity</h3>
          <div className="h-64 flex items-end justify-between px-2 gap-3 border-b border-surface-container pb-2">
            {[40, 50, 80, 60, 90, 75].map((h1, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="w-full flex flex-col justify-end gap-1 group cursor-pointer"
              >
                <div className="w-full bg-primary rounded-t-md transition-all duration-300 group-hover:bg-primary-fixed-variant" style={{ height: `${h1}%` }}></div>
                <div className="w-full bg-surface-variant rounded-t-sm transition-all duration-300 group-hover:bg-outline-variant" style={{ height: `${h1 * 0.5}%` }}></div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between px-2 mt-4">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
              <span key={i} className="font-label-md text-[13px] font-bold text-secondary uppercase tracking-wider w-full text-center">{month}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-surface-bright rounded-[24px] shadow-sm border border-outline-variant/20 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6 md:p-8 border-b border-surface-container flex justify-between items-center bg-surface/50 backdrop-blur-sm">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Recent System Activity</h3>
          <button className="font-label-md text-[14px] font-semibold text-primary hover:text-primary-fixed-variant transition-colors flex items-center gap-1">
            View All <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-surface-container">
                <th className="font-label-md text-[12px] font-bold text-secondary py-4 px-8 uppercase tracking-wider">User</th>
                <th className="font-label-md text-[12px] font-bold text-secondary py-4 px-6 uppercase tracking-wider">Action</th>
                <th className="font-label-md text-[12px] font-bold text-secondary py-4 px-6 uppercase tracking-wider">Target Resource</th>
                <th className="font-label-md text-[12px] font-bold text-secondary py-4 px-6 uppercase tracking-wider">Timestamp</th>
                <th className="font-label-md text-[12px] font-bold text-secondary py-4 px-8 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container bg-surface-bright">
              {[
                { name: 'Dr. Alan James', initials: 'AJ', action: 'Document Upload', target: 'Thesis_Draft_v2.pdf', time: '10 mins ago', status: 'Success', statusColor: 'bg-[#10B981]/10 text-[#10B981]', iconBg: 'bg-tertiary-container text-on-tertiary-container' },
                { name: 'Maria Rossi', initials: 'MR', action: 'System Login', target: 'Supervision Portal', time: '45 mins ago', status: 'Success', statusColor: 'bg-[#10B981]/10 text-[#10B981]', iconBg: 'bg-primary-container text-on-primary-container' },
                { name: 'AI Monitor', initials: 'SYS', action: 'Plagiarism Alert', target: 'Submission_ID_8829', time: '2 hours ago', status: 'Flagged', statusColor: 'bg-error/10 text-error', iconBg: 'bg-error-container text-on-error-container', warning: true },
                { name: 'Prof. Sarah Klein', initials: 'SK', action: 'Settings Modified', target: 'AI Evaluation Criteria', time: '5 hours ago', status: 'Pending Sync', statusColor: 'bg-[#F59E0B]/10 text-[#F59E0B]', iconBg: 'bg-secondary-container text-on-secondary-container' }
              ].map((row, idx) => (
                <motion.tr 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="hover:bg-surface-container-lowest transition-colors group cursor-pointer"
                >
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${row.iconBg} flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform`}>
                        {row.initials}
                      </div>
                      <span className="font-body-md text-[15px] font-semibold text-on-surface">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 font-body-md text-[15px] text-on-surface flex items-center gap-2">
                    {row.warning && <span className="material-symbols-outlined text-error text-sm animate-pulse">warning</span>}
                    {row.action}
                  </td>
                  <td className="py-5 px-6 font-body-md text-[15px] text-secondary group-hover:text-primary transition-colors">{row.target}</td>
                  <td className="py-5 px-6 font-body-md text-[15px] text-secondary">{row.time}</td>
                  <td className="py-5 px-8">
                    <span className={`${row.statusColor} font-label-md text-[12px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide`}>{row.status}</span>
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

export default AdminDashboard;
