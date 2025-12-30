import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

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

  // Get user initials
  const getInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/login')
    setShowDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
              {getInitials()}
            </div>
            {user?.username && (
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {user.username}
              </span>
            )}
            <i className="fas fa-chevron-down text-xs text-gray-500 hidden lg:block"></i>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {user && (
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
