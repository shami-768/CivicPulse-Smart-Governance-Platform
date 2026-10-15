import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/StatusUpdates.css";

const StatusUpdates = () => {
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewComplaint, setPreviewComplaint] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/portal");
    }
  }, [navigate]);

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

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `http://localhost:8081/api/complaints/${cleanId}/status?status=${encodeURIComponent(status)}`,
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

      const updated = await response.json();
      setPreviewComplaint(updated);
      setIsError(false);
      setMessage(`✅ Status successfully updated to "${formatStatusDisplay(status)}" for Complaint #${cleanId}! All dashboards (Admin, Department, and Citizen) are now synchronized.`);
      setComment("");
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
                <div style={{ fontSize: "12.5px", color: "#475569", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                  <div><strong>Category:</strong> {previewComplaint.category}</div>
                  <div><strong>Location:</strong> {previewComplaint.location}</div>
                  <div><strong>Priority:</strong> {previewComplaint.priority} ({previewComplaint.slaHours || 48}h SLA)</div>
                  <div>
                    <strong>Governance:</strong>{" "}
                    {previewComplaint.isEscalated ? (
                      <span style={{ color: "#b91c1c", fontWeight: "700" }}>🚨 Escalated</span>
                    ) : (
                      <span style={{ color: "#15803d", fontWeight: "600" }}>Standard Department Queue</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>New Status to Apply</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PENDING">Pending (Received, Awaiting Review)</option>
                <option value="IN_PROGRESS">In Progress (Assigned & Field Work Ongoing)</option>
                <option value="RESOLVED">Resolved (Issue Addressed & Closed)</option>
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
              />
            </div>

            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? "Updating Status..." : "Update Status"}
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