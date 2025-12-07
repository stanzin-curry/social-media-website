import React from 'react'
import { useApp } from '../context/AppContext'

export default function Activity(){
  const { publishedPosts, scheduledPosts } = useApp()
  const allPosts = [...publishedPosts, ...scheduledPosts].sort((a,b)=> new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Activity History</h3>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs">All</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Published</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Scheduled</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs">Failed</button>
          </div>
        </div>

        <div className="space-y-3">
          {allPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-history text-4xl mb-3" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : allPosts.map(p=>(
            <div key={p.id} className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <i className="fab fa-instagram text-white text-xl" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{p.caption.substring(0,60)}</p>
                    <p className="text-xs text-gray-500">{p.status === 'published' ? `Published ${new Date(p.publishedAt).toLocaleString()}` : `Scheduled for ${p.scheduledDate} ${p.scheduledTime}`}</p>
                  </div>
                  <span className={`px-3 py-1 ${p.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'} text-xs rounded-full`}>{p.status}</span>
                </div>
                {p.status === 'published' && (
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    <span><i className="fas fa-eye text-blue-400" /> {p.reach?.toLocaleString()} reach</span>
                    <span><i className="fas fa-heart text-red-400" /> {p.likes}</span>
                    <span><i className="fas fa-comment text-blue-400" /> {p.comments}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
