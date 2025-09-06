import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./common/Header";

/** -------------------- FHIT OPTIONS (same as your PHP) -------------------- */
const glOptions = {
  "FHIT - SALARIES - 1": "210304001", "FHIT - SALARIES - 2": "210304002", "FHIT - SALARIES - 3": "210304003",
  "FHIT - SALARIES - 4": "210304004", "FHIT - SALARIES - 5": "210304005", "FHIT - SALARIES - 6": "210304006",
  "FHIT - SALARIES - 7": "210304007", "FHIT - SALARIES - 8": "210304008", "FHIT - SALARIES - 9": "210304009",
  "FHIT - SALARIES - 10": "210304010",
  "FHIT - HONORARIA - 1": "210305001", "FHIT - HONORARIA - 2": "210305002", "FHIT - HONORARIA - 3": "210305003",
  "FHIT - HONORARIA - 4": "210305004", "FHIT - HONORARIA - 5": "210305005", "FHIT - HONORARIA - 6": "210305006",
  "FHIT - HONORARIA - 7": "210305007", "FHIT - HONORARIA - 8": "210305008", "FHIT - HONORARIA - 9": "210305009",
  "FHIT - HONORARIA - 10": "210305010",
  "FHIT - PROFESSIONAL FEE - 1": "210306001", "FHIT - PROFESSIONAL FEE - 2": "210306002", "FHIT - PROFESSIONAL FEE - 3": "210306003",
  "FHIT - PROFESSIONAL FEE - 4": "210306004", "FHIT - PROFESSIONAL FEE - 5": "210306005", "FHIT - PROFESSIONAL FEE - 6": "210306006",
  "FHIT - PROFESSIONAL FEE - 7": "210306007", "FHIT - PROFESSIONAL FEE - 8": "210306008", "FHIT - PROFESSIONAL FEE - 9": "210306009",
  "FHIT - PROFESSIONAL FEE - 10": "210306010",
  "FHIT - TRANSPORTATION AND DELIVERY EXPENSES": "210303007",
  "FHIT - TRAVEL (LOCAL)": "210303028",
  "FHIT - TRAVEL (FOREIGN)": "210303029",
  "FHIT - ACCOMMODATION AND VENUE": "210303025",
  "FHIT - TRAVEL ALLOWANCE / PER DIEM": "210303003",
  "FHIT - FOOD AND MEALS": "210303026",
  "FHIT - REPRESENTATION EXPENSES": "210303018",
  "FHIT - REPAIRS AND MAINTENANCE OF FACILITIES": "210303005",
  "FHIT - REPAIRS AND MAINTENANCE OF VEHICLES": "210303006",
  "FHIT - SUPPLIES AND MATERIALS EXPENSES": "210303008",
  "FHIT - ADVERTISING EXPENSES": "210303015",
  "FHIT - PRINTING AND BINDING EXPENSES": "210303016",
  "FHIT - GENERAL SERVICES": "210303014",
  "FHIT - COMMUNICATION EXPENSES": "210303004",
  "FHIT - UTILITY EXPENSES": "210303009",
  "FHIT - SCHOLARSHIP EXPENSES": "210303011",
  "FHIT - TRAINING, WORKSHOP, CONFERENCE": "210303010",
  "FHIT - MEMBERSHIP FEE": "210303027",
  "FHIT - INDIRECT COST - RESEARCH FEE": "210303040",
  "FHIT - WITHDRAWAL OF FUND": "210303043",
  "FHIT - AWARDS/REWARDS, PRICES AND INDEMNITIES": "210303012",
  "FHIT - SURVEY, RESEARCH, EXPLORATION AND DEVELOPMENT EXPENSES": "210303013",
  "FHIT - RENT EXPENSES": "210303017",
  "FHIT - SUBSCRIPTION EXPENSES": "210303019",
  "FHIT - DONATIONS": "210303020",
  "FHIT - TAXES, INSURANCE PREMIUMS AND OTHER FEES": "210303022",
  "FHIT - OTHER MAINTENANCE AND OPERATING EXPENSES": "210303023",
  Others: "",
};

