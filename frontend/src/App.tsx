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
import EmployeePreferencesPage from './pages/EmployeePreferencesPage'
import ShiftTemplatesPage from './pages/ShiftTemplatesPage'
import ShiftSwapsPage from './pages/ShiftSwapsPage'
import AutoSchedulePage from './pages/AutoSchedulePage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ProtectedRoute from './components/ProtectedRoute'
import { Role, Permission } from './types/auth.types'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
        <Route
          path="shifts"
          element={
            <ProtectedRoute requiredPermissions={[Permission.SHIFT_READ]}>
              <ShiftsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shifts/:hospitalId/:date"
          element={
            <ProtectedRoute requiredPermissions={[Permission.SHIFT_READ]}>
              <ShiftDayView />
            </ProtectedRoute>
          }
        />
        <Route
          path="leaves"
          element={
            <ProtectedRoute requiredPermissions={[Permission.LEAVE_READ]}>
              <LeavesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cross-hospital"
          element={
            <ProtectedRoute requiredRole={Role.LEADER}>
              <CrossHospitalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="export"
          element={
            <ProtectedRoute requiredRole={Role.LEADER}>
              <ExportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute requiredPermissions={[Permission.EMPLOYEE_READ]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id/preferences"
          element={
            <ProtectedRoute requiredPermissions={[Permission.EMPLOYEE_READ]}>
              <EmployeePreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shift-templates"
          element={
            <ProtectedRoute requiredRole={Role.LEADER}>
              <ShiftTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="shift-swaps"
          element={
            <ProtectedRoute requiredPermissions={[Permission.SWAP_READ]}>
              <ShiftSwapsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="auto-schedule"
          element={
            <ProtectedRoute requiredRole={Role.LEADER}>
              <AutoSchedulePage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
