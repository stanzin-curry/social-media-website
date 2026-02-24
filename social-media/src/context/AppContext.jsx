import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { accountAPI } from '../api/account.api.js'
import { postAPI } from '../api/post.api.js'
import { notificationAPI } from '../api/notification.api.js'

const AppContext = createContext()
//hey
export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    facebook: false,
    linkedin: false,
  })

  const [accountData, setAccountData] = useState({
    instagram: { username: '', followers: 0, posts: 0, lastSync: '', pageCount: 0, accountId: null },
    facebook: { username: '', followers: 0, posts: 0, lastSync: '', pageCount: 0, accountId: null },
    linkedin: { username: '', followers: 0, posts: 0, lastSync: '', pageCount: 0, accountId: null }
  })

  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [selectedModalPlatforms, setSelectedModalPlatforms] = useState([])
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [publishedPosts, setPublishedPosts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  // Track server notification IDs to avoid duplicates
  const serverNotificationIds = useRef(new Set())

  // Load accounts, posts, and notifications on mount
  useEffect(() => {
    loadAccounts()
    loadPosts()
    loadServerNotifications()
    
    // Set up polling for new notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      loadServerNotifications()
    }, 30000)
    
    return () => clearInterval(notificationInterval)
  }, [])

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await accountAPI.getAccounts()
      if (response.success && response.accounts) {
        const accounts = {}
        const data = {}
        
        // First pass: collect all accounts
        const allAccounts = {}
        response.accounts.forEach(account => {
          if (account.platform === 'linkedin' || account.platform === 'linkedin-company') {
            allAccounts['linkedin'] = allAccounts['linkedin'] || []
            allAccounts['linkedin'].push(account)
          } else {
            allAccounts[account.platform] = account
          }
        })
        
        // Process each platform
        Object.keys(allAccounts).forEach(platform => {
          if (platform === 'linkedin') {
            // Handle LinkedIn - can have both personal and company
            const linkedInAccounts = allAccounts[platform]
            accounts['linkedin'] = linkedInAccounts.some(acc => acc.isActive)
            
            // Find the active account (prefer company over personal for display)
            const activeAccount = linkedInAccounts.find(acc => acc.isActive && acc.platform === 'linkedin-company') 
              || linkedInAccounts.find(acc => acc.isActive && acc.platform === 'linkedin')
            
            if (activeAccount) {
              data['linkedin'] = {
                username: activeAccount.platformUsername,
                followers: activeAccount.followers || 0,
                posts: activeAccount.postCount || 0,
                pageCount: activeAccount.pageCount || 0,
                lastSync: activeAccount.lastSync ? new Date(activeAccount.lastSync).toLocaleString() : 'Never',
                accountType: activeAccount.platform === 'linkedin-company' ? 'company' : 'personal',
                accountId: activeAccount._id
              }
            }
          } else {
            const account = allAccounts[platform]
            accounts[platform] = account.isActive
            if (account.isActive) {
              data[platform] = {
                username: account.platformUsername,
                followers: account.followers || 0,
                posts: account.postCount || 0,
                pageCount: account.pageCount || 0,
                lastSync: account.lastSync ? new Date(account.lastSync).toLocaleString() : 'Never',
                accountId: account._id || account.id
              }
            }
          }
        })
        
        // Special handling for Instagram: count Instagram accounts from Facebook pages and get account ID
        if (accounts['facebook'] && data['facebook'] && accounts['instagram']) {
          const facebookAccount = response.accounts.find(acc => acc.platform === 'facebook' && acc.isActive)
          const instagramAccount = response.accounts.find(acc => acc.platform === 'instagram' && acc.isActive)
          
          if (facebookAccount && facebookAccount.pages) {
            const instagramCount = facebookAccount.pages.filter(page => page.instagramAccount).length
            if (data['instagram']) {
              data['instagram'].pageCount = instagramCount || 1
              // Set account ID if Instagram account exists
              if (instagramAccount && !data['instagram'].accountId) {
                data['instagram'].accountId = instagramAccount._id
              }
            }
          }
        }
        
        setConnectedAccounts(accounts)
        setAccountData(data)
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      setLoading(true)
      const [scheduledResponse, publishedResponse] = await Promise.all([
        postAPI.getScheduledPosts(),
        postAPI.getPublishedPosts()
      ])

      if (scheduledResponse.success) {
        setScheduledPosts(scheduledResponse.posts || [])
      }
      if (publishedResponse.success) {
        setPublishedPosts(publishedResponse.posts || [])
      }
      
      // Also reload notifications when posts are reloaded
      loadServerNotifications()
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServerNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await notificationAPI.getNotifications({ limit: 50 })
      
      if (response.success && response.notifications) {
        // Convert server notifications to local format and merge
        const newServerNotifications = response.notifications
          .filter(notif => !serverNotificationIds.current.has(notif._id))
          .map(notif => {
            serverNotificationIds.current.add(notif._id)
            // Map server notification types to local types
            const typeMap = {
              'postPublished': 'success',
              'postFailed': 'error'
            }
            return {
              id: notif._id,
              message: notif.message,
              type: typeMap[notif.type] || 'info',
              timestamp: notif.createdAt,
              read: notif.read,
              fromServer: true,
              notificationId: notif._id // Keep original ID for marking as read
            }
          })
        
        if (newServerNotifications.length > 0) {
          setNotifications(prev => {
            // Merge with existing notifications, avoiding duplicates
            const existingIds = new Set(prev.map(n => n.id))
            const uniqueNew = newServerNotifications.filter(n => !existingIds.has(n.id))
            return [...uniqueNew, ...prev]
          })
        }
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.error('Error loading server notifications:', error)
    }
  }

  const toggleConnection = async (platform, accountType = null) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification('Please login to connect accounts', 'error')
        return
      }

      // Check if the specific account type is connected
      let isConnected = false;
      if (platform === 'linkedin' && accountType) {
        // For LinkedIn, check the specific account type
        const accounts = await accountAPI.getAccounts()
        const platformKey = accountType === 'company' ? 'linkedin-company' : 'linkedin'
        const account = accounts.accounts?.find(acc => acc.platform === platformKey && acc.isActive)
        isConnected = !!account
      } else {
        isConnected = connectedAccounts[platform]
      }

      // If disconnecting, find account and disconnect
      if (isConnected) {
        const accounts = await accountAPI.getAccounts()
        // For LinkedIn, check account type
        let account;
        if (platform === 'linkedin' && accountType === 'company') {
          account = accounts.accounts?.find(acc => acc.platform === 'linkedin-company' && acc.isActive)
        } else if (platform === 'linkedin' && accountType === 'personal') {
          account = accounts.accounts?.find(acc => acc.platform === 'linkedin' && acc.isActive)
        } else if (platform === 'linkedin') {
          // Fallback: try to find personal account first, then company
          account = accounts.accounts?.find(acc => acc.platform === 'linkedin' && acc.isActive) ||
                   accounts.accounts?.find(acc => acc.platform === 'linkedin-company' && acc.isActive)
        } else {
          account = accounts.accounts?.find(acc => acc.platform === platform && acc.isActive)
        }
        
        if (account) {
          await accountAPI.disconnectAccount(account._id)
          addNotification(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`, 'info')
        }
      } else {
        // For connecting, get OAuth URL and redirect
        let response;
        switch (platform) {
          case 'linkedin':
            if (accountType === 'company') {
              response = await accountAPI.getLinkedInCompanyAuthUrl();
            } else {
              response = await accountAPI.getLinkedInAuthUrl();
            }
            break;
          case 'facebook':
            response = await accountAPI.getFacebookAuthUrl();
            break;
          case 'instagram':
            response = await accountAPI.getInstagramAuthUrl();
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        if (response.success && response.url) {
          window.location.href = response.url;
        } else {
          throw new Error(response.message || 'Failed to get OAuth URL');
        }
      }
      
      await loadAccounts()
      updatePlatformSelectors(connectedAccounts)
    } catch (error) {
      addNotification(`Failed to ${isConnected ? 'disconnect' : 'connect'} ${platform}: ${error.message}`, 'error')
      console.error('Error toggling connection:', error)
    }
  }

  function updatePlatformSelectors(accounts = connectedAccounts) {
    // ensure selectedPlatforms only includes connected ones
    setSelectedPlatforms(prev => prev.filter(p => accounts[p]))
    setSelectedModalPlatforms(prev => prev.filter(p => accounts[p]))
  }

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) return prev.filter(p => p !== platform)
      return [...prev, platform]
    })
  }

  const toggleModalPlatform = (platform) => {
    setSelectedModalPlatforms(prev => {
      if (prev.includes(platform)) return prev.filter(p => p !== platform)
      return [...prev, platform]
    })
  }

  const addNotification = (message, type = 'info') => {
    setNotifications(prev => [{ id: Date.now(), message, type, timestamp: new Date().toISOString(), fromServer: false }, ...prev])
  }

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Mark all server notifications as read
        await notificationAPI.markAllAsRead()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
    setNotifications([])
    serverNotificationIds.current.clear()
  }

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      if (token && notificationId) {
        await notificationAPI.markAsRead(notificationId)
      }
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.notificationId === notificationId || n.id === notificationId 
          ? { ...n, read: true }
          : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const schedulePost = async ({ caption, date, time, platforms, media, selectedPages }) => {
    if (!caption || !date || !time || !platforms?.length) {
      throw new Error('Please fill in all fields and select at least one platform')
    }
    // Combine date and time, create Date object in user's local timezone, then convert to ISO string
    const scheduledDateTime = new Date(`${date}T${time}`)
    if (scheduledDateTime <= new Date()) {
      throw new Error('Please select a future date and time')
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to schedule posts')
      }

      // Convert media URL to File if needed
      let mediaFile = null
      if (media) {
        if (media instanceof File) {
          mediaFile = media
        } else if (typeof media === 'string' && media.startsWith('blob:')) {
          // Convert blob URL to File
          const response = await fetch(media)
          const blob = await response.blob()
          mediaFile = new File([blob], 'post-media.jpg', { type: blob.type })
        }
      }

      const response = await postAPI.createPost({
        caption,
        scheduledDate: scheduledDateTime.toISOString(), // Send as ISO string for proper timezone handling
        scheduledTime: time, // Keep for backward compatibility
        platforms: [...platforms],
        media: mediaFile,
        selectedPages
      })

      if (response.success) {
        addNotification(`Post scheduled for ${date} at ${time}`, 'success')
        await loadPosts() // Reload posts from API
      } else {
        throw new Error(response.message || 'Failed to schedule post')
      }
    } catch (error) {
      addNotification(error.message || 'Failed to schedule post', 'error')
      throw error
    }
  }

  const publishScheduledPost = async (postId) => {
    // This is now handled by the cron scheduler on the backend
    // We just reload posts to get updated status hehehe
    await loadPosts()
  }

  const schedulePostFromModal = async ({ caption, date, time, platforms, selectedPages }) => {
    await schedulePost({ caption, date, time, platforms, selectedPages })
  }

  const deletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to delete posts')
      }

      const response = await postAPI.deletePost(postId)

      if (response.success) {
        addNotification('Post deleted successfully', 'success')
        await loadPosts() // Reload posts from API
      } else {
        throw new Error(response.message || 'Failed to delete post')
      }
    } catch (error) {
      addNotification(error.message || 'Failed to delete post', 'error')
      throw error
    }
  }

  const updatePost = async (postId, { caption, date, time, platforms, media, selectedPages }) => {
    if (!caption || !date || !time || !platforms?.length) {
      throw new Error('Please fill in all fields and select at least one platform')
    }
    const scheduledDateTime = new Date(`${date}T${time}`)
    if (scheduledDateTime <= new Date()) {
      throw new Error('Please select a future date and time')
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to update posts')
      }

      // Convert media URL to File if needed
      let mediaFile = null
      if (media) {
        if (media instanceof File) {
          mediaFile = media
        } else if (typeof media === 'string' && media.startsWith('blob:')) {
          // Convert blob URL to File
          const response = await fetch(media)
          const blob = await response.blob()
          mediaFile = new File([blob], 'post-media.jpg', { type: blob.type })
        }
      }

      const response = await postAPI.updatePost(postId, {
        caption,
        scheduledDate: date,
        scheduledTime: time,
        platforms: [...platforms],
        media: mediaFile,
        selectedPages
      })

      if (response.success) {
        addNotification('Post updated successfully', 'success')
        await loadPosts() // Reload posts from API
      } else {
        throw new Error(response.message || 'Failed to update post')
      }
    } catch (error) {
      addNotification(error.message || 'Failed to update post', 'error')
      throw error
    }
  }

  const changeMonth = (delta) => {
    let nm = currentMonth + delta
    let ny = currentYear
    if (nm > 11) { nm = 0; ny++ }
    if (nm < 0) { nm = 11; ny-- }
    setCurrentMonth(nm)
    setCurrentYear(ny)
  }

  const value = useMemo(() => ({
    connectedAccounts,
    accountData,
    selectedPlatforms,
    selectedModalPlatforms,
    scheduledPosts,
    publishedPosts,
    notifications,
    currentMonth,
    currentYear,
    loading,
    toggleConnection,
    togglePlatform,
    toggleModalPlatform,
    schedulePost,
    schedulePostFromModal,
    publishScheduledPost,
    deletePost,
    updatePost,
    addNotification,
    clearAllNotifications,
    markNotificationAsRead,
    loadServerNotifications,
    changeMonth,
    updatePlatformSelectors,
    setCurrentMonth,
    setCurrentYear,
    loadAccounts,
    loadPosts
  }), [
    connectedAccounts,
    selectedPlatforms,
    selectedModalPlatforms,
    scheduledPosts,
    publishedPosts,
    notifications,
    currentMonth,
    currentYear,
    loading
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
