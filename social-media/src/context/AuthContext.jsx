import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../api/auth.api.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Verify token by fetching current user
      const response = await authAPI.getCurrentUser()
      if (response.success && response.user) {
        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        // Invalid token, remove it
        localStorage.removeItem('token')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      if (response.success && response.token) {
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register(username, email, password)
      if (response.success && response.token) {
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.message || 'Registration failed' }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      }
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

