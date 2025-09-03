import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from './common/Header'
import RequestCard from './common/RequestCard'
import RequestModal from './common/RequestModal'

const RequesterDashboard = ({ user, onLogout }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    sort: 'latest',
    search: ''
  })

  useEffect(() => {
    fetchRequests()
  }, [filters])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams(filters)
      const response = await fetch(`/api/requester/requests.php?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.requests)
      } else {
        setError(data.message || 'Failed to fetch requests')
      }
    } catch (error) {
      setError('An error occurred while fetching requests')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleRequestClick = (request) => {
    setSelectedRequest(request)
    setShowModal(true)
  }

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm(`Are you sure you want to delete budget request ${requestId}?\n\nThis action cannot be undone.`)) {
      try {
        const response = await fetch('/api/requester/delete_request.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ request_id: requestId })
        })

        const data = await response.json()

        if (data.success) {
          setRequests(prev => prev.filter(req => req.request_id !== requestId))
          alert('Request deleted successfully')
        } else {
          alert('Error: ' + data.message)
        }
      } catch (error) {
        alert('An error occurred while deleting the request')
        console.error('Delete error:', error)
      }
    }
  }

  const filteredRequests = requests.filter(request => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return (
        request.request_id.toLowerCase().includes(searchTerm) ||
        request.academic_year.toLowerCase().includes(searchTerm) ||
        request.status.toLowerCase().includes(searchTerm)
      )
    }
    return true
  })

  return (
    <div className="page-container">
      <Header 
        user={user} 
        onLogout={onLogout}
        title="REQUESTER DASHBOARD"
        showCreateButton={true}
      />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="filters">
        <label htmlFor="sort">Sort By:</label>
        <select 
          id="sort" 
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
        >
          <option value="latest">Latest first</option>
          <option value="oldest">Oldest</option>
        </select>

        <label htmlFor="status">Status:</label>
        <select 
          id="status" 
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="more_information">More Information</option>
        </select>

        <label htmlFor="search">Search:</label>
        <input 
          type="text" 
          id="search" 
          placeholder="Search requests..." 
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
      </div>

      <div className="content-box">
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
            <p>No budget requests found</p>
            <p style={{ fontSize: '14px', marginTop: '10px', color: 'var(--text-muted)' }}>
              {filters.search ? 'Try adjusting your search criteria' : 'Create your first budget request to get started'}
            </p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <RequestCard
              key={request.request_id}
              request={request}
              onClick={() => handleRequestClick(request)}
              onDelete={() => handleDeleteRequest(request.request_id)}
              showDeleteButton={request.status === 'pending' && !request.level1_processed}
            />
          ))
        )}
      </div>

      {showModal && selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setShowModal(false)}
          userRole="requester"
        />
      )}

      <style jsx>{`
        .page-container {
          padding: 20px 40px;
        }

        .filters {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0 20px 0;
          color: var(--text-secondary);
        }

        .filters label {
          font-weight: 600;
          font-size: 14px;
        }

        .filters select,
        .filters .search-input {
          padding: 6px 10px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--card-bg);
          color: var(--text-primary);
        }

        .content-box {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: 0 4px 20px var(--shadow-color);
          padding: 20px 24px;
        }

        .loading,
        .no-requests {
          text-align: center;
          color: var(--text-secondary);
          padding: 40px 0;
        }
      `}</style>
    </div>
  )
}

export default RequesterDashboard
