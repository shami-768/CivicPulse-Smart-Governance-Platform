import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/ComingSoon.css";

// One reusable placeholder for every not-yet-built feature page.
// Each route in App.jsx passes a different "title" prop to this same component.
function ComingSoon({ title }) {
  return (
    <div>
      <Navbar />

      <section className="coming-soon-section">
        <div className="coming-soon-card">
          <span className="coming-soon-icon">🚧</span>
          <h1>{title}</h1>
          <h2>Coming Soon</h2>
          <p>
            This feature is currently under development and will be
            available in an upcoming milestone.
          </p>
          <Link to="/" className="btn btn-primary-large">
            Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ComingSoon;