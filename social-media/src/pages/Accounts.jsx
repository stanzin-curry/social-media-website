import React from 'react'
import { useApp } from '../context/AppContext'

export default function Accounts(){
  const { connectedAccounts, toggleConnection, accountData } = useApp()

  const platforms = [
    { key: 'instagram', color: 'from-orange-400 to-pink-500', icon: 'fa-instagram' },
    { key: 'facebook', color: 'bg-blue-500', icon: 'fa-facebook' },
  ]

  // LinkedIn has two connection types
  const linkedInConnections = [
    { key: 'linkedin', accountType: 'personal', label: 'LinkedIn (Personal Profile)', color: 'bg-blue-700', icon: 'fa-linkedin' },
    { key: 'linkedin', accountType: 'company', label: 'LinkedIn (Company Pages)', color: 'bg-blue-800', icon: 'fa-building' }
  ]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {platforms.map(p=>(
          <div key={p.key} className={`bg-white rounded-xl shadow-md p-3 sm:p-4 border-t-4 ${p.key==='instagram' ? 'border-orange-500' : 'border-blue-500'}`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${p.key==='instagram' ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0`}>
                  <i className={`fab ${p.icon} text-white text-sm sm:text-base`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{p.key.charAt(0).toUpperCase()+p.key.slice(1)}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{connectedAccounts[p.key] ? accountData[p.key].username : 'Not connected'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] sm:text-xs rounded-full whitespace-nowrap flex-shrink-0 ${connectedAccounts[p.key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{connectedAccounts[p.key] ? 'Connected' : 'Disconnected'}</span>
            </div>

            {connectedAccounts[p.key] && (
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-800">{accountData[p.key].followers}</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold text-gray-800">{accountData[p.key].posts}</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-600">Last Sync</span>
                  <span className="font-semibold text-gray-800 truncate ml-2">{accountData[p.key].lastSync}</span>
                </div>
              </div>
            )}

            <button onClick={()=>toggleConnection(p.key)} className={`w-full px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium min-h-[44px] transition-colors ${connectedAccounts[p.key] ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-500 text-white hover:bg-green-600'}`}>
              <i className={`fas ${connectedAccounts[p.key] ? 'fa-unlink' : 'fa-link'} mr-2`} />{connectedAccounts[p.key] ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}

        {/* LinkedIn connections - show both personal and company */}
        {linkedInConnections.map(p=>{
          const isConnected = connectedAccounts[p.key] && accountData[p.key]?.accountType === p.accountType;
          return (
            <div key={`${p.key}-${p.accountType}`} className={`bg-white rounded-xl shadow-md p-3 sm:p-4 border-t-4 border-blue-700`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${p.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${p.icon} text-white text-sm sm:text-base`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">{p.label}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{isConnected ? accountData[p.key].username : 'Not connected'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] sm:text-xs rounded-full whitespace-nowrap flex-shrink-0 ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {isConnected && (
                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-semibold text-gray-800">{accountData[p.key].followers}</span>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-semibold text-gray-800">{accountData[p.key].posts}</span>
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="text-gray-600">Last Sync</span>
                    <span className="font-semibold text-gray-800 truncate ml-2">{accountData[p.key].lastSync}</span>
                  </div>
                </div>
              )}

              <button onClick={()=>toggleConnection(p.key, p.accountType)} className={`w-full px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium min-h-[44px] transition-colors ${isConnected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                <i className={`fas ${isConnected ? 'fa-unlink' : 'fa-link'} mr-2`} />{isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
