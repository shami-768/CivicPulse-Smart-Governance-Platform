import React, { useState, useEffect } from "react";
import "../styles/AdminDashboard.css";

const RegisterOfficerModal = ({ isOpen, onClose, onOfficerAdded }) => {
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'list'
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    departmentName: "Public Works Department",
    departmentCode: "PWD",
    phone: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = [
    { name: "Public Works Department", code: "PWD" },
    { name: "Water Supply & Sewerage", code: "WATER" },
    { name: "Public Health & Sanitation", code: "SANITATION" },
    { name: "Electricity & Lighting", code: "ELEC" },
    { name: "Environment & Parks", code: "PARKS" },
    { name: "Town Planning & Housing", code: "HOUSING" },
    { name: "General Administration", code: "ADMIN" },
  ];

  const fetchOfficers = async () => {
    setLoadingOfficers(true);
    try {
      let res = await fetch("http://localhost:8081/api/auth/officers");
      if (res.status === 404) {
        res = await fetch("http://localhost:8081/api/departments/officers");
      }
      if (res.ok) {
        const data = await res.json();
        setOfficers(data);
      }
    } catch (err) {
      console.warn("Could not fetch officers from backend DB:", err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOfficers();
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "departmentName") {
      const selected = departmentOptions.find((d) => d.name === value);
      setFormData((prev) => ({
        ...prev,
        departmentName: value,
        departmentCode: selected ? selected.code : "DEPT",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Please fill out all required fields (Name, Email, Password).");
      return;
    }

    setIsSubmitting(true);

    try {
      let res = await fetch("http://localhost:8081/api/auth/register-officer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          departmentName: formData.departmentName,
          departmentCode: formData.departmentCode,
          phone: formData.phone.trim(),
        }),
      });

      if (res.status === 404) {
        res = await fetch("http://localhost:8081/api/departments/register-officer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            departmentName: formData.departmentName,
            departmentCode: formData.departmentCode,
            phone: formData.phone.trim(),
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to register department officer. Please ensure backend server is running.");
      }

      const createdOfficer = await res.json();
      setSuccessMsg(`Officer ${createdOfficer.name} (${createdOfficer.email}) registered successfully in DB!`);

      setFormData({
        name: "",
        email: "",
        password: "",
        departmentName: "Public Works Department",
        departmentCode: "PWD",
        phone: "",
      });

      fetchOfficers();

      if (onOfficerAdded) {
        onOfficerAdded(createdOfficer);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Ensure email is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          maxWidth: "650px",
          width: "100%",
          color: "#ffffff",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#f8fafc" }}>
              🏛️ Department Officer Management
            </h2>
            <small style={{ color: "#94a3b8" }}>
              Admin Console - Register and view officers in DB
            </small>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Toggle Buttons */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "register" ? "rgba(2, 132, 199, 0.3)" : "transparent",
              color: activeTab === "register" ? "#38bdf8" : "#94a3b8",
              border: "none",
              borderBottom: activeTab === "register" ? "2px solid #38bdf8" : "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ➕ Register New Officer
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("list");
              fetchOfficers();
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "list" ? "rgba(2, 132, 199, 0.3)" : "transparent",
              color: activeTab === "list" ? "#38bdf8" : "#94a3b8",
              border: "none",
              borderBottom: activeTab === "list" ? "2px solid #38bdf8" : "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📋 Registered Officers ({officers.length})
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "0.9rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid #22c55e",
                color: "#86efac",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "0.9rem",
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          {activeTab === "register" ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Officer Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Officer Rajesh Sharma"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "#fff",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Officer Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="officer.pwd@civicpulse.com"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "#fff",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Assign Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter secure password"
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "#fff",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876500000"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "#fff",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Department Name
                  </label>
                  <select
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "#0f172a",
                      color: "#fff",
                    }}
                  >
                    {departmentOptions.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 600 }}>
                    Dept Code
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#38bdf8",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "6px",
                    border: "none",
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Saving to DB..." : "Save Officer to DB"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {loadingOfficers ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>Loading officers from database...</p>
              ) : officers.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center" }}>No registered department officers found in DB.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#38bdf8" }}>
                      <th style={{ padding: "8px" }}>Name</th>
                      <th style={{ padding: "8px" }}>Email</th>
                      <th style={{ padding: "8px" }}>Department</th>
                      <th style={{ padding: "8px" }}>Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((off) => (
                      <tr key={off.id || off.email} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{off.name}</td>
                        <td style={{ padding: "8px", color: "#cbd5e1" }}>{off.email}</td>
                        <td style={{ padding: "8px", color: "#94a3b8" }}>{off.departmentName}</td>
                        <td style={{ padding: "8px" }}>
                          <span style={{ background: "rgba(2, 132, 199, 0.2)", color: "#38bdf8", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {off.departmentCode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterOfficerModal;
