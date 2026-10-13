import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Registration.css";

function Registration() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Keep only digits for phone number
    const updatedValue =
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 10)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));

    setSuccessMessage("");
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (password.length === 0) {
      return {
        label: "",
        percent: 0,
        color: "",
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        label: "Weak",
        percent: 33,
        color: "var(--danger)",
      };
    }

    if (score <= 3) {
      return {
        label: "Medium",
        percent: 66,
        color: "var(--warning)",
      };
    }

    return {
      label: "Strong",
      percent: 100,
      color: "var(--success)",
    };
  };

  const strength = getPasswordStrength(formData.password);

  // Form validation
  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName =
        "Full name must be at least 3 characters.";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    // Phone
    const phone = formData.phone.replace(/\D/g, "");

    if (!phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[6-9][0-9]{9}$/.test(phone)) {
      newErrors.phone =
        "Enter a valid 10-digit phone number.";
    }

    // Address
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    return newErrors;
  };

  // Register user with Spring Boot backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrors({});

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8081/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            address: formData.address.trim(),
            password: formData.password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed."
        );
      }

      console.log(
        "Registration successful:",
        data
      );

      setSuccessMessage(
        "Registration successful! You can now login."
      );

      // Clear form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(
        "Registration error:",
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
            "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />

      <section className="auth-section">
        <div className="auth-card">

          <h1>Citizen Registration</h1>

          <p className="auth-subtitle">
            Create your account to report and track
            civic issues.
          </p>

          {/* Success message */}
          {successMessage && (
            <div className="success-box">
              {successMessage}
            </div>
          )}

          {/* Backend error */}
          {errors.submit && (
            <div className="error-text">
              {errors.submit}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Riya Sharma"
              />

              {errors.fullName && (
                <span className="error-text">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />

              {errors.email && (
                <span className="error-text">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
              />

              {errors.phone && (
                <span className="error-text">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House no., street, city, state"
                rows="3"
              />

              {errors.address && (
                <span className="error-text">
                  {errors.address}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              {/* Password strength */}
              {formData.password && (
                <div className="strength-meter">
                  <div className="strength-bar-bg">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${strength.percent}%`,
                        backgroundColor:
                          strength.color,
                      }}
                    ></div>
                  </div>

                  <span
                    style={{
                      color: strength.color,
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}

              {errors.password && (
                <span className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="password-wrapper">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  id="confirmPassword"
                  name="confirmPassword"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <span className="error-text">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Register button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Registering..."
                : "Register"}
            </button>

          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login">
              Login here
            </Link>
          </p>

          <p className="auth-footer-text">
            <Link to="/">
              ← Back to Home
            </Link>
          </p>

        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Registration;