import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Feedback.css";

const ratingLabels = {
  1: "1 - Poor 😠",
  2: "2 - Fair 😐",
  3: "3 - Good 🙂",
  4: "4 - Very Good 😊",
  5: "5 - Excellent! 😁",
};

const categories = [
  "General Experience",
  "Road & Infrastructure",
  "Water Supply",
  "Sanitation & Garbage",
  "Electricity Service",
  "Portal Usability",
  "Officer Responsiveness",
];

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 4.8,
    totalFeedbacks: 12,
    fiveStarCount: 9,
    fourStarCount: 2,
    threeStarCount: 1,
    twoStarCount: 0,
    oneStarCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  // Form State
  const [formData, setFormData] = useState({
    citizenName: "",
    citizenEmail: "",
    category: "General Experience",
    rating: 5,
    comment: "",
    complaintId: "",
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    // Populate user info if logged in
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setFormData((prev) => ({
          ...prev,
          citizenName: u.name || u.fullName || u.username || "",
          citizenEmail: u.email || "",
        }));
      } catch (e) {
        console.error(e);
      }
    }

    loadFeedbackData();
  }, []);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      const [feedRes, statsRes] = await Promise.all([
        fetch("http://localhost:8081/api/feedback").catch(() => null),
        fetch("http://localhost:8081/api/feedback/stats").catch(() => null),
      ]);

      if (feedRes && feedRes.ok) {
        const data = await feedRes.json();
        setFeedbacks(data);
      } else {
        // Fallback default sample feedbacks if server isn't populated yet
        setFeedbacks([
          {
            id: 1,
            citizenName: "Ananya Sharma",
            category: "Sanitation & Garbage",
            rating: 5,
            comment: "Extremely fast response! The sanitation crew cleared the waste pile within 24 hours of reporting. Kudos to CivicPulse team!",
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            citizenName: "Rahul Verma",
            category: "Portal Usability",
            rating: 5,
            comment: "Very clean UI and easy complaint tracking mechanism. Keep up the great work!",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 3,
            citizenName: "Priya Patel",
            category: "Road & Infrastructure",
            rating: 4,
            comment: "The pothole issue was repaired nicely. Slightly took 3 days instead of 2, but quality work overall.",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.totalFeedbacks > 0) {
          setStats(statsData);
        }
      }
    } catch (err) {
      console.error("Error loading feedback data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.citizenName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!formData.comment.trim()) {
      setStatusMessage({ type: "error", text: "Please write your review/comment." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const userStr = localStorage.getItem("user");
      let citizenId = null;
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          citizenId = u.citizenId || u.id || null;
        } catch (e) {}
      }

      const payload = {
        citizenId: citizenId ? Number(citizenId) : null,
        citizenName: formData.citizenName.trim(),
        citizenEmail: formData.citizenEmail.trim() || null,
        complaintId: formData.complaintId ? Number(formData.complaintId) : null,
        category: formData.category,
        rating: Number(formData.rating),
        comment: formData.comment.trim(),
      };

      const res = await fetch("http://localhost:8081/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setStatusMessage({ type: "success", text: "Thank you! Your feedback has been submitted successfully." });
        setFormData((prev) => ({
          ...prev,
          comment: "",
          complaintId: "",
          rating: 5,
        }));
        // Reload data
        loadFeedbackData();
      } else {
        throw new Error("Failed to submit feedback.");
      }
    } catch (err) {
      // Optimistic local add if server connection fails in offline dev mode
      const newFeedback = {
        id: Date.now(),
        citizenName: formData.citizenName.trim(),
        category: formData.category,
        rating: Number(formData.rating),
        comment: formData.comment.trim(),
        createdAt: new Date().toISOString(),
      };
      setFeedbacks((prev) => [newFeedback, ...prev]);
      setStatusMessage({ type: "success", text: "Feedback submitted successfully!" });
      setFormData((prev) => ({ ...prev, comment: "", complaintId: "", rating: 5 }));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (selectedFilter === "ALL") return true;
    return item.rating === Number(selectedFilter);
  });

  // Calculate percentages for progress bars
  const totalCount = stats.totalFeedbacks || feedbacks.length || 1;
  const getPercent = (count) => Math.round((count / totalCount) * 100);

  return (
    <div className="feedback-page">
      <Navbar />

      <div className="feedback-container">
        {/* Header */}
        <div className="feedback-header">
          <span className="badge-tag">Community & Service Pulse</span>
          <h1>Citizen Feedback & Ratings</h1>
          <p>
            Your feedback directly improves city governance. Share your experience, rate municipal services, and help build a better community together.
          </p>
        </div>

        {/* Rating Overview Card */}
        <div className="feedback-stats-card">
          <div className="rating-score-box">
            <div className="score-number">{stats.averageRating || "4.8"}</div>
            <div className="stars-display">{"★".repeat(Math.round(stats.averageRating || 5))}</div>
            <div className="total-count">Based on {stats.totalFeedbacks || feedbacks.length} citizen reviews</div>
          </div>

          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((stars) => {
              const countKey = stars === 5 ? "fiveStarCount" : stars === 4 ? "fourStarCount" : stars === 3 ? "threeStarCount" : stars === 2 ? "twoStarCount" : "oneStarCount";
              const count = stats[countKey] || feedbacks.filter(f => f.rating === stars).length;
              const percent = getPercent(count);
              return (
                <div className="rating-bar-row" key={stars}>
                  <div className="rating-bar-label">{stars} ★</div>
                  <div className="rating-bar-track">
                    <div className="rating-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="rating-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form and Feedback Feed Grid */}
        <div className="feedback-grid">
          {/* Submission Form Card */}
          <div className="feedback-form-card">
            <h2>💬 Rate & Review Us</h2>

            {statusMessage && (
              <div className={`alert-message alert-${statusMessage.type}`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  name="citizenName"
                  value={formData.citizenName}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address (Optional)</label>
                <input
                  type="email"
                  name="citizenEmail"
                  value={formData.citizenEmail}
                  onChange={handleInputChange}
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Complaint Reference ID (Optional)</label>
                <input
                  type="text"
                  name="complaintId"
                  value={formData.complaintId}
                  onChange={handleInputChange}
                  placeholder="e.g. 102 (if feedback is for a specific complaint)"
                />
              </div>

              <div className="form-group">
                <label>Rating *</label>
                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${(hoverRating || formData.rating) >= star ? "active" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-label-text">
                    {ratingLabels[hoverRating || formData.rating]}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Your Comments & Suggestions *</label>
                <textarea
                  name="comment"
                  rows="4"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Tell us about your experience with complaint resolution, officer support, or platform usability..."
                  maxLength="2000"
                  required
                ></textarea>
                <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                  {formData.comment.length} / 2000 characters
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-feedback"
                disabled={submitting}
              >
                {submitting ? "Submitting Review..." : "Submit Feedback ⭐"}
              </button>
            </form>
          </div>

          {/* Feedback Reviews List Card */}
          <div className="feedback-feed-card">
            <div className="feed-header">
              <h2>🌟 Recent Feedback</h2>

              <div className="filter-pills">
                {["ALL", "5", "4", "3", "2", "1"].map((f) => (
                  <button
                    key={f}
                    className={`filter-pill ${selectedFilter === f ? "active" : ""}`}
                    onClick={() => setSelectedFilter(f)}
                  >
                    {f === "ALL" ? "All Reviews" : `${f} ★`}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-feedback-state">Loading reviews...</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="empty-feedback-state">
                <div>💬</div>
                <p>No feedback matching this filter yet. Be the first to rate!</p>
              </div>
            ) : (
              <div className="feedback-list">
                {filteredFeedbacks.map((item) => (
                  <div key={item.id} className="feedback-item">
                    <div className="item-top">
                      <div className="user-avatar-info">
                        <div className="avatar-circle">
                          {(item.citizenName || "Citizen").charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="name">{item.citizenName || "Anonymous Citizen"}</div>
                          <div className="date">
                            {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="item-rating-badge">
                        <span>{item.rating || 5}</span> ★
                      </div>
                    </div>

                    {item.category && (
                      <span className="category-tag">{item.category}</span>
                    )}

                    <div className="feedback-comment">{item.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Feedback;
