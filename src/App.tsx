import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { SavingGoals } from './pages/SavingGoals'
import { Habits } from './pages/Habits'
import { Snapshots } from './pages/Snapshots'
import { Categories } from './pages/Categories'
import { InvestmentProfiles } from './pages/InvestmentProfiles'
import { Profile } from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="saving-goals" element={<SavingGoals />} />
            <Route path="habits" element={<Habits />} />
            <Route path="snapshots" element={<Snapshots />} />
            <Route path="categories" element={<AdminRoute><Categories /></AdminRoute>} />
            <Route path="investment-profiles" element={<InvestmentProfiles />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
