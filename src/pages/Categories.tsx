import { useEffect, useRef, useState } from 'react'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api'
import type { Category } from '../types'
import { categorySchema, type CategoryForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const TYPE_OPTS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
]

const emptyForm = (): CategoryForm => ({ name: '', icon: '', type: 'expense' })

export function Categories() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    const data = await getCategories()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
        await updateCategory(editing.id, payload)
      } else {
        await createCategory(payload)
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
    if (!confirm('¿Eliminar categoría?')) return
    await deleteCategory(id)
    load()
  }

  const expenses = items.filter((c) => c.type === 'expense')
  const incomes = items.filter((c) => c.type === 'income')

  function Section({ title, list }: { title: string; list: Category[] }) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {list.length === 0 && <p className="text-gray-400 text-sm px-4 py-3">Sin categorías.</p>}
          {list.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.icon ?? '🏷️'}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                  {cat.isSystem && <p className="text-xs text-gray-400">Sistema</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="text-xs text-blue-500 hover:underline">Editar</button>
                {!cat.isSystem && (
                  <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
        <Button onClick={openCreate}>+ Nueva</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="space-y-6">
          <Section title="Gastos" list={expenses} />
          <Section title="Ingresos" list={incomes} />
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
