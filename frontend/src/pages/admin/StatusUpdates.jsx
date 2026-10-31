import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import { getSlaStatus } from "../../utils/slaUtils";
import "../../styles/StatusUpdates.css";

const StatusUpdates = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [complaintId, setComplaintId] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewComplaint, setPreviewComplaint] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shouldEscalate, setShouldEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/portal");
      return;
    }
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch (e) {}
  }, [navigate]);

  // Role & Permission Checks
  const isAdmin = currentUser?.role === "ADMIN";
  const isOfficer = !isAdmin;
  const isCaseResolved = String(previewComplaint?.status || "").toUpperCase() === "RESOLVED";
  const isCaseEscalated = Boolean(previewComplaint?.isEscalated);
  const isOfficerBlockedByEscalation = isOfficer && isCaseEscalated;
  const isStatusChangeLocked = isCaseResolved || isOfficerBlockedByEscalation;

  // Helper to extract numeric ID (e.g., "CMP-1001", "#1001" => "1001")
  const getNumericId = (input) => {
    if (!input) return "";
    return input.replace(/[^0-9]/g, "");
  };

  // Helper to format status for display
  const formatStatusDisplay = (s) => {
    const clean = String(s || "").trim().toUpperCase().replace(/[- ]/g, "_");
    if (clean === "IN_PROGRESS") return "In Progress";
    if (clean === "RESOLVED") return "Resolved";
    if (clean === "REJECTED") return "Rejected";
    return "Pending";
  };

  // Live preview when complaint ID is typed or pasted
  useEffect(() => {
    const cleanId = getNumericId(complaintId);
    if (!cleanId) {
      setPreviewComplaint(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`http://localhost:8081/api/complaints/${cleanId}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewComplaint(data);
          if (data.status) {
            const norm = String(data.status).trim().toUpperCase().replace(/[- ]/g, "_");
            setStatus(norm);
          }
        } else {
          setPreviewComplaint(null);
        }
      } catch (e) {
        setPreviewComplaint(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [complaintId]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const cleanId = getNumericId(complaintId);

    if (!cleanId) {
      setMessage("Please enter a valid complaint ID (e.g. CMP-1001 or 1001).");
      setIsError(true);
      return;
    }

    // Rule 1: Once resolved, cannot be changed
    if (isCaseResolved) {
      setMessage("❌ This complaint has already been resolved and permanently closed. Its status cannot be modified.");
      setIsError(true);
      return;
    }

    // Rule 2: Escalated complaints can only be updated by Admin
    if (isOfficerBlockedByEscalation) {
      setMessage("❌ Access restricted: This complaint is escalated to Higher Municipal Authority. Department officers cannot change its status; only Administrators can review, update, or resolve escalated cases.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const currentRole = isAdmin ? "ADMIN" : "DEPARTMENT_OFFICER";

      const response = await fetch(
        `http://localhost:8081/api/complaints/${cleanId}/status?status=${encodeURIComponent(status)}&updatedBy=${encodeURIComponent(currentRole)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update status on server.");
      }

      let updated = await response.json();

      // If officer selected to chain to higher authority
      if (shouldEscalate && !updated.isEscalated) {
        const officerName = currentUser?.name || (currentUser?.departmentCode ? `${currentUser.departmentCode} Officer` : "Department Officer");

        const escRes = await fetch(`http://localhost:8081/api/complaints/${cleanId}/escalate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: escalateReason.trim() || comment.trim() || "Escalated by Department Officer for higher authority directive.",
            officerName
          }),
        });

        if (escRes.ok) {
          updated = await escRes.json();
        }
      }

      setPreviewComplaint(updated);
      setIsError(false);
      setMessage(`✅ Status successfully updated to "${formatStatusDisplay(status)}" for Complaint #${cleanId}!${shouldEscalate ? " (Also routed to Higher Authority)" : ""} All dashboards and notifications are synchronized.`);
      setComment("");
      setShouldEscalate(false);
      setEscalateReason("");
    } catch (error) {
      console.error("Status update error:", error);
      setIsError(true);
      setMessage(`❌ ${error.message || "Unable to update status. Please verify the backend service is running."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AdminNavbar />

      <div className="status-updates">
        <div className="status-header">
          <h1>Update Complaint Status</h1>
          <p>Instantly update civic issue progress across Department, Admin, and Citizen dashboards</p>
        </div>

        <div className="status-card">
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Complaint ID (e.g. CMP-1001 or 1001)</label>
              <input
                type="text"
                placeholder="Enter complaint ID (e.g. CMP-1001 or 1001)"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
              />
            </div>

            {/* Live Complaint Preview Box */}
            {previewLoading && (
              <div style={{ fontSize: "13px", color: "#64748b", margin: "-10px 0 16px 0" }}>
                🔍 Looking up complaint #{getNumericId(complaintId)}...
              </div>
            )}

            {previewComplaint && !previewLoading && (
              <div style={{
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#0369a1", textTransform: "uppercase" }}>
                      FOUND: COMPLAINT #{previewComplaint.id}
                    </span>
                    <h4 style={{ margin: "2px 0 6px 0", color: "#0f172a", fontSize: "15px" }}>
                      {previewComplaint.title || previewComplaint.category}
                    </h4>
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: "#e0f2fe",
                    color: "#0284c7"
                  }}>
                    Current: {formatStatusDisplay(previewComplaint.status)}
                  </span>
                </div>

                {(() => {
                  const sla = getSlaStatus(previewComplaint, nowTime);
                  return (
                    <div style={{ fontSize: "12.5px", color: "#475569", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                      <div><strong>Category:</strong> {previewComplaint.category}</div>
                      <div><strong>Location:</strong> {previewComplaint.location}</div>
                      <div>
                        <strong>Live SLA:</strong>{" "}
                        <span style={{ color: sla.color, fontWeight: "700" }}>{sla.text}</span> ({sla.slaHours}h Target)
                      </div>
                      <div>
                        <strong>Governance:</strong>{" "}
                        {previewComplaint.isEscalated ? (
                          <span style={{ color: "#b91c1c", fontWeight: "800" }}>🚨 Escalated to Higher Authority</span>
                        ) : (
                          <span style={{ color: "#15803d", fontWeight: "600" }}>Standard Department Queue</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Case Resolved Banner */}
            {isCaseResolved && (
              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#166534"
              }}>
                <span style={{ fontSize: "24px" }}>🔒</span>
                <div>
                  <strong style={{ display: "block", fontSize: "14.5px" }}>Complaint Resolved & Permanently Closed</strong>
                  <span style={{ fontSize: "12.5px", color: "#15803d" }}>
                    Once marked as RESOLVED, civic governance platform policy prevents any further status modifications. This case record is preserved as permanently closed.
                  </span>
                </div>
              </div>
            )}

            {/* Officer Escalation Lock Banner */}
            {isOfficerBlockedByEscalation && (
              <div style={{
                background: "#fff1f2",
                border: "1.5px solid #fecdd3",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#9f1239"
              }}>
                <span style={{ fontSize: "24px" }}>🚨</span>
                <div>
                  <strong style={{ display: "block", fontSize: "14.5px" }}>Status Locked: Escalated to Higher Authority</strong>
                  <span style={{ fontSize: "12.5px", color: "#be123c" }}>
                    This complaint has been escalated to Higher Municipal Authority. Department officers cannot change its status; only Administrators can review, update, or resolve escalated cases.
                  </span>
                </div>
              </div>
            )}

            {/* Admin Authority Escalated Mode Notice */}
            {isAdmin && isCaseEscalated && !isCaseResolved && (
              <div style={{
                background: "#eff6ff",
                border: "1.5px solid #bfdbfe",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#1e40af",
                fontSize: "13px"
              }}>
                <span style={{ fontSize: "18px" }}>👑</span>
                <span>
                  <strong>Admin Authority Mode:</strong> You are updating an escalated case. Applying an update here will automatically notify the citizen and alert the assigned department officer.
                </span>
              </div>
            )}

            {/* Officer Chain to Higher Authority Option */}
            {previewComplaint && !isCaseEscalated && !isCaseResolved && (
              <div style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px"
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "700", color: "#be123c", fontSize: "13.5px" }}>
                  <input
                    type="checkbox"
                    checked={shouldEscalate}
                    onChange={(e) => setShouldEscalate(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#e11d48", cursor: "pointer" }}
                  />
                  <span>🚨 Chain / Escalate this complaint to Higher Municipal Authority</span>
                </label>

                {shouldEscalate && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12.5px", fontWeight: "600", color: "#9f1239", display: "block", marginBottom: "4px" }}>
                      Escalation Reason for Higher Authority:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Major structural issue requires commissioner sanction..."
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fca5a5",
                        fontSize: "13px"
                      }}
                      required={shouldEscalate}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>New Status to Apply</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isStatusChangeLocked}
                style={isStatusChangeLocked ? { background: "#f1f5f9", cursor: "not-allowed", opacity: 0.8 } : {}}
              >
                <option value="PENDING">Pending (Received, Awaiting Review)</option>
                <option value="IN_PROGRESS">In Progress (Assigned & Field Work Ongoing)</option>
                <option value="RESOLVED">Resolved (Issue Addressed & Permanently Closed)</option>
                <option value="REJECTED">Rejected (Duplicate or Invalid)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department Action Log / Comment (Optional)</label>
              <textarea
                placeholder="Add a field officer note, dispatch update, or department remarks..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                disabled={isStatusChangeLocked}
              />
            </div>

            <button
              type="submit"
              className="update-btn"
              disabled={loading || isStatusChangeLocked}
              style={isStatusChangeLocked ? { background: "#94a3b8", cursor: "not-allowed" } : {}}
            >
              {loading
                ? "Updating Status..."
                : isCaseResolved
                ? "🔒 Complaint Resolved (Closed)"
                : isOfficerBlockedByEscalation
                ? "🚨 Locked (Escalated to Admin)"
                : "Update Status"}
            </button>

            {message && (
              <p
                className="update-message"
                style={{
                  color: isError ? "#dc2626" : "#15803d",
                  background: isError ? "#fee2e2" : "#f0fdf4",
                  border: `1px solid ${isError ? "#fca5a5" : "#86efac"}`,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginTop: "16px",
                  fontWeight: "600",
                  fontSize: "13.5px"
                }}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdates;