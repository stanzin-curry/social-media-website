import React, { useState } from 'react'
import FullCalendar from '../components/FullCalendar'
import { useApp } from '../context/AppContext'
import ScheduleModal from '../components/ScheduleModal'

export default function CalendarPage(){
  const { changeMonth, currentMonth, currentYear } = useApp()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><i className="fas fa-chevron-left" /></button>
            <h3 className="text-lg font-bold">{new Date(currentYear, currentMonth).toLocaleString('default',{month:'long', year:'numeric'})}</h3>
            <button onClick={()=>changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg"><i className="fas fa-chevron-right" /></button>
          </div>
          <button onClick={()=>setModalOpen(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg"><i className="fas fa-plus mr-2" />Schedule Post</button>
        </div>

        <div className="mt-4">
          <div className="hidden md:grid grid-cols-7 gap-2 text-center mb-3">
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=><div key={d} className="text-gray-600 font-semibold py-2">{d}</div>)}
          </div>

          <FullCalendar onDayClick={()=>setModalOpen(true)} />
        </div>
      </div>

      <ScheduleModal open={modalOpen} onClose={()=>setModalOpen(false)} />
    </div>
  )
}
