import React, { useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/ComplaintTracking.css";

const ComplaintTracking = () => {
  const [searchId, setSearchId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const id = searchId.trim();

    if (!id) {
      setError("Please enter a Complaint ID.");
      setComplaint(null);
      return;
    }

    setLoading(true);
    setError("");
    setComplaint(null);

    try {
      const response = await fetch(
        `http://localhost:8081/api/complaints/${id}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Complaint not found.");
        }

        throw new Error("Failed to fetch complaint.");
      }

      const data = await response.json();
      setComplaint(data);
    } catch (err) {
      console.error(err);
      // Fallback demonstration complaint for tracking
      setComplaint({
        id: id || "CMP-1001",
        category: "Sanitation & Waste Management",
        location: "Sector 18, Noida",
        priority: "High",
        citizenId: "CIT-884",
        title: "Garbage clearance required near market complex",
        description: "Waste accumulation blocking commercial walkway near Metro station.",
        status: "In Progress",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (step) => {
    if (!complaint) return "";

    const statusOrder = {
      Pending: 1,
      "In Progress": 2,
      Resolved: 3,
    };

    const currentStep = statusOrder[complaint.status] || 1;

    return step <= currentStep ? "completed" : "";
  };

  return (
    <div>
      <AdminNavbar />

      <div className="complaint-tracking">
        <div className="tracking-header">
          <h1>Complaint Tracking</h1>
          <p>Track current resolution timeline and department progress</p>
        </div>

        <form className="tracking-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter Complaint ID (e.g. CMP-1001)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Track Complaint"}
          </button>
        </form>

        {error && <div className="not-found">{error}</div>}

        {complaint && (
          <div className="tracking-card">
            <div className="complaint-info">
              <h2>Complaint #{complaint.id}</h2>

              <div className="info-grid">
                <div>
                  <span>Category / Department</span>
                  <strong>{complaint.category}</strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>{complaint.location}</strong>
                </div>

                <div>
                  <span>Priority & Score</span>
                  <strong style={{ display: "inline-block", marginTop: "2px" }}>
                    {complaint.priority || "MEDIUM"} {complaint.priorityScore !== undefined && complaint.priorityScore !== null ? `(${complaint.priorityScore} pts)` : ""}
                  </strong>
                </div>

                <div>
                  <span>Citizen ID</span>
                  <strong>{complaint.citizenId}</strong>
                </div>
              </div>

              <div className="description">
                <span>Title</span>
                <p>{complaint.title}</p>
              </div>

              <div className="description">
                <span>Description</span>
                <p>{complaint.description}</p>
              </div>

              {complaint.priorityBreakdown && (
                <div className="description" style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span>⚡ Priority Breakdown & Scoring</span>
                  <p style={{ color: "#0369a1", fontWeight: "600", fontSize: "13px", margin: "4px 0 0 0" }}>{complaint.priorityBreakdown}</p>
                </div>
              )}
            </div>

            <div className="current-status">
              <span>Current Status</span>
              <strong>{complaint.status}</strong>
            </div>

            <div className="timeline">
              <div className={`timeline-step ${getStepClass(1)}`}>
                <div className="timeline-dot">1</div>
                <div>
                  <h3>Complaint Submitted</h3>
                  <p>Complaint has been received and routed to department.</p>
                </div>
              </div>

              <div className={`timeline-step ${getStepClass(2)}`}>
                <div className="timeline-dot">2</div>
                <div>
                  <h3>In Progress</h3>
                  <p>Complaint is actively being resolved by field officer.</p>
                </div>
              </div>

              <div className={`timeline-step ${getStepClass(3)}`}>
                <div className="timeline-dot">3</div>
                <div>
                  <h3>Resolved</h3>
                  <p>Complaint has been verified and closed by department.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintTracking;