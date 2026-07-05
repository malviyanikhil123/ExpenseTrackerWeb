import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import { Toaster, toast } from "sonner"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "../store/authStore"
import { DashboardLayout } from "../components/layout/DashboardLayout"
import { useProfileDetails } from "../features/profile/hooks/useProfile"

// Lazy load / direct import of features pages (Section 82/96)
import LoginPage from "../features/auth/pages/LoginPage"
import RegisterPage from "../features/auth/pages/RegisterPage"
import DashboardPage from "../features/dashboard/pages/DashboardPage"
import CategoriesPage from "../features/categories/pages/CategoriesPage"
import AccountsPage from "../features/accounts/pages/AccountsPage"
import TransactionsPage from "../features/transactions/pages/TransactionsPage"
import DebtsPage from "../features/debts/pages/DebtsPage"
import AnalyticsPage from "../features/analytics/pages/AnalyticsPage"
import ProfilePage from "../features/profile/pages/ProfilePage"
import NotFound from "../pages/NotFound"

// Route Guards (Section 51, 52)
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

// Protected Layout wrapper providing DashboardLayout framework (Section 51, 52)
import { ConfirmDialog } from "../components/dialogs/CustomDialog"

function ProtectedLayoutWrapper() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const { data: profile } = useProfileDetails()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false)

  const path = location.pathname.substring(1) || "dashboard"

  return (
    <>
      <DashboardLayout
        activeNavId={path}
        onNavSelect={(id) => {
          navigate(`/${id}`)
        }}
        userDisplayName={profile?.fullName || user?.name || "Member"}
        userEmail={profile?.email || user?.email || ""}
        userAvatarUrl={profile?.avatarUrl || undefined}
        onLogout={() => setIsConfirmLogoutOpen(true)}
      >
        <Outlet />
      </DashboardLayout>

      <ConfirmDialog
        isOpen={isConfirmLogoutOpen}
        onClose={() => setIsConfirmLogoutOpen(false)}
        onConfirm={() => {
          clearAuth()
          queryClient.clear()
          setIsConfirmLogoutOpen(false)
          toast.success("Successfully logged out!")
        }}
        title="Logout?"
        message="You will need to login again to access your financial records."
        confirmText="Logout"
        isDestructive={true}
      />
    </>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Redirect Root (Section 52) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public auth screens */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected dashboard screens */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayoutWrapper />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster position="top-right" duration={3000} richColors />
    </>
  )
}
