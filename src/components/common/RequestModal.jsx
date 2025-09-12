import React, { useEffect, useMemo, useState } from "react";

/** Simple peso helpers */
const peso = (n) =>
  "₱" +
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Academic-year distribution helpers (AY e.g. "2024-2025") */
function ayMonths(academicYear) {
  const [startY, endY] = (academicYear || "").split("-").map((x) => parseInt(x, 10));
  if (!startY || !endY) return [];
  const out = [];
  for (let m = 9; m <= 12; m++) out.push(new Date(startY, m - 1).toLocaleString("default", { month: "long" }) + ` ${startY}`);
  for (let m = 1; m <= 8; m++) out.push(new Date(endY, m - 1).toLocaleString("default", { month: "long" }) + ` ${endY}`);
  return out;
}
function distributionRows(total, duration, academicYear) {
  const months = ayMonths(academicYear);
  if (duration === "Monthly") {
    const each = (Number(total) || 0) / (months.length || 1);
    return months.map((label) => ({ period: label, amount: each }));
  }
  if (duration === "Quarterly") {
    const each = (Number(total) || 0) / 4;
    return [
      { period: `Q1 (${months[0]} - ${months[2]})`, amount: each },
      { period: `Q2 (${months[3]} - ${months[5]})`, amount: each },
      { period: `Q3 (${months[6]} - ${months[8]})`, amount: each },
      { period: `Q4 (${months[9]} - ${months[11]})`, amount: each },
    ];
  }
  return months.length
    ? [{ period: `Annual (${months[0]} - ${months[11]})`, amount: Number(total) || 0 }]
    : [{ period: "Annual", amount: Number(total) || 0 }];
}

