import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/RegisterComplaint.css";

function RegisterComplaint() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    "Fire & Emergency",
    "Street Light",
    "Road",
    "Water",
    "Sanitation",
    "Garbage",
    "Drainage",
    "Electricity",
    "Other",
  ];

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

    setSuccessMessage("");
    setDuplicateMessage("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Complaint title is required.";
    }

    if (!formData.description.trim()) {
      newErrors.description =
        "Complaint description is required.";
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        "Description must be at least 10 characters.";
    }

    if (!formData.category) {
      newErrors.category =
        "Please select a complaint category.";
    }

    if (!formData.location.trim()) {
      newErrors.location =
        "Location is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setSuccessMessage("");
    setDuplicateMessage("");

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Get logged-in citizen
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        throw new Error(
          "Citizen information not found. Please login again."
        );
      }

      const user = JSON.parse(storedUser);

      const citizenId = user.citizenId || user.id;

      if (!citizenId) {
        throw new Error(
          "Citizen ID not found. Please login again."
        );
      }

      const complaintData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        citizenId: Number(citizenId),
        status: "PENDING",
      };

      console.log(
        "Complaint data:",
        complaintData
      );

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8081/api/complaints",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },
          body: JSON.stringify(complaintData),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {

        const message =
          data.message ||
          data.error ||
          "Unable to register complaint.";

        // Duplicate complaint detected
        if (
          message.toLowerCase().includes("duplicate") ||
          message.toLowerCase().includes("similarity")
        ) {
          setDuplicateMessage(message);
          setFormData({
            title: "",
            description: "",
            category: "",
            location: "",
          });

          return;
        }

        throw new Error(message);
      }

      console.log(
        "Complaint registered successfully:",
        data
      );

      setSuccessMessage(
        "Complaint submitted successfully. Our system will automatically assign the department and assess urgency."
      );

      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
      });

    } catch (error) {
      console.error(
        "Complaint registration error:",
        error
      );

      if (error instanceof TypeError) {
        setErrors({
          submit:
            "Unable to connect to the server. Please make sure the Spring Boot backend is running on port 8081.",
        });
      } else {
        setErrors({
          submit:
            error.message ||
            "Unable to register complaint.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-complaint-page">
      <Navbar />

      <main className="register-complaint-container">

        {/* Header */}
        <section className="complaint-header">
          <span className="complaint-badge">
            📝 Citizen Portal
          </span>

          <h1>Register a Complaint</h1>

          <p>
            Report a civic issue and submit it to the
            concerned department.
          </p>
        </section>

        {/* Form */}
        <section className="complaint-form-card">

          {successMessage && (
            <div className="success-box">
              <h2>✅ Complaint Submitted Successfully</h2>

              <p>{successMessage}</p>

              <div className="success-actions">
                <button
                  type="button"
                  onClick={() => navigate("/track-complaint")}
                >
                  Track Complaint
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/citizen/dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {duplicateMessage && !successMessage && (
            <div className="error-box">
              <h2>⚠️ Duplicate Complaint Detected</h2>

              <p>{duplicateMessage}</p>

              <div className="success-actions">
                <button
                  type="button"
                  onClick={() => navigate("/track-complaint")}
                >
                  View My Complaints
                </button>

                <button
                  type="button"
                  onClick={() => setDuplicateMessage("")}
                >
                  Submit Different Complaint
                </button>
              </div>
            </div>
          )}

          {!successMessage && !duplicateMessage && (
            <form onSubmit={handleSubmit} noValidate>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">
                  Complaint Title
                </label>

                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Street Light Not Working"
                />

                {errors.title && (
                  <span className="error-text">
                    {errors.title}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the civic issue in detail..."
                  rows="5"
                />

                {errors.description && (
                  <span className="error-text">
                    {errors.description}
                  </span>
                )}
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Category
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

                {errors.category && (
                  <span className="error-text">
                    {errors.category}
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="location">
                  Location
                </label>

                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Ghaziabad"
                />

                {errors.location && (
                  <span className="error-text">
                    {errors.location}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="complaint-form-actions">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    navigate(
                      "/citizen/dashboard"
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Submitting..."
                    : "Submit Complaint"}
                </button>

              </div>

            </form>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default RegisterComplaint;