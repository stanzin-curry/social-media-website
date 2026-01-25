import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ open, toggle }) {

  const linkClass = ({ isActive }) =>
    `nav-link flex items-center gap-2 sm:gap-3 px-3 lg:px-4 py-2 sm:py-3 rounded-lg text-gray-700 hover:bg-gray-100 mb-2 min-h-[44px] transition-colors
     ${isActive ? 'bg-green-50 text-green-600' : ''}`
  
  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    if (window.innerWidth < 1024 && toggle) {
      toggle()
    }
  }

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">SocialSync</h1>
            <p className="text-xs sm:text-sm text-gray-500">Schedule & Manage</p>
          </div>

          {/* Close Button (mobile only) */}
          <button
            onClick={toggle}
            className="lg:hidden text-gray-600 hover:text-gray-800 p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 sm:p-3 lg:p-4 overflow-y-auto">
          <NavLink to="/dashboard" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-home w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Dashboard</span>
          </NavLink>

          <NavLink to="/calendar" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-calendar w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Calendar</span>
          </NavLink>

          <NavLink to="/create" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-plus-circle w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Create Post</span>
          </NavLink>

          <NavLink to="/activity" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-history w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Activity History</span>
          </NavLink>

          <NavLink to="/accounts" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-link w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Social Accounts</span>
          </NavLink>

          <NavLink to="/analytics" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-chart-line w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Analytics</span>
          </NavLink>

          <NavLink to="/settings" className={linkClass} onClick={handleNavClick}>
            <i className="fas fa-cog w-5 text-base sm:text-lg flex-shrink-0" />
            <span className="text-xs sm:text-sm lg:text-base">Settings</span>
          </NavLink>
        </nav>

        {/* User Section */}
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
              JD
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">rudr motu</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">john@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Dark Overlay for mobile */}
      <div
        className={`
        fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden
        ${open ? 'block' : 'hidden'}
      `}
        onClick={toggle}
      />
    </>
  )
}
