import React, { useState, useEffect } from 'react';
import StudentCard from '../components/StudentCard';
import { WeeklyAverageChart, CategoryPieChart, SentimentBarChart } from '../components/Charts';
import StudentTable from '../components/StudentTable';
import AlertsPanel from '../components/AlertsPanel';
import AISuggestions from '../components/AISuggestions';
import { getStudents } from '../data/firebaseService';

export default function Dashboard({ onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const studentsData = await getStudents();
    setStudents(studentsData);
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [studentsData, trendsData, categoriesData, sentimentsData] = await Promise.all([
        getStudents(),
        getClassAverageTrends(),
        getCategoryDistribution(),
        getSentimentDistribution()
      ]);
      setStudents(studentsData);
      setTrends(trendsData);
      setCategories(categoriesData);
      setSentiments(sentimentsData);
      setLoading(false);
    };

    fetchData();

    // Listen for sync completion to refresh UI
    const handleSync = () => {
      console.log("Sync event received in Dashboard, refreshing data...");
      fetchData();
    };
    window.addEventListener('googleSheetsSynced', handleSync);
    
    return () => window.removeEventListener('googleSheetsSynced', handleSync);
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase animate-pulse">Syncing with Active Matrix...</p>
      </div>
    );
  }

  // Calculate Metrics from Live Student Data
  const avgEngagement = students.length > 0
    ? Math.round(students.reduce((acc, curr) => acc + (curr.engagementScore || 0), 0) / students.length)
    : 0;
  
  const atRiskCount = students.filter(s => s.atRisk).length;

  // Calculate Category Distribution
  const catCounts = { High: 0, Medium: 0, Low: 0 };
  students.forEach(s => {
    if (catCounts[s.category] !== undefined) catCounts[s.category]++;
  });
  const categories = [
    { name: 'High', value: catCounts.High },
    { name: 'Medium', value: catCounts.Medium },
    { name: 'Low', value: catCounts.Low }
  ];

  // Calculate Sentiment Distribution
  const sentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
  students.forEach(s => {
    const sent = s.sentiment || 'Neutral';
    if (sentCounts[sent] !== undefined) sentCounts[sent]++;
  });
  const sentiments = [
    { name: 'Positive', value: sentCounts.Positive },
    { name: 'Neutral', value: sentCounts.Neutral },
    { name: 'Negative', value: sentCounts.Negative }
  ];

  // Mock Trends for now (or could be derived from student.weeklyHistory)
  const trends = [
    { week: 'W1', average: 65 },
    { week: 'W2', average: 70 },
    { week: 'W3', average: 68 },
    { week: 'W4', average: avgEngagement }
  ];

  const highCount = catCounts.High;

  return (
    <div className="space-y-8 animate-in relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1 flex items-center gap-3">
            System Overview 
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse block"></span>
          </h1>
          <p className="text-slate-400 font-medium text-sm tracking-wide uppercase">CS101 Active Matrix</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StudentCard 
          label="Avg Engagement" 
          value={`${avgEngagement}%`} 
          subtext={2.4} 
          trend="up" 
          trendLabel="vs last cycle"
          colorClass="text-indigo-400 text-glow"
        />
        <StudentCard 
          label="Active Terminals" 
          value={students.length} 
          colorClass="text-slate-100"
        />
        <StudentCard 
          label="Optimal Performance" 
          value={students.length > 0 ? `${Math.round((highCount / students.length) * 100)}%` : '0%'} 
          subtext={5} 
          trend="up"
          colorClass="text-emerald-400 text-glow"
        />
        <StudentCard 
          label="Critical Alerts" 
          value={atRiskCount} 
          subtext={-1} 
          trend="down"
          colorClass="text-red-500 text-glow"
          isAlert={atRiskCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="neon-card rounded-2xl p-6 md:p-8">
            <h2 className="text-[13px] font-black text-slate-300 uppercase tracking-widest mb-6">Engagement Trajectory</h2>
            <WeeklyAverageChart data={trends} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="neon-card rounded-2xl p-6 md:p-8">
              <h2 className="text-[13px] font-black text-slate-300 uppercase tracking-widest mb-6">Status Matrix</h2>
              <CategoryPieChart data={categories} />
            </div>
            <div className="neon-card rounded-2xl p-6 md:p-8">
              <h2 className="text-[13px] font-black text-slate-300 uppercase tracking-widest mb-6">Sentiment Analysis</h2>
              <SentimentBarChart data={sentiments} />
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-8">
          <AlertsPanel students={students} />
          <AISuggestions />
        </div>
      </div>

      <div className="mt-8">
        <StudentTable students={students} onSelectStudent={onSelectStudent} />
      </div>
    </div>
  );
}
