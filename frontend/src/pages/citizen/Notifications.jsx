import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  RefreshCw,
  Check,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Notifications.css";

const API_BASE_URL = "http://localhost:8081/api";

function Notifications() {
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const userString = localStorage.getItem("user");

      if (!userString) {
        setError("Please login to view your notifications.");
        setNotifications([]);
        return;
      }

      const user = JSON.parse(userString);

      const citizenId =
        user.citizenId ??
        user.id ??
        user.userId;

      if (!citizenId) {
        setError("Citizen information not found. Please login again.");
        setNotifications([]);
        return;
      }

      // Fetch REAL notifications from backend
      const response = await fetch(
        `${API_BASE_URL}/notifications/citizen/${citizenId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications.");
      }

      const data = await response.json();

      setNotifications(data);
    } catch (err) {
      console.error("Notification error:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Mark one notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read.");
      }

      // Update UI immediately
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const userString = localStorage.getItem("user");

      if (!userString) return;

      const user = JSON.parse(userString);

      const citizenId =
        user.citizenId ??
        user.id ??
        user.userId;

      if (!citizenId) return;

      const response = await fetch(
        `${API_BASE_URL}/notifications/citizen/${citizenId}/read-all`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read.");
      }

      // Update UI immediately
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Being reviewed";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return "";

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications = notifications.filter(
    (notification) => {
      const value = search.toLowerCase().trim();

      if (!value) return true;

      return (
        notification.title
          ?.toLowerCase()
          .includes(value) ||
        notification.message
          ?.toLowerCase()
          .includes(value) ||
        notification.complaintTitle
          ?.toLowerCase()
          .includes(value) ||
        String(notification.complaintId)
          .toLowerCase()
          .includes(value)
      );
    }
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const getIcon = (type) => {
    switch (type) {
      case "resolved":
        return <CheckCircle2 size={22} />;

      case "progress":
      case "status":
        return <Clock3 size={22} />;

      case "warning":
        return <AlertCircle size={22} />;

      case "received":
        return <FileText size={22} />;

      default:
        return <Bell size={22} />;
    }
  };

  return (
    <div className="notifications-page">
      <Navbar />

      <main className="notifications-container">

        {/* Header */}
        <section className="notifications-header">
          <div>
            <p className="notifications-eyebrow">
              CIVICPULSE
            </p>

            <h1>Notifications</h1>

            <p>
              Stay updated with the latest activity on your complaints.
            </p>
          </div>

          <div className="notification-header-icon">
            <Bell size={28} />
          </div>
        </section>

        {/* Search */}
        <section className="notification-search-section">
          <div className="notification-search">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search by complaint name or complaint ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="notifications-list-section">

          <div className="notifications-list-header">
            <div>
              <h2>Recent Notifications</h2>

              <p>
                {filteredNotifications.length} notification
                {filteredNotifications.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="notification-actions">

              {unreadCount > 0 && (
                <button
                  className="notification-mark-all"
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                >
                  <Check size={18} />
                  Mark all as read
                </button>
              )}

              <button
                className="notification-refresh"
                onClick={fetchNotifications}
                title="Refresh notifications"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="notifications-empty">
              <div className="empty-icon">
                <RefreshCw size={28} />
              </div>

              <h3>Loading notifications...</h3>

              <p>
                Fetching your latest complaint activity.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="notifications-empty">
              <div className="empty-icon">
                <AlertCircle size={28} />
              </div>

              <h3>Unable to load notifications</h3>

              <p>{error}</p>

              <button
                className="notification-retry"
                onClick={fetchNotifications}
              >
                Try Again
              </button>
            </div>
          )}

          {/* No notifications */}
          {!loading &&
            !error &&
            filteredNotifications.length === 0 && (
              <div className="notifications-empty">

                <div className="empty-icon">
                  <Bell size={28} />
                </div>

                <h3>
                  {search
                    ? "No notifications found"
                    : "No notifications yet"}
                </h3>

                <p>
                  {search
                    ? "Try searching with a different complaint name or complaint ID."
                    : "Notifications about your complaints will appear here."}
                </p>

              </div>
            )}

          {/* Notification list */}
          {!loading &&
            !error &&
            filteredNotifications.length > 0 && (
              <div className="notifications-list">

                {filteredNotifications.map(
                  (notification) => (
                    <article
                      key={notification.id}
                      className={`notification-card ${
                        notification.read
                          ? "read"
                          : "unread"
                      }`}
                    >

                      <div
                        className={`notification-icon ${notification.type}`}
                      >
                        {getIcon(notification.type)}
                      </div>

                      <div className="notification-content">

                        <div className="notification-top">

                          <h3>
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="unread-dot"></span>
                          )}

                        </div>

                        <p>
                          {notification.message}
                        </p>

                        <div className="notification-meta">

                          <span>
                            <FileText size={15} />

                            Complaint #
                            {notification.complaintId}
                          </span>

                          {notification.status && (
                            <span>
                              <Clock3 size={15} />

                              Status:{" "}
                              {formatStatus(
                                notification.status
                              )}
                            </span>
                          )}

                          {notification.createdAt && (
                            <span>
                              {formatTime(
                                notification.createdAt
                              )}
                            </span>
                          )}

                        </div>

                        {!notification.read && (
                          <button
                            className="notification-read-button"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                          >
                            <Check size={15} />
                            Mark as read
                          </button>
                        )}

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

        </section>

      </main>

      <Footer />
    </div>
  );
}

export default Notifications;