import React from 'react'
import { Link } from 'react-router-dom'

const Header = ({ user, onLogout, title, showCreateButton = false }) => {
  return (
    <>
      {/* Dark Mode Toggle */}
      <div className="dark-mode-toggle" onClick={toggleDarkMode}>
        <span className="toggle-icon sun-icon">☀️</span>
        <span className="toggle-icon moon-icon">🌙</span>
      </div>

      {/* Institutional Header */}
      <div className="institution-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/assets/dlsulogo.png" alt="DLSU Logo" className="institution-logo" />
            <div className="institution-info">
              <h1>Budget Management System</h1>
              <p>Financial Planning & Resource Allocation</p>
            </div>
          </div>
          <div className="header-nav">
            <div className="user-info">
              <p className="username">👤 {user.name || user.username}</p>
              <p className="role">{user.role === 'requester' ? 'Requester' : user.role.replace('_', ' ').toUpperCase()}</p>
            </div>
            <button onClick={onLogout} className="logout-btn">🚪 Logout</button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="header-bar">
          <h1>{title}</h1>
          {showCreateButton && (
            <div>
              <Link to="/create-request" className="create-btn">
                <span>✨</span>
                <span>Create New Request</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Educational Header Styling - Green Pantone 355U to White */
        .institution-header {
          background: linear-gradient(135deg, #00B04F 0%, #4CAF50 30%, #ffffff 100%);
          color: #333;
          padding: 0;
          position: relative;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .institution-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: linear-gradient(45deg, transparent 0%, transparent 45%, #f8f9fa 50%, #f8f9fa 100%);
          transform: skewY(-2deg);
          transform-origin: bottom left;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          position: relative;
          z-index: 2;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .institution-logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
        }

        .institution-info h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,176,79,0.8), 1px 1px 2px rgba(0,176,79,1);
        }

        .institution-info p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-info {
          text-align: right;
        }

        .user-info .username {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #00B04F;
        }

        .user-info .role {
          font-size: 12px;
          color: #666;
          margin: 2px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .logout-btn {
          background: #00B04F;
          border: 1px solid #00B04F;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,176,79,0.3);
          cursor: pointer;
        }

        .logout-btn:hover {
          background: #009640;
          border-color: #009640;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,176,79,0.4);
        }

        .dashboard-container {
          display: block;
          width: 100%;
          padding: 24px 40px 10px 40px;
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: var(--header-bg);
          padding: 25px 30px;
          border-radius: 15px;
          box-shadow: 0 4px 20px var(--shadow-color);
          border: 1px solid var(--border-color);
        }

        .header-bar h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--green-dark);
          margin: 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .create-btn {
          background: linear-gradient(135deg, #00B04F 0%, #008037 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,176,79,0.3);
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0,176,79,0.4);
        }

        /* Dark Mode Toggle */
        .dark-mode-toggle {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          z-index: 1000;
          background: var(--card-bg);
          border: 2px solid var(--green-primary);
          border-radius: 50px;
          padding: 12px;
          cursor: pointer;
          box-shadow: 0 4px 20px var(--shadow-color);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
        }

        .dark-mode-toggle:hover {
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 30px var(--shadow-color);
        }

        .dark-mode-toggle .toggle-icon {
          font-size: 24px;
          transition: all 0.3s ease;
        }

        .dark-mode-toggle .sun-icon {
          display: block;
        }

        .dark-mode-toggle .moon-icon {
          display: none;
        }

        [data-theme="dark"] .dark-mode-toggle .sun-icon {
          display: none;
        }

        [data-theme="dark"] .dark-mode-toggle .moon-icon {
          display: block;
        }
      `}</style>
    </>
  )
}

// Dark Mode Toggle Functionality
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  });
}

export default Header
