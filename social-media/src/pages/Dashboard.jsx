import React from 'react'
import { useApp } from '../context/AppContext'
import MiniCalendar from '../components/MiniCalendar'

export default function Dashboard(){
  const { scheduledPosts, publishedPosts, notifications, connectedAccounts } = useApp()
  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length
  const failedPosts = publishedPosts.filter(p => p.status === 'failed').length

  return (
    <div className="screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-xs font-medium">Scheduled Posts</h3>
          <p className="text-2xl font-bold">{scheduledPosts.length}</p>
          <p className="text-xs text-gray-500 mt-2">Ready to publish</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-xs font-medium">Published Posts</h3>
          <p className="text-2xl font-bold">{publishedPosts.length}</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-xs font-medium">Failed Posts</h3>
          <p className="text-2xl font-bold">{failedPosts}</p>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-xs font-medium">Connected Accounts</h3>
          <p className="text-2xl font-bold">{connectedCount}</p>
          <p className="text-xs text-gray-500 mt-2">{connectedCount > 0 ? 'All active' : 'Connect accounts to start'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4">
          <h3 className="text-base font-semibold mb-4">Recent Activity</h3>
          {/* show latest 3 published posts */}
          {publishedPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-3" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : publishedPosts.slice(0,3).map(p=>{
            const postId = p._id || p.id
            const analytics = p.analytics || {}
            return (
            <div key={postId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <i className="fab fa-instagram text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{p.caption?.substring(0, 50) || 'No caption'}...</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.likes || 0} likes • {analytics.comments || 0} comments</p>
              </div>
            </div>
          )})}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-base font-semibold mb-4">Quick Calendar</h3>
          <div className="text-center mb-3">
            <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleString('default',{month:'long', year:'numeric'})}</p>
          </div>
          <MiniCalendar />
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-gray-600">Scheduled posts</span>
          </div>
        </div>
      </div>
    </div>
  )
}
