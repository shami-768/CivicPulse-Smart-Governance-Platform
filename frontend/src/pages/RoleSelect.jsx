import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/RoleSelect.css";

// Shown when a user clicks "Login" in the navbar.
// Lets them pick which portal they want, before seeing either login form.
function RoleSelect() {
  return (
    <div>
      <Navbar />

      <section className="role-select-section">
        <div className="role-select-header">
          <h1>Welcome to CivicPulse</h1>
          <p>Choose your portal to continue</p>
        </div>

        <div className="role-cards">
          <div className="role-card">
            <span className="role-icon">👤</span>
            <h2>Citizen</h2>
            <p>Report and track civic complaints</p>
            <Link to="/login" className="btn btn-primary-large">
              Citizen Login
            </Link>
          </div>

          <div className="role-card">
            <span className="role-icon">🏛️</span>
            <h2>Department Officer</h2>
            <p>Access department complaints matrix & reports</p>
            <Link to="/department/login" className="btn btn-primary-large">
              Officer Login
            </Link>
          </div>

          <div className="role-card">
            <span className="role-icon">🛡️</span>
            <h2>Admin</h2>
            <p>Manage complaints and civic services</p>
            <Link to="/admin/login" className="btn btn-primary-large">
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default RoleSelect;