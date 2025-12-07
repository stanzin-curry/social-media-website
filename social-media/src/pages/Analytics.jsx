import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { useApp } from '../context/AppContext'

export default function Analytics(){
  const engagementRef = useRef(null)
  const platformRef = useRef(null)

  useEffect(() => {
    if (engagementRef.current && !engagementRef.current._chart) {
      engagementRef.current._chart = new Chart(engagementRef.current, {
        type:'line',
        data: {
          labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
          datasets:[
            { label:'Likes', data:[0,0,0,0,0,0,0], borderColor:'#32A852', backgroundColor: 'rgba(50,168,82,0.1)', tension:0.4 },
            { label:'Comments', data:[0,0,0,0,0,0,0], borderColor:'#FF8A00', backgroundColor:'rgba(255,138,0,0.1)', tension:0.4 }
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } }, scales:{ y:{ beginAtZero:true } } }
      })
    }

    if (platformRef.current && !platformRef.current._chart) {
      platformRef.current._chart = new Chart(platformRef.current, {
        type:'bar',
        data: {
          labels:['Instagram','Facebook','LinkedIn'],
          datasets:[ { label:'Posts Published', data:[0,0,0], backgroundColor:['#FF8A00','#1877F2','#0A66C2'] } ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
      })
    }
  },[])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Analytics Overview</h3>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-500 text-white rounded text-xs">All Platforms</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-xs">Instagram</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-xs">Facebook</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-xs">LinkedIn</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-600">Total Reach</p></div>
          <div className="text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-600">Total Likes</p></div>
          <div className="text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-600">Total Comments</p></div>
          <div className="text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-gray-600">Posts Published</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 h-64">
          <h3 className="text-base font-semibold mb-4">Engagement Over Time</h3>
          <div className="h-[220px] overflow-hidden">
            <canvas ref={engagementRef} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 h-64">
          <h3 className="text-base font-semibold mb-4">Posts Per Platform</h3>
          <div className="h-[220px]">
            <canvas ref={platformRef} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold mb-4">Top Performing Posts</h3>
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-chart-bar text-4xl mb-3" />
          <p className="text-sm">No posts yet</p>
        </div>
      </div>
    </div>
  )
}
