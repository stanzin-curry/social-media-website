import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [connectedAccounts, setConnectedAccounts] = useState({
    // instagram: false,
    // facebook: false,
    // linkedin: false,
    // this below section is the corrected code from gpt
    instagram: true,
facebook: true,
linkedin: true,

  })

  const [accountData] = useState({
    instagram: { username: '@your_brand', followers: '12.5K', posts: 234, lastSync: 'Just now' },
    facebook: { username: 'Your Brand Page', followers: '8.2K', posts: 189, lastSync: 'Just now' },
    linkedin: { username: 'Company Page', followers: '5.8K', posts: 156, lastSync: 'Just now' }
  })

  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [selectedModalPlatforms, setSelectedModalPlatforms] = useState([])
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [publishedPosts, setPublishedPosts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    // set min attributes on inputs (if any DOM reliant parts exist; pages will use date.min)
    // nothing required here (React controlled components will set min themselves)
  }, [])

  const toggleConnection = (platform) => {
    setConnectedAccounts(prev => {
      const next = { ...prev, [platform]: !prev[platform] }
      addNotification(`${platform.charAt(0).toUpperCase() + platform.slice(1)} ${next[platform] ? 'connected successfully!' : 'disconnected'}`, next[platform] ? 'success' : 'info')
      updatePlatformSelectors(next)
      return next
    })
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
    setNotifications(prev => [{ id: Date.now(), message, type, timestamp: new Date().toISOString() }, ...prev])
  }

  const clearAllNotifications = () => setNotifications([])

  const schedulePost = ({ caption, date, time, platforms }) => {
    if (!caption || !date || !time || !platforms?.length) {
      throw new Error('Please fill in all fields and select at least one platform')
    }
    const scheduledDateTime = new Date(`${date}T${time}`)
    if (scheduledDateTime <= new Date()) {
      throw new Error('Please select a future date and time')
    }

    const post = {
      id: Date.now(),
      caption,
      scheduledDate: date,
      scheduledTime: time,
      platforms: [...platforms],
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    }

    setScheduledPosts(prev => [...prev, post])
    addNotification(`Post scheduled for ${date} at ${time}`, 'success')

    // For demo: auto-publish after short delay (original had setTimeout 5s)
    setTimeout(() => {
      publishScheduledPost(post.id)
    }, 5000)
  }

  const publishScheduledPost = (postId) => {
    setScheduledPosts(prev => {
      const idx = prev.findIndex(p => p.id === postId)
      if (idx === -1) return prev
      const post = { ...prev[idx], status: 'published', publishedAt: new Date().toISOString(), likes: Math.floor(Math.random() * 500) + 100, comments: Math.floor(Math.random() * 100) + 20, reach: Math.floor(Math.random() * 5000) + 1000 }
      setPublishedPosts(pubPrev => [post, ...pubPrev])
      addNotification(`Post published successfully to ${post.platforms.join(', ')}!`, 'success')
      // remove from scheduled
      const copy = [...prev]
      copy.splice(idx, 1)
      return copy
    })
  }

  const schedulePostFromModal = ({ caption, date, time, platforms }) => {
    schedulePost({ caption, date, time, platforms })
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
    toggleConnection,
    togglePlatform,
    toggleModalPlatform,
    schedulePost,
    schedulePostFromModal,
    publishScheduledPost,
    addNotification,
    clearAllNotifications,
    changeMonth,
    updatePlatformSelectors,
    setCurrentMonth,
    setCurrentYear
  }), [
    connectedAccounts,
    selectedPlatforms,
    selectedModalPlatforms,
    scheduledPosts,
    publishedPosts,
    notifications,
    currentMonth, currentYear
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
