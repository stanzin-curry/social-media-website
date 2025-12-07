import React from 'react'
import { useApp } from '../context/AppContext'

export default function MiniCalendar(){
  const { scheduledPosts } = useApp()
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const prevLastDay = new Date(today.getFullYear(), today.getMonth(), 0)
  const days = []

  for (let i = firstDay.getDay() - 1; i >= 0; i--) days.push({ num: prevLastDay.getDate() - i, dim: true })
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const hasScheduled = scheduledPosts.some(p=> new Date(p.scheduledDate).getDate() === day && new Date(p.scheduledDate).getMonth()===today.getMonth())
    days.push({ num: day, dim: false, today: day === today.getDate(), hasScheduled })
  }
  const remaining = 42 - (firstDay.getDay() + lastDay.getDate())
  for (let i=1;i<=remaining;i++) days.push({ num: i, dim: true })

  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="text-gray-500 font-medium">{d}</div>)}
      {days.map((d, i) => (
        <div key={i} className={`${d.dim ? 'text-gray-400' : (d.today ? 'bg-green-500 text-white rounded font-semibold' : 'hover:bg-gray-100 rounded cursor-pointer')} relative py-1`}>
          {d.num}
          {d.hasScheduled && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />}
        </div>
      ))}
    </div>
  )
}
