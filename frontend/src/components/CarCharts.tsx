import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import type { CarStats } from '../api/stats';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../api/expenses';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-');
  const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
  return `${months[Number(month) - 1]} ${year}`;
}

function formatCategoryName(name: string) {
  return EXPENSE_CATEGORY_LABELS[name as ExpenseCategory] || name;
}

interface Props {
  stats: CarStats;
}

function CarCharts({ stats }: Props) {
  const monthlyData = stats.monthlyStats.map((m) => ({
    ...m,
    monthLabel: formatMonth(m.month),
  }));

  const categoryData = stats.categoryStats.map((c) => ({
    ...c,
    name: formatCategoryName(c.name),
  }));

  return (
    <div className="space-y-6">
      {/* Měsíční náklady */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-white font-semibold mb-4">Náklady podle měsíců</h3>
        {monthlyData.length === 0 ? (
          <p className="text-slate-400 text-sm">Zatím nejsou žádná data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kč`}
              />
              <Legend />
              <Bar dataKey="fuel" name="Palivo" stackId="a" fill="#3b82f6" />
              <Bar dataKey="service" name="Servis" stackId="a" fill="#f59e0b" />
              <Bar dataKey="expenses" name="Výdaje" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Náklady podle kategorií */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Náklady podle kategorií</h3>
          {categoryData.length === 0 ? (
            <p className="text-slate-400 text-sm">Zatím nejsou žádná data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kč`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Vývoj spotřeby */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Vývoj spotřeby</h3>
          {stats.consumptionTrend.length === 0 ? (
            <p className="text-slate-400 text-sm">Potřeba alespoň 2 tankování do plna.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.consumptionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} unit=" l" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(value: number) => `${value} l/100km`}
                />
                <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default CarCharts;