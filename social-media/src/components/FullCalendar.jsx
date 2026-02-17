import React from 'react'
import { useApp } from '../context/AppContext'

export default function FullCalendar({ onDayClick, onPostClick }) {
  const { currentMonth, currentYear, scheduledPosts, publishedPosts } = useApp()
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const prevLastDay = new Date(currentYear, currentMonth, 0)
  const cells = []
  
  // Combine scheduled and published posts
  const allPosts = [...scheduledPosts, ...publishedPosts]

  // Helper function to get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return <i className="fab fa-facebook" />
      case 'linkedin':
        return <i className="fab fa-linkedin" />
      case 'instagram':
        return <i className="fab fa-instagram" />
      default:
        return <i className="fas fa-globe" />
    }
  }

  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    cells.push({ num: prevLastDay.getDate() - i, dim:true })
  }
  for (let day=1; day<= lastDay.getDate(); day++) {
    const dayPosts = allPosts.filter(p => {
      if (!p.scheduledDate) return false
      const pd = new Date(p.scheduledDate)
      return pd.getDate() === day && pd.getMonth() === currentMonth && pd.getFullYear() === currentYear
    })
    const today = new Date()
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
    // Format date as YYYY-MM-DD for date input
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ num: day, posts: dayPosts, isToday, dateStr })
  }
  const remaining = 42 - (firstDay.getDay() + lastDay.getDate())
  for (let i=1;i<=remaining;i++) cells.push({ num: i, dim:true })

  const handleDayClick = (cell, e) => {
    // Don't trigger day click if clicking on a post
    if (e.target.closest('.post-item')) return
    if (cell.dim) return
    // Pass formatted date string (YYYY-MM-DD) for Quick Scheduling
    onDayClick?.(cell.dateStr || null)
  }

  const handlePostClick = (post, e) => {
    e.stopPropagation()
    onPostClick?.(post)
  }

  return (
    <div>
      <div className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:block">{monthNames[currentMonth]} {currentYear}</div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2 auto-rows-fr">
        {cells.map((c, idx) => (
          <div 
            key={idx} 
            className={`rounded sm:rounded-lg p-1 sm:p-2 h-[60px] sm:h-24 md:h-28 flex flex-col ${c.dim ? 'bg-gray-50' : 'bg-white border border-gray-200 sm:border-2 hover:border-green-500 cursor-pointer'} ${c.isToday ? 'border-green-500 bg-green-50' : ''}`} 
            onClick={(e) => handleDayClick(c, e)}
          >
            <p className={`text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
              c.isToday 
                ? 'text-green-700' 
                : c.dim 
                  ? 'text-gray-500' 
                  : 'text-gray-800'
            }`}>{c.num}</p>
            <div className="flex-1 overflow-y-auto space-y-0.5 sm:space-y-1 mt-1 sm:mt-2 min-h-0 calendar-cell-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
              {c.posts && c.posts.length > 0 ? (
                c.posts.map(p => {
                  const postId = p._id || p.id
                  const scheduledDate = p.scheduledDate ? new Date(p.scheduledDate) : null
                  const timeStr = scheduledDate ? scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                  const platforms = p.platforms || []
                  const caption = p.caption || ''
                  const captionPreview = caption.length > 15 ? caption.substring(0, 15) + '...' : caption
                  const postStatus = p.status || 'scheduled'
                  const isPublished = postStatus === 'published'
                  const isFailed = postStatus === 'failed'
                  
                  // Different colors based on status
                  let bgColor = 'bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600' // Scheduled
                  if (isPublished) {
                    bgColor = 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' // Published
                  } else if (isFailed) {
                    bgColor = 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' // Failed
                  }
                  
                  return (
                    <div 
                      key={postId} 
                      className={`post-item text-[9px] sm:text-xs ${bgColor} text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer transition-colors flex-shrink-0`}
                      onClick={(e) => handlePostClick(p, e)}
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1 mb-0 sm:mb-0.5">
                        {platforms.length > 0 ? (
                          platforms.slice(0, 2).map((platform, idx) => (
                            <span key={idx} className="text-[8px] sm:text-[10px]">{getPlatformIcon(platform)}</span>
                          ))
                        ) : (
                          <span className="text-[8px] sm:text-[10px]">{getPlatformIcon('instagram')}</span>
                        )}
                        {platforms.length > 2 && <span className="text-[8px] sm:text-[10px]">+{platforms.length - 2}</span>}
                        <span className="ml-auto text-[8px] sm:text-[10px] font-semibold hidden sm:inline">{timeStr}</span>
                      </div>
                      {captionPreview && (
                        <div className="truncate text-[8px] sm:text-[10px] opacity-90 hidden sm:block">{captionPreview}</div>
                      )}
                    </div>
                  )
                })
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
