# Pulso — Frontend

Interfaz web de **Pulso**, una aplicación de finanzas personales que ayuda a los usuarios a registrar transacciones, crear metas de ahorro, seguir hábitos financieros y visualizar su salud financiera.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 + TypeScript |
| Build tool | Vite 7 |
| Estilos | Tailwind CSS 4 |
| Ruteo | React Router DOM 7 |
| HTTP | Axios |
| Validación | Zod |
| Gráficas | Chart.js + react-chartjs-2 |
| Emojis | emoji-picker-react |

---

## Estructura del proyecto

```
src/
├── api/            # Llamadas HTTP (Axios) por recurso
├── components/
│   ├── charts/     # Componentes de gráficas (Chart.js)
│   ├── layout/     # AppLayout, Sidebar, ProtectedRoute, AdminRoute
│   └── ui/         # Componentes reutilizables (Button, Input, Modal)
├── context/        # AuthContext (autenticación y perfil)
├── hooks/          # Hooks genéricos (useFetch)
├── pages/          # Una página por ruta
├── schemas/        # Esquemas de validación Zod
├── types/          # Tipos TypeScript globales
└── utils/          # Utilidades (formatters)
```

---

## Páginas y rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Dashboard | Autenticado |
| `/transactions` | Transacciones | Autenticado |
| `/saving-goals` | Metas de ahorro | Autenticado |
| `/habits` | Hábitos | Autenticado |
| `/snapshots` | Snapshots diarios | Autenticado |
| `/categories` | Categorías | Solo admin |
| `/investment-profiles` | Perfiles de inversión | Autenticado |
| `/profile` | Perfil de usuario | Autenticado |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro | Público |

---

## Roles de usuario

- **`user`** — acceso estándar a todas las secciones excepto Categorías.
- **`admin`** — acceso completo, incluyendo la gestión de Categorías.

El rol es asignado por el backend y se incluye en la respuesta del login (`user.role`).

---

## Variables de entorno

Crea un archivo `.env` en la raíz basándote en `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview

# Linter
npm run lint
```
