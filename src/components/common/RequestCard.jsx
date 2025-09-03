import React from 'react'
import { Link } from 'react-router-dom'

const RequestCard = ({ request, onClick, onDelete, showDeleteButton = false }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved'
      case 'pending':
        return 'status-pending'
      case 'rejected':
        return 'status-rejected'
      case 'more_info_requested':
        return 'status-more_info_requested'
      default:
        return 'status-pending'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="request-card" onClick={onClick}>
      <div className="request-title">
        BUDGET REQUEST: {request.request_id}
      </div>
      
      <div className="request-detail">
        <i>📅</i> Submitted: {formatDate(request.timestamp)}
      </div>
      
      <div className="request-detail">
        <i>📖</i> Academic Year: {request.academic_year}
      </div>
      
      {request.proposed_budget && (
        <div className="request-detail">
          <i>💰</i> Amount: <span className="amount">{formatCurrency(request.proposed_budget)}</span>
        </div>
      )}
      
      <div className="request-detail">
        <i>⏳</i> Status: 
        <span className={`status-badge ${getStatusClass(request.status)}`}>
          {request.status === 'more_info_requested' ? 'More Information Requested' : request.status}
        </span>
      </div>

      {request.amendment_count > 0 && (
        <div className="amendment-notice">
          <div className="amendment-header">
            <span>✏️ {request.amendment_count} Amendment{request.amendment_count !== 1 ? 's' : ''} Applied</span>
            <span className="amendment-badge">VP FINANCE</span>
          </div>
          <div className="amendment-description">
            Your approved request has been modified. Click to view changes.
          </div>
        </div>
      )}

      {(request.status === 'more_info_requested' || request.status === 'more information requested') && (
        <div className="action-required">
          <span>⚠️ Action Required:</span>
          <Link 
            to={`/edit-request/${request.request_id}`}
            className="edit-btn"
            onClick={(e) => e.stopPropagation()}
          >
            ✏️ Edit Request
          </Link>
        </div>
      )}

      {showDeleteButton && (
        <div className="delete-section">
          <button 
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            delete
          </button>
        </div>
      )}

      <style jsx>{`
        .request-card {
          background: var(--card-bg);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 15px var(--shadow-color);
          position: relative;
          overflow: hidden;
        }

        /* Match original PHP spacing: container edge margin */
        :global(.content-box) .request-card {
          margin-left: 8px;
          margin-right: 8px;
        }

        .request-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #00B04F 0%, #008037 100%);
        }

        .request-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0,176,79,0.15);
          border-color: rgba(0,176,79,0.3);
        }

        .request-title {
          font-weight: 700;
          margin-bottom: 15px;
          font-size: 18px;
          color: var(--green-dark);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .request-detail {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .request-detail i {
          font-style: normal;
          font-size: 18px;
          width: 25px;
          text-align: center;
        }

        .amount {
          font-weight: 700;
          color: var(--green-dark);
          font-size: 16px;
        }

        .status-badge {
          margin-left: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 12px;
        }

        .status-approved { 
          color: #28a745; 
          background: rgba(40,167,69,0.1);
        }
        
        .status-pending { 
          color: #fd7e14; 
          background: rgba(253,126,20,0.1);
        }
        
        .status-rejected { 
          color: #dc3545; 
          background: rgba(220,53,69,0.1);
        }
        
        .status-more_info_requested { 
          color: #856404; 
          background: rgba(133,100,4,0.1);
        }

        .amendment-notice {
          margin-top: 12px;
          padding: 10px;
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
          border: 1px solid #28a745;
          border-radius: 6px;
        }

        .amendment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .amendment-header span:first-child {
          color: #155724;
          font-weight: 600;
          font-size: 14px;
        }

        .amendment-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .amendment-description {
          margin-top: 6px;
          font-size: 12px;
          color: #155724;
        }

        .action-required {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .action-required span:first-child {
          color: #856404;
          font-weight: bold;
          font-size: 14px;
        }

        .edit-btn {
          display: inline-block;
          background-color: #015c2e;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .edit-btn:hover {
          background-color: #004d26;
          transform: translateY(-1px);
        }

        .delete-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #dee2e6;
          text-align: right;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #6c757d;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
          padding: 2px 4px;
          transition: color 0.3s ease;
        }
        
        .delete-btn:hover {
          color: #dc3545;
        }
      `}</style>
    </div>
  )
}

export default RequestCard
