import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTransactions, getSavingGoals, getHabits, getTodaySnapshot } from '../api'
import type { Transaction, SavingGoal, Habit, DailySnapshot } from '../types'
import { LineChart } from '../components/charts/LineChart'
import { formatCurrency } from '../utils/formatters'

export function Dashboard() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [today, setToday] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTransactions(),
      getSavingGoals(),
      getHabits(true),
      getTodaySnapshot(),
    ]).then(([txs, g, h, snap]) => {
      setTransactions(txs)
      setGoals(g)
      setHabits(h)
      setToday(snap)
      setLoading(false)
    })
  }, [])

  const incomes = transactions.filter((t) => t.type === 'income')
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalIncome = incomes.reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = expenses.reduce((s, t) => s + parseFloat(t.amount), 0)
  const balance = totalIncome - totalExpense

  // Group transactions by month for the chart
  const monthlyData = transactions.reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
    const month = t.occurredAt.slice(0, 7)
    if (!acc[month]) acc[month] = { income: 0, expense: 0 }
    if (t.type === 'income') acc[month].income += parseFloat(t.amount)
    else acc[month].expense += parseFloat(t.amount)
    return acc
  }, {})

  const chartLabels = Object.keys(monthlyData).sort()
  const chartDatasets = [
    {
      label: 'Ingresos',
      data: chartLabels.map((m) => monthlyData[m].income),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      tension: 0.4,
    },
    {
      label: 'Gastos',
      data: chartLabels.map((m) => monthlyData[m].expense),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.1)',
      tension: 0.4,
    },
  ]

  const moodLabel: Record<string, string> = {
    calm: '😌 Tranquilo', stressed: '😰 Estresado', confident: '💪 Seguro', neutral: '😐 Neutral',
  }

  if (loading) {
    return <p className="text-gray-400 text-sm">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Hola, {profile?.person?.firstName ?? 'usuario'} 👋
        </h2>
        <p className="text-sm text-gray-500">Resumen de tu actividad financiera</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Balance', value: formatCurrency(balance), color: balance >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Ingresos', value: formatCurrency(totalIncome), color: 'text-green-600' },
          { label: 'Gastos', value: formatCurrency(totalExpense), color: 'text-red-600' },
          { label: 'Metas activas', value: String(goals.length), color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartLabels.length > 0 && (
        <LineChart labels={chartLabels} datasets={chartDatasets} title="Ingresos vs Gastos por mes" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's snapshot */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Snapshot de hoy</h3>
          {today ? (
            <div className="space-y-1">
              {today.mood && <p className="text-sm">{moodLabel[today.mood]}</p>}
              {today.consciousScore && <p className="text-sm text-gray-600">Puntaje: {today.consciousScore}/10</p>}
              {today.reflection && <p className="text-sm text-gray-500 italic">"{today.reflection}"</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin snapshot hoy. Ve a la sección Snapshots.</p>
          )}
        </div>

        {/* Habits */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Hábitos activos ({habits.length})</h3>
          {habits.length === 0 ? (
            <p className="text-sm text-gray-400">Sin hábitos activos.</p>
          ) : (
            <ul className="space-y-1">
              {habits.slice(0, 5).map((h) => (
                <li key={h.id} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-400">●</span> {h.name}
                </li>
              ))}
              {habits.length > 5 && (
                <li className="text-xs text-gray-400">+{habits.length - 5} más</li>
              )}
            </ul>
          )}
        </div>

        {/* Saving goals */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Metas de ahorro</h3>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-400">Sin metas.</p>
          ) : (
            <ul className="space-y-2">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100))
                return (
                  <li key={g.id}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{g.name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Últimas transacciones</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400">Sin transacciones.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>{t.category?.icon ?? '💳'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.category?.name ?? 'Sin categoría'}</p>
                    <p className="text-xs text-gray-400">{t.occurredAt.slice(0, 10)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
