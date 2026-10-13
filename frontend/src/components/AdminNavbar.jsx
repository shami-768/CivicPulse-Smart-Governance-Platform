import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/AdminNavbar.css";

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const userString = localStorage.getItem("user");

  let loggedInUser = null;

  try {
    if (userString) {
      loggedInUser = JSON.parse(userString);
    }
  } catch (error) {
    console.error("Error parsing loggedInUser", error);
  }

  const isDepartmentOfficer =
    loggedInUser &&
    (loggedInUser.role === "DEPARTMENT_OFFICER" ||
      loggedInUser.role === "DEPARTMENT");

  const isDepartmentPortal =
    isDepartmentOfficer || location.pathname === "/department/dashboard";

  const navItems = [
    {
      label: "Overview",
      path: "/admin/dashboard",
      icon: "📊",
    },
    {
      label: "Manage Complaints",
      path: "/admin/complaints",
      icon: "📁",
    },
    {
      label: "Update Status",
      path: "/admin/status",
      icon: "✏️",
    },
    {
      label: "Track Complaints",
      path: "/admin/tracking",
      icon: "🔍",
    },
  ].filter((item) => !(isDepartmentPortal && item.label === "Overview"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");

    setMenuOpen(false);

    navigate("/");
  };

  const handleNavigation = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const displayName =
    loggedInUser?.name ||
    (isDepartmentOfficer ? "Department Officer" : "Administrator");

  const displayRole = isDepartmentOfficer
    ? loggedInUser?.departmentCode
      ? `${loggedInUser.departmentCode} Officer`
      : "Department Officer"
    : "Super Admin";

  const avatarLetter = isDepartmentOfficer ? "O" : "A";

  const brandBadge = isDepartmentOfficer
    ? "Department Portal"
    : "Admin Console";

  return (
    <nav className="admin-nav">
      <div className="admin-nav-container">

        {/* ================= BRAND ================= */}
        <div
          className="admin-nav-brand"
          onClick={() =>
            navigate(
              isDepartmentOfficer
                ? "/department/dashboard"
                : "/admin/dashboard"
            )
          }
        >
          <span className="brand-logo">
            Civic<strong>Pulse</strong>
          </span>

          <span className="brand-badge">
            {brandBadge}
          </span>
        </div>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <div className="admin-nav-links">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/admin/departments" &&
                (location.pathname === "/admin/department-dashboard" ||
                  location.pathname === "/department/dashboard"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${
                  isActive ? "active" : ""
                }`}
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span className="nav-text">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ================= USER SECTION ================= */}
        <div className="admin-nav-user">

          <span
            className="user-avatar"
            style={
              isDepartmentOfficer
                ? { background: "#0284c7" }
                : {}
            }
          >
            {avatarLetter}
          </span>

          <div className="user-info">
            <span className="user-name">
              {displayName}
            </span>

            <small className="user-role">
              {displayRole}
            </small>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon">↪</span>
            <span>Logout</span>
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            className={`mobile-menu-btn ${
              menuOpen ? "open" : ""
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`mobile-menu ${
          menuOpen ? "show" : ""
        }`}
      >
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/admin/departments" &&
              (location.pathname ===
                "/admin/department-dashboard" ||
                location.pathname ===
                "/department/dashboard"));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${
                isActive ? "active" : ""
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="mobile-nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          className="mobile-logout-btn"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;