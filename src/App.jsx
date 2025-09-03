import React, { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Login from './components/Login'
import RequesterDashboard from './components/RequesterDashboard'
import ApproverDashboard from './components/ApproverDashboard'
import CreateRequest from './components/CreateRequest'
import EditRequest from './components/EditRequest'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if we have initial data from PHP xampp stuff
      if (window.initialData && window.initialData.authenticated) {
        setUser(window.initialData.user)
        setLoading(false)
        return
      }
      
      // Fallback to API check
      const response = await fetch('/api/check_auth.php')
      const data = await response.json()
      
      if (data.authenticated) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout.php', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: 'var(--text-primary)'
      }}>
        Loading...
      </div>
    )
  }

  // Router for the app, put routes here after being declared in the components
  const router = createBrowserRouter([
    {
      path: '/login',
      element: user
        ? <Navigate to={user.role === 'requester' ? '/requester' : '/approver'} replace />
        : <Login onLogin={handleLogin} />
    },
    {
      path: '/requester',
      element: user && user.role === 'requester'
        ? <RequesterDashboard user={user} onLogout={handleLogout} />
        : <Navigate to="/login" replace />
    },
    {
      path: '/approver',
      element: user && ['approver', 'department_head', 'dean', 'vp_finance'].includes(user.role)
        ? <ApproverDashboard user={user} onLogout={handleLogout} />
        : <Navigate to="/login" replace />
    },
    {
      path: '/create-request',
      element: user && user.role === 'requester'
        ? <CreateRequest user={user} onLogout={handleLogout} />
        : <Navigate to="/login" replace />
    },
    {
      path: '/edit-request/:requestId',
      element: user && user.role === 'requester'
        ? <EditRequest user={user} onLogout={handleLogout} />
        : <Navigate to="/login" replace />
    },
    {
      path: '/',
      element: <Navigate to={user ? (user.role === 'requester' ? '/requester' : '/approver') : '/login'} replace />
    }
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  })

  return (
    <RouterProvider 
      router={router}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    />
  )
}

export default App
