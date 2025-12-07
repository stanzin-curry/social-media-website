import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ScheduleModal({ open, onClose }) {
  const { selectedModalPlatforms, toggleModalPlatform, schedulePostFromModal, connectedAccounts } = useApp()
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const handleSubmit = () => {
    try {
      schedulePostFromModal({ caption, date, time, platforms: selectedModalPlatforms })
      setCaption(''); setDate(''); setTime('')
      onClose?.()
    } catch (err) {
      alert(err.message)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg lg:text-xl font-bold text-gray-800">Schedule New Post</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2"><i className="fas fa-times text-lg lg:text-xl"/></button>
        </div>

        <div className="p-4 lg:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Caption</label>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" rows="4" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
            <div className="flex gap-2">
              {Object.keys(connectedAccounts).filter(k=>connectedAccounts[k]).length === 0 ? (
                <div className="text-sm text-gray-500 py-4">Connect accounts first to select platforms</div>
              ) : Object.keys(connectedAccounts).filter(k=>connectedAccounts[k]).map(p => (
                <button key={p} onClick={()=>toggleModalPlatform(p)} className={`px-3 py-2 border rounded ${selectedModalPlatforms.includes(p) ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-gray-600'}`}>
                  <i className={`fab fa-${p} mr-2`} />{p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold"><i className="fas fa-clock mr-2" />Schedule Post</button>
        </div>
      </div>
    </div>
  )
}
