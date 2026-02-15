import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaFacebook, FaLinkedin } from 'react-icons/fa'
import { useApp } from '../context/AppContext'
import { postAPI } from '../api/post.api.js'
import MiniCalendar from '../components/MiniCalendar'

// stanzin is sleepy today

export default function Dashboard(){
  const navigate = useNavigate()
  const { scheduledPosts, publishedPosts, notifications, connectedAccounts } = useApp()
  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length
  const failedPosts = publishedPosts.filter(p => p.status === 'failed').length
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await postAPI.getPosts()
      if (response.success) {
        setPosts(response.posts || [])
      } else {
        setError('Failed to fetch posts')
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Format date nicely (e.g., "Jan 7, 8:50 PM")
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleDateString('en-US', options)
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase() || 'SCHEDULED'
    if (statusUpper === 'PUBLISHED') {
      return 'bg-green-100 text-green-800 border-green-300'
    } else if (statusUpper === 'SCHEDULED') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    } else if (statusUpper === 'DRAFT') {
      return 'bg-gray-100 text-gray-800 border-gray-300'
    } else {
      return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <FaFacebook className="text-blue-600" />
      case 'linkedin':
        return <FaLinkedin className="text-blue-700" />
      default:
        return null
    }
  }

  return (
    <div className="screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Scheduled Posts</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{scheduledPosts.length}</p>
          <p className="text-xs text-gray-500">Ready to publish</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Published Posts</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{publishedPosts.length}</p>
          <p className="text-xs text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Failed Posts</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{failedPosts}</p>
          <p className="text-xs text-gray-500">Needs attention</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Connected Accounts</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{connectedCount}</p>
          <p className="text-xs text-gray-500">{connectedCount > 0 ? 'All active' : 'Connect accounts to start'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Recent Activity</h3>
          
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <i className="fas fa-spinner fa-spin text-xl sm:text-2xl mb-3" />
              <p className="text-xs sm:text-sm">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 sm:py-8 text-red-500">
              <i className="fas fa-exclamation-circle text-xl sm:text-2xl mb-3" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <i className="fas fa-inbox text-3xl sm:text-4xl mb-3" />
              <p className="text-xs sm:text-sm mb-2">No posts yet. Create your first one!</p>
              <button
                onClick={() => navigate('/create')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium min-h-[44px]"
              >
                Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {posts.map((post) => {
                const postId = post._id || post.id
                const caption = post.caption || post.content || 'No caption'
                const platforms = post.platforms || []
                const status = post.status || 'scheduled'
                const scheduledAt = post.scheduledDate || post.scheduledAt
                
                return (
                  <div key={postId} className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    {/* Platform Icons */}
                    <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                      {platforms.length > 0 ? (
                        platforms.slice(0, 2).map((platform, idx) => (
                          <div key={idx} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            {getPlatformIcon(platform)}
                          </div>
                        ))
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <i className="fas fa-globe text-gray-400 text-xs sm:text-sm" />
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 mb-1 line-clamp-2 break-words">
                        {caption}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium border ${getStatusBadge(status)}`}>
                          {status.toUpperCase()}
                        </span>
                        {/* Scheduled Time */}
                        {scheduledAt && (
                          <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                            <i className="fas fa-clock mr-1" />
                            {formatDate(scheduledAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 hidden sm:block lg:block">
          <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Quick Calendar</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">Current month overview</p>
          <div className="text-center mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm font-semibold text-gray-800">{new Date().toLocaleString('default',{month:'long', year:'numeric'})}</p>
          </div>
          <MiniCalendar />
          <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full flex-shrink-0" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full flex-shrink-0" />
              <span className="text-gray-600">Scheduled posts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
