import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/TrackComplaint.css";

function TrackComplaint() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setIsLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error("Please login again.");
      }

      const user = JSON.parse(storedUser);

      const citizenId = user.citizenId || user.id;

      if (!citizenId) {
        throw new Error("Citizen ID not found. Please login again.");
      }

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8081/api/complaints/citizen/${citizenId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },
        }
      );

      let data = [];

      try {
        data = await response.json();
      } catch {
        data = [];
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch complaints."
        );
      }

      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch complaints error:", err);

      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the server. Please make sure the Spring Boot backend is running on port 8081."
        );
      } else {
        setError(err.message || "Unable to fetch complaints.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // Status helpers
  // -----------------------------

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toUpperCase();

    if (normalizedStatus === "RESOLVED") {
      return "status-resolved";
    }

    if (
      normalizedStatus === "IN_PROGRESS" ||
      normalizedStatus === "IN PROGRESS"
    ) {
      return "status-progress";
    }

    if (normalizedStatus === "REJECTED") {
      return "status-rejected";
    }

    return "status-pending";
  };

  const formatStatus = (status) => {
    if (!status) {
      return "PENDING";
    }

    return status.replace(/_/g, " ");
  };

  // -----------------------------
  // Unique filter options
  // -----------------------------

  const categories = useMemo(() => {
    return [
      ...new Set(
        complaints
          .map((complaint) => complaint.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [complaints]);

  // -----------------------------
  // Filter + Sort
  // -----------------------------

  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    const search = searchTerm.trim().toLowerCase();

    // Search
    if (search) {
      result = result.filter((complaint) => {
        const id = String(
          complaint.id || complaint.complaintId || ""
        ).toLowerCase();

        const title = String(
          complaint.title || ""
        ).toLowerCase();

        const location = String(
          complaint.location || ""
        ).toLowerCase();

        return (
          id.includes(search) ||
          title.includes(search) ||
          location.includes(search)
        );
      });
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(
        (complaint) =>
          complaint.status?.toUpperCase() === statusFilter
      );
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      result = result.filter(
        (complaint) =>
          complaint.category === categoryFilter
      );
    }

    // Priority filter
    if (priorityFilter !== "ALL") {
      result = result.filter(
        (complaint) =>
          complaint.priority?.toUpperCase() === priorityFilter
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "PRIORITY") {
        const priorityOrder = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        return (
          (priorityOrder[b.priority?.toUpperCase()] || 0) -
          (priorityOrder[a.priority?.toUpperCase()] || 0)
        );
      }

      if (sortBy === "STATUS") {
        const statusOrder = {
          PENDING: 1,
          IN_PROGRESS: 2,
          RESOLVED: 3,
          REJECTED: 4,
        };

        return (
          (statusOrder[
            b.status?.toUpperCase()
          ] || 0) -
          (statusOrder[
            a.status?.toUpperCase()
          ] || 0)
        );
      }

      if (sortBy === "OLDEST") {
        return (
          Number(a.id || a.complaintId || 0) -
          Number(b.id || b.complaintId || 0)
        );
      }

      // Default: newest
      return (
        Number(b.id || b.complaintId || 0) -
        Number(a.id || a.complaintId || 0)
      );
    });

    return result;
  }, [
    complaints,
    searchTerm,
    statusFilter,
    categoryFilter,
    priorityFilter,
    sortBy,
  ]);

  // -----------------------------
  // Clear filters
  // -----------------------------

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPriorityFilter("ALL");
    setSortBy("NEWEST");
  };

  const filtersActive =
    searchTerm ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    sortBy !== "NEWEST";

  return (
    <div className="track-complaint-page">
      <Navbar />

      <main className="track-complaint-container">

        {/* Header */}
        <section className="track-header">
          <span className="track-badge">
            🔎 Citizen Portal
          </span>

          <h1>Track Your Complaint</h1>

          <p>
            View your submitted complaints and check their
            current status.
          </p>
        </section>

        {/* Back Button */}
        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/citizen/dashboard")}
        >
          ← Back to Dashboard
        </button>

        {/* Loading */}
        {isLoading && (
          <div className="track-message">
            <div className="loading-spinner"></div>
            <p>Loading your complaints...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="track-error-box">
            <p>{error}</p>

            <button
              onClick={fetchComplaints}
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No complaints */}
        {!isLoading &&
          !error &&
          complaints.length === 0 && (
            <div className="no-complaints-card">
              <div className="no-complaints-icon">
                📋
              </div>

              <h2>No Complaints Found</h2>

              <p>
                You have not registered any complaints yet.
              </p>

              <button
                className="register-now-btn"
                onClick={() =>
                  navigate("/register-complaint")
                }
              >
                Register a Complaint
              </button>
            </div>
          )}

        {/* Complaints */}
        {!isLoading &&
          !error &&
          complaints.length > 0 && (
            <section className="complaints-list">

              {/* Search + Filters */}
              <div className="complaint-filters">

                {/* Search */}
                <div className="search-filter-box">
                  <span className="search-icon">🔎</span>

                  <input
                    type="text"
                    placeholder="Search by ID, title or location..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                  />
                </div>

                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="filter-select"
                >
                  <option value="ALL">
                    All Status
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

                {/* Category */}
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  className="filter-select"
                >
                  <option value="ALL">
                    All Categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                {/* Priority */}
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value)
                  }
                  className="filter-select"
                >
                  <option value="ALL">
                    All Priority
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

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="filter-select"
                >
                  <option value="NEWEST">
                    Newest First
                  </option>
                  <option value="OLDEST">
                    Oldest First
                  </option>
                  <option value="PRIORITY">
                    Highest Priority
                  </option>
                  <option value="STATUS">
                    Status
                  </option>
                </select>

                {/* Clear */}
                {filtersActive && (
                  <button
                    className="clear-filters-btn"
                    onClick={clearFilters}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* List Header */}
              <div className="complaints-list-header">
                <h2>Your Complaints</h2>

                <span>
                  Showing {filteredComplaints.length} of{" "}
                  {complaints.length} Complaint
                  {complaints.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* No filter results */}
              {filteredComplaints.length === 0 && (
                <div className="no-filter-results">
                  <div className="no-complaints-icon">
                    🔍
                  </div>

                  <h2>No Matching Complaints</h2>

                  <p>
                    Try changing your search or filters.
                  </p>

                  <button
                    className="clear-filters-btn"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {/* Complaint Cards */}
              {filteredComplaints.map(
                (complaint, index) => (
                  <div
                    className="complaint-track-card"
                    key={
                      complaint.id ||
                      complaint.complaintId ||
                      index
                    }
                  >

                    {/* Top */}
                    <div className="complaint-card-top">

                      <div>
                        <span className="complaint-id">
                          Complaint #
                          {complaint.id ||
                            complaint.complaintId ||
                            index + 1}
                        </span>

                        <h3>
                          {complaint.title ||
                            "Untitled Complaint"}
                        </h3>
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          complaint.status
                        )}`}
                      >
                        {formatStatus(
                          complaint.status
                        )}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="complaint-description">
                      {complaint.description ||
                        "No description available."}
                    </p>

                    {/* Details */}
                    <div className="complaint-details">

                      <div className="detail-item">
                        <span className="detail-label">
                          Category
                        </span>

                        <span className="detail-value">
                          {complaint.category || "-"}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">
                          Location
                        </span>

                        <span className="detail-value">
                          {complaint.location || "-"}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">
                          Priority
                        </span>

                        <span
                          className={`priority-value priority-${(
                            complaint.priority || "low"
                          ).toLowerCase()}`}
                        >
                          {complaint.priority || "-"}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">
                          Department
                        </span>

                        <span className="detail-value">
                          {complaint.departmentId || "-"}
                        </span>
                      </div>

                    </div>
                  </div>
                )
              )}

            </section>
          )}

      </main>

      <Footer />
    </div>
  );
}

export default TrackComplaint;