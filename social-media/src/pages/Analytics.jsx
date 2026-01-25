import React, { useEffect, useRef, useMemo } from 'react'
import Chart from 'chart.js/auto'
import { useApp } from '../context/AppContext'

export default function Analytics(){
  const engagementRef = useRef(null)
  const platformRef = useRef(null)
  const { publishedPosts } = useApp()
  const [selectedPlatform, setSelectedPlatform] = React.useState('all')

  // Filter posts by selected platform
  const filteredPosts = useMemo(() => {
    const published = publishedPosts.filter(p => p.status === 'published')
    
    if (selectedPlatform === 'all') {
      return published
    }
    
    return published.filter(post => {
      if (!post.platforms) return false
      return post.platforms.some(p => p.toLowerCase() === selectedPlatform.toLowerCase())
    })
  }, [publishedPosts, selectedPlatform])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const published = filteredPosts
    
    const totals = published.reduce((acc, post) => {
      const analytics = post.analytics || {}
      return {
        reach: acc.reach + (analytics.reach || 0),
        likes: acc.likes + (analytics.likes || 0),
        comments: acc.comments + (analytics.comments || 0),
        posts: acc.posts + 1
      }
    }, { reach: 0, likes: 0, comments: 0, posts: 0 })

    return totals
  }, [filteredPosts])

  // Count posts by platform
  const platformCounts = useMemo(() => {
    const published = publishedPosts.filter(p => p.status === 'published')
    const counts = { instagram: 0, facebook: 0, linkedin: 0 }
    
    published.forEach(post => {
      if (post.platforms) {
        post.platforms.forEach(platform => {
          if (platform.toLowerCase() === 'instagram') counts.instagram++
          if (platform.toLowerCase() === 'facebook') counts.facebook++
          if (platform.toLowerCase() === 'linkedin') counts.linkedin++
        })
      }
    })
    
    return [counts.instagram, counts.facebook, counts.linkedin]
  }, [publishedPosts])

  // Group engagement by day of week (last 7 days)
  const engagementByDay = useMemo(() => {
    const published = filteredPosts
    const likesByDay = [0, 0, 0, 0, 0, 0, 0]
    const commentsByDay = [0, 0, 0, 0, 0, 0, 0]
    
    // Get last 7 days (starting from today, going back 6 days)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0) // Ensure start of day
      return date
    })
    
    published.forEach(post => {
      // Use publishedAt if available, otherwise fall back to scheduledDate
      const postDateStr = post.publishedAt || post.scheduledDate
      if (postDateStr) {
        const postDate = new Date(postDateStr)
        postDate.setHours(0, 0, 0, 0) // Reset to start of day for comparison
        
        const dayIndex = last7Days.findIndex(day => {
          return day.getTime() === postDate.getTime()
        })
        
        if (dayIndex !== -1) {
          const analytics = post.analytics || {}
          likesByDay[dayIndex] += analytics.likes || 0
          commentsByDay[dayIndex] += analytics.comments || 0
        }
      }
    })
    
    return { likes: likesByDay, comments: commentsByDay }
  }, [filteredPosts])

  // Update engagement chart
  useEffect(() => {
    if (engagementRef.current) {
      if (engagementRef.current._chart) {
        engagementRef.current._chart.destroy()
      }
      engagementRef.current._chart = new Chart(engagementRef.current, {
        type:'line',
        data: {
          labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
          datasets:[
            { label:'Likes', data: engagementByDay.likes, borderColor:'#32A852', backgroundColor: 'rgba(50,168,82,0.1)', tension:0.4 },
            { label:'Comments', data: engagementByDay.comments, borderColor:'#FF8A00', backgroundColor:'rgba(255,138,0,0.1)', tension:0.4 }
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } }, scales:{ y:{ beginAtZero:true } } }
      })
    }
  }, [engagementByDay])

  // Update platform chart
  useEffect(() => {
    if (platformRef.current) {
      if (platformRef.current._chart) {
        platformRef.current._chart.destroy()
      }
      platformRef.current._chart = new Chart(platformRef.current, {
        type:'bar',
        data: {
          labels:['Instagram','Facebook','LinkedIn'],
          datasets:[ { label:'Posts Published', data: platformCounts, backgroundColor:['#FF8A00','#1877F2','#0A66C2'] } ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
      })
    }
  }, [platformCounts])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold">Analytics Overview</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setSelectedPlatform('all')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs transition-colors min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none ${
                selectedPlatform === 'all' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Platforms
            </button>
            <button 
              onClick={() => setSelectedPlatform('instagram')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs transition-colors min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none ${
                selectedPlatform === 'instagram' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Instagram
            </button>
            <button 
              onClick={() => setSelectedPlatform('facebook')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs transition-colors min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none ${
                selectedPlatform === 'facebook' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Facebook
            </button>
            <button 
              onClick={() => setSelectedPlatform('linkedin')}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs transition-colors min-h-[36px] sm:min-h-[40px] flex-1 sm:flex-none ${
                selectedPlatform === 'linkedin' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              LinkedIn
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Reach</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{summaryMetrics.reach.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-red-500">
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Likes</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{summaryMetrics.likes.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-green-500">
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Comments</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{summaryMetrics.comments.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-l-4 border-orange-500">
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Posts Published</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{summaryMetrics.posts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 h-64 sm:h-72">
          <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Engagement Over Time</h3>
          <div className="h-[200px] sm:h-[220px] overflow-hidden">
            <canvas ref={engagementRef} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 h-64 sm:h-72">
          <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Posts Per Platform</h3>
          <div className="h-[200px] sm:h-[220px]">
            <canvas ref={platformRef} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Top Performing Posts</h3>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <i className="fas fa-chart-bar text-3xl sm:text-4xl mb-3" />
            <p className="text-xs sm:text-sm">No posts yet{selectedPlatform !== 'all' ? ` for ${selectedPlatform}` : ''}</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredPosts
              .sort((a, b) => {
                const aTotal = (a.analytics?.likes || 0) + (a.analytics?.comments || 0) + (a.analytics?.reach || 0)
                const bTotal = (b.analytics?.likes || 0) + (b.analytics?.comments || 0) + (b.analytics?.reach || 0)
                return bTotal - aTotal
              })
              .slice(0, 5)
              .map(post => {
                const analytics = post.analytics || {}
                const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null
                return (
                  <div key={post._id || post.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-lg hover:shadow-md">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <i className="fab fa-instagram text-white text-sm sm:text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold line-clamp-2 break-words">{post.caption || 'No caption'}</p>
                      {publishedDate && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{publishedDate.toLocaleDateString()}</p>
                      )}
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600 mt-2 flex-wrap">
                        <span><i className="fas fa-eye text-blue-400" /> {analytics.reach?.toLocaleString() || 0}</span>
                        <span><i className="fas fa-heart text-red-400" /> {analytics.likes || 0}</span>
                        <span><i className="fas fa-comment text-blue-400" /> {analytics.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
