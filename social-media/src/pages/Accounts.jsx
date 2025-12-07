import React from 'react'
import { useApp } from '../context/AppContext'

export default function Accounts(){
  const { connectedAccounts, toggleConnection, accountData } = useApp()

  const platforms = [
    { key: 'instagram', color: 'from-orange-400 to-pink-500', icon: 'fa-instagram' },
    { key: 'facebook', color: 'bg-blue-500', icon: 'fa-facebook' },
    { key: 'linkedin', color: 'bg-blue-700', icon: 'fa-linkedin' }
  ]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(p=>(
          <div key={p.key} className={`bg-white rounded-xl shadow-md p-4 border-t-4 ${p.key==='instagram' ? 'border-orange-500' : p.key==='facebook' ? 'border-blue-500' : 'border-blue-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${p.key==='instagram' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : p.key==='facebook' ? 'bg-blue-500' : 'bg-blue-700'} flex items-center justify-center`}>
                  <i className={`fab ${p.icon} text-white`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{p.key.charAt(0).toUpperCase()+p.key.slice(1)}</h3>
                  <p className="text-xs text-gray-500">{connectedAccounts[p.key] ? accountData[p.key].username : 'Not connected'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${connectedAccounts[p.key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{connectedAccounts[p.key] ? 'Connected' : 'Disconnected'}</span>
            </div>

            {connectedAccounts[p.key] && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-800">{accountData[p.key].followers}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold text-gray-800">{accountData[p.key].posts}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Last Sync</span>
                  <span className="font-semibold text-gray-800">{accountData[p.key].lastSync}</span>
                </div>
              </div>
            )}

            <button onClick={()=>toggleConnection(p.key)} className={`w-full px-3 py-2 rounded-lg ${connectedAccounts[p.key] ? 'bg-red-50 text-red-600' : 'bg-green-500 text-white'}`}>
              <i className={`fas ${connectedAccounts[p.key] ? 'fa-unlink' : 'fa-link'} mr-2`} />{connectedAccounts[p.key] ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
