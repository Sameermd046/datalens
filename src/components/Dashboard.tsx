import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { LayoutDashboard, Info, ArrowUpRight, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { ChartConfig, ColumnProfile, KPICardData } from '../types/dataset';
import { buildDynamicCharts, generateDynamicKPIs } from '../utils/dashboardBuilder';

interface DashboardProps {
  filteredData: Record<string, any>[];
  columns: ColumnProfile[];
  totalOriginalRows: number;
  onNavigateFilters: () => void;
}

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

export const Dashboard: React.FC<DashboardProps> = ({
  filteredData,
  columns,
  totalOriginalRows,
  onNavigateFilters
}) => {
  const kpis: KPICardData[] = generateDynamicKPIs(filteredData, columns, totalOriginalRows);
  const charts: ChartConfig[] = buildDynamicCharts(filteredData, columns);

  const filteredCount = filteredData.length;
  const isFiltered = filteredCount !== totalOriginalRows;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Retention & Context */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Auto-Generated Exploratory Analytics
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Dynamic Intelligence Dashboard</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Data-Driven Schemas
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Records Analyzed: </span>
              <strong className="text-emerald-400">{filteredCount.toLocaleString()}</strong>
              {isFiltered && (
                <span className="text-slate-500"> (of {totalOriginalRows.toLocaleString()})</span>
              )}
            </div>

            <button
              onClick={onNavigateFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Adjust Slicers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(kpi => (
          <div
            key={kpi.id}
            className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1 relative overflow-hidden"
          >
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {kpi.label}
            </span>
            <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {kpi.value}
            </div>
            {kpi.subtext && (
              <p className="text-[11px] text-slate-500 font-mono truncate pt-0.5">
                {kpi.subtext}
              </p>
            )}
            <div className="absolute top-2 right-2 opacity-10">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Visualizations Grid */}
      {charts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {charts.map((chart, idx) => (
            <div
              key={chart.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-100">{chart.title}</h3>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/50 uppercase">
                    {chart.type}
                  </span>
                </div>
                {/* Visual Reasoning Explanation */}
                <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{chart.reason}</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === 'bar' || chart.type === 'column' || chart.type === 'histogram' ? (
                    <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey={chart.xAxisKey}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F1F5F9'
                        }}
                      />
                      <Bar dataKey={chart.yAxisKey || 'value'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : chart.type === 'line' ? (
                    <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey={chart.xAxisKey}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        interval={Math.ceil(chart.data.length / 8)}
                      />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F1F5F9'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={chart.yAxisKey || 'value'}
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10B981' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : chart.type === 'donut' ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {chart.data.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F1F5F9'
                        }}
                        formatter={(val: any, name: any, item: any) => [
                          `${val} (${item.payload.percentage}%)`,
                          name
                        ]}
                      />
                    </PieChart>
                  ) : chart.type === 'scatter' ? (
                    <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey={chart.xAxisKey}
                        name={chart.xAxisKey}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey={chart.yAxisKey}
                        name={chart.yAxisKey}
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#F1F5F9'
                        }}
                      />
                      <Scatter data={chart.data} fill="#8B5CF6" />
                    </ScatterChart>
                  ) : null}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
          <p className="text-sm text-slate-400">
            No suitable numeric or categorical dimensions identified to generate charts.
          </p>
        </div>
      )}
    </div>
  );
};
