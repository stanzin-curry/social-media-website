import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ open, toggle }) {

  const linkClass = ({ isActive }) =>
    `nav-link flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 mb-2 
     ${isActive ? 'bg-green-50 text-green-600' : ''}`

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
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">SocialSync</h1>
            <p className="text-xs lg:text-sm text-gray-500">Schedule & Manage</p>
          </div>

          {/* Close Button (mobile only) */}
          <button
            onClick={toggle}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
          <NavLink to="/dashboard" className={linkClass}>
            <i className="fas fa-home w-5 text-lg" />
            <span className="text-sm lg:text-base">Dashboard</span>
          </NavLink>

          <NavLink to="/calendar" className={linkClass}>
            <i className="fas fa-calendar w-5 text-lg" />
            <span className="text-sm lg:text-base">Calendar</span>
          </NavLink>

          <NavLink to="/create" className={linkClass}>
            <i className="fas fa-plus-circle w-5 text-lg" />
            <span className="text-sm lg:text-base">Create Post</span>
          </NavLink>

          <NavLink to="/activity" className={linkClass}>
            <i className="fas fa-history w-5 text-lg" />
            <span className="text-sm lg:text-base">Activity History</span>
          </NavLink>

          <NavLink to="/accounts" className={linkClass}>
            <i className="fas fa-link w-5 text-lg" />
            <span className="text-sm lg:text-base">Social Accounts</span>
          </NavLink>

          <NavLink to="/analytics" className={linkClass}>
            <i className="fas fa-chart-line w-5 text-lg" />
            <span className="text-sm lg:text-base">Analytics</span>
          </NavLink>

          <NavLink to="/settings" className={linkClass}>
            <i className="fas fa-cog w-5 text-lg" />
            <span className="text-sm lg:text-base">Settings</span>
          </NavLink>
        </nav>

        {/* User Section */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 lg:px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-orange-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
              JD
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">rudr motu</p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
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
