import React, { useState } from 'react'
import { FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa'
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

  // Get platform icon and styling
  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: { icon: FaFacebook, bg: 'bg-blue-600', gradient: 'from-blue-500 to-blue-700' },
      instagram: { icon: FaInstagram, bg: 'bg-gradient-to-br', gradient: 'from-orange-400 to-pink-500' },
      linkedin: { icon: FaLinkedin, bg: 'bg-blue-700', gradient: 'from-blue-600 to-blue-800' }
    }
    return icons[platform?.toLowerCase()] || icons.instagram
  }

  // Get primary platform (first successful published platform, or first platform in array)
  const getPrimaryPlatform = (post) => {
    if (post.publishedPlatforms && post.publishedPlatforms.length > 0) {
      const successful = post.publishedPlatforms.find(pp => pp.status === 'success')
      if (successful) return successful.platform
    }
    if (post.platforms && post.platforms.length > 0) {
      return post.platforms[0]
    }
    return 'instagram' // default
  }

  // Check if post has Facebook and can refresh stats
  const canRefreshStats = (post) => {
    return post.publishedPlatforms?.some(pp => pp.platform === 'facebook' && pp.status === 'success')
  }

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
            const primaryPlatform = getPrimaryPlatform(p)
            const platformIcon = getPlatformIcon(primaryPlatform)
            const IconComponent = platformIcon.icon
            const hasMultiplePlatforms = p.platforms && p.platforms.length > 1
            const successfulPlatforms = p.publishedPlatforms?.filter(pp => pp.status === 'success') || []
            
            return (
            <div key={postId} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${platformIcon.gradient} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className="text-white text-base sm:text-xl" />
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
                
                {/* Platform tags */}
                {p.platforms && p.platforms.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.platforms.map(platform => {
                      const platformInfo = getPlatformIcon(platform)
                      const PlatformIcon = platformInfo.icon
                      const isSuccessful = successfulPlatforms.some(sp => sp.platform === platform)
                      return (
                        <span 
                          key={platform} 
                          className={`text-[10px] sm:text-xs px-2 py-1 rounded flex items-center gap-1 ${
                            isSuccessful ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <PlatformIcon className="text-[10px]" />
                          {platform}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Stats section - show for published posts */}
                {p.status === 'published' && (
                  <div className="mt-3 space-y-2">
                    {/* Combined stats (if single platform or no per-platform data) */}
                    {(!hasMultiplePlatforms || successfulPlatforms.length <= 1) && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <span><i className="fas fa-eye text-blue-400" /> {analytics.reach?.toLocaleString() || 0} reach</span>
                          <span><i className="fas fa-heart text-red-400" /> {analytics.likes || 0}</span>
                          <span><i className="fas fa-comment text-blue-400" /> {analytics.comments || 0}</span>
                          {analytics.shares > 0 && (
                            <span><i className="fas fa-share text-green-400" /> {analytics.shares || 0}</span>
                          )}
                        </div>
                        {canRefreshStats(p) && (
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

                    {/* Multi-platform stats view */}
                    {hasMultiplePlatforms && successfulPlatforms.length > 1 && (
                      <div className="space-y-2">
                        {successfulPlatforms.map((pubPlatform, idx) => {
                          const platformInfo = getPlatformIcon(pubPlatform.platform)
                          const PlatformIcon = platformInfo.icon
                          // For now, show combined stats for all platforms
                          // In future, we can store analytics per platform
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <div className="flex items-center gap-2">
                                <PlatformIcon className={`text-sm ${platformInfo.gradient.includes('blue') ? 'text-blue-600' : platformInfo.gradient.includes('pink') ? 'text-pink-500' : 'text-blue-700'}`} />
                                <span className="text-[10px] sm:text-xs font-medium text-gray-700 capitalize">{pubPlatform.platform}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600">
                                <span><i className="fas fa-eye text-blue-400" /> {analytics.reach?.toLocaleString() || 0}</span>
                                <span><i className="fas fa-heart text-red-400" /> {analytics.likes || 0}</span>
                                <span><i className="fas fa-comment text-blue-400" /> {analytics.comments || 0}</span>
                              </div>
                            </div>
                          )
                        })}
                        {canRefreshStats(p) && (
                          <button
                            onClick={() => handleRefreshAnalytics(postId)}
                            disabled={refreshing[postId]}
                            className="w-full sm:w-auto px-2 py-1 bg-blue-500 text-white rounded text-[10px] sm:text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[36px]"
                          >
                            {refreshing[postId] ? 'Refreshing...' : 'Refresh Stats (Facebook)'}
                          </button>
                        )}
                      </div>
                    )}
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
