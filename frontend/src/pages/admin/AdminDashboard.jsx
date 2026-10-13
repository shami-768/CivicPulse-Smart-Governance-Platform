import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import RegisterOfficerModal from "../../components/RegisterOfficerModal";
import "../../styles/AdminDashboard.css";

const CANONICAL_HIGHLIGHTS_DEFAULT = [
  { departmentCode: "ED", departmentName: "Emergency & Public Safety Department", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "ESL", departmentName: "Electricity & Street Lighting", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "PWI", departmentName: "Public Works & Infrastructure", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "WSS", departmentName: "Water Supply & Sewerage", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "SWM", departmentName: "Sanitation & Waste Management", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "PHH", departmentName: "Public Health & Hygiene", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "PE", departmentName: "Environment & Parks", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "TT", departmentName: "Traffic & Transportation", high: 0, medium: 0, low: 0, total: 0 },
  { departmentCode: "GAD", departmentName: "General Administration Department", high: 0, medium: 0, low: 0, total: 0 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  });
  const [departmentHighlights, setDepartmentHighlights] = useState(CANONICAL_HIGHLIGHTS_DEFAULT);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch("http://localhost:8081/api/reports/summary").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("http://localhost:8081/api/complaints/priority-distribution").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("http://localhost:8081/api/complaints/priority-sorted").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("http://localhost:8081/api/feedback/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([summary, priorityDist, complaints, feedback]) => {
        if (summary) {
          setDashboardData({
            totalComplaints: summary.totalComplaints || 0,
            pendingComplaints: summary.pendingComplaints || 0,
            inProgressComplaints: summary.inProgressComplaints || 0,
            resolvedComplaints: summary.resolvedComplaints || 0,
          });
        }

        if (priorityDist && Array.isArray(priorityDist.departments)) {
          const map = {};
          CANONICAL_HIGHLIGHTS_DEFAULT.forEach((d) => { map[d.departmentCode] = { ...d }; });
          priorityDist.departments.forEach((item) => {
            if (item && item.departmentCode) {
              map[item.departmentCode] = {
                departmentCode: item.departmentCode,
                departmentName: item.departmentName || map[item.departmentCode]?.departmentName || item.departmentCode,
                high: item.high || 0,
                medium: item.medium || 0,
                low: item.low || 0,
                total: item.total || 0,
              };
            }
          });
          setDepartmentHighlights(Object.values(map));
        }

        if (Array.isArray(complaints)) {
          setRecentComplaints(complaints.slice(0, 5));
        }

        if (feedback) {
          setFeedbackStats(feedback);
        }
      })
      .catch((err) => {
        console.error("AdminDashboard API loading error:", err);
        setApiError("Unable to fetch backend analytics. Showing default metrics.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "resolved") return "status resolved";
    if (s === "in_progress" || s === "in progress") return "status progress";
    return "status pending";
  };

  const stats = [
    {
      title: "Total Complaints",
      value: dashboardData?.totalComplaints ?? 0,
      description: "All complaints received",
    },
    {
      title: "Pending",
      value: dashboardData?.pendingComplaints ?? 0,
      description: "Waiting for action",
    },
    {
      title: "In Progress",
      value: dashboardData?.inProgressComplaints ?? 0,
      description: "Currently being handled",
    },
    {
      title: "Resolved",
      value: dashboardData?.resolvedComplaints ?? 0,
      description: "Successfully resolved",
    },
    {
      title: "Customer Rating",
      value: feedbackStats?.averageRating ? `${feedbackStats.averageRating} ★` : "N/A",
      description: feedbackStats?.totalFeedbacks ? `From ${feedbackStats.totalFeedbacks} citizen reviews` : "No reviews yet",
    },
  ];

  const getPriorityBadgeStyle = (priority) => {
    switch (String(priority || "LOW").toUpperCase()) {
      case "CRITICAL":
        return { background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "800" };
      case "HIGH":
        return { background: "#ffedd5", color: "#ea580c", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "800" };
      case "MEDIUM":
        return { background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "800" };
      default:
        return { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "800" };
    }
  };

  return (
    <div>
      <AdminNavbar />

      <div className="admin-dashboard">

        {/* Header Banner */}
        <div className="dashboard-header">
          <div>
            <h1>Admin Overview</h1>
            <p>Smart Governance Platform & Municipal Department Operations</p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsOfficerModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                display: "flex",
                alignItems: "center",
              }}
            >
              ➕ Register Department Officer
            </button>
          </div>
        </div>

        <RegisterOfficerModal
          isOpen={isOfficerModalOpen}
          onClose={() => setIsOfficerModalOpen(false)}
        />

        {apiError && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", border: "1px solid #fca5a5", marginBottom: "20px" }}>
            ⚠️ {apiError}
          </div>
        )}

        {/* Overall Stats */}
        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.title}>
              <h3>{stat.title}</h3>

              <div className="stat-value">
                {loading ? "..." : stat.value}
              </div>

              <p>{stat.description}</p>
            </div>
          ))}
        </section>

        {/* Department Wise Summary Banner */}
        <section className="dashboard-section" style={{ borderLeft: "5px solid #0ea5a5" }}>
          <div className="section-header">
            <div>
              <h2>Department-Wise Performance Summary</h2>
              <p>Key operational metrics across canonical municipal departments</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "16px" }}>
            {departmentHighlights.map((dept) => (
              <div key={dept.departmentCode} style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "800", color: "#0369a1", background: "#e0f2fe", padding: "2px 8px", borderRadius: "6px", fontSize: "12px" }}>
                    {dept.departmentCode}
                  </span>
                  <small style={{ color: "#ea580c", fontWeight: "700" }}>Vol: {dept.total || 0}</small>
                </div>
                <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginBottom: "10px" }}>
                  {dept.departmentName}
                </strong>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                  <span>High: <strong style={{ color: "#dc2626" }}>{dept.high || 0}</strong></span>
                  <span>Med: <strong style={{ color: "#d97706" }}>{dept.medium || 0}</strong></span>
                  <span>Low: <strong style={{ color: "#16a34a" }}>{dept.low || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Complaints */}
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Recent Complaints</h2>
              <p>Latest complaints submitted by citizens</p>
            </div>

            <button
              className="view-all-btn"
              onClick={() => navigate("/admin/complaints")}
            >
              View All Complaints
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentComplaints.length > 0 ? (
                  recentComplaints.map((complaint) => (
                    <tr key={complaint.id || complaint.title}>
                      <td>#{complaint.id}</td>
                      <td>
                        <span style={getPriorityBadgeStyle(complaint.priority)}>
                          {complaint.priority || "MEDIUM"}
                        </span>
                      </td>
                      <td>{complaint.category || "General"}</td>
                      <td>{complaint.location || "City Zone"}</td>
                      <td>
                        <span className={getStatusClass(complaint.status)}>
                          {complaint.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      No complaints registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Governance Actions</h2>

          <div className="action-grid">

            <button
              onClick={() => navigate("/admin/departments")}
              style={{ background: "#0ea5a5" }}
            >
              📊 Department Dashboard & Diagrams
            </button>

            <button
              onClick={() => navigate("/admin/complaints")}
            >
              Manage Complaints
            </button>

            <button
              onClick={() => navigate("/admin/status")}
            >
              Update Status
            </button>

            <button
              onClick={() => navigate("/admin/tracking")}
            >
              Track Complaints
            </button>

          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;