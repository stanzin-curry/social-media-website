import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function MiniCalendar(){
  const { scheduledPosts } = useApp()
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const prevLastDay = new Date(today.getFullYear(), today.getMonth(), 0)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const days = []

  // Helper function to get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <i className="fab fa-facebook text-blue-600" />
      case 'linkedin':
        return <i className="fab fa-linkedin text-blue-700" />
      case 'instagram':
        return <i className="fab fa-instagram text-pink-600" />
      default:
        return null
    }
  }

  // Helper function to get posts for a specific day
  const getPostsForDay = (day) => {
    return scheduledPosts.filter(p => {
      if (!p.scheduledDate) return false
      const postDate = new Date(p.scheduledDate)
      return postDate.getDate() === day && 
             postDate.getMonth() === today.getMonth() && 
             postDate.getFullYear() === today.getFullYear()
    })
  }

  // Helper function to get unique platforms from posts
  const getPlatformsForDay = (day) => {
    const posts = getPostsForDay(day)
    const platforms = new Set()
    posts.forEach(post => {
      if (post.platforms && Array.isArray(post.platforms)) {
        post.platforms.forEach(platform => platforms.add(platform))
      }
    })
    return Array.from(platforms)
  }

  for (let i = firstDay.getDay() - 1; i >= 0; i--) days.push({ num: prevLastDay.getDate() - i, dim: true })
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayPosts = getPostsForDay(day)
    const hasScheduled = dayPosts.length > 0
    days.push({ num: day, dim: false, today: day === today.getDate(), hasScheduled, postCount: dayPosts.length })
  }
  const remaining = 42 - (firstDay.getDay() + lastDay.getDate())
  for (let i=1;i<=remaining;i++) days.push({ num: i, dim: true })

  const handleMouseEnter = (e, day) => {
    if (day.dim || !day.hasScheduled) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setHoveredDay(day.num)
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-xs">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="text-gray-600 font-semibold py-1 sm:py-1.5">{d}</div>)}
        {days.map((d, i) => (
            <div 
              key={i} 
              className={`${
                d.dim 
                  ? 'text-gray-400' 
                  : d.today 
                    ? 'bg-green-500 text-white rounded font-semibold shadow-sm' 
                    : 'text-gray-800 hover:bg-gray-100 rounded cursor-pointer'
              } relative py-1 sm:py-1.5 min-h-[28px] sm:min-h-[32px] flex items-center justify-center transition-colors group`}
              onMouseEnter={(e) => handleMouseEnter(e, d)}
              onMouseLeave={handleMouseLeave}
            >
              <span className={`${d.today ? 'text-white font-bold' : d.dim ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
                {d.num}
              </span>
              {d.hasScheduled && !d.dim && (
                <span className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full border border-white shadow-sm" />
              )}
            </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredDay !== null && (() => {
        const dayData = days.find(d => d.num === hoveredDay && !d.dim)
        const platforms = dayData && dayData.hasScheduled ? getPlatformsForDay(hoveredDay) : []
        const postCount = dayData?.postCount || 0
        
        return (
          <div 
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-2 sm:p-3 min-w-[160px] pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px'
            }}
          >
            <div className="font-semibold mb-1.5 text-white border-b border-gray-700 pb-1.5">
              {hoveredDay} {today.toLocaleString('default', { month: 'short' })}
            </div>
            <div className="mb-1.5">
              <span className="text-orange-400 font-semibold">{postCount}</span>
              <span className="text-gray-300 ml-1">
                {postCount === 1 ? 'post' : 'posts'} scheduled
              </span>
            </div>
            {platforms.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-700">
                <span className="text-gray-400 text-[10px]">Platforms:</span>
                {platforms.map((platform, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded">
                    {getPlatformIcon(platform)}
                    <span className="text-[10px] capitalize">{platform}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Arrow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )
      })()}
    </div>
  )
}
