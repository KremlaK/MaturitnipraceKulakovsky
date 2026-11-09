import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import type { CarStats } from '../api/stats';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../api/expenses';

const COLORS = ['#ffcc00', '#ff5500', '#e6342a', '#00443a', '#8b8b8b', '#c9a227', '#7a3b12', '#4a4a4a'];

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
      <div className="bg-panel border border-panel-border rounded-xl p-4">
        <h3 className="text-ink font-display font-semibold mb-4 text-sm uppercase tracking-wider">Náklady podle měsíců</h3>
        {monthlyData.length === 0 ? (
          <p className="text-ink-muted text-sm font-mono-gauge">Zatím nejsou žádná data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-panel-border)" />
              <XAxis dataKey="monthLabel" stroke="var(--c-ink-muted)" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="var(--c-ink-muted)" fontSize={11} fontFamily="JetBrains Mono" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--c-panel)', border: '1px solid var(--c-panel-border)', borderRadius: 8, fontFamily: 'JetBrains Mono' }}
                labelStyle={{ color: 'var(--c-ink)' }}
                formatter={(value) => `${Number(value).toLocaleString('cs-CZ')} Kč`}
              />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} />
              <Bar dataKey="fuel" name="Palivo" stackId="a" fill="#ffcc00" />
              <Bar dataKey="service" name="Servis" stackId="a" fill="#ff5500" />
              <Bar dataKey="expenses" name="Výdaje" stackId="a" fill="#e6342a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Náklady podle kategorií */}
        <div className="bg-panel border border-panel-border rounded-xl p-4">
          <h3 className="text-ink font-display font-semibold mb-4 text-sm uppercase tracking-wider">Podle kategorií</h3>
          {categoryData.length === 0 ? (
            <p className="text-ink-muted text-sm font-mono-gauge">Zatím nejsou žádná data.</p>
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
                  contentStyle={{ backgroundColor: 'var(--c-panel)', border: '1px solid var(--c-panel-border)', borderRadius: 8, fontFamily: 'JetBrains Mono' }}
                  formatter={(value) => `${Number(value).toLocaleString('cs-CZ')} Kč`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Vývoj spotřeby */}
        <div className="bg-panel border border-panel-border rounded-xl p-4">
          <h3 className="text-ink font-display font-semibold mb-4 text-sm uppercase tracking-wider">Vývoj spotřeby</h3>
          {stats.consumptionTrend.length === 0 ? (
            <p className="text-ink-muted text-sm font-mono-gauge">Potřeba alespoň 2 tankování do plna.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.consumptionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-panel-border)" />
                <XAxis dataKey="date" stroke="var(--c-ink-muted)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="var(--c-ink-muted)" fontSize={11} unit=" l" fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--c-panel)', border: '1px solid var(--c-panel-border)', borderRadius: 8, fontFamily: 'JetBrains Mono' }}
                  formatter={(value) => `${value} l/100km`}
                />
                <Line type="monotone" dataKey="consumption" stroke="#ffcc00" strokeWidth={2} dot={{ fill: '#ffcc00' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default CarCharts;
