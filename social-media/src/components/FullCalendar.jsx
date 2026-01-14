import React from 'react'
import { useApp } from '../context/AppContext'

export default function FullCalendar({ onDayClick, onPostClick }) {
  const { currentMonth, currentYear, scheduledPosts } = useApp()
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const prevLastDay = new Date(currentYear, currentMonth, 0)
  const cells = []

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
    const dayPosts = scheduledPosts.filter(p => {
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
      <div className="mb-3 text-sm font-semibold text-gray-700">{monthNames[currentMonth]} {currentYear}</div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, idx) => (
          <div key={idx} className={`rounded-lg p-2 min-h-20 ${c.dim ? 'bg-gray-50 text-gray-400' : 'bg-white border-2 hover:border-green-500 cursor-pointer'} ${c.isToday ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} onClick={(e) => handleDayClick(c, e)}>
            <p className={`text-xs font-semibold ${c.isToday ? 'text-green-700' : ''}`}>{c.num}</p>
            <div className="space-y-1 mt-2">
              {c.posts?.map(p => {
                const postId = p._id || p.id
                const scheduledDate = p.scheduledDate ? new Date(p.scheduledDate) : null
                const timeStr = scheduledDate ? scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                const platforms = p.platforms || []
                const caption = p.caption || ''
                const captionPreview = caption.length > 20 ? caption.substring(0, 20) + '...' : caption
                
                return (
                  <div 
                    key={postId} 
                    className="post-item text-xs bg-gradient-to-r from-orange-400 to-pink-500 text-white px-2 py-1 rounded cursor-pointer hover:from-orange-500 hover:to-pink-600 transition-colors"
                    onClick={(e) => handlePostClick(p, e)}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {platforms.length > 0 ? (
                        platforms.slice(0, 2).map((platform, idx) => (
                          <span key={idx} className="text-[10px]">{getPlatformIcon(platform)}</span>
                        ))
                      ) : (
                        <span className="text-[10px]">{getPlatformIcon('instagram')}</span>
                      )}
                      {platforms.length > 2 && <span className="text-[10px]">+{platforms.length - 2}</span>}
                      <span className="ml-auto text-[10px] font-semibold">{timeStr}</span>
                    </div>
                    {captionPreview && (
                      <div className="truncate text-[10px] opacity-90">{captionPreview}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
