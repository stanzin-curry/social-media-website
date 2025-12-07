import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function NotificationPanel(){
  const { notifications, clearAllNotifications } = useApp()
  const [open, setOpen] = useState(false)

  // In Header we don't open it via context for brevity — user can toggle via button there hooking into state if you prefer.
  // Keep it simple: show when there are notifications; provide a fixed small UI in top-right.

  return (
    <div className={`fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 ${notifications.length ? '' : 'hidden'}`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <button onClick={clearAllNotifications} className="text-xs text-green-600 hover:text-green-700 font-medium">Clear All</button>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
        ) : notifications.map(n => (
          <div key={n.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <i className={`fas ${n.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-info-circle text-blue-500'} text-lg mt-1`}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
