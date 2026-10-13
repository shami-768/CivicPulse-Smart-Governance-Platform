import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h3 className="footer-logo">
            Civic<span className="logo-accent">Pulse</span>
          </h3>
          <p className="footer-text">
            A smart governance platform connecting citizens with local
            administration for faster, transparent civic issue resolution.
          </p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/" className="footer-link">
            Home
          </Link>
          <Link to="/login" className="footer-link">
            Citizen Login
          </Link>
          <Link to="/register" className="footer-link">
            Citizen Registration
          </Link>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <p className="footer-text">support@civicpulse.gov.in</p>
          <p className="footer-text">Helpline: 1800-XXX-XXXX</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} CivicPulse</p>
      </div>
    </footer>
  );
}

export default Footer;