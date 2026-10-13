import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/AdminLogin.css";

function DepartmentLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Officer email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid officer email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      let response;
      try {
        response = await fetch("http://localhost:8081/api/auth/department-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }),
        });

        if (response.status === 404) {
          response = await fetch("http://localhost:8081/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
            }),
          });
        }
      } catch (netErr) {
        console.warn("Backend API unreachable:", netErr);
        throw new Error("Unable to connect to authentication server. Please verify backend service is running.");
      }

      if (response && response.ok) {
        const data = await response.json();

        // Store token & user object in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));

        // Direct to Department Dashboard
        navigate("/department/dashboard");
        return;
      }

      if (response && !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Invalid officer email or password. Only registered department officers can log in."
        );
      }

      throw new Error("Invalid department officer credentials.");
    } catch (error) {
      console.error("Department Officer login error:", error);

      setErrors({
        submit:
          error.message ||
          "Authentication failed. Please check your officer email and password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div className="admin-login-card" style={{ maxWidth: "460px", width: "100%" }}>
        <div className="admin-icon">🏛️</div>

        <p className="portal-label" style={{ color: "#38bdf8", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.85rem", marginBottom: "8px" }}>
          DEPARTMENTAL OFFICER PORTAL
        </p>

        <h1 style={{ fontSize: "1.75rem", marginBottom: "12px" }}>Officer Login</h1>

        <p style={{ color: "#94a3b8", fontSize: "0.92rem", marginBottom: "24px" }}>
          Login with credentials assigned by your Administrator to access departmental complaints and metrics.
        </p>

        {errors.submit && (
          <div className="error-message" style={{ background: "#ef444422", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 14px", borderRadius: "6px", marginBottom: "20px", fontSize: "0.88rem", textAlign: "left" }}>
            ⚠️ {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="admin-form-group" style={{ marginBottom: "18px", textAlign: "left" }}>
            <label htmlFor="officer-email" style={{ display: "block", color: "#cbd5e1", marginBottom: "6px", fontSize: "0.88rem", fontWeight: 600 }}>
              Officer Email
            </label>
            <input
              type="email"
              id="officer-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="officer@civicpulse.com"
              autoComplete="email"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(15, 23, 42, 0.6)", color: "#fff" }}
            />
            {errors.email && (
              <span className="error-text" style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="admin-form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label htmlFor="officer-password" style={{ display: "block", color: "#cbd5e1", marginBottom: "6px", fontSize: "0.88rem", fontWeight: 600 }}>
              Password
            </label>
            <div className="admin-password-wrapper" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="officer-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter officer password"
                autoComplete="current-password"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(15, 23, 42, 0.6)", color: "#fff" }}
              />
              <button
                type="button"
                className="admin-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.8rem" }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text" style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="admin-login-btn"
            disabled={isLoading}
            style={{ width: "100%", padding: "12px", borderRadius: "6px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "1rem", transition: "all 0.2s ease" }}
          >
            {isLoading ? "Authenticating Officer..." : "Login as Department Officer"}
          </button>
        </form>

        <Link
          to="/portal"
          className="back-home-btn"
          style={{ display: "inline-block", marginTop: "20px", color: "#94a3b8", textDecoration: "none", fontSize: "0.88rem" }}
        >
          ← Choose Another Portal
        </Link>
      </div>
    </div>
  );
}

export default DepartmentLogin;
