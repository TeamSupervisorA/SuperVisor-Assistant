import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const defaultRubric = [
  { key: 'problemUnderstanding', label: 'Problem understanding', maxScore: 10, description: '' },
  { key: 'methodology', label: 'Methodology', maxScore: 20, description: '' },
  { key: 'implementation', label: 'Implementation', maxScore: 30, description: '' },
  { key: 'documentation', label: 'Documentation', maxScore: 40, description: '' }
];

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: '', name: '', department: '', sections: 1 });
  const [departments, setDepartments] = useState([]);
  const [rubricCourse, setRubricCourse] = useState(null);
  const [rubric, setRubric] = useState(defaultRubric);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const [res, departmentRes] = await Promise.all([
        apiFetch('/api/courses'),
        apiFetch('/api/admin/departments').catch(() => ({ data: [] }))
      ]);
      setCourses(res.data || []);
      const nextDepartments = departmentRes.data || [];
      setDepartments(nextDepartments);
      setNewCourse((current) => ({ ...current, department: current.department || nextDepartments[0]?.name || '' }));
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
      setError(err.message || 'Unable to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await apiFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify(newCourse)
      });
      
      setCourses([...courses, res.data]);
      setShowAddModal(false);
      setNewCourse({ code: '', name: '', department: departments[0]?.name || '', sections: 1 });
    } catch (err) {
      setError(err.message || 'Unable to create the course.');
    }
  };

  const saveRubric = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const response = await apiFetch(`/api/courses/${rubricCourse._id}`, {
        method: 'PUT',
        body: JSON.stringify({ rubric: { criteria: rubric } })
      });
      setCourses((items) => items.map((course) => course._id === response.data._id ? response.data : course));
      setRubricCourse(null);
    } catch (err) {
      setError(err.message || 'Unable to save the course rubric.');
    }
  };

  const getDeptStats = (deptName) => {
    const deptCourses = courses.filter(c => c.department === deptName);
    const totalSections = deptCourses.reduce((sum, c) => sum + (c.sections || 1), 0);
    return { courses: deptCourses.length, sections: totalSections };
  };

  const csStats = getDeptStats('Computer Science');
  const eeeStats = getDeptStats('Electrical Engineering');
  const baStats = getDeptStats('Business Admin');
  const filteredCourses = courses.filter((course) => `${course.code} ${course.name} ${course.department}`.toLowerCase().includes(query.toLowerCase()));

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
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
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8"
      >
        {/* Page Header & Global Actions */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Curriculum</span>
            <h2 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Course Management</h2>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Organize university departments, courses, and sections.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 group">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-y-0.5 transition-transform">library_add</span> Add Course
            </button>
          </div>
        </motion.div>

        {error && <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 px-5 py-3 text-sm font-medium text-error">{error}</div>}

        {/* Department Overview Bento Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {[
            { title: 'Computer Science', subtitle: 'School of Engineering', icon: 'terminal', color: 'bg-primary', stats: csStats, label: 'Science' },
            { title: 'Electrical Engineering', subtitle: 'School of Engineering', icon: 'bolt', color: 'bg-tertiary', stats: eeeStats, label: 'Engineering' },
            { title: 'Business Admin', subtitle: 'School of Business', icon: 'trending_up', color: 'bg-[#10B981]', stats: baStats, label: 'Business' },
          ].map((dept, idx) => (
            <motion.div key={idx} variants={itemVariants} className={`bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:border-${dept.color.replace('bg-','')}/40 hover:shadow-md transition-all flex flex-col group relative overflow-hidden`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[24px] opacity-20 ${dept.color} group-hover:opacity-40 transition-opacity`}></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-surface shadow-sm ${dept.color.replace('bg-', 'bg-')}/10 ${dept.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[24px]">{dept.icon}</span>
                </div>
                <span className={`font-label-md text-[11px] font-bold ${dept.color.replace('bg-','bg-')}/10 ${dept.color.replace('bg-','text-')} border border-current/20 px-2.5 py-1 rounded-full uppercase tracking-wider`}>{dept.label}</span>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-1">{dept.title}</h3>
                <p className="font-body-sm text-[14px] text-secondary mb-6">{dept.subtitle}</p>
              </div>
              
              <div className="mt-auto flex items-center gap-6 border-t border-outline-variant/30 pt-6 relative z-10">
                <div>
                  <div className="font-display text-[32px] font-black text-on-surface leading-none mb-1">{dept.stats.courses}</div>
                  <div className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest">Active Courses</div>
                </div>
                <div className="h-10 w-px bg-outline-variant/40"></div>
                <div>
                  <div className="font-display text-[32px] font-black text-on-surface leading-none mb-1">{dept.stats.sections}</div>
                  <div className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest">Sections</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Courses Table Section */}
        <motion.div variants={itemVariants} className="bg-surface/90 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 md:p-8 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/50">
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface">Course Directory</h3>
            
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses..." className="pl-12 pr-4 py-2.5 bg-surface-container-lowest/50 border border-outline-variant/50 rounded-xl font-body-md text-[14px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64 transition-all" />
            </div>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-8 uppercase tracking-widest">Course Code</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Course Name</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Department</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Sections</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50 bg-surface/30">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-secondary font-body-md">{courses.length ? 'No courses match your search.' : 'No courses found. Add a course to get started.'}</td>
                  </tr>
                ) : (
                  filteredCourses.map((course, idx) => (
                    <motion.tr 
                      key={course._id || idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
                      className="hover:bg-surface-container-lowest transition-colors group"
                    >
                      <td className="py-5 px-8">
                        <span className="font-label-md text-[13px] font-bold text-on-surface bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">{course.code}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-title-sm text-[15px] font-bold text-on-surface leading-tight">{course.name}</span>
                      </td>
                      <td className="py-5 px-6">
                        <button type="button" onClick={() => { setRubricCourse(course); setRubric((course.rubric?.criteria?.length ? course.rubric.criteria : defaultRubric).map((item) => ({ ...item }))); }} className="rounded-xl border border-outline-variant px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10">Configure rubric</button>
                      </td>
                      <td className="py-5 px-6 font-body-md text-[14px] text-secondary group-hover:text-primary transition-colors">{course.department}</td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[13px]">{course.sections || 1}</div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>

      {/* Add Course Modal Overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowAddModal(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface rounded-[32px] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col"
            >
              <div className="p-8 pb-6 border-b border-surface-container relative">
                <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                   <span className="material-symbols-outlined text-[24px]">library_add</span>
                </div>
                <h3 className="font-display text-[24px] font-black text-on-surface">Add New Course</h3>
                <p className="font-body-sm text-secondary mt-1">Create a new course in the curriculum.</p>
              </div>
              
              <form onSubmit={handleCreateCourse} className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Course Code</label>
                  <input type="text" required value={newCourse.code} onChange={(e) => setNewCourse({...newCourse, code: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="e.g. CS101" />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Course Name</label>
                  <input type="text" required value={newCourse.name} onChange={(e) => setNewCourse({...newCourse, name: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="Intro to Computer Science" />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Department</label>
                  <select required value={newCourse.department} onChange={(e) => setNewCourse({...newCourse, department: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
                    <option value="" disabled>{departments.length ? 'Select department' : 'Create a department first'}</option>
                    {departments.map((department) => <option key={department._id} value={department.name}>{department.name} ({department.code})</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Number of Sections</label>
                  <input type="number" min="1" required value={newCourse.sections} onChange={(e) => setNewCourse({...newCourse, sections: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-outline-variant text-on-surface font-label-md text-[14px] font-bold hover:bg-surface-container transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary font-label-md text-[14px] font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rubricCourse && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRubricCourse(null)} />
          <motion.form onSubmit={saveRubric} initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-outline-variant bg-surface p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><h3 className="text-2xl font-black text-on-surface">Course rubric</h3><p className="mt-1 text-sm text-secondary">{rubricCourse.code} · Version {rubricCourse.rubric?.version || 1}. Criteria must total 100 points.</p></div>
              <button type="button" onClick={() => setRubricCourse(null)} className="text-secondary"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              {rubric.map((criterion, index) => <div key={criterion.key} className="grid gap-3 rounded-2xl border border-outline-variant p-4 sm:grid-cols-[1fr_110px]">
                <div className="space-y-2">
                  <input required value={criterion.label} onChange={(event) => setRubric((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 font-bold text-on-surface" aria-label={`Criterion ${index + 1} label`} />
                  <input value={criterion.description || ''} onChange={(event) => setRubric((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface" placeholder="What should the evaluator assess?" />
                </div>
                <input type="number" min="1" max="100" required value={criterion.maxScore} onChange={(event) => setRubric((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, maxScore: Number(event.target.value) } : item))} className="h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-on-surface" aria-label={`${criterion.label} maximum score`} />
              </div>)}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3"><span className="font-bold text-on-surface">Maximum total</span><span className="text-xl font-black text-primary">{rubric.reduce((sum, item) => sum + Number(item.maxScore || 0), 0)} / 100</span></div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setRubricCourse(null)} className="rounded-xl border border-outline-variant px-5 py-3 font-bold text-on-surface">Cancel</button><button type="submit" className="rounded-xl bg-primary px-5 py-3 font-bold text-on-primary">Save rubric</button></div>
          </motion.form>
        </div>}
      </AnimatePresence>

    </div>
  );
};

export default CourseManagement;
