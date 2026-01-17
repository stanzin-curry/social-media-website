import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaFacebook, FaLinkedin } from 'react-icons/fa'
import { useApp } from '../context/AppContext'
import { postAPI } from '../api/post.api.js'
import MiniCalendar from '../components/MiniCalendar'

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-xs font-medium">Scheduled Posts</h3>
          <p className="text-2xl font-bold">{scheduledPosts.length}</p>
          <p className="text-xs text-gray-500 mt-2">Ready to publish</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-xs font-medium">Published Posts</h3>
          <p className="text-2xl font-bold">{publishedPosts.length}</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-xs font-medium">Failed Posts</h3>
          <p className="text-2xl font-bold">{failedPosts}</p>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-xs font-medium">Connected Accounts</h3>
          <p className="text-2xl font-bold">{connectedCount}</p>
          <p className="text-xs text-gray-500 mt-2">{connectedCount > 0 ? 'All active' : 'Connect accounts to start'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4">
          <h3 className="text-base font-semibold mb-4">Recent Activity</h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-spinner fa-spin text-2xl mb-3" />
              <p className="text-sm">Loading posts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <i className="fas fa-exclamation-circle text-2xl mb-3" />
              <p className="text-sm">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-3" />
              <p className="text-sm mb-2">No posts yet. Create your first one!</p>
              <button
                onClick={() => navigate('/create')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const postId = post._id || post.id
                const caption = post.caption || post.content || 'No caption'
                const platforms = post.platforms || []
                const status = post.status || 'scheduled'
                const scheduledAt = post.scheduledDate || post.scheduledAt
                
                return (
                  <div key={postId} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    {/* Platform Icons */}
                    <div className="flex flex-col gap-2">
                      {platforms.length > 0 ? (
                        platforms.map((platform, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            {getPlatformIcon(platform)}
                          </div>
                        ))
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <i className="fas fa-globe text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                        {caption.length > 100 ? `${caption.substring(0, 100)}...` : caption}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(status)}`}>
                          {status.toUpperCase()}
                        </span>
                        {/* Scheduled Time */}
                        {scheduledAt && (
                          <span className="text-xs text-gray-500">
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

        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-base font-semibold mb-4">Quick Calendar</h3>
          <div className="text-center mb-3">
            <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleString('default',{month:'long', year:'numeric'})}</p>
          </div>
          <MiniCalendar />
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-gray-600">Scheduled posts</span>
          </div>
        </div>
      </div>
    </div>
  )
}
