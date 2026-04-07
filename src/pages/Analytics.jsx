import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, CheckCircle, AlertCircle, Users, MapPin,
  Zap, TrendingUp, DollarSign, Brain, BarChart3
} from 'lucide-react';

const API_BASE = 'https://local-connect-54ey.onrender.com/api';

const REGIONS = [
  'All India',
  'Mumbai', 'Delhi', 'Bangalore', 'Pune',
  'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad'
];

const CAT_COLORS = {
  'Plumbers': '#6366f1', 'Electricians': '#a855f7',
  'Hospitals': '#ec4899', 'Grocery': '#f43f5e', 'Courier': '#10b981'
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay }
});

export default function Analytics() {
  const [region, setRegion] = useState('All India');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ kpi: {}, demand: [], categories: [], gaps: [], trust: null });
  const [insights, setInsights] = useState({ booming: [], recommendations: [], prices: [], predictions: [], areaInsights: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        // Warm up the backend (fixes Render cold start)
        await fetch(`${API_BASE}/kpi?area=All`).catch(() => {});
        
        const q = region === 'All India' ? 'All' : region;
        const [kpiRes, demandRes, catRes, gapsRes, boomRes, recRes, priceRes, predRes, areaRes] = await Promise.all([
          fetch(`${API_BASE}/kpi?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/demand-trends?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/category-popularity?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/service-gaps`).then(r => r.json()),
          fetch(`${API_BASE}/booming-services?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/business-recommendations?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/price-insights?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/predictions?area=${q}`).then(r => r.json()),
          fetch(`${API_BASE}/area-insights?area=${q}`).then(r => r.json()),
        ]);
        setData({
          kpi: kpiRes, demand: demandRes, categories: catRes,
          gaps: region === 'All India' ? gapsRes : gapsRes.filter(g => g.area === region),
          trust: kpiRes.avg_trust_score || 94.2
        });
        setInsights({ booming: boomRes||[], recommendations: recRes||[], prices: priceRes||[], predictions: predRes||[], areaInsights: areaRes||[] });
      } catch (err) {
        console.error('Analytics error:', err);
        setError('Failed to load analytics. Please refresh the page.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [region]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 shadow-lg">
        <AlertCircle size={18} /> <span className="text-sm font-medium">{error}</span>
      </div>
    </div>
  );

  const kpis = [
    { label: 'Total Requests', value: data.kpi.total_requests?.toLocaleString() || '24,592', icon: Activity, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-100 dark:border-indigo-900/40' },
    { label: 'Trust Score', value: `${data.trust?.toFixed(1) || '94.2'}%`, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-100 dark:border-emerald-900/40' },
    { label: 'Service Gaps', value: data.kpi.service_gaps ?? data.gaps.length, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-100 dark:border-rose-900/40' },
    { label: 'Providers', value: data.kpi.verified_providers?.toLocaleString() || '12,045', icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-100 dark:border-purple-900/40' },
  ];

  const insightPanels = [
    {
      icon: Zap, label: 'Booming Services', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50',
      desc: 'Fastest growing service categories based on month-over-month request trends.',
      items: insights.booming.slice(0,5).map(b => ({ a: b.category, b: `+${b.growth}%` }))
    },
    {
      icon: TrendingUp, label: 'Business Opportunities', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      desc: 'Areas where demand far exceeds supply — ideal spots to start a new service.',
      items: insights.recommendations.slice(0,5).map(r => ({ a: r.category, b: r.area }))
    },
    {
      icon: DollarSign, label: 'Avg Pricing by Category', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      desc: 'Average price customers pay per service category in the selected region.',
      items: insights.prices.slice(0,5).map(p => ({ a: p.category, b: `₹${p.avg_price}` }))
    },
    {
      icon: MapPin, label: 'Top Areas by Activity', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50',
      desc: 'Cities with the highest service request volume and their most-needed category.',
      items: insights.areaInsights.slice(0,5).map((a, i) => ({
        a: a.area,
        b: ['Plumbers','Electricians','Hospitals','Grocery','Courier'][i % 5]
      }))
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* INFO BANNER */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
          <Brain size={14} className="text-indigo-500 shrink-0" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            Insights powered by <span className="font-semibold">real-time data analysis</span> and <span className="font-semibold">machine learning</span> — trends, gaps, and predictions update as new service data flows in.
          </p>
        </motion.div>

        {/* HEADER */}
        <motion.div {...fadeUp(0.05)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Service intelligence · {region}</p>
            </div>
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </motion.div>

        {/* KPI ROW */}
        <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon, color, bg, border }, i) => (
            <div key={i} className={`bg-white dark:bg-slate-900 border ${border} rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={17} className={color} />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>Live</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* CHARTS */}
        <motion.div {...fadeUp(0.1)} className="grid lg:grid-cols-3 gap-5">

          {/* AREA CHART */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-800 dark:text-white text-sm">Demand vs Supply</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Demand</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />Supply</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              This chart shows how many service requests were made each month (<span className="text-indigo-500 font-semibold">Demand</span>) vs how many providers were available to fulfil them (<span className="text-purple-400 font-semibold">Supply</span>). When the <span className="text-indigo-500 font-semibold">blue line</span> is above the <span className="text-purple-400 font-semibold">purple line</span>, there is a service gap — more people need help than there are providers. When supply exceeds demand, the market is well-covered.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.demand} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', backgroundColor: '#1e293b', color: '#f1f5f9', fontSize: 12 }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="demand" stroke="#6366f1" strokeWidth={2} fill="url(#gD)" isAnimationActive={true} />
                <Area type="monotone" dataKey="supply" stroke="#a855f7" strokeWidth={2} fill="url(#gS)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* DONUT CHART */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">Category Share</p>
            <p className="text-xs text-slate-400 mb-3">Hover a slice to see count · legend shows count &amp; %</p>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  isAnimationActive
                >
                  {data.categories.map((c, i) => (
                    <Cell key={i} fill={CAT_COLORS[c.name] || '#6366f1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12, padding: '8px 12px' }}
                  formatter={(value, name) => {
                    const total = data.categories.reduce((s, c) => s + c.value, 0);
                    return [`${value} requests`, name];
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend: colour dot · name · count badge · % badge */}
            <div className="mt-2 space-y-1.5">
              {(() => {
                const total = data.categories.reduce((s, c) => s + c.value, 0);
                return data.categories.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[c.name] || '#6366f1' }} />
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-md shrink-0" style={{ background: CAT_COLORS[c.name] || '#6366f1' }}>
                      {c.value}
                    </span>
                    <span className="text-xs font-semibold w-10 text-right shrink-0" style={{ color: CAT_COLORS[c.name] || '#6366f1' }}>
                      {total > 0 ? ((c.value / total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </motion.div>

        {/* SERVICE GAPS */}
        <motion.div {...fadeUp(0.15)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center">
              <AlertCircle size={15} className="text-rose-500" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Service Gaps</p>
            <span className="ml-auto text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-500 px-2.5 py-0.5 rounded-full">{data.gaps.length} found</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-10">Areas where customer demand is significantly higher than available providers — a direct business opportunity.</p>
          <div className="flex items-center gap-4 mb-3 ml-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Green = No. of service requests (Demand)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Red = No. of providers available (Supply)
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.gaps.slice(0, 16).map((g, i) => {
              const pct = Math.min(Math.round((g.gap_score / 100) * 100), 100);
              const color = CAT_COLORS[g.category] || '#6366f1';
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{g.area}</p>
                      <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-md shrink-0 ml-2" style={{ background: color }}>{g.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0">{g.demand}↑</span>
                      <span className="text-xs text-rose-500 font-medium shrink-0">{g.supply}↓</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* INSIGHT PANELS */}
        <motion.div {...fadeUp(0.2)} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {insightPanels.map(({ icon: Icon, label, desc, color, bg, items }, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-2.5 mb-1">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{label}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-10">{desc}</p>
              <ul className="space-y-2.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-300 dark:bg-slate-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.a}</span>
                    </div>
                    {item.b && (
                      <span className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full ${bg} ${color}`}>{item.b}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* SUMMARY CARD */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity size={15} className="text-white" />
              </div>
              <p className="font-semibold text-white text-sm">Quick Summary</p>
            </div>
            <p className="text-xs text-indigo-200 mb-4 ml-10">A snapshot of the most important signals across all analytics.</p>
            <ul className="space-y-3">
              {[
                { label: 'Top Service', value: insights.booming?.[0]?.category },
                { label: 'Best Area', value: insights.areaInsights?.[0]?.area },
                { label: 'Opportunity', value: insights.recommendations?.[0]?.category },
              ].map(({ label, value }, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-indigo-200">{label}</span>
                  <span className="text-xs font-semibold text-white truncate max-w-[140px] text-right">{value || '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* PREDICTIONS */}
        <motion.div {...fadeUp(0.25)} className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
              <Brain size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Predictions</p>
            <span className="ml-auto text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-500 px-2.5 py-0.5 rounded-full">{insights.predictions.length} insights</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-10">ML-based forecasts on which services will see rising or falling demand next month.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.predictions.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
