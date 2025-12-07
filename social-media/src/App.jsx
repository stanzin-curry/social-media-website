import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import NotificationPanel from './components/NotificationPanel'

import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import CreatePost from './pages/CreatePost'
import Activity from './pages/Activity'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Header />
          <NotificationPanel />
          <div className="p-4 lg:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </AppProvider>
  )
}
