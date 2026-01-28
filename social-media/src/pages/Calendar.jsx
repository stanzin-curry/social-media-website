import React, { useState } from 'react'
import FullCalendar from '../components/FullCalendar'
import { useApp } from '../context/AppContext'
import ScheduleModal from '../components/ScheduleModal'
import PostDetailModal from '../components/PostDetailModal'

export default function CalendarPage(){
  const { changeMonth, currentMonth, currentYear, loadPosts } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [postDetailOpen, setPostDetailOpen] = useState(false)

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  const handlePostClick = (post) => {
    setSelectedPost(post)
    setPostDetailOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedDate(null)
  }

  const handleClosePostDetail = () => {
    setPostDetailOpen(false)
    setSelectedPost(null)
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <button 
              onClick={()=>changeMonth(-1)} 
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Previous month"
            >
              <i className="fas fa-chevron-left text-sm sm:text-base" />
            </button>
            <h3 className="text-base sm:text-lg font-bold text-center sm:text-left flex-1 sm:flex-none">{new Date(currentYear, currentMonth).toLocaleString('default',{month:'long', year:'numeric'})}</h3>
            <button 
              onClick={()=>changeMonth(1)} 
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Next month"
            >
              <i className="fas fa-chevron-right text-sm sm:text-base" />
            </button>
          </div>
          <button 
            onClick={()=>setModalOpen(true)} 
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors min-h-[44px] text-sm sm:text-base font-medium"
          >
            <i className="fas fa-plus mr-2" />Schedule Post
          </button>
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="hidden md:grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2 sm:mb-3">
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=><div key={d} className="text-gray-600 font-semibold py-1 sm:py-2 text-xs sm:text-sm">{d}</div>)}
          </div>
          <div className="grid sm:hidden grid-cols-7 gap-0.5 text-center mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="text-gray-600 font-semibold py-1 text-[10px]">{d}</div>)}
          </div>

          <FullCalendar onDayClick={handleDayClick} onPostClick={handlePostClick} />
        </div>
      </div>

      <ScheduleModal 
        open={modalOpen} 
        onClose={handleCloseModal} 
        initialDate={selectedDate}
        onPostCreated={loadPosts}
      />
      {selectedPost && (
        <PostDetailModal open={postDetailOpen} onClose={handleClosePostDetail} post={selectedPost} />
      )}
    </div>
  )
}
