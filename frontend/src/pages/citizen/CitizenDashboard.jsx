import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/CitizenDashboard.css";

function CitizenDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
  });

  // Geo-tag photo preview modal
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    let citizenId = 5;

    try {
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser) {
        navigate("/login");
        return;
      }
      setUser(parsedUser);
      citizenId = parsedUser.citizenId || parsedUser.id || 5;

      // Fetch dashboard statistics
      fetch(
        `http://localhost:8081/api/citizens/${citizenId}/dashboard`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch dashboard statistics");
          }

          return response.json();
        })
        .then((data) => {
          setStats({
            totalComplaints: data.totalComplaints || 0,
            pendingComplaints: data.pendingComplaints || 0,
            inProgressComplaints: data.inProgressComplaints || 0,
            resolvedComplaints: data.resolvedComplaints || 0,
          });
        })
        .catch((error) => {
          console.error("Dashboard statistics error:", error);
        });

      // Fetch citizen complaints
      fetch(
        `http://localhost:8081/api/citizens/${citizenId}/complaints`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch complaints");
          }

          return response.json();
        })
        .then((data) => {
          setComplaints(data || []);
        })
        .catch((error) => {
          console.error("Complaints API error:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error("Error reading user data:", error);
      setLoading(false);
    }
  }, [navigate]);

  // Unique categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        complaints
          .map((complaint) => complaint.category)
          .filter(Boolean)
      ),
    ];
  }, [complaints]);

  // Canonical status normalizer
  const normalizeStatus = (raw) => {
    if (!raw) return "PENDING";
    const s = String(raw).trim().toUpperCase().replace(/[- ]/g, "_");
    if (s.includes("RESOLV") || s === "CLOSED") return "RESOLVED";
    if (s.includes("PROG") || s.includes("ASSIGN")) return "IN_PROGRESS";
    if (s.includes("REJECT")) return "REJECTED";
    return "PENDING";
  };

  const formatStatusDisplay = (raw) => {
    const norm = normalizeStatus(raw);
    if (norm === "IN_PROGRESS") return "In Progress";
    if (norm === "RESOLVED") return "Resolved";
    if (norm === "REJECTED") return "Rejected";
    return "Pending";
  };

  const getCleanNumericId = (raw) => {
    if (!raw) return "";
    return String(raw).replace(/[^0-9]/g, "");
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cleanDigits = term.replace(/[^0-9]/g, "");

    return complaints.filter((complaint) => {
      const cid = String(complaint.id || "").toLowerCase();
      const formattedCmp = `cmp-${cid}`;

      const matchesSearch =
        !term ||
        cid.includes(term) ||
        formattedCmp.includes(term) ||
        (cleanDigits && cid === cleanDigits) ||
        complaint.title?.toLowerCase().includes(term) ||
        complaint.location?.toLowerCase().includes(term) ||
        complaint.category?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizeStatus(complaint.status) === normalizeStatus(statusFilter);

      const matchesCategory =
        categoryFilter === "ALL" ||
        complaint.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        complaint.priority?.toUpperCase() === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority
      );
    });
  }, [
    complaints,
    search,
    statusFilter,
    categoryFilter,
    priorityFilter,
  ]);

  // Live synchronizing stats: dynamically calculated from complaints
  const displayStats = useMemo(() => {
    if (complaints && complaints.length > 0) {
      const pending = complaints.filter(
        (c) => normalizeStatus(c.status) === "PENDING"
      ).length;
      const inProgress = complaints.filter(
        (c) => normalizeStatus(c.status) === "IN_PROGRESS"
      ).length;
      const resolved = complaints.filter(
        (c) => normalizeStatus(c.status) === "RESOLVED"
      ).length;

      return {
        totalComplaints: complaints.length,
        pendingComplaints: pending,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
      };
    }
    return stats;
  }, [stats, complaints]);

  // Chart calculations
  const statusCounts = {
    PENDING: complaints.filter(
      (c) => normalizeStatus(c.status) === "PENDING"
    ).length,

    IN_PROGRESS: complaints.filter(
      (c) => normalizeStatus(c.status) === "IN_PROGRESS"
    ).length,

    RESOLVED: complaints.filter(
      (c) => normalizeStatus(c.status) === "RESOLVED"
    ).length,

    REJECTED: complaints.filter(
      (c) => normalizeStatus(c.status) === "REJECTED"
    ).length,
  };

  const priorityCounts = {
    HIGH: complaints.filter(
      (c) => c.priority?.toUpperCase() === "HIGH"
    ).length,

    MEDIUM: complaints.filter(
      (c) => c.priority?.toUpperCase() === "MEDIUM"
    ).length,

    LOW: complaints.filter(
      (c) => c.priority?.toUpperCase() === "LOW"
    ).length,
  };

  const categoryCounts = {};

  complaints.forEach((complaint) => {
    const category = complaint.category || "Other";

    categoryCounts[category] =
      (categoryCounts[category] || 0) + 1;
  });

  const getStatusClass = (status) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case "PENDING":
        return "status-pending";

      case "IN_PROGRESS":
        return "status-progress";

      case "RESOLVED":
        return "status-resolved";

      case "REJECTED":
        return "status-rejected";

      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "priority-high";

      case "MEDIUM":
        return "priority-medium";

      case "LOW":
        return "priority-low";

      default:
        return "";
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPriorityFilter("ALL");
  };

  return (
    <div className="citizen-dashboard">
      <Navbar />

      <main className="dashboard-container">

        {/* Header */}
        <section className="dashboard-header">
          <div>
            <h1>
              Welcome,{" "}
              {user?.name ||
                user?.fullName ||
                "Citizen"}{" "}
              👋
            </h1>

            <p>
              Manage your complaints and monitor their
              progress from one place.
            </p>
          </div>

          <button
            className="primary-dashboard-button"
            onClick={() =>
              navigate("/register-complaint")
            }
          >
            + Register Complaint
          </button>
        </section>

        {/* Statistics */}
        <section className="dashboard-cards">

          <div className="dashboard-card">
            <h3>Total Complaints</h3>

            <p className="card-number">
              {stats.totalComplaints}
            </p>

            <span>
              All complaints submitted
            </span>
          </div>

          <div className="dashboard-card">
            <h3>Pending</h3>

            <p className="card-number">
              {stats.pendingComplaints}
            </p>

            <span>
              Awaiting processing
            </span>
          </div>

          <div className="dashboard-card">
            <h3>In Progress</h3>

            <p className="card-number">
              {stats.inProgressComplaints}
            </p>

            <span>
              Currently being processed
            </span>
          </div>

          <div className="dashboard-card">
            <h3>Resolved</h3>

            <p className="card-number">
              {stats.resolvedComplaints}
            </p>

            <span>
              Successfully resolved
            </span>
          </div>

        </section>

        {/* Analytics */}
        <section className="analytics-section">

          <div className="section-title">
            <h2>Complaint Analytics</h2>

            <p>
              Overview of your submitted complaints
            </p>
          </div>

          <div className="analytics-grid">

            {/* Status */}
            <div className="analytics-card">
              <h3>Status Distribution</h3>

              <div className="chart-bars">

                {Object.entries(statusCounts).map(
                  ([status, count]) => (
                    <div
                      className="chart-row"
                      key={status}
                    >
                      <div className="chart-label">
                        <span>
                          {status
                            .replace("_", " ")}
                        </span>

                        <strong>
                          {count}
                        </strong>
                      </div>

                      <div className="bar-background">
                        <div
                          className={`bar-fill ${getStatusClass(
                            status
                          )}`}
                          style={{
                            width:
                              complaints.length > 0
                                ? `${
                                    (count /
                                      complaints.length) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

              </div>
            </div>

            {/* Category */}
            <div className="analytics-card">
              <h3>Complaints by Category</h3>

              <div className="chart-bars">

                {Object.entries(categoryCounts).map(
                  ([category, count]) => (
                    <div
                      className="chart-row"
                      key={category}
                    >
                      <div className="chart-label">
                        <span>{category}</span>

                        <strong>
                          {count}
                        </strong>
                      </div>

                      <div className="bar-background">
                        <div
                          className="bar-fill"
                          style={{
                            width:
                              complaints.length > 0
                                ? `${
                                    (count /
                                      complaints.length) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

              </div>
            </div>

            {/* Priority */}
            <div className="analytics-card">
              <h3>Priority Distribution</h3>

              <div className="priority-summary">

                <div className="priority-item">
                  <span className="priority-dot high" />
                  <span>High</span>
                  <strong>
                    {priorityCounts.HIGH}
                  </strong>
                </div>

                <div className="priority-item">
                  <span className="priority-dot medium" />
                  <span>Medium</span>
                  <strong>
                    {priorityCounts.MEDIUM}
                  </strong>
                </div>

                <div className="priority-item">
                  <span className="priority-dot low" />
                  <span>Low</span>
                  <strong>
                    {priorityCounts.LOW}
                  </strong>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Complaints */}
        <section className="complaints-section">

          <div className="section-title">
            <h2>My Complaints</h2>

            <p>
              Search and filter your submitted complaints
            </p>
          </div>

          {/* Filters */}
          <div className="filters-container">

            <input
              type="text"
              placeholder="Search by title or location..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="RESOLVED">
                Resolved
              </option>

              <option value="REJECTED">
                Rejected
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  value={category}
                  key={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Priorities
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

            <button
              className="reset-filter-button"
              onClick={handleResetFilters}
            >
              Reset
            </button>

          </div>

          {/* Complaint list */}
          {loading ? (
            <div className="empty-state">
              Loading complaints...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="empty-state">
              <h3>No complaints found</h3>

              <p>
                Try changing your filters or search
                criteria.
              </p>
            </div>
          ) : (
            <div className="complaints-list">

              {filteredComplaints.map(
                (complaint) => (
                  <div
                    className="complaint-card"
                    key={complaint.id}
                  >

                    <div className="complaint-main">

                      <div>
                        <h3>
                          {complaint.title}
                        </h3>

                        <p>
                          {complaint.description}
                        </p>
                      </div>

                      <div className="complaint-badges">

                        <span
                          className={`status-badge ${getStatusClass(
                            complaint.status
                          )}`}
                        >
                          {complaint.status?.replace(
                            "_",
                            " "
                          )}
                        </span>

                        <span
                          className={`priority-badge ${getPriorityClass(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority}
                        </span>

                      </div>

                    </div>

                    <div className="complaint-details">

                      <div>
                        <span>Category</span>
                        <strong>
                          {complaint.category}
                        </strong>
                      </div>

                      <div>
                        <span>Location</span>
                        <strong>
                          {complaint.location}
                        </strong>
                      </div>

                      <div>
                        <span>Department</span>
                        <strong>
                          {complaint.departmentId
                            ? `Department ${complaint.departmentId}`
                            : "Not assigned"}
                        </strong>
                      </div>

                      <div>
                        <span>Complaint ID</span>
                        <strong>
                          #{complaint.id}
                        </strong>
                      </div>

                      <div>
                        <span>Resolution SLA</span>
                        <strong style={{ color: "#0284c7" }}>
                          {complaint.slaHours
                            ? `${complaint.slaHours} Hours`
                            : String(complaint.priority).toUpperCase() === "CRITICAL"
                            ? "12 Hours"
                            : String(complaint.priority).toUpperCase() === "HIGH"
                            ? "24 Hours"
                            : String(complaint.priority).toUpperCase() === "MEDIUM"
                            ? "48 Hours"
                            : "72 Hours"}
                        </strong>
                      </div>

                      <div>
                        <span>SLA Status</span>
                        <strong style={{
                          color: String(complaint.status).toUpperCase() === "RESOLVED"
                            ? "#16a34a"
                            : (complaint.isSlaBreached ? "#dc2626" : "#0284c7")
                        }}>
                          {String(complaint.status).toUpperCase() === "RESOLVED"
                            ? "✓ Resolved (Within SLA)"
                            : (complaint.isSlaBreached ? "⚠️ SLA Breached" : "⏱ On Track")}
                        </strong>
                      </div>

                    </div>

                    {/* Geo-Tagged Photo & GPS Location */}
                    {(complaint.photoUrl || (complaint.latitude && complaint.longitude)) && (
                      <div className="dashboard-geotag-row">
                        {complaint.photoUrl && (
                          <div
                            className="dashboard-photo-thumb"
                            onClick={() => setSelectedPhotoModal(complaint)}
                            title="Click to view Geo-Tagged Photo"
                          >
                            <img src={complaint.photoUrl} alt="Complaint evidence" />
                            <span className="photo-thumb-badge">🔍 Geo Photo</span>
                          </div>
                        )}

                        <div className="dashboard-geo-meta">
                          {complaint.latitude && complaint.longitude && (
                            <span className="dashboard-gps-pill">
                              <span className="gps-live-dot"></span>
                              GPS: {Number(complaint.latitude).toFixed(4)}°, {Number(complaint.longitude).toFixed(4)}°
                            </span>
                          )}

                          {complaint.latitude && complaint.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dashboard-map-btn"
                            >
                              🗺️ View on Map ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* Actions */}
        <section className="dashboard-actions">

          <div className="action-card">
            <h2>Need to report another issue?</h2>

            <p>
              Submit a new complaint to the concerned
              department.
            </p>

            <button
              onClick={() =>
                navigate("/register-complaint")
              }
            >
              Register Complaint
            </button>
          </div>

          <div className="action-card">
            <h2>Want to track a complaint?</h2>

            <p>
              View detailed information about your
              complaint and its current status.
            </p>

            <button
              onClick={() =>
                navigate("/track-complaint")
              }
            >
              Track Complaint
            </button>
          </div>

        </section>

      </main>

      {/* Geo-Tag Photo Fullview Modal */}
      {selectedPhotoModal && (
        <div
          className="photo-modal-backdrop"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            className="photo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="photo-modal-header">
              <div>
                <span className="modal-badge">📍 Verified Geo-Tag Photo</span>
                <h3>Complaint #{selectedPhotoModal.id} - {selectedPhotoModal.title}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedPhotoModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="photo-modal-body">
              <img
                src={selectedPhotoModal.photoUrl}
                alt="Enlarged Geo-Tagged Photo"
                className="photo-modal-image"
              />
            </div>

            <div className="photo-modal-footer">
              <div className="photo-meta-details">
                {selectedPhotoModal.latitude && selectedPhotoModal.longitude && (
                  <span>
                    <strong>Coordinates:</strong> {Number(selectedPhotoModal.latitude).toFixed(6)}° N, {Number(selectedPhotoModal.longitude).toFixed(6)}° E
                  </span>
                )}
                <span><strong>Location:</strong> {selectedPhotoModal.location}</span>
              </div>

              {selectedPhotoModal.latitude && selectedPhotoModal.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${selectedPhotoModal.latitude},${selectedPhotoModal.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-map-link-btn"
                >
                  🗺️ Open in Google Maps ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CitizenDashboard;