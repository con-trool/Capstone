import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onLogin(data.user)
        navigate(data.user.role === 'requester' ? '/requester' : '/approver')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred during login')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Animated background particles */}
      <div className="particles" id="particles"></div>

      <div className="login-wrapper">
        {/* Enhanced Left Pane with System Information */}
        <div className="left-pane">
          <img src="/BRS_BG.png" alt="DLSU Building" className="bg-image" />
          <div className="left-content">
            <h1 className="system-title">Budget Management System</h1>
            <p className="system-subtitle">Streamlined Financial Planning & Resource Allocation</p>
          </div>
        </div>

        {/* Enhanced Right Pane with Modern Form */}
        <div className="right-pane">
          <div className="form-wrapper">
            <img src="/assets/dlsulogo.png" alt="DLSU Logo" className="logo" />
            
            <div className="welcome-text">
              <h2 className="welcome-title">Welcome Back</h2>
              <p className="welcome-subtitle">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="error-message">
                🚨 {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <div className="input-icon">👤</div>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email address" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="input-group">
                <div className="input-icon">🔒</div>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Enter your password" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-left">
          <span>BUDGET MANAGEMENT SYSTEM</span>
        </div>
        <div className="footer-right">
          <span>DE LA SALLE UNIVERSITY - MANILA</span>
        </div>
      </footer>

      <style jsx>{`
        .login-container {
          display: flex;
          height: 100vh;
          width: 100%;
          position: relative;
          z-index: 2;
          flex-direction: column;
        }

        .login-wrapper {
          display: flex;
          flex: 1;
          height: calc(100vh - 60px);
        }

        /* Animated background particles */
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          background: rgba(0, 176, 79, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }

        /* Enhanced Left Pane */
        .left-pane {
          flex: 1;
          position: relative;
          background: linear-gradient(135deg, #00B04F 0%, #008037 50%, #004d26 100%);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .bg-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.15;
          position: absolute;
          top: 0;
          left: 0;
        }

        .left-content {
          position: relative;
          z-index: 3;
          text-align: center;
          color: white;
          padding: 40px;
          max-width: 500px;
        }

        .system-title {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          animation: slideInLeft 1s ease-out;
        }

        .system-subtitle {
          font-size: 1.2rem;
          margin-bottom: 40px;
          opacity: 0.9;
          font-weight: 400;
          animation: slideInLeft 1s ease-out 0.2s both;
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Enhanced Right Pane */
        .right-pane {
          width: 40%;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 40px;
          box-shadow: -10px 0 30px rgba(0,0,0,0.1);
          position: relative;
        }

        .form-wrapper {
          text-align: center;
          width: 100%;
          max-width: 400px;
          animation: slideInRight 1s ease-out;
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .logo {
          width: 120px;
          height: 120px;
          margin-bottom: 30px;
          border-radius: 50%;
          box-shadow: 0 10px 30px rgba(0,176,79,0.3);
          border: 4px solid #00B04F;
          padding: 10px;
          background: white;
          object-fit: contain;
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }

        .welcome-text {
          margin-bottom: 40px;
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 600;
          color: #015c2e;
          margin-bottom: 10px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .welcome-subtitle {
          color: #6c757d;
          font-size: 1rem;
          font-weight: 400;
        }

        /* Enhanced Form Styling */
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          position: relative;
          margin-bottom: 10px;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.2rem;
          z-index: 2;
        }

        input {
          width: 100%;
          padding: 15px 15px 15px 50px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          font-family: 'Montserrat', sans-serif;
          background: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        input:focus {
          outline: none;
          border-color: #00B04F;
          box-shadow: 0 4px 20px rgba(0,176,79,0.2);
          transform: translateY(-2px);
        }

        input::placeholder {
          color: #adb5bd;
          font-weight: 400;
        }

        .login-btn {
          background: linear-gradient(135deg, #00B04F 0%, #008037 100%);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,176,79,0.3);
          margin-top: 10px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0,176,79,0.4);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Enhanced Error Message */
        .error-message {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          color: #721c24;
          padding: 15px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
          box-shadow: 0 4px 15px rgba(220,53,69,0.2);
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Enhanced Footer */
        .footer {
          background: linear-gradient(135deg, #015c2e 0%, #00B04F 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
        }

        .footer-left, .footer-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
          }
          .left-pane {
            height: 40%;
          }
          .right-pane {
            width: 100%;
            height: 60%;
          }
          .system-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
