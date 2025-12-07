import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header(){
  const location = useLocation()
  const navigate = useNavigate()
  const titles = {
    '/dashboard': { title: 'Dashboard', subtitle: "Welcome back! Here's your overview" },
    '/calendar': { title: 'Calendar', subtitle: 'View and manage your scheduled posts' },
    '/create': { title: 'Create Post', subtitle: 'Compose and schedule new content' },
    '/activity': { title: 'Activity History', subtitle: 'View all your post activity and performance' },
    '/accounts': { title: 'Social Accounts', subtitle: 'Manage your connected platforms' },
    '/analytics': { title: 'Analytics', subtitle: 'Track your performance metrics' },
    '/settings': { title: 'Settings', subtitle: 'Manage your account preferences' }
  }
  const path = location.pathname
  const t = titles[path] || { title: 'Dashboard', subtitle: '' }

  return (
    <header className="bg-white shadow-sm px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 lg:gap-0 flex-1 min-w-0">
        <button className="lg:hidden text-gray-600 hover:text-gray-800 p-2" onClick={()=>{ /* sidebar handled in Sidebar with internal state */ }}>
          <i className="fas fa-bars text-xl"></i>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg lg:text-2xl font-bold text-gray-800 truncate">{t.title}</h2>
          <p className="text-xs lg:text-sm text-gray-500 hidden sm:block truncate">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
        <button className="relative p-2 text-gray-600 hover:text-gray-800" onClick={()=>{ /* toggled in NotificationPanel */ }}>
          <i className="fas fa-bell text-lg lg:text-xl"></i>
          {/* badge handled by NotificationPanel */}
        </button>
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-semibold cursor-pointer text-sm lg:text-base">JD</div>
      </div>
    </header>
  )
}
