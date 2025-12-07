import React from 'react'

export default function Settings(){
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-base font-semibold mb-4">Profile Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input defaultValue="stanzin paldan" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input defaultValue="stanzincurry@gmail.com" type="email" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input defaultValue="nakpo studio" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg">Save Changes</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Post Published</p>
              <p className="text-xs text-gray-500">Get notified when your scheduled posts are published</p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Post Failed</p>
              <p className="text-xs text-gray-500">Get notified when a post fails to publish</p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mt-4">
        <h3 className="text-base font-semibold mb-4">Danger Zone</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-2">Delete Account</p>
          <p className="text-xs text-red-600 mb-3">Once you delete your account, there is no going back.</p>
          <button className="px-3 py-2 bg-red-600 text-white rounded-lg">Delete Account</button>
        </div>
      </div>
    </div>
  )
}
