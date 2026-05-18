import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTransactions, getSavingGoals, getHabits, getTodaySnapshot } from '../api'
import type { Transaction, SavingGoal, Habit, DailySnapshot } from '../types'
import { LineChart } from '../components/charts/LineChart'
import { formatCurrency } from '../utils/formatters'

const moodLabel: Record<string, string> = {
  calm: '😌 Tranquilo',
  stressed: '😰 Estresado',
  confident: '💪 Seguro',
  neutral: '😐 Neutral',
}

export function Dashboard() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [today, setToday] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getTransactions(),
      getSavingGoals(),
      getHabits(true),
      getTodaySnapshot(),
    ])
      .then(([txs, g, h, snap]) => {
        setTransactions(txs)
        setGoals(g)
        setHabits(h)
        setToday(snap)
      })
      .catch(() => setError('Error al cargar el dashboard. Intenta recargar la página.'))
      .finally(() => setLoading(false))
  }, [])

  const incomes = transactions.filter((t) => t.type === 'income')
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalIncome = incomes.reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = expenses.reduce((s, t) => s + parseFloat(t.amount), 0)
  const balance = totalIncome - totalExpense

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
      backgroundColor: 'rgba(34,197,94,0.08)',
      tension: 0.4,
    },
    {
      label: 'Gastos',
      data: chartLabels.map((m) => monthlyData[m].expense),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.08)',
      tension: 0.4,
    },
  ]

  const statCards = [
    {
      label: 'Balance total',
      value: formatCurrency(balance),
      valueColor: balance >= 0 ? 'text-green-500' : 'text-red-500',
      icon: '💰',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Ingresos',
      value: formatCurrency(totalIncome),
      valueColor: 'text-gray-900',
      icon: '📥',
      iconBg: 'bg-green-50',
    },
    {
      label: 'Gastos',
      value: formatCurrency(totalExpense),
      valueColor: 'text-gray-900',
      icon: '📤',
      iconBg: 'bg-red-50',
    },
    {
      label: 'Metas activas',
      value: String(goals.length),
      valueColor: 'text-[#3C50E0]',
      icon: '🎯',
      iconBg: 'bg-indigo-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Hola, {profile?.person?.firstName ?? 'usuario'} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Resumen de tu actividad financiera</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-sm border border-gray-200 bg-white py-6 px-6 shadow-sm"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.iconBg}`}>
              <span className="text-2xl leading-none">{stat.icon}</span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</h4>
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartLabels.length > 0 && (
        <div className="rounded-sm border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">Ingresos vs Gastos por mes</h3>
          </div>
          <div className="p-6">
            <LineChart labels={chartLabels} datasets={chartDatasets} title="" />
          </div>
        </div>
      )}

      {/* 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Snapshot */}
        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Snapshot de hoy</h3>
          </div>
          <div className="px-5 py-4">
            {today ? (
              <div className="space-y-2">
                {today.mood && <p className="text-sm text-gray-700">{moodLabel[today.mood]}</p>}
                {today.consciousScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Puntaje consciente</span>
                    <span className="text-sm font-semibold text-[#3C50E0]">{today.consciousScore}/10</span>
                  </div>
                )}
                {today.reflection && (
                  <p className="text-sm text-gray-400 italic border-l-2 border-gray-200 pl-3">
                    "{today.reflection}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin snapshot hoy. Ve a la sección Snapshots.</p>
            )}
          </div>
        </div>

        {/* Habits */}
        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Hábitos activos</h3>
            <span className="text-xs font-medium text-[#3C50E0] bg-indigo-50 px-2 py-0.5 rounded-full">
              {habits.length}
            </span>
          </div>
          <div className="px-5 py-4">
            {habits.length === 0 ? (
              <p className="text-sm text-gray-400">Sin hábitos activos.</p>
            ) : (
              <ul className="space-y-2">
                {habits.slice(0, 5).map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                    {h.name}
                  </li>
                ))}
                {habits.length > 5 && (
                  <li className="text-xs text-gray-400">+{habits.length - 5} más</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Metas de ahorro</h3>
          </div>
          <div className="px-5 py-4">
            {goals.length === 0 ? (
              <p className="text-sm text-gray-400">Sin metas.</p>
            ) : (
              <ul className="space-y-3">
                {goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100))
                  return (
                    <li key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{g.name}</span>
                        <span className="text-[#3C50E0] font-semibold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3C50E0] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-sm border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Últimas transacciones</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-400">Sin transacciones.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg shrink-0">
                    {t.category?.icon ?? '💳'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.category?.name ?? 'Sin categoría'}</p>
                    <p className="text-xs text-gray-400">{t.occurredAt.slice(0, 10)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
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
