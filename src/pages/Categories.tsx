import { useEffect, useRef, useState } from 'react'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { getCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../api'
import type { Category } from '../types'
import { categorySchema, type CategoryForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable, type Column } from '../components/ui/DataTable'

const TYPE_OPTS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const emptyForm = (): CategoryForm => ({ name: '', icon: '', type: 'expense' })

const LIMIT = 10

export function Categories() {
  const [items, setItems] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')
  const [loadErr, setLoadErr] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  async function load(p = page) {
    setLoading(true)
    setLoadErr('')
    try {
      const data = await getCategories(p, LIMIT)
      setItems(data.items)
      setTotal(data.total)
    } catch {
      setLoadErr('Error al cargar las categorías. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setApiErr('')
    setShowPicker(false)
    setEditing(null)
    setModal('create')
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({ name: cat.name, icon: cat.icon ?? '', type: cat.type })
    setErrors({})
    setApiErr('')
    setShowPicker(false)
    setModal('edit')
  }

  function set(field: keyof CategoryForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  function onEmojiClick(data: EmojiClickData) {
    set('icon', data.emoji)
    setShowPicker(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = categorySchema.safeParse(form)
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof CategoryForm] = e.message })
      setErrors(fe)
      return
    }
    const payload = { ...result.data, icon: result.data.icon || undefined }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateAdminCategory(editing.id, payload)
      } else {
        await createAdminCategory(payload)
      }
      setModal(null)
      load(page)
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar categoría?')) return
    setDeleteErr('')
    try {
      await deleteAdminCategory(id)
      const lastPage = Math.max(1, Math.ceil((total - 1) / LIMIT))
      const nextPage = Math.min(page, lastPage)
      if (nextPage !== page) setPage(nextPage)
      else load(page)
    } catch {
      setDeleteErr('Error al eliminar la categoría. Intenta de nuevo.')
    }
  }

  const columns: Column<Category>[] = [
    {
      key: 'icon',
      header: '',
      headerClassName: 'w-10',
      render: (cat) => <span className="text-xl">{cat.icon ?? '🏷️'}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (cat) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
          {cat.isSystem && <p className="text-xs text-gray-400">Sistema</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (cat) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (cat) => (
        <div className="flex gap-3 justify-end">
          <button onClick={() => openEdit(cat)} className="text-xs text-blue-500 hover:underline">Editar</button>
          {!cat.isSystem && (
            <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
        <Button onClick={openCreate}>+ Nueva</Button>
      </div>

      {deleteErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{deleteErr}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(cat) => cat.id}
        loading={loading}
        error={loadErr}
        emptyMessage="Sin categorías."
      />

      {!loading && !loadErr && total > LIMIT && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Página {page} de {Math.ceil(total / LIMIT)} ({total} total)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / LIMIT)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setShowPicker(false) }}
        title={modal === 'edit' ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="cname"
            label="Nombre"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />

          {/* Icon picker */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ícono</label>
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-500 transition-colors bg-white w-full"
              >
                <span className="text-2xl leading-none">
                  {form.icon || '🏷️'}
                </span>
                <span className="text-gray-500">{form.icon ? 'Cambiar ícono' : 'Seleccionar ícono'}</span>
                {form.icon && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); set('icon', '') }}
                    className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </button>

              {showPicker && (
                <div className="absolute z-50 top-full mt-1 left-0">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={Theme.LIGHT}
                    lazyLoadEmojis
                    searchPlaceholder="Buscar emoji..."
                    width={320}
                    height={380}
                  />
                </div>
              )}
            </div>
          </div>

          <Select
            id="ctype"
            label="Tipo"
            value={form.type}
            options={TYPE_OPTS}
            onChange={(e) => set('type', e.target.value)}
          />

          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setModal(null); setShowPicker(false) }}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