/** -------------------- Helpers -------------------- */
const peso = (n) =>
  "₱ " +
  (Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function parsePeso(str) {
  if (!str) return 0;
  const clean = String(str).replace(/[^\d.]/g, "");
  const val = parseFloat(clean);
  return Number.isFinite(val) ? val : 0;
}

function parseSequential(label) {
  // returns { base, n } e.g. "FHIT - SALARIES - 3" -> { base:"FHIT - SALARIES", n:3 }
  const m = label.match(/^(FHIT - [A-Z /,&()'-]+?)(?:\s*-\s*(\d+))?$/i);
  if (!m) return { base: null, n: null };
  const base = m[1].trim();
  const n = m[2] ? parseInt(m[2], 10) : null;
  return { base, n };
}

function academicYearToMonths(academic_year) {
  // "2024-2025" -> Sep 2024 ... Aug 2025 (12 months)
  const [startY, endY] = academic_year.split("-").map((x) => parseInt(x, 10));
  const months = [];
  // Sep(9) - Dec(12) of startY
  for (let m = 9; m <= 12; m++) {
    const d = new Date(startY, m - 1, 1);
    months.push({
      key: `${startY}-${String(m).padStart(2, "0")}`,
      label: `${d.toLocaleString("default", { month: "long" })} ${startY}`,
    });
  }
  // Jan(1) - Aug(8) of endY
  for (let m = 1; m <= 8; m++) {
    const d = new Date(endY, m - 1, 1);
    months.push({
      key: `${endY}-${String(m).padStart(2, "0")}`,
      label: `${d.toLocaleString("default", { month: "long" })} ${endY}`,
    });
  }
  return months;
}

function calcDistribution(totalAmount, duration, academic_year) {
  const months = academicYearToMonths(academic_year);
  if (duration === "Monthly") {
    const each = totalAmount / months.length;
    return months.map((m) => ({ period: m.label, amount: each }));
  }
  if (duration === "Quarterly") {
    const each = totalAmount / 4;
    // 4 quarters of the AY
    return [
      { period: `Q1 (${months[0].label.split(" ")[0]} - ${months[2].label})`, amount: each },
      { period: `Q2 (${months[3].label} - ${months[5].label})`, amount: each },
      { period: `Q3 (${months[6].label} - ${months[8].label})`, amount: each },
      { period: `Q4 (${months[9].label} - ${months[11].label})`, amount: each },
    ];
  }
  return [{ period: `Annual (${months[0].label} - ${months[11].label})`, amount: totalAmount }];
}

/** -------------------- Small UI bits -------------------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
}

function FileChip({ name, size, type, onRemove }) {
  return (
    <div className="file-chip">
      <div>
        <strong>{name}</strong>
        <br />
        <small style={{ color: "#666" }}>
          {(size / 1024).toFixed(1)} KB — {type || "unknown"}
        </small>
      </div>
      <button type="button" className="btn danger xs" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

/** -------------------- Searchable FHIT dropdown -------------------- */
function SearchableGL({
  value,                // current label string (e.g., "FHIT - SALARIES - 1" or "Others" or "")
  setValue,             // (label) => void
  getAvailableLabels,   // () => string[]  (computed in parent with sequential rules)
  placeholder = "Search or choose FHIT Item…",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef(null);

  const all = useMemo(() => getAvailableLabels(), [getAvailableLabels]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((x) => x.toLowerCase().includes(needle));
  }, [all, q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    // keep input display synced when parent value changes
    if (!open) setQ(value || "");
  }, [value, open]);

  return (
    <div className="searchable" ref={boxRef}>
      <input
        className="search-input"
        placeholder={placeholder}
        value={open ? q : value || ""}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          setQ(value || "");
          setOpen(true);
        }}
      />
      {open && (
        <div className="dropdown">
          {filtered.length === 0 ? (
            <div className="dropdown-empty">No matching items</div>
          ) : (
            filtered.map((label) => (
              <div
                key={label}
                className="dropdown-item"
                onClick={() => {
                  setValue(label);
                  setOpen(false);
                }}
              >
                {label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** -------------------- One entry row -------------------- */
function EntryRow({
  entry,
  onChange,
  onRemove,
  usedLabels, // Set of labels used by other rows
}) {
  // Compute available labels with sequential gating.
  const getAvailableLabels = useMemo(() => {
    return () => {
      const labels = Object.keys(glOptions);
      const out = [];
      const localUsed = new Set(usedLabels); // copy
      if (entry.label) localUsed.delete(entry.label); // allow current selection

      const labelUsed = (l) => localUsed.has(l);

      for (const label of labels) {
        if (label === "Others") {
          // "Others" is unlimited
          out.push(label);
          continue;
        }
        const { base, n } = parseSequential(label);
        if (!base) continue;

        if (n == null) {
          // Non-numbered may be used once
          if (!labelUsed(label)) out.push(label);
        } else {
          // Only show -k if -1..-(k-1) already used
          let can = !labelUsed(label);
          for (let i = 1; i < n && can; i++) {
            const prev = `${base} - ${i}`;
            if (!usedLabels.has(prev)) can = false;
          }
          if (can) out.push(label);
        }
      }
      return out;
    };
  }, [usedLabels, entry.label]);

  return (
    <div className="entry-row">
      <SearchableGL
        value={entry.label}
        setValue={(label) =>
          onChange({ ...entry, label, gl_code: label === "Others" ? "" : glOptions[label] })
        }
        getAvailableLabels={getAvailableLabels}
      />

      {entry.label && entry.label !== "Others" && (
        <input className="gl-code" value={entry.gl_code} readOnly placeholder="GL Code" />
      )}

      {entry.label === "Others" && (
        <input
          className="text"
          placeholder="Describe (for Others)"
          value={entry.other_desc || ""}
          onChange={(e) => onChange({ ...entry, other_desc: e.target.value })}
        />
      )}

      <input
        className="text"
        placeholder="Remarks (optional)"
        value={entry.remarks || ""}
        onChange={(e) => onChange({ ...entry, remarks: e.target.value })}
      />

      <input
        className="amount"
        placeholder="₱ 0.00"
        value={entry.amountDisplay ?? (entry.amount ? peso(entry.amount) : "")}
        onChange={(e) => onChange({ ...entry, amountDisplay: e.target.value })}
        onBlur={() => {
          const amt = parsePeso(entry.amountDisplay);
          onChange({ ...entry, amount: amt, amountDisplay: amt ? peso(amt) : "" });
        }}
      />

      <button type="button" className="btn icon danger" onClick={onRemove} aria-label="Remove">
        🗑
      </button>
    </div>
  );
}

/** -------------------- File upload (drag & drop + list) -------------------- */
const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "text/plain",
  "text/csv",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function FileUpload({ files, setFiles }) {
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  function validate(file) {
    if (!allowedTypes.has(file.type)) {
      alert(`File "${file.name}" is not a supported format.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
      return false;
    }
    return true;
  }

  function addFiles(list) {
    const next = [];
    for (const f of list) if (validate(f)) next.push(f);
    if (next.length) setFiles((prev) => [...prev, ...next]);
  }

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const over = (e) => {
      e.preventDefault();
      box.style.borderColor = "#006633";
      box.style.background = "#f0f8f0";
    };
    const leave = (e) => {
      e.preventDefault();
      box.style.borderColor = "#ccc";
      box.style.background = "#f9f9f9";
    };
    const drop = (e) => {
      e.preventDefault();
      leave(e);
      addFiles(e.dataTransfer.files);
    };
    box.addEventListener("dragover", over);
    box.addEventListener("dragleave", leave);
    box.addEventListener("drop", drop);
    return () => {
      box.removeEventListener("dragover", over);
      box.removeEventListener("dragleave", leave);
      box.removeEventListener("drop", drop);
    };
  }, []);

  return (
    <div className="left-panel">
      <h3>📎 Supporting Documents (Optional)</h3>
      <p className="muted">
        Upload receipts, quotes, specifications, or other supporting documents. <br />
        <small>Supported: PDF, DOC/DOCX, XLS/XLSX, JPG/PNG/GIF, TXT, CSV (Max: 10MB per file)</small>
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
        multiple
        style={{ display: "none" }}
        onChange={(e) => addFiles(e.target.files)}
      />

      <div
        ref={boxRef}
        className="drop-area"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <div style={{ fontSize: 24, color: "#999", marginBottom: 10 }}>📁</div>
        <div style={{ fontSize: 16, color: "#666" }}>
          Click to select files or drag and drop here
        </div>
      </div>

      <div className="file-list">
        {files.length > 0 && (
          <>
            <div className="files-count">📎 {files.length} file(s) selected:</div>
            {files.map((f, i) => (
              <FileChip
                key={i}
                name={f.name}
                size={f.size}
                type={f.type}
                onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** -------------------- Main component -------------------- */
export default function CreateRequest({ user, onLogout }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    academic_year: "2024-2025",
    campus: "11",
    department: "999",
    fund_account: "62000701",
    fund_name: "",
    duration: "Annually",
    budget_title: "",
    description: "",
  });

  const [entries, setEntries] = useState([
    // { id, label, gl_code, other_desc, remarks, amount, amountDisplay }
  ]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [distOpen, setDistOpen] = useState(false);
  const [distDetail, setDistDetail] = useState(null);

  // Used labels set for gating (across all rows)
  const usedLabels = useMemo(() => {
    const s = new Set();
    for (const e of entries) if (e.label) s.add(e.label);
    return s;
  }, [entries]);

  const budgetData = useMemo(() => {
    // Build summary data similar to PHP (skip empty or zero)
    const list = [];
    let total = 0;
    for (const e of entries) {
      if (!e.label) continue;
      const amt = Number(e.amount) || 0;
      if (amt <= 0) continue;
      const displayLabel =
        e.label === "Others" ? `Others - ${e.other_desc || ""}` : e.label;
      const gl_code = e.label === "Others" ? "" : glOptions[e.label] || "";
      list.push({
        label: displayLabel,
        gl_code,
        remarks: e.remarks || "",
        amount: amt,
      });
      total += amt;
    }
    return { list, total };
  }, [entries]);

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", gl_code: "", other_desc: "", remarks: "", amount: 0, amountDisplay: "" },
    ]);
  }

  function updateEntry(id, next) {
    setEntries((prev) => prev.map((e) => (e.id === id ? next : e)));
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function showDistribution(item) {
    setDistDetail({
      ...item,
      duration: form.duration,
      academic_year: form.academic_year,
    });
    setDistOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic client validations
    if (!budgetData.list.length) {
      setError("Add at least one budget entry with a positive amount.");
      return;
    }
    for (const eRow of entries) {
      if (!eRow.label) continue;
      if (eRow.label === "Others" && !(eRow.other_desc || "").trim()) {
        setError(`Please describe your "Others" item.`);
        return;
      }
    }

    setLoading(true);
    try {
      // Build FormData (supports files)
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("budget_entries", JSON.stringify(budgetData.list));
      fd.append("file_count", String(files.length));
      files.forEach((f, i) => fd.append(`attachments[${i}]`, f, f.name));

      const res = await fetch("/api/requester/create_request.php", {
        method: "POST",
        body: fd,
        // NOTE: no Content-Type header; browser sets `multipart/form-data` boundary automatically
        // If your backend only accepts JSON, switch to submit_request.php or update the endpoint.
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        alert("Budget request created successfully!");
        navigate("/requester");
      } else {
        setError(data?.message || "Failed to create request.");
      }
    } catch (err) {
      console.error("Create request error:", err);
      setError("An error occurred while creating the request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      <Header user={user} onLogout={onLogout} title="CREATE BUDGET REQUEST" />

      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="top-row">
            <a className="back-btn" onClick={() => navigate("/requester")}>← Back to Dashboard</a>
          </div>

          <h2 style={ {textAlign: "center"}}>Create Budget Request (FHIT)</h2>

          {error && <div className="error">{error}</div>}

          {/* Form section A */}
          <div className="form-section">
            <div className="form-group">
              <label>Academic Year</label>
              <select
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              >
                <option>2024-2025</option>
                <option>2025-2026</option>
                <option>2026-2027</option>
              </select>
            </div>

            <div className="form-group">
              <label>Campus Code</label>
              <select
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                required
              >
                <option value="11">11 - Manila</option>
                <option value="12">12 - Makati</option>
                <option value="13">13 - McKinley</option>
                <option value="21">21 - Laguna</option>
                <option value="31">31 - BGC</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department Code</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fund Account Code</label>
              <input
                value={form.fund_account}
                onChange={(e) => setForm({ ...form, fund_account: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fund Name</label>
              <input
                value={form.fund_name}
                onChange={(e) => setForm({ ...form, fund_name: e.target.value })}
                placeholder="Enter fund name…"
                required
              />
            </div>

            <div className="form-group">
              <label>Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              >
                <option>Annually</option>
                <option>Quarterly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>

          {/* Form section B */}
          <div className="form-section single">
            <div className="form-group full">
              <label>Budget Request Title</label>
              <input
                value={form.budget_title}
                onChange={(e) => setForm({ ...form, budget_title: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Entry Panel */}
          <div className="left-panel">
            <h3>Proposed Itemized Budget</h3>
            {entries.length === 0 && (
              <div className="hint muted">Add entries and choose FHIT items. Sequential items (e.g., “… - 2”) unlock after you’ve used “… - 1”.</div>
            )}
            {entries.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                usedLabels={usedLabels}
                onChange={(next) => updateEntry(e.id, next)}
                onRemove={() => removeEntry(e.id)}
              />
            ))}
            <button type="button" className="btn" onClick={addEntry}>+ Add Entry</button>
          </div>

          {/* File Upload */}
          <FileUpload files={files} setFiles={setFiles} />

          {/* Summary */}
          <div className="budget-summary">
            <h3>Budget Summary</h3>
            <div className="summary-list">
              {budgetData.list.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <span>{item.label}</span>
                  <span
                    className="clickable-amount"
                    onClick={() => showDistribution(item)}
                    title="View distribution"
                  >
                    {peso(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="total">Total: {peso(budgetData.total)}</div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={() => navigate("/requester")}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Creating..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Distribution Modal */}
      <Modal open={distOpen} onClose={() => setDistOpen(false)}>
        {distDetail && (
          <div>
            <h2>Budget Distribution Details</h2>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Line Item:</strong> {distDetail.gl_code}</p>
              <p><strong>Description:</strong> {distDetail.label}</p>
              <p><strong>Total Amount:</strong> {peso(distDetail.amount)}</p>
              <p><strong>Distribution Chosen:</strong> {distDetail.duration}</p>
            </div>
            <table className="distribution-table">
              <thead>
                <tr><th>Period</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {calcDistribution(distDetail.amount, distDetail.duration, distDetail.academic_year)
                  .map((row, i) => (
                    <tr key={i}>
                      <td>{row.period}</td>
                      <td>{peso(row.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Lightweight CSS (plain <style>, not styled-jsx) */}
      <style>{`
        .container { padding: 30px; background: #fff; border-radius: 8px; margin: 20px auto; max-width: 1300px; }
        .top-row { display:flex; justify-content:flex-start; }
        .back-btn { color:#006633; font-weight:600; cursor:pointer; text-decoration:none; }
        h2 { color:#004d26; margin: 10px 0 20px; }
        .error { background:#ffecec; color:#b00020; padding:12px 14px; border:1px solid #ffbcbc; border-radius:8px; margin-bottom:16px; }
        .muted { color:#666; }
        .form-section { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:20px; }
        .form-section.single .form-group.full { grid-column: 1 / -1; }
        .form-group label { font-weight:600; display:block; margin-bottom:6px; }
        .form-group input, .form-group select, .form-group textarea {
          width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;
        }

        .left-panel { width:100%; padding:20px; border:2px solid #ccc; border-radius:10px; margin: 20px 0; }
        .entry-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px; }
        .entry-row .gl-code { width:160px; background:#f0f0f0; border:1px solid #aaa; padding:8px; border-radius:6px; }
        .entry-row .text { width:220px; padding:8px; border-radius:6px; border:1px solid #ccc; }
        .entry-row .amount { width:160px; padding:8px; border-radius:6px; border:1px solid #ccc; }

        .searchable { position:relative; flex:1 1 260px; min-width:260px; }
        .search-input { width:100%; padding:8px; border-radius:6px; border:1px solid #ccc; }
        .dropdown { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ccc; border-top:none; border-radius:0 0 6px 6px; max-height:220px; overflow:auto; z-index:10; }
        .dropdown-item { padding:10px; cursor:pointer; border-bottom:1px solid #f0f0f0; }
        .dropdown-item:hover { background:#f8f9fa; }
        .dropdown-empty { padding:10px; color:#666; font-style:italic; }

        .drop-area { border:2px dashed #ccc; border-radius:8px; padding:30px; text-align:center; cursor:pointer; background:#f9f9f9; transition:all .2s; }
        .file-list { margin-top:14px; }
        .files-count { margin-bottom:8px; font-weight:600; color:#006633; }
        .file-chip { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border:1px solid #ddd; border-radius:5px; margin-bottom:6px; background:#fff; }

        .budget-summary { background:#f0f4f7; border:4px solid #006633; padding:20px 30px; border-radius:20px; }
        .summary-item { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed #e0e0e0; }
        .summary-item:last-child { border-bottom:none; }
        .clickable-amount { color:#006633; text-decoration:underline; cursor:pointer; }
        .clickable-amount:hover { color:#004d26; font-weight:600; }
        .total { font-size:22px; font-weight:700; text-align:right; color:#004d26; margin-top:12px; }

        .form-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:20px; padding-top:16px; border-top:1px solid #e5e5e5; }
        .btn { padding:10px 16px; border-radius:25px; font-weight:700; border:1px solid #006633; background:#fff; cursor:pointer; }
        .btn.primary { background:#006633; color:#fff; border-color:#006633; }
        .btn.secondary { color:#006633; background:#fff; }
        .btn.icon { padding:6px 10px; border-radius:10px; }
        .btn.danger { border-color:#dc3545; color:#dc3545; }
        .btn.danger.xs { padding:5px 10px; border-radius:6px; }
        .btn:disabled { opacity:.7; cursor:not-allowed; }

        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .modal-card { background:#fff; width:min(90vw, 680px); border-radius:10px; padding:24px 24px 20px; position:relative; box-shadow:0 4px 20px rgba(0,0,0,.3); }
        .modal-close { position:absolute; top:6px; right:10px; background:none; border:none; font-size:28px; cursor:pointer; }
        .distribution-table { width:100%; border-collapse:collapse; margin-top:10px; }
        .distribution-table th, .distribution-table td { padding:10px; border:1px solid #ddd; text-align:left; }
        .distribution-table th { background:#f8f9fa; font-weight:700; }
      `}</style>
    </div>
  );
}
