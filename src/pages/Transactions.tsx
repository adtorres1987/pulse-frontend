import { useEffect, useState } from 'react'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} from '../api'
import type { Transaction, Category } from '../types'
import { transactionSchema, type TransactionForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatCurrency, formatDate } from '../utils/formatters'

const EMOTION_OPTS = [
  { value: '', label: '— sin etiqueta —' },
  { value: 'need', label: 'Necesidad' },
  { value: 'impulse', label: 'Impulso' },
  { value: 'emotional', label: 'Emocional' },
]

const TYPE_OPTS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const emptyForm = (): TransactionForm => ({
  amount: 0,
  type: 'expense',
  occurredAt: new Date().toISOString().slice(0, 16),
  emotionTag: undefined,
  note: '',
  categoryId: '',
})

export function Transactions() {
  const [items, setItems] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<TransactionForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const [txs, cats] = await Promise.all([getTransactions(), getCategories()])
    setItems(txs)
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setApiErr('')
    setEditing(null)
    setModal('create')
  }

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setForm({
      amount: parseFloat(tx.amount),
      type: tx.type,
      occurredAt: tx.occurredAt.slice(0, 16),
      emotionTag: tx.emotionTag ?? undefined,
      note: tx.note ?? '',
      categoryId: tx.category?.id ?? '',
    })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function set(field: keyof TransactionForm, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = transactionSchema.safeParse({ ...form, amount: Number(form.amount) })
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof TransactionForm] = e.message })
      setErrors(fe)
      return
    }
    const payload = {
      ...result.data,
      occurredAt: new Date(result.data.occurredAt).toISOString(),
      categoryId: result.data.categoryId || undefined,
      emotionTag: result.data.emotionTag || undefined,
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateTransaction(editing.id, payload)
      } else {
        await createTransaction(payload as Parameters<typeof createTransaction>[0])
      }
      setModal(null)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar transacción?')) return
    await deleteTransaction(id)
    load()
  }

  const catOpts = [
    { value: '', label: '— sin categoría —' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Transacciones</h2>
        <Button onClick={openCreate}>+ Nueva</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin transacciones.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Monto</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Etiqueta</th>
                <th className="px-4 py-3 text-left">Nota</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{formatDate(tx.occurredAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(parseFloat(tx.amount))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tx.category ? `${tx.category.icon ?? ''} ${tx.category.name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{tx.emotionTag ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.note ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => openEdit(tx)} className="text-blue-500 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(tx.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar transacción' : 'Nueva transacción'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select
            id="type"
            label="Tipo"
            value={form.type}
            options={TYPE_OPTS}
            onChange={(e) => set('type', e.target.value)}
          />
          <Input
            id="amount"
            label="Monto"
            type="number"
            min={0}
            step="0.01"
            value={form.amount || ''}
            onChange={(e) => set('amount', parseFloat(e.target.value))}
            error={errors.amount}
          />
          <Input
            id="occurredAt"
            label="Fecha y hora"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(e) => set('occurredAt', e.target.value)}
            error={errors.occurredAt}
          />
          <Select
            id="categoryId"
            label="Categoría"
            value={form.categoryId ?? ''}
            options={catOpts}
            onChange={(e) => set('categoryId', e.target.value)}
          />
          <Select
            id="emotionTag"
            label="Etiqueta emocional"
            value={form.emotionTag ?? ''}
            options={EMOTION_OPTS}
            onChange={(e) => set('emotionTag', e.target.value || undefined)}
          />
          <Input
            id="note"
            label="Nota"
            value={form.note ?? ''}
            onChange={(e) => set('note', e.target.value)}
          />
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
