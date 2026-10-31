import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import { getSlaStatus } from "../../utils/slaUtils";
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
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState(INITIAL_MOCK_COMPLAINTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  // Live real-time SLA ticking clock
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Department Officer Manual Escalation State
  const [escalatingComplaint, setEscalatingComplaint] = useState(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateOfficerName, setEscalateOfficerName] = useState("");
  const [escalatingLoading, setEscalatingLoading] = useState(false);
  const [escalateSuccessMsg, setEscalateSuccessMsg] = useState("");
  const [escalateErrorMsg, setEscalateErrorMsg] = useState("");

  const userString = localStorage.getItem("user");
  let loggedInUser = null;
  try {
    if (userString) loggedInUser = JSON.parse(userString);
  } catch (err) {}

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
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/portal");
      return;
    }
    fetchComplaints();
  }, [navigate]);

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

  // Handle Department Officer manual escalation to Higher Authority
  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalatingComplaint) return;

    setEscalatingLoading(true);
    setEscalateErrorMsg("");
    setEscalateSuccessMsg("");

    try {
      const officer =
        escalateOfficerName.trim() ||
        loggedInUser?.name ||
        (loggedInUser?.departmentCode ? `${loggedInUser.departmentCode} Officer` : "Department Officer");

      const reason =
        escalateReason.trim() ||
        "Escalated by Department Officer for higher-level municipal executive intervention.";

      const res = await fetch(
        `http://localhost:8081/api/complaints/${escalatingComplaint.id}/escalate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, officerName: officer }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to submit escalation to server.");
      }

      const updated = await res.json();
      setComplaints((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      if (selectedComplaint && selectedComplaint.id === updated.id) {
        setSelectedComplaint(updated);
      }

      setEscalateSuccessMsg(
        `Complaint #${updated.id} successfully escalated to Higher Municipal Authority!`
      );

      setTimeout(() => {
        setEscalatingComplaint(null);
        setEscalateSuccessMsg("");
      }, 1300);
    } catch (err) {
      console.error("Manual escalation error:", err);
      setEscalateErrorMsg(
        "Unable to escalate complaint. Please verify the backend service is running."
      );
    } finally {
      setEscalatingLoading(false);
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
                  <th>Resolution SLA</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => {
                    const sla = getSlaStatus(complaint, nowTime);
                    const isEscalatedOrBreached = complaint.isEscalated || sla.isBreached;

                    return (
                      <tr key={complaint.id} style={isEscalatedOrBreached ? { background: "#fff5f5" } : {}}>
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
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "800",
                                background: sla.bg,
                                color: sla.color,
                                border: `1px solid ${sla.borderColor}`,
                                width: "fit-content",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {sla.shortText}
                            </span>
                            <small style={{ color: "#64748b", fontSize: "11px", fontWeight: "600" }}>
                              Target: {sla.slaHours}h SLA
                            </small>
                          </div>
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
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            <button
                              className="view-btn"
                              onClick={() => setSelectedComplaint(complaint)}
                            >
                              View Breakdown
                            </button>

                            {/* Officer Manual Escalation Button or Escalated Badge */}
                            {complaint.isEscalated ? (
                              loggedInUser?.role === "ADMIN" ? (
                                <button
                                  style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    border: "1px solid #fca5a5",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    fontWeight: "800",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  onClick={() => navigate("/admin/escalations")}
                                  title="Escalated to Higher Authority. Click to view dossier."
                                >
                                  🚨 Escalated ↗
                                </button>
                              ) : (
                                <span
                                  style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    border: "1px solid #fca5a5",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    fontWeight: "800",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Escalated to Higher Municipal Authority. Status updates reserved for Administrator."
                                >
                                  🚨 Escalated (Admin Review)
                                </span>
                              )
                            ) : (
                              String(complaint.status || "").toUpperCase() !== "RESOLVED" &&
                              String(complaint.status || "").toUpperCase() !== "REJECTED" && (
                                <button
                                  style={{
                                    background: "#fff1f2",
                                    color: "#e11d48",
                                    border: "1px solid #fecdd3",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    fontWeight: "700",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  onClick={() => {
                                    setEscalatingComplaint(complaint);
                                    setEscalateReason("");
                                    setEscalateOfficerName(
                                      loggedInUser?.name ||
                                        (loggedInUser?.departmentCode
                                          ? `${loggedInUser.departmentCode} Officer`
                                          : "")
                                    );
                                  }}
                                  title="Chain / Escalate this complaint to Higher Municipal Authority"
                                >
                                  🔗 Chain to Higher Authority
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="no-results">
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
              {/* Priority Level & SLA Target */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Priority Classification:</span>
                  {getPriorityBadge(selectedComplaint.priority, selectedComplaint.priorityScore)}
                </div>

                <div style={{ background: "#e0f2fe", padding: "6px 12px", borderRadius: "8px", border: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>⏱ Resolution SLA:</span>
                  <strong style={{ color: "#0284c7", fontSize: "13px" }}>
                    {selectedComplaint.slaHours
                      ? `${selectedComplaint.slaHours} Hours Target`
                      : String(selectedComplaint.priority).toUpperCase() === "CRITICAL"
                      ? "12 Hours Target"
                      : String(selectedComplaint.priority).toUpperCase() === "HIGH"
                      ? "24 Hours Target"
                      : String(selectedComplaint.priority).toUpperCase() === "MEDIUM"
                      ? "48 Hours Target"
                      : "72 Hours Target"}
                  </strong>
                </div>
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
              flexWrap: "wrap",
              gap: "10px",
              padding: "14px 24px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Status: <strong style={{ color: "#0f172a" }}>{selectedComplaint.status}</strong>
                </span>
                {selectedComplaint.isEscalated && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#dc2626",
                    background: "#fee2e2",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid #fca5a5"
                  }}>
                    🚨 Routed to Higher Authority
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!selectedComplaint.isEscalated &&
                  String(selectedComplaint.status || "").toUpperCase() !== "RESOLVED" &&
                  String(selectedComplaint.status || "").toUpperCase() !== "REJECTED" && (
                    <button
                      onClick={() => {
                        setEscalatingComplaint(selectedComplaint);
                        setEscalateReason("");
                        setEscalateOfficerName(
                          loggedInUser?.name ||
                            (loggedInUser?.departmentCode
                              ? `${loggedInUser.departmentCode} Officer`
                              : "")
                        );
                      }}
                      style={{
                        background: "#fff1f2",
                        color: "#e11d48",
                        border: "1px solid #fecdd3",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      🔗 Chain to Higher Authority
                    </button>
                  )}

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
        </div>
      )}

      {/* Modal: Department Officer Manual Chain to Higher Authority */}
      {escalatingComplaint && (
        <div
          onClick={() => {
            if (!escalatingLoading) setEscalatingComplaint(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px 14px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #be123c, #9f1239)",
              color: "#ffffff",
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", color: "#fecdd3" }}>
                  DEPARTMENT OFFICER DIRECTIVE
                </span>
                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "700" }}>
                  🚨 Chain to Higher Municipal Authority
                </h3>
              </div>
              <button
                onClick={() => setEscalatingComplaint(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "22px",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleEscalateSubmit} style={{ padding: "20px 24px" }}>
              {escalateSuccessMsg && (
                <div style={{
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  color: "#166534",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "16px"
                }}>
                  ✅ {escalateSuccessMsg}
                </div>
              )}

              {escalateErrorMsg && (
                <div style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#991b1b",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "16px"
                }}>
                  ⚠️ {escalateErrorMsg}
                </div>
              )}

              {/* Case Summary Card */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                  <span>CASE #{escalatingComplaint.id}</span>
                  <strong style={{ color: "#0284c7" }}>{escalatingComplaint.category}</strong>
                </div>
                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "15px", margin: "4px 0" }}>
                  {escalatingComplaint.title || escalatingComplaint.category}
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  📍 {escalatingComplaint.location} | Priority: <strong>{escalatingComplaint.priority}</strong>
                </div>
              </div>

              {/* Officer Name Field */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Officer Name / Department Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma (SWM Officer)"
                  value={escalateOfficerName}
                  onChange={(e) => setEscalateOfficerName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px"
                  }}
                  required
                />
              </div>

              {/* Escalation Reason Field */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Reason for Higher Authority Escalation
                </label>
                <textarea
                  rows="4"
                  placeholder="Describe why higher authority directive or cross-department budget/interventions are required (e.g. Major road structural repair requiring municipal commissioner approval)..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                  required
                ></textarea>
                <small style={{ color: "#64748b", fontSize: "11.5px", display: "block", marginTop: "4px" }}>
                  ℹ️ This case will immediately move to the Higher Authority Escalation Page and citizen will be notified.
                </small>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEscalatingComplaint(null)}
                  disabled={escalatingLoading}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalatingLoading}
                  style={{
                    background: "linear-gradient(135deg, #be123c, #9f1239)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(190, 18, 60, 0.3)"
                  }}
                >
                  {escalatingLoading ? "Routing to Higher Authority..." : "🚨 Confirm Escalation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;