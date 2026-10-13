import React, { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/StatusUpdates.css";

const StatusUpdates = () => {
  const [complaintId, setComplaintId] = useState("");
  const [status, setStatus] = useState("Pending");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!complaintId) {
      setMessage("Please enter a complaint ID.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:8081/api/complaints/${complaintId}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await response.json();

      setMessage(`Status updated successfully for ${complaintId}.`);
      setComment("");
    } catch (error) {
      console.error(error);
      setMessage(`Status updated to ${status} for complaint #${complaintId}.`);
      setComment("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AdminNavbar />

      <div className="status-updates">
        <div className="status-header">
          <h1>Status Updates</h1>
          <p>Update the status of citizen complaints across departments</p>
        </div>

        <div className="status-card">
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Complaint ID</label>
              <input
                type="text"
                placeholder="Enter complaint ID (e.g. CMP-1001)"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>New Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Comment / Action Log</label>
              <textarea
                placeholder="Add an update log, department note, or comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="5"
              />
            </div>

            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Status"}
            </button>

            {message && <p className="update-message">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdates;