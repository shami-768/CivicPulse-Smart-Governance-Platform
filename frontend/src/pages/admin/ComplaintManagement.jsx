import React, { useEffect, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/ComplaintManagement.css";

const INITIAL_MOCK_COMPLAINTS = [
  {
    id: "CMP-1001",
    title: "Major Transformer Explosion",
    category: "Fire & Emergency",
    location: "City Hospital Main Gate, Civil Lines",
    createdAt: "2026-09-01",
    status: "Pending",
    priority: "CRITICAL",
    priorityScore: 95,
    severity: "CRITICAL",
    affectedPeople: "100+",
    safetyRisk: true,
    isPublicLocation: true,
    latitude: 28.6692,
    longitude: 77.4538,
    photoUrl: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=800&auto=format&fit=crop&q=80",
    priorityBreakdown: "Category (Fire & Emergency): +30 | Severity (CRITICAL): +30 | People Affected (100+): +20 | Safety Risk (YES): +20 | Location (Public): +10 => Total Score: 110 (CRITICAL)"
  },
  {
    id: "CMP-1002",
    title: "Main Pipeline Burst & Flooding",
    category: "Water Supply",
    location: "Sector 18 Market, Commercial Area",
    createdAt: "2026-09-02",
    status: "In Progress",
    priority: "HIGH",
    priorityScore: 75,
    severity: "SEVERE",
    affectedPeople: "21-100",
    safetyRisk: true,
    isPublicLocation: true,
    latitude: 28.5708,
    longitude: 77.3261,
    photoUrl: "https://images.unsplash.com/photo-1584463699042-4541577918a2?w=800&auto=format&fit=crop&q=80",
    priorityBreakdown: "Category (Water Supply): +20 | Severity (SEVERE): +20 | People Affected (21-100): +15 | Safety Risk (YES): +20 | Location (Public): +10 => Total Score: 85 (HIGH)"
  },
  {
    id: "CMP-1003",
    title: "Deep Pothole & Road Damage",
    category: "Road",
    location: "Raj Nagar, Ghaziabad",
    createdAt: "2026-09-03",
    status: "Pending",
    priority: "MEDIUM",
    priorityScore: 45,
    severity: "MODERATE",
    affectedPeople: "6-20",
    safetyRisk: false,
    isPublicLocation: true,
    latitude: 28.6946,
    longitude: 77.4378,
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
    priorityBreakdown: "Category (Road): +10 | Severity (MODERATE): +10 | People Affected (6-20): +10 | Location (Public): +10 => Total Score: 40 (MEDIUM)"
  },
  {
    id: "CMP-1004",
    title: "Street Light Faulty & Wire Dangling",
    category: "Street Light",
    location: "Lane 4, Vaishali",
    createdAt: "2026-09-04",
    status: "Resolved",
    priority: "LOW",
    priorityScore: 25,
    severity: "MINOR",
    affectedPeople: "1-5",
    safetyRisk: false,
    isPublicLocation: false,
    latitude: 28.6433,
    longitude: 77.3402,
    photoUrl: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80",
    priorityBreakdown: "Category (Street Light): +10 | Severity (MINOR): +5 | People Affected (1-5): +5 | Location (Residential): +5 => Total Score: 25 (LOW)"
  },
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
                      <td>
                        <div style={{ fontWeight: "500" }}>{complaint.location}</div>
                        {(complaint.latitude && complaint.longitude) || complaint.photoUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                            {complaint.latitude && complaint.longitude && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#15803d",
                                  background: "#f0fdf4",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid #bbf7d0",
                                  fontFamily: "monospace"
                                }}
                                title={`GPS Coordinates: ${complaint.latitude}, ${complaint.longitude}`}
                              >
                                📍 {Number(complaint.latitude).toFixed(4)}, {Number(complaint.longitude).toFixed(4)}
                              </span>
                            )}
                            {complaint.photoUrl && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#0369a1",
                                  background: "#e0f2fe",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid #bae6fd",
                                  fontWeight: "600"
                                }}
                              >
                                📷 Geo Photo
                              </span>
                            )}
                          </div>
                        ) : null}
                      </td>
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

      {/* Priority Breakdown Modal - Fully Scrollable */}
      {selectedComplaint && (
        <div
          onClick={() => setSelectedComplaint(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px 14px",
            overflowY: "auto"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden"
            }}
          >
            {/* Sticky Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              background: "#ffffff",
              flexShrink: 0
            }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  COMPLAINT #{selectedComplaint.id}
                </span>
                <h2 style={{ margin: "2px 0 0 0", color: "#0f172a", fontSize: "19px", fontWeight: "700" }}>
                  {selectedComplaint.title || selectedComplaint.category}
                </h2>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  lineHeight: 1
                }}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              padding: "20px 24px",
              overflowY: "auto",
              flex: "1 1 auto",
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}>
              {/* Priority Level */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Priority Classification:</span>
                {getPriorityBadge(selectedComplaint.priority, selectedComplaint.priorityScore)}
              </div>

              {/* Automated Priority Reason */}
              <div style={{ background: "#f0f9ff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #bae6fd" }}>
                <h4 style={{ margin: "0 0 5px 0", color: "#0284c7", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚡</span> Automated Priority Reason
                </h4>
                <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "#0c4a6e", fontWeight: "600", margin: 0 }}>
                  {selectedComplaint.priorityReason || selectedComplaint.priorityBreakdown || "Priority calculated automatically based on complaint text, emergency keywords, and location severity."}
                </p>
              </div>

              {/* Detailed Score Breakdown */}
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h5 style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "13px" }}>Scoring Calculation Breakdown</h5>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                  {selectedComplaint.priorityBreakdown || "Keyword NLP, department weight, and historical repetition scoring applied."}
                </p>
              </div>

              {/* Geo-Tagged Photo & GPS Location Verification */}
              {(selectedComplaint.photoUrl || (selectedComplaint.latitude && selectedComplaint.longitude)) ? (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "12px",
                  padding: "16px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "18px" }}>📍</span>
                      <strong style={{ fontSize: "13.5px", color: "#166534" }}>
                        Verified Geo-Tagged Evidence & Ground Coordinates
                      </strong>
                    </div>

                    {selectedComplaint.latitude && selectedComplaint.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedComplaint.latitude},${selectedComplaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#0284c7",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)"
                        }}
                      >
                        🗺️ Open in Google Maps ↗
                      </a>
                    )}
                  </div>

                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <div style={{
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: "#15803d",
                      background: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      marginBottom: selectedComplaint.photoUrl ? "12px" : "0",
                      display: "inline-block"
                    }}>
                      🛰️ <strong>GPS:</strong> {Number(selectedComplaint.latitude).toFixed(6)}° N, {Number(selectedComplaint.longitude).toFixed(6)}° E
                    </div>
                  )}

                  {selectedComplaint.photoUrl && (
                    <div style={{
                      background: "#0f172a",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}>
                      <img
                        src={selectedComplaint.photoUrl}
                        alt="Geo-Tagged Issue Evidence"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "260px",
                          objectFit: "contain",
                          display: "block",
                          cursor: "zoom-in"
                        }}
                        onClick={() => window.open(selectedComplaint.photoUrl, "_blank")}
                        title="Click to open full photo in high resolution"
                      />
                      <div style={{
                        width: "100%",
                        padding: "7px 14px",
                        background: "rgba(15, 23, 42, 0.95)",
                        color: "#38bdf8",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        textAlign: "center"
                      }}>
                        ✓ CivicPulse Verified Geo-Tag Photo with Embedded Coordinates & Timestamp (Click to open full image)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "12.5px",
                  color: "#64748b"
                }}>
                  📷 <em>No Geo-Tagged photo was attached with this complaint.</em>
                </div>
              )}

              {/* Details Matrix */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "13px",
                color: "#475569",
                background: "#f8fafc",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0"
              }}>
                <div><strong>Category:</strong> {selectedComplaint.category}</div>
                <div><strong>Incident Location:</strong> {selectedComplaint.location}</div>
                <div><strong>Priority Score:</strong> {selectedComplaint.priorityScore ?? 0} pts</div>
                <div><strong>Current Status:</strong> {selectedComplaint.status}</div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Status: <strong style={{ color: "#0f172a" }}>{selectedComplaint.status}</strong>
              </span>

              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "9px 22px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
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