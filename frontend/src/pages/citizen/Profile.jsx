import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [citizenId, setCitizenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD PROFILE
  // =========================================================
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    try {
      setLoading(true);
      setError("");

      // Get currently logged-in user
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);

      // Check user ID
      if (!user.id) {
        setError("User information is missing. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Logged-in user:", user);

      // Citizen ID from login response
      setCitizenId(user.citizenId || null);

      // Load actual user information
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    } catch (err) {
      console.error("Profile loading error:", err);
      setError("Unable to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Get current user
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setError("Please login again.");
        setSaving(false);
        return;
      }

      const user = JSON.parse(storedUser);

      // Citizen ID is required for PUT request
      if (!user.citizenId) {
        setError("Citizen profile not found.");
        setSaving(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/citizens/${user.citizenId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(user.token
              ? {
                  Authorization: `Bearer ${user.token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            phone: profile.phone,
            address: profile.address,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Backend update error:", errorText);

        throw new Error(
          "Failed to update profile. Please check the backend."
        );
      }

      const updatedCitizen = await response.json();

      console.log("Updated citizen:", updatedCitizen);

      // =====================================================
      // UPDATE LOCAL STORAGE
      // =====================================================

      const updatedUser = {
        ...user,
        phone: updatedCitizen.phone || "",
        address: updatedCitizen.address || "",
        citizenId: updatedCitizen.id || user.citizenId,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      // =====================================================
      // UPDATE UI
      // =====================================================

      setProfile((previousProfile) => ({
        ...previousProfile,
        phone: updatedCitizen.phone || "",
        address: updatedCitizen.address || "",
      }));

      setCitizenId(updatedCitizen.id || user.citizenId);

      setEditing(false);
      setSuccess("Profile updated successfully.");

      // Remove success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL EDITING
  // =========================================================
  const handleCancel = () => {
    // Reload data from localStorage
    fetchProfile();

    setEditing(false);
    setError("");
    setSuccess("");
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================
  if (loading) {
    return (
      <>
        <Navbar />

        <main className="profile-page">
          <div className="profile-loading">
            <div className="profile-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // PROFILE PAGE
  // =========================================================
  return (
    <>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">

          {/* =================================================
              HEADER
          ================================================= */}
          <div className="profile-header">
            <div>
              <h1>My Profile</h1>
              <p>
                View and manage your CivicPulse account information.
              </p>
            </div>

            <Link
              to="/"
              className="profile-back-btn"
            >
              ← Back to Home
            </Link>
          </div>

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}
          {error && (
            <div className="profile-message profile-error">
              {error}
            </div>
          )}

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}
          {success && (
            <div className="profile-message profile-success">
              {success}
            </div>
          )}

          {/* =================================================
              PROFILE CARD
          ================================================= */}
          <div className="profile-card">

            {/* =================================================
                PROFILE TOP
            ================================================= */}
            <div className="profile-top">

              <div className="profile-avatar">
                {profile.name
                  ? profile.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div className="profile-user-info">
                <h2>
                  {profile.name || "Citizen"}
                </h2>

                <p>
                  {profile.email || "No email available"}
                </p>

                <span className="profile-role">
                  CITIZEN
                </span>
              </div>

            </div>

            {/* =================================================
                PROFILE DETAILS
            ================================================= */}
            <div className="profile-details">

              {/* =================================================
                  FULL NAME
              ================================================= */}
              <div className="profile-field">
                <label>Full Name</label>

                <input
                  type="text"
                  value={profile.name}
                  disabled
                  className="profile-input disabled-input"
                />

                <small>
                  Name is managed through your account.
                </small>
              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}
              <div className="profile-field">
                <label>Email Address</label>

                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="profile-input disabled-input"
                />

                <small>
                  Email is managed through your account.
                </small>
              </div>

              {/* =================================================
                  PHONE
              ================================================= */}
              <div className="profile-field">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your phone number"
                  className={`profile-input ${
                    !editing ? "disabled-input" : ""
                  }`}
                />
              </div>

              {/* =================================================
                  ADDRESS
              ================================================= */}
              <div className="profile-field profile-address-field">
                <label>Address</label>

                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter your address"
                  rows="4"
                  className={`profile-input profile-textarea ${
                    !editing ? "disabled-input" : ""
                  }`}
                />
              </div>

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}
            <div className="profile-actions">

              {!editing ? (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="profile-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </>
              )}

            </div>

          </div>

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}
          <div className="profile-info-card">

            <h3>Account Information</h3>

            <div className="profile-info-grid">

              <div>
                <span>Account Type</span>
                <strong>Citizen</strong>
              </div>

              <div>
                <span>Profile ID</span>
                <strong>
                  {citizenId || "N/A"}
                </strong>
              </div>

              <div>
                <span>Platform</span>
                <strong>CivicPulse</strong>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Profile;