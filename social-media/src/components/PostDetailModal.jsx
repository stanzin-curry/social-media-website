import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { postAPI } from '../api/post.api.js'
import PageSelector from './PageSelector.jsx'

export default function PostDetailModal({ open, onClose, post }) {
  const { loadPosts, addNotification, connectedAccounts } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [selectedPages, setSelectedPages] = useState({ facebook: null, instagram: null })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '')
      if (post.scheduledDate) {
        const scheduledDate = new Date(post.scheduledDate)
        setDate(scheduledDate.toISOString().split('T')[0])
        setTime(scheduledDate.toTimeString().slice(0, 5))
      }
      // Initialize selected platforms from post
      setSelectedPlatforms(post.platforms || [])
      // Initialize selected pages from post
      setSelectedPages(post.selectedPages || { facebook: null, instagram: null })
    }
  }, [post])

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform)
      }
      return [...prev, platform]
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form
    if (post) {
      setCaption(post.caption || '')
      if (post.scheduledDate) {
        const scheduledDate = new Date(post.scheduledDate)
        setDate(scheduledDate.toISOString().split('T')[0])
        setTime(scheduledDate.toTimeString().slice(0, 5))
      }
      setSelectedPlatforms(post.platforms || [])
      setSelectedPages(post.selectedPages || { facebook: null, instagram: null })
    }
  }

  const handleUpdate = async () => {
    if (!caption || !date || !time || selectedPlatforms.length === 0) {
      addNotification('Please fill in all fields and select at least one platform', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await postAPI.updatePost(post._id || post.id, {
        caption,
        scheduledDate: date,
        scheduledTime: time,
        platforms: selectedPlatforms,
        selectedPages
      })

      if (response.success) {
        addNotification('Post updated successfully', 'success')
        await loadPosts()
        setIsEditing(false)
        onClose?.()
      } else {
        throw new Error(response.message || 'Failed to update post')
      }
    } catch (error) {
      addNotification(error.message || 'Failed to update post', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this scheduled post?')) {
      return
    }

    try {
      setLoading(true)
      const response = await postAPI.deletePost(post._id || post.id)

      if (response.success) {
        addNotification('Post deleted successfully', 'success')
        await loadPosts()
        onClose?.()
      } else {
        throw new Error(response.message || 'Failed to delete post')
      }
    } catch (error) {
      addNotification(error.message || 'Failed to delete post', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <i className="fab fa-facebook text-blue-600" />
      case 'linkedin':
        return <i className="fab fa-linkedin text-blue-700" />
      case 'instagram':
        return <i className="fab fa-instagram text-pink-600" />
      default:
        return <i className="fas fa-globe text-gray-500" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!open || !post) return null

  const platforms = post.platforms || []
  const scheduledDate = post.scheduledDate ? new Date(post.scheduledDate) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Scheduled Post' : 'Post Details'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <i className="fas fa-times text-base sm:text-lg lg:text-xl"/>
          </button>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post Caption</label>
                <textarea 
                  value={caption} 
                  onChange={e => setCaption(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" 
                  rows="4" 
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Select Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(connectedAccounts).filter(k => connectedAccounts[k]).length === 0 ? (
                    <div className="text-xs sm:text-sm text-gray-500 py-3 sm:py-4">Connect accounts first to select platforms</div>
                  ) : Object.keys(connectedAccounts).filter(k => connectedAccounts[k]).map(p => (
                    <button 
                      key={p} 
                      onClick={() => togglePlatform(p)} 
                      className={`px-3 py-2 border rounded text-xs sm:text-sm min-h-[44px] transition-colors ${selectedPlatforms.includes(p) ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <i className={`fab fa-${p} mr-2`} />{p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Selection for Facebook */}
              {selectedPlatforms.includes('facebook') && (
                <PageSelector
                  platform="facebook"
                  value={selectedPages.facebook}
                  onChange={(pageId) => setSelectedPages({ ...selectedPages, facebook: pageId })}
                />
              )}

              {/* Page Selection for Instagram */}
              {selectedPlatforms.includes('instagram') && (
                <PageSelector
                  platform="instagram"
                  value={selectedPages.instagram}
                  onChange={(accountId) => setSelectedPages({ ...selectedPages, instagram: accountId })}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.caption || 'No caption'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
                <div className="flex gap-2 flex-wrap">
                  {platforms.length > 0 ? (
                    platforms.map((platform, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                        {getPlatformIcon(platform)}
                        <span className="text-sm font-medium">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No platforms selected</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time</label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-800">{formatDate(post.scheduledDate)}</p>
                </div>
              </div>

              {post.media && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Media</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={post.media.startsWith('http') ? post.media : `${window.location.origin}${post.media}`} 
                      alt="Post media" 
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel} 
                className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-100 rounded-lg hover:bg-gray-200 min-h-[44px] text-sm sm:text-base"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate} 
                className="flex-1 px-4 py-2.5 sm:py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 min-h-[44px] text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Post'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleDelete} 
                className="px-4 py-2.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 min-h-[44px] text-sm sm:text-base"
                disabled={loading}
              >
                <i className="fas fa-trash mr-2" />Delete
              </button>
              <button 
                onClick={handleEdit} 
                className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 min-h-[44px] text-sm sm:text-base"
              >
                <i className="fas fa-edit mr-2" />Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