function fileIcon(ext) {
  const e = String(ext || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif"].includes(e)) return "🖼️";
  if (e === "pdf") return "📕";
  if (["doc", "docx"].includes(e)) return "📘";
  if (["xls", "xlsx", "csv"].includes(e)) return "📊";
  return "📄";
}

const APPROVER_ROLES = new Set(["approver", "department_head", "dean", "vp_finance"]);

export default function RequestModal({ request, onClose, userRole = "requester" }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [distOpen, setDistOpen] = useState(false);
  const [distItem, setDistItem] = useState(null);
  const [approvedMap, setApprovedMap] = useState({});
  const [preview, setPreview] = useState(null);

  // FETCH
  useEffect(() => {
    if (!request?.request_id) return;
    let active = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const url = `/api/request_details.php?request_id=${encodeURIComponent(request.request_id)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const raw = await res.text();
        let json;
        try { json = JSON.parse(raw); } catch { throw new Error(`Bad JSON (HTTP ${res.status}): ${raw.slice(0,200)}`); }
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        if (!active) return;
        setData(json);
        const seed = {};
        (json.entries || []).forEach((e) => {
          if (e.approved_amount != null && e.approved_amount !== "") seed[e.row_num] = String(e.approved_amount);
        });
        setApprovedMap(seed);
      } catch (e) {
        console.error(e);
        if (active) setErr("An error occurred while loading details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [request?.request_id]);

  const req = data?.request;
  const entries = data?.entries || [];
  const attachments = data?.attachments || [];
  const approvalHistory = data?.approval_history || [];
  const activityHistory = data?.history || [];
  const amendments = data?.amendments || [];

  const hasApprovedAmounts = entries.some((e) => e.approved_amount != null && e.approved_amount !== "" && e.approved_amount !== e.amount);
  const isVPFinalPending =
    userRole === "vp_finance" &&
    String((req?.status || "").toLowerCase()) === "pending" &&
    req?.current_approval_level === req?.total_approval_levels;
  const showApprovedColumn = hasApprovedAmounts || isVPFinalPending;

  const totalApprovedLive = showApprovedColumn
    ? entries.reduce((t, e) => {
        const raw = approvedMap[e.row_num];
        const use = raw === "" || raw == null ? e.amount : parseFloat(raw);
        return t + (Number(use) || 0);
      }, 0)
    : null;

  function onAmountClick(e) {
    setDistItem({
      gl_code: e.gl_code,
      description: e.budget_description,
      amount: e.amount,
      duration: req?.duration || "Annually",
      academic_year: req?.academic_year || "",
    });
    setDistOpen(true);
  }

  async function handleApproval(action) {
    const comments = document.getElementById("modal-approval-comments")?.value || "";
    console.log("handleApproval", action, comments, req.request_id);
    try {
      const fd = new FormData();
      fd.append("request_id", req.request_id);
      fd.append("action", action);
      fd.append("comments", comments);
      if (isVPFinalPending) {
        // Encode approved amounts as bracketed fields for PHP (approved_amounts[row_num])
        Object.entries(approvedMap || {}).forEach(([row, val]) => {
          if (val !== undefined && val !== null) {
            fd.append(`approved_amounts[${row}]`, String(val));
          }
        });
      }
      const res = await fetch("/api/process_approval.php", {
        method: "POST",
        body: fd,
      });
      const raw = await res.text();
      let j;
      try { j = JSON.parse(raw); } catch { throw new Error(`Bad JSON (HTTP ${res.status}): ${raw.slice(0,200)}`); }
      if (res.ok && j.success) {
        alert("Action recorded successfully.");
        onClose?.();
        // Refresh the page to show updated state
        window.location.reload();
      } else {
        alert((j && j.message) || "Failed to process action.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while processing your action.");
    }
  }

  function downloadHref(att) {
    return `download_attachment.php?id=${encodeURIComponent(att.id)}`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : err ? (
          <div className="error">{err}</div>
        ) : !req ? (
          <div className="error">Request not found.</div>
        ) : (
          <div className="modal-content-wrapper">
            {/* ===== Request Overview (new look) ===== */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-icon">🧾</span>
                <h3>Request Overview</h3>
              </div>

              <div className="overview-grid">
                <div className="info-card accent-green">
                  <div className="label">Request ID:</div>
                  <div className="value strong">{req.request_id}</div>
                </div>

                <div className="info-card">
                  <div className="label">Requester:</div>
                  <div className="value">{req.requester_name || "Unknown"}</div>
                </div>

                <div className="info-card">
                  <div className="label">Campus:</div>
                  <div className="value">{req.campus_code} - {req.campus_name}</div>
                </div>

                <div className="info-card">
                  <div className="label">Department:</div>
                  <div className="value">{req.department_code}</div>
                </div>

                <div className="info-card">
                  <div className="label">Fund Account:</div>
                  <div className="value">{req.fund_account || "N/A"}</div>
                </div>

                <div className="info-card">
                  <div className="label">Fund Name:</div>
                  <div className="value">{req.fund_name || "N/A"}</div>
                </div>

                <div className="info-card">
                  <div className="label">Duration:</div>
                  <div className="value"><span className="chip chip-pink">{req.duration || "N/A"}</span></div>
                </div>

                <div className="info-card">
                  <div className="label">Academic Year:</div>
                  <div className="value"><span className="chip chip-indigo">{req.academic_year}</span></div>
                </div>

                <div className="info-card">
                  <div className="label">Total Amount:</div>
                  <div className="value amount">{peso(req.proposed_budget)}</div>
                </div>

                <div className="info-card">
                  <div className="label">Submitted:</div>
                  <div className="value">{new Date(req.timestamp).toLocaleString()}</div>
                </div>

                <div className="info-card">
                  <div className="label">Status:</div>
                  <div className="value">
                    <span className={`status-chip ${String(req.status).toLowerCase()}`}>{req.status}</span>
                  </div>
                </div>

                {req.current_approval_level != null && (
                  <div className="info-card">
                    <div className="label">Approval Progress:</div>
                    <div className="value">
                      Level {req.current_approval_level} of {req.total_approval_levels}
                      {req.workflow_complete && <span className="ok">  •  ✓ Complete</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== Request Details (new look) ===== */}
            {(req.budget_title || req.description) && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">🗂️</span>
                  <h3>Request Details</h3>
                </div>

                {req.budget_title && (
                  <div className="block">
                    <div className="block-label">Budget Request Title:</div>
                    <div className="block-body">{req.budget_title}</div>
                  </div>
                )}

                {req.description && (
                  <div className="block">
                    <div className="block-label">Description:</div>
                    <div className="block-body">{req.description}</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Budget Line Items ===== */}
            {entries.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">📊</span>
                  <h3>Budget Line Items</h3>
                </div>

                <div className="table-wrap">
                  <table className="lines">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>GL Code</th>
                        <th>Description</th>
                        <th>Remarks</th>
                        <th>Proposed Amount</th>
                        {showApprovedColumn && <th className="approved-head">Approved Amount</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => {
                        const extApproved = e.approved_amount != null && e.approved_amount !== "" ? Number(e.approved_amount) : null;
                        const isEdited = extApproved != null && extApproved !== Number(e.amount);
                        return (
                          <tr key={e.row_num}>
                            <td>{e.row_num}</td>
                            <td>{e.gl_code}</td>
                            <td>{e.budget_description}</td>
                            <td>{e.remarks ? e.remarks : <em className="muted">No remarks</em>}</td>
                            <td className="right">
                              <span className="clickable" onClick={() => onAmountClick(e)} title="View distribution">
                                {peso(e.amount)}
                              </span>
                            </td>
                            {showApprovedColumn && (
                              <td className="right">
                                {isVPFinalPending ? (
                                  <>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={approvedMap[e.row_num] ?? ""}
                                      placeholder={(Number(e.amount) || 0).toFixed(2)}
                                      onChange={(ev) => setApprovedMap((m) => ({ ...m, [e.row_num]: ev.target.value }))}
                                      className="approved-input"
                                      title="Leave blank to keep original amount"
                                    />
                                    <div className="hint">Leave blank for original</div>
                                  </>
                                ) : (
                                  <span style={isEdited ? { color: "#28a745", fontWeight: 700 } : undefined}>
                                    {peso(extApproved != null ? extApproved : e.amount)}
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    {showApprovedColumn && (
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="right strong">TOTAL PROPOSED:</td>
                          <td className="right strong">{peso(entries.reduce((s, e) => s + Number(e.amount || 0), 0))}</td>
                          <td className="right strong green">{peso(totalApprovedLive)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* ===== Attachments ===== */}
            {attachments.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">📎</span>
                  <h3>Attachments</h3>
                </div>
                <div className="att-grid">
                  {attachments.map((a) => {
                    const ext = (a.original_filename || "").split(".").pop();
                    const icon = fileIcon(ext);
                    const sizeKB = (Number(a.file_size) || 0) / 1024;
                    const isImage = ["jpg", "jpeg", "png", "gif"].includes(String(ext || "").toLowerCase());
                    return (
                      <div key={a.id} className="att-card">
                        <div className="att-row">
                          <span className="att-icon">{icon}</span>
                          <div className="att-meta">
                            <strong>{a.original_filename}</strong>
                            <br />
                            <small>
                              {sizeKB.toFixed(1)} KB • Uploaded {new Date(a.upload_timestamp).toLocaleString()}
                              {a.uploader_name ? ` by ${a.uploader_name}` : ""}
                            </small>
                          </div>
                        </div>
                        <div className="att-actions">
                          <a href={downloadHref(a)} className="btn dl">📥 Download</a>
                          {isImage && (
                            <button type="button" className="btn prev" onClick={() => setPreview({ src: `uploads/${a.filename}`, title: a.original_filename })}>
                              👁️ Preview
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== Current Assignment ===== */}
            {req && req.status === 'pending' && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">👤</span>
                  <h3>Current Assignment</h3>
                </div>
                <div className="assignment-info">
                  <div className="assignment-card">
                    <div className="assignment-label">Currently Assigned To:</div>
                    <div className="assignment-value">
                      {req.current_approver_name || "Unassigned"}
                      {req.current_approver_role && (
                        <span className="assignment-role">({req.current_approver_role})</span>
                      )}
                    </div>
                    <div className="assignment-level">
                      Level {req.current_approval_level} of {req.total_approval_levels}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Approval Workflow ===== */}
            {approvalHistory.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">📋</span>
                  <h3>Approval Workflow</h3>
                </div>
                <div className="workflow-timeline">
                  {approvalHistory
                    .reduce((unique, ah) => {
                      const existing = unique.find(item => item.approval_level === ah.approval_level);
                      if (!existing) {
                        unique.push(ah);
                      } else if (ah.timestamp && (!existing.timestamp || new Date(ah.timestamp) > new Date(existing.timestamp))) {
                        // Replace with more recent entry if available
                        const index = unique.findIndex(item => item.approval_level === ah.approval_level);
                        unique[index] = ah;
                      }
                      return unique;
                    }, [])
                    .sort((a, b) => (a.approval_level || 0) - (b.approval_level || 0))
                    .map((ah, i, deduplicatedArray) => {
                      const s = String(ah.status || "").toLowerCase();
                      const isCompleted = s === "approved" || s === "rejected";
                      const isCurrent = req && req.current_approval_level == ah.approval_level && s === "pending";
                      const isPending = s === "pending" && !isCurrent;
                      
                      return (
                        <div key={`${ah.approval_level}-${i}`} className={`workflow-step ${isCompleted ? 'completed' : isCurrent ? 'current' : isPending ? 'pending' : 'upcoming'}`}>
                          <div className="step-indicator">
                            <div className="step-circle">
                              {isCompleted ? "✓" : isCurrent ? "●" : isPending ? "⏳" : "○"}
                            </div>
                            {i < deduplicatedArray.length - 1 && <div className="step-line"></div>}
                          </div>
                          <div className="step-content">
                            <div className="step-header">
                              <span className="step-level">Level {ah.approval_level}</span>
                              <span className="step-status">{ah.status || "Pending"}</span>
                            </div>
                            <div className="step-approver">{ah.approver_name || "Unassigned"}</div>
                            {ah.timestamp && isCompleted && (
                              <div className="step-time">{new Date(ah.timestamp).toLocaleString()}</div>
                            )}
                            {ah.comments && isCompleted && (
                              <div className="step-comments">"{ah.comments}"</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ===== Activity History ===== */}
            {activityHistory.length > 0 && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">📝</span>
                  <h3>Activity History</h3>
                </div>
                <div className="activity-timeline">
                  {activityHistory.map((h, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-time">{new Date(h.timestamp).toLocaleString()}</div>
                      <div className="activity-content">
                        <div className="activity-user">{h.approver_name || "System"}</div>
                        <div className="activity-action">{h.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== Approval Actions (pending) ===== */}
            {APPROVER_ROLES.has(userRole) && String((req.status || "").toLowerCase()) === "pending" && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">✅</span>
                  <h3>Approval Actions</h3>
                </div>
                <label htmlFor="modal-approval-comments" className="lbl">Comments (Optional):</label>
                <textarea id="modal-approval-comments" rows={3} className="ta" placeholder="Add any comments about your decision..." />
                <div className="action-buttons">
                  <button className="btn approve" onClick={() => handleApproval("approve")}>✓ Approve Request</button>
                  <button className="btn reject" onClick={() => handleApproval("reject")}>✗ Reject Request</button>
                  <button className="btn info" onClick={() => handleApproval("request_info")}>ℹ Request More Information</button>
                </div>
              </div>
            )}

            {/* ===== VP Finance Amendment area (unchanged logic) ===== */}
            {userRole === "vp_finance" && String((req.status || "").toLowerCase()) === "approved" && (
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-icon">✏️</span>
                  <h3>Amendments</h3>
                </div>

                {Array.isArray(amendments) && amendments.length > 0 && (
                  <div className="amend-list">
                    {amendments.map((am) => {
                      const status = String(am.status || "").toLowerCase();
                      const bg = status === "approved" ? "#d4edda" : status === "rejected" ? "#f8d7da" : "#fff3cd";
                      const baseline = am.calculated_original_budget != null ? am.calculated_original_budget : am.original_total_budget;
                      const change = (Number(am.amended_total_budget) || 0) - (Number(baseline) || 0);
                      return (
                        <div key={am.amendment_number} className="amend-card" style={{ background: bg }}>
                          <div className="amend-head">
                            <div>
                              <strong>Amendment #{am.amendment_number}</strong>
                              <span className={`pill ${status}`}>{status.toUpperCase()}</span>
                            </div>
                            <small>{new Date(am.created_timestamp).toLocaleString()}</small>
                          </div>
                          <div className="amend-title">
                            <strong>{am.amendment_title}</strong>
                            <span className="tt">{String(am.amendment_type || "").replace(/_/g, " ")}</span>
                          </div>
                          {am.amendment_reason && <div className="note">{am.amendment_reason}</div>}
                          {am.amendment_type === "budget_change" && am.original_total_budget != null && am.amended_total_budget != null && (
                            <div className="amend-nums">
                              <div><strong>Original Budget:</strong> {peso(baseline)}</div>
                              <div><strong>Amended Budget:</strong> {peso(am.amended_total_budget)}</div>
                              <div style={{ color: change >= 0 ? "#28a745" : "#dc3545" }}>
                                <strong>Change:</strong> {(change >= 0 ? "+" : "") + peso(Math.abs(change)).slice(1)}
                              </div>
                            </div>
                          )}
                          <div className="amend-foot">
                            Created by: {am.created_by_name}{am.approved_by_name ? ` | Processed by: ${am.approved_by_name}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="amend-cta">
                  <button
                    className="btn big"
                    onClick={() => { window.location.href = `/vp/amend/create?request_id=${encodeURIComponent(req.request_id)}`; }}
                  >
                    🚀 Create Amendment to Approved Request
                  </button>
                  <p className="muted">
                    <strong>Note:</strong> Amendments modify approved requests with full audit trail.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Distribution Modal */}
        {distOpen && distItem && (
          <div className="dist-overlay" onClick={() => setDistOpen(false)}>
            <div className="dist" onClick={(e) => e.stopPropagation()}>
              <button className="close mini" onClick={() => setDistOpen(false)}>×</button>
              <h2>Budget Distribution Details</h2>
              <div className="mb-10">
                <p><strong>Line Item:</strong> {distItem.gl_code}</p>
                <p><strong>Description:</strong> {distItem.description}</p>
                <p><strong>Total Amount:</strong> {peso(distItem.amount)}</p>
                <p><strong>Distribution Chosen:</strong> {distItem.duration}</p>
              </div>
              <table className="lines">
                <thead><tr><th>Period</th><th>Amount</th></tr></thead>
                <tbody>
                  {distributionRows(distItem.amount, distItem.duration, distItem.academic_year).map((row, i) => (
                    <tr key={i}><td>{row.period}</td><td className="right">{peso(row.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {preview && (
          <div className="img-overlay" onClick={() => setPreview(null)}>
            <div className="img-box" onClick={(e) => e.stopPropagation()}>
              <img src={preview.src} alt={preview.title} />
              <div className="img-title">{preview.title}</div>
              <button className="close mini" onClick={() => setPreview(null)}>✕ Close</button>
            </div>
          </div>
        )}

        {/* ====== NEW THEME STYLES ====== */}
        <style jsx>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: flex-start; justify-content: center; z-index: 9999; padding: 20px; }
          .modal { position: relative; background: #fff; border-radius: 12px; padding: 16px 16px 24px; width: min(650px, 75vw); max-width: 75vw; height: calc(100vh - 40px); overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,.25); display: flex; flex-direction: column; box-sizing: border-box; }
          .modal-content-wrapper { flex: 1; overflow-y: auto; overflow-x: hidden; padding-right: 4px; }
          .close { position: absolute; top: 8px; right: 12px; font-size: 22px; border: none; background: none; cursor: pointer; }

          .panel { background: #f7f9fb; border: 1px solid #e6eaee; border-radius: 12px; padding: 14px 16px; margin: 10px 0 14px; box-shadow: 0 1px 0 #eef2f6 inset; display: block; width: 100%; }
          .panel-head { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
          .panel-head h3 { margin:0; font-size:18px; font-weight:800; color:#1f2d3d; }
          .panel-icon { font-size:18px; }

          .overview-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; width: 100%; box-sizing: border-box; }
          @media (max-width: 768px) { .overview-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .overview-grid { grid-template-columns: 1fr; } }

          .info-card { background:#fff; border:1px solid #e6eaee; border-radius:10px; padding:10px 12px; position:relative; box-shadow:0 1px 2px rgba(16,24,40,.04); min-width: 0; word-wrap: break-word; overflow: hidden; display: flex; flex-direction: column; height: 100%; }
          .info-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background:#e6eaee; border-top-left-radius:10px; border-bottom-left-radius:10px; }
          .info-card.accent-green::before { background:#28a745; }
          .label { font-weight:700; color:#32455b; margin-bottom:4px; }
          .value { color:#1f2d3d; overflow: hidden; text-overflow: ellipsis; flex: 1; }
          .value.strong { font-weight:800; letter-spacing:.3px; }
          .value.amount { color:#0f9d58; font-weight:800; font-size:18px; }
          .ok { color:#28a745; font-weight:700; }

          .chip { display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; background:#eef2ff; color:#3730a3; }
          .chip-pink { background:#ffe4f1; color:#a70d5d; }
          .chip-indigo { background:#e7edff; color:#3340a5; }

          .status-chip { padding:4px 8px; border-radius:999px; font-weight:800; background:#eee; display: inline-block; }
          .status-chip.approved { color:#28a745; background:rgba(40,167,69,.12); }
          .status-chip.pending { color:#fd7e14; background:rgba(253,126,20,.12); }
          .status-chip.rejected { color:#dc3545; background:rgba(220,53,69,.12); }
          .status-chip.more_info_requested { color:#856404; background:rgba(133,100,4,.12); }

          .block { background:#fff; border:1px solid #e6eaee; border-radius:10px; padding:12px 14px; margin-bottom:12px; width: 100%; box-sizing: border-box; }
          .block-label { font-weight:800; color:#32455b; margin-bottom:6px; }
          .block-body { color:#1f2d3d; background:#f8fafc; border:1px solid #eef2f6; padding:10px; border-radius:8px; width: 100%; box-sizing: border-box; }

          .table-wrap { overflow-x:auto;}
          table.lines { width:100%; border-collapse:collapse; font-size:14px; background:#fff; border:1px solid #e6eaee; border-radius:10px; overflow:hidden; }
          table.lines thead th { background:#f0f3f8; color:#1f2d3d; text-align:left; padding:10px; border-bottom:1px solid #e6eaee; }
          table.lines td { border-bottom:1px solid #eef2f6; padding:10px; }
          td.right { text-align:right; }
          .approved-head { background:#e8f6ee !important; }
          .clickable { color:#015c2e; text-decoration:underline; cursor:pointer; }
          .clickable:hover { color:#004d26; font-weight:700; }
          .approved-input { width:100%; padding:6px; border:1px solid #dde3ea; border-radius:6px; text-align:right; }
          .hint { color:#6c757d; font-size:11px; }
          .muted { color:#6c757d; }
          tfoot td.strong { font-weight:800; background:#f8fafc; }
          tfoot td.green { color:#28a745; }

          .att-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:12px; }
          .att-card { border:1px solid #e6eaee; border-radius:10px; padding:12px; background:#fff; }
          .att-row { display:flex; gap:10px; align-items:center; margin-bottom:8px; }
          .att-icon { font-size:22px; }
          .att-meta strong { color:#015c2e; }
          .att-actions { display:flex; gap:6px; }
          .btn { padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer; border:none; }
          .btn.dl { background:#0b8043; color:#fff; text-decoration:none; }
          .btn.prev { background:#17a2b8; color:#fff; }

          /* Current Assignment Styles */
          .assignment-info { margin-top: 12px; }
          .assignment-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .assignment-label { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
          .assignment-value { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .assignment-role { font-size: 14px; color: #64748b; font-weight: 500; margin-left: 8px; }
          .assignment-level { font-size: 14px; color: #64748b; }

          /* Workflow Timeline Styles */
          .workflow-timeline { margin-top: 16px; }
          .workflow-step { display: flex; margin-bottom: 20px; position: relative; }
          .step-indicator { display: flex; flex-direction: column; align-items: center; margin-right: 16px; }
          .step-circle { 
            width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 16px; z-index: 2; position: relative;
          }
          .workflow-step.completed .step-circle { background: #10b981; color: white; }
          .workflow-step.current .step-circle { background: #3b82f6; color: white; }
          .workflow-step.pending .step-circle { background: #f59e0b; color: white; }
          .workflow-step.upcoming .step-circle { background: #e5e7eb; color: #6b7280; }
          .step-line { 
            width: 2px; height: 40px; background: #e5e7eb; margin-top: 4px;
          }
          .workflow-step.completed .step-line { background: #10b981; }
          .workflow-step.current .step-line { background: #3b82f6; }
          
          .step-content { flex: 1; }
          .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .step-level { font-weight: 700; color: #1e293b; }
          .step-status { 
            padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;
            background: #f1f5f9; color: #475569;
          }
          .workflow-step.completed .step-status { background: #dcfce7; color: #166534; }
          .workflow-step.current .step-status { background: #dbeafe; color: #1e40af; }
          .workflow-step.pending .step-status { background: #fef3c7; color: #92400e; }
          
          .step-approver { font-weight: 600; color: #374151; margin-bottom: 4px; }
          .step-time { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
          .step-comments { font-size: 14px; color: #4b5563; font-style: italic; background: #f9fafb; padding: 8px; border-radius: 6px; }

          /* Activity Timeline Styles */
          .activity-timeline { margin-top: 16px; }
          .activity-item { 
            display: flex; padding: 12px 0; border-bottom: 1px solid #f1f5f9; 
            align-items: flex-start; gap: 12px;
          }
          .activity-item:last-child { border-bottom: none; }
          .activity-time { 
            font-size: 12px; color: #6b7280; font-weight: 500; 
            min-width: 140px; flex-shrink: 0;
          }
          .activity-content { flex: 1; }
          .activity-user { font-weight: 600; color: #374151; margin-bottom: 2px; }
          .activity-action { color: #4b5563; font-size: 14px; }

          .lbl { display:block; margin:8px 0 6px; font-weight:800; color:#32455b; }
          .ta { width:100%; padding:10px; border:1px solid #dde3ea; border-radius:10px; background:#fff; }
          .action-buttons { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
          .btn.approve { background:#02733e; color:#fff; }
          .btn.reject { background:#c62828; color:#fff; }
          .btn.info { background:#c5a100; color:#fff; }

          .amend-list { max-height:600px; overflow:auto; border:1px solid #e6eaee; border-radius:10px; background:#fff; }
          .amend-card { padding:12px; border-bottom:1px solid #eef2f6; }
          .amend-head { display:flex; justify-content:space-between; }
          .pill { margin-left:10px; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:800; color:#fff; }
          .pill.approved { background:#28a745; }
          .pill.rejected { background:#dc3545; }
          .pill.pending { background:#ffc107; color:#333; }
          .amend-title { margin:8px 0; display:flex; gap:10px; align-items:center; }
          .amend-title .tt { padding:2px 6px; background:#e9edf5; border-radius:4px; font-size:11px; text-transform:capitalize; }
          .note { background:#f8fafc; border:1px solid #eef2f6; padding:10px; border-radius:6px; }
          .amend-nums { display:flex; gap:20px; font-size:14px; margin-top:8px; }
          .amend-cta { margin-top:12px; background:#f8fafc; padding:16px; border-radius:10px; border:2px dashed #015c2e; }
          .btn.big { background: linear-gradient(135deg,#015c2e,#28a745); color:#fff; }

          .dist-overlay, .img-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:10000; }
          .dist, .img-box { background:#fff; padding:20px; border-radius:12px; width:min(680px,92vw); max-height:85vh; overflow:auto; position:relative; box-shadow:0 10px 40px rgba(0,0,0,.35); }
          .close.mini { position:absolute; top:8px; right:10px; background:none; border:none; cursor:pointer; font-size:20px; }
          .img-box { display:flex; flex-direction:column; align-items:center; gap:10px; }
          .img-box img { max-width:90vw; max-height:70vh; border-radius:8px; }
          .img-title { position:absolute; top:-32px; left:0; color:#fff; }
          .loading { padding:40px; text-align:center; }
          .error { background:#ffecec; color:#b00020; border:1px solid #ffbcbc; padding:10px; border-radius:8px; }
        `}</style>
      </div>
    </div>
  );
}
