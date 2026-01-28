import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import NotificationPanel from './components/NotificationPanel'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import CreatePost from './pages/CreatePost'
import Activity from './pages/Activity'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

// Layout component for protected routes
function ProtectedLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <AppProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} toggle={toggleSidebar} />
        <main className="flex-1 min-w-0">
          <Header toggleSidebar={toggleSidebar} />
          <NotificationPanel />
          <div className="p-2 sm:p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Navigate to="/dashboard" replace />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <CalendarPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <CreatePost />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Activity />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Accounts />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Analytics />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
