import React from 'react'
import { useApp } from '../context/AppContext'

export default function FullCalendar({ onDayClick }) {
  const { currentMonth, currentYear, scheduledPosts } = useApp()
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const prevLastDay = new Date(currentYear, currentMonth, 0)
  const cells = []

  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    cells.push({ num: prevLastDay.getDate() - i, dim:true })
  }
  for (let day=1; day<= lastDay.getDate(); day++) {
    const dayPosts = scheduledPosts.filter(p => {
      const pd = new Date(p.scheduledDate)
      return pd.getDate() === day && pd.getMonth() === currentMonth && pd.getFullYear() === currentYear
    })
    const today = new Date()
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
    cells.push({ num: day, posts: dayPosts, isToday })
  }
  const remaining = 42 - (firstDay.getDay() + lastDay.getDate())
  for (let i=1;i<=remaining;i++) cells.push({ num: i, dim:true })

  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-gray-700">{monthNames[currentMonth]} {currentYear}</div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, idx) => (
          <div key={idx} className={`rounded-lg p-2 min-h-20 ${c.dim ? 'bg-gray-50 text-gray-400' : 'bg-white border-2 hover:border-green-500 cursor-pointer'} ${c.isToday ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} onClick={()=>onDayClick?.(c.num)}>
            <p className={`text-xs font-semibold ${c.isToday ? 'text-green-700' : ''}`}>{c.num}</p>
            <div className="space-y-1 mt-2">
              {c.posts?.map(p => <div key={p.id} className="text-xs truncate bg-gradient-to-r from-orange-400 to-pink-500 text-white px-2 py-1 rounded hidden sm:block"><i className="fab fa-instagram mr-1" />{p.scheduledTime}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
