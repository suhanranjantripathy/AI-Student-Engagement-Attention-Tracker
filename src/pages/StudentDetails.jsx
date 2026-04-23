import React, { useState, useEffect } from 'react';
import { ArrowLeft, Key, Terminal, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { getStudentById } from '../data/firebaseService';
import { WeeklyAverageChart, StudentPerformanceChart } from '../components/Charts';

export default function StudentDetails({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      // Only show loading on initial fetch to avoid flickering
      if (!student) setLoading(true);
      const data = await getStudentById(studentId);
      setStudent(data);
      setLoading(false);
    };

    fetchStudent();

    // Refresh if data syncs in background
    const handleSync = () => {
      console.log(`Sync event in Details for student ${studentId}`);
      fetchStudent();
    };
    window.addEventListener('googleSheetsSynced', handleSync);

    return () => window.removeEventListener('googleSheetsSynced', handleSync);
  }, [studentId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-mono text-sm animate-pulse tracking-widest">QUERYING NODE TELEMETRY...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-20 text-center">
        <p className="text-red-500 font-bold mb-4">NODE NOT FOUND</p>
        <button onClick={onBack} className="text-indigo-400 font-mono text-xs hover:underline">RETURN TO BASE</button>
      </div>
    );
  }

  const weeklyData = student.weeklyHistory.map((val, idx) => ({
    week: `CYC: ${idx + 1}`,
    average: val
  }));

  const perfData = [
    { name: 'Metrics', participation: student.participation, quizScore: student.quizScore }
  ];

  return (
    <div className="space-y-8 animate-in relative z-10 w-full max-w-[1400px] mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold font-mono text-slate-500 hover:text-indigo-400 transition-colors mb-2 bg-[#111] w-fit px-4 py-2 rounded-xl border border-[#333]"
      >
        <ArrowLeft size={14} /> SYSTEM.GO_BACK()
      </button>

      {/* Profile Header */}
      <div className="neon-card rounded-2xl p-6 md:p-10 relative overflow-hidden">
        {/* Subtle glow behind the profile */}
         <div className="absolute top-1/2 left-20 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-[#050505] flex items-center justify-center border border-[#333] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="w-full h-full rounded-[0.6rem] bg-[#1a1a1a] text-indigo-400 flex items-center justify-center text-3xl font-black font-mono shadow-inner border border-white/5">
                {student.name.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">{student.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-xs font-mono font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Key size={14} className="text-indigo-500" /> ID: {student.id}</span>
                <span className="flex items-center gap-1.5"><Terminal size={14} className="text-indigo-500" /> NODE_LOC: sector_a</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="px-5 py-4 rounded-xl bg-[#0a0a0a] border border-[#222] shadow-inner flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Integrity</span>
              {student.atRisk ? (
                <span className="text-red-500 font-bold text-sm font-mono flex items-center gap-1.5"><AlertTriangle size={14} /> CRITICAL</span>
              ) : (
                <span className="text-emerald-500 font-bold text-sm font-mono flex items-center gap-1.5"><TrendingUp size={14} /> NOMINAL</span>
              )}
            </div>
            <div className={`px-5 py-4 rounded-xl border flex flex-col items-center justify-center min-w-[120px] ${
              student.category === 'High' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
              student.category === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
              'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">Status</span>
              <span className="font-black text-sm uppercase font-mono">{student.category}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Charts */}
          <div className="neon-card rounded-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[13px] font-black text-slate-300 uppercase tracking-widest">Telemetry Stream</h2>
              <span className="text-2xl font-black font-mono text-indigo-400">{student.engagementScore}% <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-right">Current Lvl</span></span>
            </div>
            <WeeklyAverageChart data={weeklyData} />
          </div>
          
          <div className="neon-card rounded-2xl p-6 md:p-8">
             <h2 className="text-[13px] font-black text-slate-300 uppercase tracking-widest mb-6">Output Matrix</h2>
             <StudentPerformanceChart data={perfData} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Sentiment History */}
          <div className="neon-card rounded-2xl p-6 md:p-8">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6">Sentiment Diagnostics</h3>
            <div className="space-y-3">
              {student.sentimentHistory.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#222]">
                  <span className="text-[11px] font-mono text-slate-400">CYC {idx + 1}</span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono border ${
                    s === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    s === 'Neutral' ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {s.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="neon-card rounded-2xl p-6 md:p-8">
             <h3 className="text-[11px] font-black uppercase tracking-widest text-[#555] mb-6">System Logs</h3>
             {student.feedback.length > 0 ? (
               <div className="space-y-4">
                 {student.feedback.map((fb, idx) => (
                   <div key={idx} className="relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-indigo-500 bg-[#0a0a0a] border border-[#222] p-4 rounded-lg">
                     <p className="text-[10px] font-mono font-bold text-[#666] flex items-center gap-1.5 mb-2"><Calendar size={12}/> TIMESTAMP: {fb.date}</p>
                     <p className="text-xs font-mono text-slate-300 leading-relaxed">{fb.text}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center p-6 bg-[#0a0a0a] rounded-xl border border-dashed border-[#333]">
                  <p className="text-[11px] font-mono text-[#555]">NO LOGS RECORDED.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
