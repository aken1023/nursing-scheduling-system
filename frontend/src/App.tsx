import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ShiftsPage from './pages/ShiftsPage'
import ShiftDayView from './pages/ShiftDayView'
import LeavesPage from './pages/LeavesPage'
import CrossHospitalPage from './pages/CrossHospitalPage'
import ExportPage from './pages/ExportPage'
import EmployeesPage from './pages/EmployeesPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="shifts/:hospitalId/:date" element={<ShiftDayView />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="cross-hospital" element={<CrossHospitalPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="employees" element={<EmployeesPage />} />
      </Route>
    </Routes>
  )
}

export default App
