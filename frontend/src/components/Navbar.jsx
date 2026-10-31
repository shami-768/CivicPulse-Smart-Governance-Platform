import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);

        const citizenId = parsed.citizenId || parsed.id || parsed.userId;
        if (citizenId && (parsed.role === "CITIZEN" || !parsed.role)) {
          fetch(`http://localhost:8081/api/notifications/citizen/${citizenId}/unread-count`)
            .then((r) => r.ok ? r.json() : 0)
            .then((cnt) => setUnreadCount(Number(cnt) || 0))
            .catch(() => {});
        }
      } catch (error) {
        console.error("Error reading user data:", error);
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Civic<span className="logo-accent">Pulse</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">

          {/* Always visible */}
          <Link to="/" className="nav-link">
            Home
          </Link>

          {/* Citizen navigation - only for logged-in citizens */}
          {currentUser && (currentUser.role === "CITIZEN" || !currentUser.role) && (
            <>
              <Link to="/citizen/dashboard" className="nav-link">
                Dashboard
              </Link>

              <Link to="/register-complaint" className="nav-link">
                Complaints
              </Link>

              <Link to="/track-complaint" className="nav-link">
                Track Complaint
              </Link>

              <Link to="/notifications" className="nav-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      lineHeight: "1.3"
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link to="/feedback" className="nav-link">
                Feedback
              </Link>

              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </>
          )}

          {/* Direct portal links for Officers and Admins */}
          {currentUser && (currentUser.role === "DEPARTMENT_OFFICER" || currentUser.role === "DEPARTMENT") && (
            <Link to="/department/dashboard" className="nav-link" style={{ color: "#38bdf8", fontWeight: "700" }}>
              🏛️ Department Dashboard
            </Link>
          )}

          {currentUser && currentUser.role === "ADMIN" && (
            <Link to="/admin/dashboard" className="nav-link" style={{ color: "#38bdf8", fontWeight: "700" }}>
              📊 Admin
            </Link>
          )}

        </div>

        {/* Right-side actions */}
        <div className="navbar-actions">

          {currentUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#38bdf8",
                }}
              >
                👋 {currentUser.name || currentUser.email}
              </span>

              <button
                className="citizen-logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                
                Logout
              </button>

            </div>
          ) : (
            <>
              <Link to="/portal" className="btn btn-outline">
                Login
              </Link>

              <Link to="/register" className="btn btn-filled">
                Register
              </Link>
            </>
          )}

        </div>

      </div>
    </nav>
  );
}

export default Navbar;