import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { postAPI } from '../api/post.api.js'

export default function Activity(){
  const { publishedPosts, scheduledPosts, loadPosts, addNotification } = useApp()
  const [refreshing, setRefreshing] = useState({})
  const allPosts = [...publishedPosts, ...scheduledPosts].sort((a,b)=> {
    const dateA = new Date(b.publishedAt || b.scheduledDate || b.createdAt || 0)
    const dateB = new Date(a.publishedAt || a.scheduledDate || a.createdAt || 0)
    return dateA - dateB
  })

  const handleRefreshAnalytics = async (postId) => {
    setRefreshing(prev => ({ ...prev, [postId]: true }))
    try {
      const response = await postAPI.refreshAnalytics(postId)
      if (response.success) {
        addNotification('Analytics refreshed successfully', 'success')
        // Reload posts to get updated analytics
        await loadPosts()
      } else {
        addNotification(response.message || 'Failed to refresh analytics', 'error')
      }
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
      addNotification(error.message || 'Failed to refresh analytics', 'error')
    } finally {
      setRefreshing(prev => ({ ...prev, [postId]: false }))
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold">Activity History</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button className="px-3 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg text-[10px] sm:text-xs min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none">All</button>
            <button className="px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] sm:text-xs min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none">Published</button>
            <button className="px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] sm:text-xs min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none">Scheduled</button>
            <button className="px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] sm:text-xs min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none">Failed</button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {allPosts.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <i className="fas fa-history text-3xl sm:text-4xl mb-3" />
              <p className="text-xs sm:text-sm">No activity yet</p>
            </div>
          ) : allPosts.map(p=>{
            const postId = p._id || p.id
            const scheduledDate = p.scheduledDate ? new Date(p.scheduledDate) : null
            const publishedDate = p.publishedAt ? new Date(p.publishedAt) : null
            const analytics = p.analytics || {}
            
            return (
            <div key={postId} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                <i className="fab fa-instagram text-white text-base sm:text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold line-clamp-2 break-words">{p.caption?.substring(0,60) || 'No caption'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                      {p.status === 'published' && publishedDate 
                        ? `Published ${publishedDate.toLocaleString()}` 
                        : scheduledDate 
                        ? `Scheduled for ${scheduledDate.toLocaleString()}`
                        : 'No date'}
                    </p>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 ${p.status === 'published' ? 'bg-green-100 text-green-600' : p.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'} text-[10px] sm:text-xs rounded-full whitespace-nowrap self-start`}>{p.status}</span>
                </div>
                {p.status === 'published' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600 mt-2">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <span><i className="fas fa-eye text-blue-400" /> {analytics.reach?.toLocaleString() || 0} reach</span>
                      <span><i className="fas fa-heart text-red-400" /> {analytics.likes || 0}</span>
                      <span><i className="fas fa-comment text-blue-400" /> {analytics.comments || 0}</span>
                    </div>
                    {p.publishedPlatforms?.some(pp => pp.platform === 'facebook' && pp.status === 'success') && (
                      <button
                        onClick={() => handleRefreshAnalytics(postId)}
                        disabled={refreshing[postId]}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] sm:text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[36px] self-start sm:self-auto"
                      >
                        {refreshing[postId] ? 'Refreshing...' : 'Refresh Stats'}
                      </button>
                    )}
                  </div>
                )}
                {p.platforms && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.platforms.map(platform => (
                      <span key={platform} className="text-[10px] sm:text-xs px-2 py-1 bg-gray-100 rounded">
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}
