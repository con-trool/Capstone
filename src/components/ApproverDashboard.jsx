import React, { useState, useEffect } from 'react'
import Header from './common/Header'
import RequestCard from './common/RequestCard'
import RequestModal from './common/RequestModal'

const ApproverDashboard = ({ user, onLogout }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    view: user.role === 'vp_finance' ? 'all' : 'pending',
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
      const response = await fetch(`/api/approver/requests.php?${queryParams}`)
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

  const filteredRequests = requests.filter(request => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return (
        request.request_id.toLowerCase().includes(searchTerm) ||
        (request.requester_name && request.requester_name.toLowerCase().includes(searchTerm)) ||
        (request.college && request.college.toLowerCase().includes(searchTerm))
      )
    }
    return true
  })

  return (
    <div className="dashboard-container">
      <Header 
        user={user} 
        onLogout={onLogout}
        title="APPROVER DASHBOARD"
      />

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="filters">
        <label htmlFor="view">View:</label>
        <select 
          id="view" 
          value={filters.view}
          onChange={(e) => handleFilterChange('view', e.target.value)}
        >
          <option value="pending">My Pending Approvals</option>
          <option value="all">All Requests</option>
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
          <option value="more_info_requested">More Info Requested</option>
        </select>

        <label htmlFor="sort">Sort By:</label>
        <select 
          id="sort" 
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount_high">Amount (High-Low)</option>
          <option value="amount_low">Amount (Low-High)</option>
        </select>

        <label htmlFor="search">Search:</label>
        <input 
          type="text" 
          id="search" 
          placeholder="Request ID, Name, College..." 
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />

        <button type="button" className="btn btn-primary" onClick={fetchRequests}>
          Filter
        </button>
      </div>

      <div className="content-box">
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
            <p>No budget requests found matching your criteria.</p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <RequestCard
              key={request.request_id}
              request={{
                ...request,
                requester_name: request.requester_name,
                college: request.college
              }}
              onClick={() => handleRequestClick(request)}
              showDeleteButton={false}
            />
          ))
        )}
      </div>

      {showModal && selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setShowModal(false)}
          userRole={user.role}
        />
      )}
    </div>
  )
}

export default ApproverDashboard
