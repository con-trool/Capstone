import React, { useState, useEffect } from 'react'

const RequestModal = ({ request, onClose, userRole }) => {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (request) {
      fetchRequestDetails()
    }
  }, [request])

  const fetchRequestDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/request_details.php?request_id=${request.request_id}`)
      const data = await response.json()

      if (data.success) {
        setDetails(data.details)
      } else {
        console.error('Failed to fetch request details:', data.message)
      }
    } catch (error) {
      console.error('Error fetching request details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <h2>Request Details - {request.request_id}</h2>
        </div>

        {loading ? (
          <div className="loading">Loading request details...</div>
        ) : details ? (
          <div className="request-details">
            <div className="info-grid">
              <div className="info-item">
                <strong>Request ID:</strong>
                <span>{details.request_id}</span>
              </div>
              <div className="info-item">
                <strong>Status:</strong>
                <span className={`status-${details.status.toLowerCase()}`}>{details.status}</span>
              </div>
              <div className="info-item">
                <strong>Academic Year:</strong>
                <span>{details.academic_year}</span>
              </div>
              <div className="info-item">
                <strong>Submitted:</strong>
                <span>{new Date(details.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            {details.budget_entries && details.budget_entries.length > 0 && (
              <div className="budget-entries">
                <h3>Budget Entries</h3>
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>GL Code</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.budget_entries.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.gl_code}</td>
                        <td>{entry.budget_description}</td>
                        <td>₱{parseFloat(entry.amount).toLocaleString()}</td>
                        <td>{entry.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {details.description && (
              <div className="description-section">
                <h3>Description</h3>
                <p>{details.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="error">Failed to load request details</div>
        )}
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--card-bg);
          margin: 5% auto;
          padding: 30px;
          width: 90%;
          max-width: 800px;
          max-height: 80%;
          overflow-y: auto;
          border-radius: 10px;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .modal-close {
          position: absolute;
          top: 15px;
          right: 25px;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          color: #666;
          background: none;
          border: none;
        }

        .modal-close:hover {
          color: #000;
        }

        .modal-header {
          border-bottom: 2px solid #015c2e;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          color: #015c2e;
          margin: 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-item {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 5px;
          border-left: 3px solid #015c2e;
        }

        .info-item strong {
          display: block;
          color: #333;
          margin-bottom: 5px;
        }

        .budget-entries {
          margin-bottom: 20px;
        }

        .budget-entries h3 {
          color: #015c2e;
          margin-bottom: 15px;
        }

        .budget-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .budget-table th,
        .budget-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }

        .budget-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #015c2e;
        }

        .description-section h3 {
          color: #015c2e;
          margin-bottom: 10px;
        }

        .description-section p {
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .status-pending {
          color: #fd7e14;
          font-weight: bold;
        }

        .status-approved {
          color: #28a745;
          font-weight: bold;
        }

        .status-rejected {
          color: #dc3545;
          font-weight: bold;
        }

        .status-more_info_requested {
          color: #856404;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default RequestModal
