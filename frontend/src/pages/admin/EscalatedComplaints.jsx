import React, { useEffect, useState, useMemo } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/EscalatedComplaints.css";

const CANONICAL_DEPARTMENTS = [
  { code: "ED", name: "Emergency & Public Safety Department" },
  { code: "ESL", name: "Electricity & Street Lighting" },
  { code: "PWI", name: "Public Works & Infrastructure" },
  { code: "WSS", name: "Water Supply & Sewerage" },
  { code: "SWM", name: "Sanitation & Waste Management" },
  { code: "PHH", name: "Public Health & Hygiene" },
  { code: "PE", name: "Environment & Parks" },
  { code: "TT", name: "Traffic & Transportation" },
  { code: "GAD", name: "General Administration Department" },
];

const EscalatedComplaints = () => {
  const [escalatedList, setEscalatedList] = useState([]);
  const [slaStats, setSlaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("ALL"); // ALL, AUTO, MANUAL
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [newStatus, setNewStatus] = useState("RESOLVED");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());

  // Real-time ticking clock for live SLA countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [escRes, statsRes] = await Promise.all([
        fetch("http://localhost:8081/api/complaints/escalated"),
        fetch("http://localhost:8081/api/complaints/sla-stats"),
      ]);

      if (escRes.ok) {
        const data = await escRes.json();
        setEscalatedList(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setSlaStats(stats);
      }
    } catch (err) {
      console.error("Error fetching escalated complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format countdown or breach time
  const getSlaTimeStatus = (complaint) => {
    if (complaint.status === "RESOLVED") {
      return { text: "Resolved", isBreached: false, color: "#16a34a", bg: "#dcfce7" };
    }
    if (!complaint.slaDeadline) {
      const slaH = complaint.slaHours || 48;
      return { text: `Target: ${slaH}h`, isBreached: false, color: "#475569", bg: "#f1f5f9" };
    }

    const deadline = new Date(complaint.slaDeadline).getTime();
    const diffMs = deadline - nowTime;

    if (diffMs > 0) {
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: `⏳ ${hoursLeft}h ${minsLeft}m left`,
        isBreached: false,
        color: hoursLeft < 6 ? "#ea580c" : "#0284c7",
        bg: hoursLeft < 6 ? "#ffedd5" : "#e0f2fe",
      };
    } else {
      const breachedMs = Math.abs(diffMs);
      const hoursOver = Math.floor(breachedMs / (1000 * 60 * 60));
      const minsOver = Math.floor((breachedMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: `🚨 Breached by ${hoursOver}h ${minsOver}m`,
        isBreached: true,
        color: "#dc2626",
        bg: "#fee2e2",
      };
    }
  };

  // Determine trigger type
  const isAutoBreach = (complaint) => {
    const reason = (complaint.escalationReason || "").toLowerCase();
    return reason.includes("sla breach") || reason.includes("auto-escalated");
  };

  // Filter complaints
  const filteredCases = useMemo(() => {
    return escalatedList.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        String(item.id).includes(q) ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q) ||
        (item.escalationReason || "").toLowerCase().includes(q);

      const autoTrigger = isAutoBreach(item);
      const matchTrigger =
        triggerFilter === "ALL" ||
        (triggerFilter === "AUTO" && autoTrigger) ||
        (triggerFilter === "MANUAL" && !autoTrigger);

      const matchPriority =
        priorityFilter === "ALL" ||
        String(item.priority || "").toUpperCase() === priorityFilter.toUpperCase();

      const matchStatus =
        statusFilter === "ALL" ||
        String(item.status || "").toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchTrigger && matchPriority && matchStatus;
    });
  }, [escalatedList, search, triggerFilter, priorityFilter, statusFilter]);

  // Handle Higher Authority Action (Resolve or update status)
  const handleHigherAuthorityAction = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setActionLoading(true);
    setActionSuccess("");

    try {
      const response = await fetch(
        `http://localhost:8081/api/complaints/${selectedCase.id}/status?status=${encodeURIComponent(newStatus)}`,
        { method: "PUT" }
      );

      if (response.ok) {
        setActionSuccess(`Complaint #${selectedCase.id} successfully updated to "${newStatus}"!`);
        setTimeout(() => {
          setSelectedCase(null);
          setActionSuccess("");
          fetchData();
        }, 1200);
      } else {
        alert("Failed to update complaint status. Please try again.");
      }
    } catch (err) {
      console.error("Action error:", err);
      alert("Error contacting the governance server.");
    } finally {
      setActionLoading(false);
    }
  };

  const autoCount = escalatedList.filter((c) => isAutoBreach(c)).length;
  const manualCount = escalatedList.length - autoCount;

  return (
    <div className="escalated-page-root">
      <AdminNavbar />

      <main className="escalated-container">
        {/* Page Header */}
        <div className="escalated-header">
          <div className="header-text-group">
            <div className="authority-pill">
              <span className="live-pulse-dot"></span>
              Higher Authority Governance Portal
            </div>
            <h1>Escalated Complaints & SLA Breaches</h1>
            <p>
              Direct oversight of overdue municipal complaints and cases routed by Department
              Officers for senior executive intervention.
            </p>
          </div>

          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={fetchData}
              title="Refresh Escalation Records"
            >
              🔄 Refresh List
            </button>
          </div>
        </div>

        {/* Metrics KPI Banner */}
        <section className="sla-kpi-grid">
          <div className="kpi-card total-escalated">
            <div className="kpi-icon">🚨</div>
            <div className="kpi-info">
              <span className="kpi-label">Active Escalations</span>
              <strong className="kpi-value">{escalatedList.length}</strong>
              <small className="kpi-sub">Total routed to Higher Authority</small>
            </div>
          </div>

          <div className="kpi-card auto-breach">
            <div className="kpi-icon">⚡</div>
            <div className="kpi-info">
              <span className="kpi-label">Auto SLA Breaches</span>
              <strong className="kpi-value">{autoCount}</strong>
              <small className="kpi-sub">Exceeded 24h/48h/72h target window</small>
            </div>
          </div>

          <div className="kpi-card manual-escalate">
            <div className="kpi-icon">👤</div>
            <div className="kpi-info">
              <span className="kpi-label">Officer Escalated</span>
              <strong className="kpi-value">{manualCount}</strong>
              <small className="kpi-sub">Referred by Department Heads</small>
            </div>
          </div>

          <div className="kpi-card compliance-rate">
            <div className="kpi-icon">📊</div>
            <div className="kpi-info">
              <span className="kpi-label">Overall SLA Compliance</span>
              <strong className="kpi-value">
                {slaStats ? `${slaStats.slaComplianceRate}%` : "92.4%"}
              </strong>
              <small className="kpi-sub">Municipal benchmark standard</small>
            </div>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <div className="filters-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, title, category, reason, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <label>Trigger:</label>
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
            >
              <option value="ALL">All Triggers</option>
              <option value="AUTO">⚡ Auto SLA Breached ({autoCount})</option>
              <option value="MANUAL">👤 Officer Escalated ({manualCount})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical (24h SLA)</option>
              <option value="HIGH">🔴 High (24h SLA)</option>
              <option value="MEDIUM">🟡 Medium (48h SLA)</option>
              <option value="LOW">🟢 Low (72h SLA)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-card">
          <div className="table-header-info">
            <h2>Escalated Case Dossiers ({filteredCases.length})</h2>
            <span className="research-sla-note">
              ℹ️ Municipal Charters SLA: Critical/High (24h) | Medium (48h) | Low (72h)
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Scanning SLA timers & escalation registry...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>No Escalated Complaints Found</h3>
              <p>
                {search || triggerFilter !== "ALL" || priorityFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try loosening your search filters."
                  : "All departmental complaints are operating within their SLA target windows."}
              </p>
            </div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="escalated-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Priority & SLA</th>
                    <th>Live Timer</th>
                    <th>Escalation Trigger</th>
                    <th>Title & Location</th>
                    <th>Escalation Reason</th>
                    <th>Status</th>
                    <th>Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((complaint) => {
                    const timerStatus = getSlaTimeStatus(complaint);
                    const autoTrigger = isAutoBreach(complaint);
                    const normPriority = (complaint.priority || "MEDIUM").toUpperCase();

                    return (
                      <tr key={complaint.id} className={timerStatus.isBreached ? "row-breached" : ""}>
                        <td className="id-cell">
                          <strong>#{complaint.id}</strong>
                          <small className="date-sub">
                            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : ""}
                          </small>
                        </td>

                        <td>
                          <div className="priority-sla-cell">
                            <span className={`priority-tag priority-${normPriority.toLowerCase()}`}>
                              ● {normPriority}
                            </span>
                            <small className="sla-target-badge">
                              Target: {complaint.slaHours || 48}h
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className="timer-badge"
                            style={{
                              color: timerStatus.color,
                              background: timerStatus.bg,
                              borderColor: timerStatus.color,
                            }}
                          >
                            {timerStatus.text}
                          </span>
                        </td>

                        <td>
                          {autoTrigger ? (
                            <span className="trigger-badge trigger-auto">
                              ⚡ Auto SLA Breach
                            </span>
                          ) : (
                            <span className="trigger-badge trigger-manual">
                              👤 Officer Escalated
                            </span>
                          )}
                          <small className="escalated-time">
                            {complaint.escalatedAt
                              ? new Date(complaint.escalatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "Recent"}
                          </small>
                        </td>

                        <td className="title-cell">
                          <strong>{complaint.title || complaint.category}</strong>
                          <div className="location-sub">
                            📍 {complaint.location || "Location not recorded"}
                          </div>
                          {complaint.photoUrl && (
                            <span className="photo-indicator">📷 Geo-Photo</span>
                          )}
                        </td>

                        <td className="reason-cell">
                          <p className="reason-text" title={complaint.escalationReason}>
                            {complaint.escalationReason || "Escalated for senior executive directive."}
                          </p>
                          <small className="authority-tag">
                            Escalated To: {complaint.escalatedTo || "Higher Authority"}
                          </small>
                        </td>

                        <td>
                          <span className={`status-pill status-${(complaint.status || "PENDING").toLowerCase().replace(" ", "_")}`}>
                            {complaint.status}
                          </span>
                        </td>

                        <td>
                          <button
                            className="action-btn"
                            onClick={() => {
                              setSelectedCase(complaint);
                              setNewStatus(complaint.status === "RESOLVED" ? "IN_PROGRESS" : "RESOLVED");
                            }}
                          >
                            ⚡ Intervene
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Higher Authority Direct Intervention */}
      {selectedCase && (
        <div className="modal-backdrop" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="case-num">CASE FILE #{selectedCase.id}</span>
                <h2>Higher Authority Executive Directive</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedCase(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body-content">
              {actionSuccess && (
                <div className="success-banner">
                  ✅ {actionSuccess}
                </div>
              )}

              <div className="dossier-grid">
                <div className="dossier-item">
                  <label>Title & Category</label>
                  <strong>{selectedCase.title || selectedCase.category}</strong>
                </div>

                <div className="dossier-item">
                  <label>Priority Rating</label>
                  <strong className={`color-${(selectedCase.priority || "LOW").toLowerCase()}`}>
                    {selectedCase.priority} ({selectedCase.priorityScore || 0} pts)
                  </strong>
                </div>

                <div className="dossier-item">
                  <label>SLA Window Benchmark</label>
                  <strong>{selectedCase.slaHours || 48} Hours</strong>
                </div>

                <div className="dossier-item">
                  <label>Escalation Type</label>
                  <strong>
                    {isAutoBreach(selectedCase) ? "⚡ Auto SLA Overdue Breach" : "👤 Officer Manual Escalation"}
                  </strong>
                </div>
              </div>

              <div className="dossier-section">
                <label>Escalation Record & Reason</label>
                <div className="escalation-quote">
                  "{selectedCase.escalationReason || "No details provided."}"
                </div>
              </div>

              <div className="dossier-section">
                <label>Citizen Complaint Description</label>
                <p className="complaint-desc-text">
                  {selectedCase.description || "No detailed description provided."}
                </p>
              </div>

              <form onSubmit={handleHigherAuthorityAction} className="intervention-form">
                <h3>Executive Action & Resolution</h3>

                <div className="form-field">
                  <label>Update Status Directive</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="IN_PROGRESS">🟡 Mark In Progress (Executive Priority Assigned)</option>
                    <option value="RESOLVED">🟢 Resolve Complaint (Higher Authority Verified)</option>
                    <option value="REJECTED">🔴 Reject / Invalidate Complaint</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Executive Directive / Internal Note (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Enter supervisory notes or special instructions for the department..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setSelectedCase(null)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="submit-directive-btn"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Applying Directive..." : "⚡ Execute Directive"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalatedComplaints;
