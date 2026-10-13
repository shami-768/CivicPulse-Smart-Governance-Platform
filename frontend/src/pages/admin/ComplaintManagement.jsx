import React, { useEffect, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/ComplaintManagement.css";

const INITIAL_MOCK_COMPLAINTS = [
  { id: "CMP-1001", title: "Major Transformer Explosion", category: "Fire & Emergency", location: "City Hospital Main Gate", createdAt: "2026-09-01", status: "Pending", priority: "CRITICAL", priorityScore: 95, severity: "CRITICAL", affectedPeople: "100+", safetyRisk: true, isPublicLocation: true, priorityBreakdown: "Category (Fire & Emergency): +30 | Severity (CRITICAL): +30 | People Affected (100+): +20 | Safety Risk (YES): +20 | Location (Public): +10 => Total Score: 110 (CRITICAL)" },
  { id: "CMP-1002", title: "Main Pipeline Burst", category: "Water Supply", location: "Sector 18 Market", createdAt: "2026-09-02", status: "In Progress", priority: "HIGH", priorityScore: 75, severity: "SEVERE", affectedPeople: "21-100", safetyRisk: true, isPublicLocation: true, priorityBreakdown: "Category (Water Supply): +20 | Severity (SEVERE): +20 | People Affected (21-100): +15 | Safety Risk (YES): +20 | Location (Public): +10 => Total Score: 85 (HIGH)" },
  { id: "CMP-1003", title: "Pothole on Main Avenue", category: "Road", location: "Raj Nagar, Ghaziabad", createdAt: "2026-09-03", status: "Pending", priority: "MEDIUM", priorityScore: 45, severity: "MODERATE", affectedPeople: "6-20", safetyRisk: false, isPublicLocation: true, priorityBreakdown: "Category (Road): +10 | Severity (MODERATE): +10 | People Affected (6-20): +10 | Location (Public): +10 => Total Score: 40 (MEDIUM)" },
  { id: "CMP-1004", title: "Street Light Flickering", category: "Street Light", location: "Lane 4, Vaishali", createdAt: "2026-09-04", status: "Resolved", priority: "LOW", priorityScore: 25, severity: "MINOR", affectedPeople: "1-5", safetyRisk: false, isPublicLocation: false, priorityBreakdown: "Category (Street Light): +10 | Severity (MINOR): +5 | People Affected (1-5): +5 | Location (Residential): +5 => Total Score: 25 (LOW)" },
];

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState(INITIAL_MOCK_COMPLAINTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  const fetchComplaints = () => {
    setLoading(true);
    fetch("http://localhost:8081/api/complaints/priority-sorted")
      .then((response) => {
        if (!response.ok) {
          return fetch("http://localhost:8081/api/complaints");
        }
        return response;
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch complaints");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setComplaints(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Complaint API error (using local dataset):", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      const response = await fetch("http://localhost:8081/api/complaints/recalculate-all", {
        method: "POST"
      });
      if (response.ok) {
        const updated = await response.json();
        setComplaints(updated);
      }
    } catch (e) {
      console.error("Recalculation error:", e);
    } finally {
      setRecalculating(false);
    }
  };

  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };

  const filteredComplaints = complaints
    .filter((complaint) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(complaint.id ?? "").toLowerCase().includes(searchText) ||
        String(complaint.title ?? "").toLowerCase().includes(searchText) ||
        String(complaint.category ?? "").toLowerCase().includes(searchText) ||
        String(complaint.location ?? "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        String(complaint.status).toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === "All" ||
        String(complaint.priority || "").toUpperCase() === priorityFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      const pA = priorityOrder[String(a.priority).toUpperCase()] || 4;
      const pB = priorityOrder[String(b.priority).toUpperCase()] || 4;
      if (pA !== pB) return pA - pB;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

  const getPriorityBadge = (priority, score) => {
    const norm = String(priority || "LOW").toUpperCase();
    let badgeStyle = {
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "800",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px"
    };

    switch (norm) {
      case "HIGH":
      case "CRITICAL":
        badgeStyle = { ...badgeStyle, background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
        break;
      case "MEDIUM":
        badgeStyle = { ...badgeStyle, background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d" };
        break;
      case "LOW":
      default:
        badgeStyle = { ...badgeStyle, background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" };
        break;
    }

    return (
      <span style={badgeStyle}>
        ● {norm} {score !== undefined && score !== null ? `(${score} pts)` : ""}
      </span>
    );
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "resolved") return "status resolved";
    if (s === "in_progress" || s === "in progress") return "status progress";
    return "status pending";
  };

  return (
    <div>
      <AdminNavbar />

      <div className="complaint-management">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>Complaint Management & Smart Priority</h1>
            <p>Automated transparent priority classification (CRITICAL → HIGH → MEDIUM → LOW)</p>
          </div>

          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {recalculating ? "⚡ Recalculating..." : "🔄 Recalculate Smart Priorities"}
          </button>
        </div>

        <div className="filters" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="search-box" style={{ flex: "1", minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search by Title, ID, Category, or Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
            >
              <option value="All">All Priorities</option>
              <option value="HIGH">🔴 High (80+)</option>
              <option value="MEDIUM">🟡 Medium (50–79)</option>
              <option value="LOW">🟢 Low (&lt;50)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="complaint-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Priority & Score</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td><strong>#{complaint.id}</strong></td>
                      <td>{getPriorityBadge(complaint.priority, complaint.priorityScore)}</td>
                      <td>{complaint.category}</td>
                      <td>{complaint.location}</td>
                      <td>
                        {complaint.createdAt
                          ? new Date(complaint.createdAt).toLocaleDateString()
                          : "Recent"}
                      </td>
                      <td>
                        <span className={getStatusClass(complaint.status)}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-results">
                      No complaints found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Priority Breakdown Modal */}
      {selectedComplaint && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            maxWidth: "600px",
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>COMPLAINT #{selectedComplaint.id}</span>
                <h2 style={{ margin: "4px 0 0 0", color: "#0f172a", fontSize: "20px" }}>{selectedComplaint.title || selectedComplaint.category}</h2>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div>Priority Level:</div>
              {getPriorityBadge(selectedComplaint.priority, selectedComplaint.priorityScore)}
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 6px 0", color: "#0369a1" }}>⚡ Automated Priority Reason</h4>
              <p style={{ fontSize: "14px", lineHeight: "1.5", color: "#0f172a", fontWeight: "600", margin: 0 }}>
                {selectedComplaint.priorityReason || selectedComplaint.priorityBreakdown || "Priority assigned automatically based on complaint title and description."}
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <h5 style={{ margin: "0 0 6px 0", color: "#475569" }}>Detailed Score Breakdown</h5>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, whiteSpace: "pre-wrap" }}>
                {selectedComplaint.priorityBreakdown || "Title + Description keyword NLP scoring applied."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#475569" }}>
              <div><strong>Category:</strong> {selectedComplaint.category}</div>
              <div><strong>Location:</strong> {selectedComplaint.location}</div>
              <div><strong>Priority Score:</strong> {selectedComplaint.priorityScore ?? 0} pts</div>
              <div><strong>Status:</strong> {selectedComplaint.status}</div>
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;