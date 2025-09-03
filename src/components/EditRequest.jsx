import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './common/Header'

const EditRequest = ({ user, onLogout }) => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    academic_year: '',
    budget_title: '',
    description: '',
    fund_account: '',
    fund_name: '',
    duration: 'Annually'
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRequestData()
  }, [requestId])

  const fetchRequestData = async () => {
    try {
      const response = await fetch(`/api/requester/get_request.php?request_id=${requestId}`)
      const data = await response.json()

      if (data.success) {
        setFormData({
          academic_year: data.request.academic_year || '',
          budget_title: data.request.budget_title || '',
          description: data.request.description || '',
          fund_account: data.request.fund_account || '',
          fund_name: data.request.fund_name || '',
          duration: data.request.duration || 'Annually'
        })
      } else {
        setError(data.message || 'Failed to fetch request data')
      }
    } catch (error) {
      setError('An error occurred while fetching request data')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/requester/update_request.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          ...formData
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Budget request updated successfully!')
        navigate('/requester')
      } else {
        setError(data.message || 'Failed to update request')
      }
    } catch (error) {
      setError('An error occurred while updating the request')
      console.error('Update error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <Header user={user} onLogout={onLogout} title="EDIT BUDGET REQUEST" />
        <div className="content-box">
          <div className="loading">Loading request data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Header 
        user={user} 
        onLogout={onLogout}
        title="EDIT BUDGET REQUEST"
      />

      <div className="content-box">
        <h2>Edit Budget Request: {requestId}</h2>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="academic_year">Academic Year:</label>
              <select
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="budget_title">Budget Title:</label>
              <input
                type="text"
                id="budget_title"
                name="budget_title"
                value={formData.budget_title}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter budget title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fund_account">Fund Account Code:</label>
              <input
                type="text"
                id="fund_account"
                name="fund_account"
                value={formData.fund_account}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter fund account code"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fund_name">Fund Name:</label>
              <input
                type="text"
                id="fund_name"
                name="fund_name"
                value={formData.fund_name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter fund name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration:</label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="Annually">Annually</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              rows="4"
              placeholder="Enter detailed description of the budget request"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/requester')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        h2 {
          color: var(--green-dark);
          margin-bottom: 30px;
          font-size: 24px;
        }
      `}</style>
    </div>
  )
}

export default EditRequest
