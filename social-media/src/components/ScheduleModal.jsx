import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import PageSelector from './PageSelector.jsx'

export default function ScheduleModal({ open, onClose, initialDate, onPostCreated }) {
  const { selectedModalPlatforms, toggleModalPlatform, schedulePostFromModal, connectedAccounts } = useApp()
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectedPages, setSelectedPages] = useState({ facebook: null, instagram: null })
  const [loading, setLoading] = useState(false)

  // Update date when initialDate prop changes (Quick Scheduling)
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate)
    }
  }, [initialDate])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCaption('')
      setDate('')
      setTime('')
      setSelectedPages({ facebook: null, instagram: null })
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!caption || !date || !time || selectedModalPlatforms.length === 0) {
      alert('Please fill in all fields and select at least one platform')
      return
    }

    try {
      setLoading(true)
      await schedulePostFromModal({ caption, date, time, platforms: selectedModalPlatforms, selectedPages })
      // Success - refresh posts and close modal
      if (onPostCreated) {
        onPostCreated()
      }
      setCaption(''); setDate(''); setTime('')
      setSelectedPages({ facebook: null, instagram: null })
      onClose?.()
    } catch (err) {
      // Error handling - show alert and keep modal open
      alert(err.message || 'Failed to schedule post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Schedule New Post</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><i className="fas fa-times text-base sm:text-lg lg:text-xl"/></button>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Post Caption</label>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm sm:text-base min-h-[100px]" rows="4" />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(connectedAccounts).filter(k=>connectedAccounts[k]).length === 0 ? (
                <div className="text-xs sm:text-sm text-gray-500 py-3 sm:py-4">Connect accounts first to select platforms</div>
              ) : Object.keys(connectedAccounts).filter(k=>connectedAccounts[k]).map(p => (
                <button key={p} onClick={()=>toggleModalPlatform(p)} className={`px-3 py-2 border rounded text-xs sm:text-sm min-h-[44px] transition-colors ${selectedModalPlatforms.includes(p) ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  <i className={`fab fa-${p} mr-2`} />{p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Page Selection for Facebook */}
          {selectedModalPlatforms.includes('facebook') && (
            <PageSelector
              platform="facebook"
              value={selectedPages.facebook}
              onChange={(pageId) => setSelectedPages({ ...selectedPages, facebook: pageId })}
            />
          )}

          {/* Page Selection for Instagram */}
          {selectedModalPlatforms.includes('instagram') && (
            <PageSelector
              platform="instagram"
              value={selectedPages.instagram}
              onChange={(accountId) => setSelectedPages({ ...selectedPages, instagram: accountId })}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base min-h-[44px]" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Time</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base min-h-[44px]" />
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-100 rounded-lg min-h-[44px] text-sm sm:text-base" disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 sm:py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />Scheduling...
              </>
            ) : (
              <>
                <i className="fas fa-clock mr-2" />Schedule Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
