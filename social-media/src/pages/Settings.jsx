import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { userAPI } from '../api/user.api'

export default function Settings(){
  const { user, updateUser, logout } = useAuth()
  const { addNotification } = useApp()
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    companyName: ''
  })
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    postPublished: true,
    postFailed: true
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        companyName: user.companyName || ''
      })
      setNotificationPrefs({
        postPublished: user.notificationPreferences?.postPublished !== false,
        postFailed: user.notificationPreferences?.postFailed !== false
      })
    }
  }, [user])

  // Validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username || formData.username.trim() === '') {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors = {}
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setIsDirty(true)
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleNotificationChange = (key) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setIsDirty(true)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      addNotification('Please fix the errors before saving', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await userAPI.updateProfile({
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        notificationPreferences: notificationPrefs
      })

      if (response.success) {
        // Update user in context
        updateUser({ ...user, ...response.user })
        setIsDirty(false)
        addNotification('Profile updated successfully', 'success')
      } else {
        addNotification(response.message || 'Failed to update profile', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
      addNotification(errorMessage, 'error')
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset form to original values
  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        companyName: user.companyName || ''
      })
      setNotificationPrefs({
        postPublished: user.notificationPreferences?.postPublished !== false,
        postFailed: user.notificationPreferences?.postFailed !== false
      })
      setIsDirty(false)
      setErrors({})
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      addNotification('Please fix the errors before changing password', 'error')
      return
    }

    setPasswordLoading(true)
    try {
      const response = await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (response.success) {
        addNotification('Password changed successfully', 'success')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setPasswordErrors({})
      } else {
        addNotification(response.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password'
      addNotification(errorMessage, 'error')
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors)
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const response = await userAPI.deleteAccount()
      
      if (response.success) {
        addNotification('Account deleted successfully', 'success')
        // Logout and redirect
        logout()
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        addNotification(response.message || 'Failed to delete account', 'error')
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account'
      addNotification(errorMessage, 'error')
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-base font-semibold mb-4">Profile Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.username ? 'border-red-500' : ''}`}
                placeholder="Enter username"
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input 
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input 
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter company name"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={handleSaveProfile}
              disabled={loading || !isDirty}
              className={`px-4 py-2.5 sm:py-2 rounded-lg min-h-[44px] flex items-center justify-center gap-2 ${
                loading || !isDirty 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white text-sm sm:text-base`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Save Changes
            </button>
            {isDirty && (
              <button 
                onClick={handleCancel}
                className="px-4 py-2.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-base font-semibold mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <input 
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={`w-full px-3 py-2 border rounded-lg ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
              placeholder="Enter current password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input 
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                placeholder="Enter new password"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input 
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleChangePassword}
            disabled={passwordLoading}
            className={`px-4 py-2.5 sm:py-2 rounded-lg min-h-[44px] flex items-center justify-center gap-2 ${
              passwordLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white text-sm sm:text-base`}
          >
            {passwordLoading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Change Password
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-base font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium">Post Published</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Get notified when your scheduled posts are published</p>
            </div>
            <input 
              type="checkbox" 
              checked={notificationPrefs.postPublished}
              onChange={() => handleNotificationChange('postPublished')}
              className="w-5 h-5 cursor-pointer flex-shrink-0"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium">Post Failed</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Get notified when a post fails to publish</p>
            </div>
            <input 
              type="checkbox" 
              checked={notificationPrefs.postFailed}
              onChange={() => handleNotificationChange('postFailed')}
              className="w-5 h-5 cursor-pointer flex-shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold mb-4">Danger Zone</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-2">Delete Account</p>
          <p className="text-xs text-red-600 mb-3">Once you delete your account, there is no going back. This will permanently delete your account and all associated data.</p>
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-800 font-medium">Are you sure? This action cannot be undone.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg min-h-[44px] ${
                    loading 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white text-sm sm:text-base`}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg min-h-[44px] text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
