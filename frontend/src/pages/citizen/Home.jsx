import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Search,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/Home.css";

function Home() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  /*
   * Check whether a citizen is already logged in.
   */
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        JSON.parse(storedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error reading user data:", error);
        setIsLoggedIn(false);
      }
    }

    // Fetch real platform statistics
    const fetchStatistics = async () => {
      try {
        const response = await fetch(
          "http://localhost:8081/api/complaints"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch complaints");
        }

        const complaints = await response.json();

        const complaintList = Array.isArray(complaints)
          ? complaints
          : [];

        const total = complaintList.length;

        const pending = complaintList.filter(
          (complaint) =>
            complaint.status?.toUpperCase() === "PENDING"
        ).length;

        const inProgress = complaintList.filter(
          (complaint) =>
            complaint.status?.toUpperCase() === "IN_PROGRESS" ||
            complaint.status?.toUpperCase() === "IN PROGRESS"
        ).length;

        const resolved = complaintList.filter(
          (complaint) =>
            complaint.status?.toUpperCase() === "RESOLVED"
        ).length;

        setStats({
          total,
          pending,
          inProgress,
          resolved,
        });
      } catch (error) {
        console.error(
          "Error fetching platform statistics:",
          error
        );
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, []);

  /*
   * Dynamic routes
   */
  const reportRoute = isLoggedIn
    ? "/register-complaint"
    : "/register";

  const trackRoute = isLoggedIn
    ? "/track-complaint"
    : "/login";

  return (
    <div className="home-page">

      <Navbar />

      {/* =====================================================
          HERO SECTION
      ====================================================== */}

      <section className="hero-section">

        <div className="hero-container">

          {/* LEFT SIDE */}

          <div className="hero-content">

            <div className="hero-badge">
              <ShieldCheck size={17} />
              <span>Citizen Service Platform</span>
            </div>

            <h1>
              Report Civic Issues.
              <br />
              <span>Track Their Resolution.</span>
            </h1>

            <p className="hero-description">
              CivicPulse provides a simple way for citizens to report
              local issues, follow complaint progress and stay informed
              about the actions taken by the concerned department.
            </p>

            <div className="hero-actions">

              {/* REPORT BUTTON */}

              <Link
                to={reportRoute}
                className="hero-primary-button"
              >
                <Send size={18} />

                <span>Report an Issue</span>

                <ArrowRight size={17} />
              </Link>

              {/* TRACK BUTTON */}

              <Link
                to={trackRoute}
                className="hero-secondary-button"
              >
                <Search size={18} />

                <span>Track Complaint</span>
              </Link>

            </div>

            <div className="hero-trust">

              <div className="trust-item">
                <CheckCircle2 size={18} />
                <span>Easy complaint registration</span>
              </div>

              <div className="trust-item">
                <CheckCircle2 size={18} />
                <span>Complaint status tracking</span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CITIZEN SERVICES + PLATFORM ACTIVITY
      ====================================================== */}

      <section className="services-activity-section">

        <div className="services-activity-container">

          {/* CITIZEN SERVICES */}

          <div className="citizen-services">

            <div className="section-label">
              CITIZEN SERVICES
            </div>

            <h2>
              Have a civic issue to report?
            </h2>

            <p>
              Register your complaint and follow its progress
              through your CivicPulse account.
            </p>

            <div className="service-buttons">

              {/* REGISTER COMPLAINT */}

              <Link
                to={reportRoute}
                className="register-button"
              >
                <Send size={17} />

                <span>Register Complaint</span>

                <ArrowRight size={16} />
              </Link>


              {/* TRACK COMPLAINT */}

              <Link
                to={trackRoute}
                className="track-button"
              >
                <Search size={17} />

                <span>Track Complaint</span>
              </Link>

            </div>

          </div>


          {/* PLATFORM ACTIVITY */}

          <div className="platform-activity">

            <div className="activity-heading">

              <div>

                <div className="section-label">
                  PLATFORM ACTIVITY
                </div>

                <h2>
                  CivicPulse at a glance
                </h2>

                <p>
                  Current complaint statistics from the platform.
                </p>

              </div>

            </div>


            <div className="stats-grid">

              {/* TOTAL */}

              <div className="stat-card">

                <div className="stat-icon total-icon">
                  <ClipboardList size={21} />
                </div>

                <div className="stat-content">

                  <span>Total Complaints</span>

                  <strong>
                    {loadingStats ? "—" : stats.total}
                  </strong>

                </div>

              </div>


              {/* PENDING */}

              <div className="stat-card">

                <div className="stat-icon pending-icon">
                  <Clock3 size={21} />
                </div>

                <div className="stat-content">

                  <span>Pending</span>

                  <strong>
                    {loadingStats ? "—" : stats.pending}
                  </strong>

                </div>

              </div>


              {/* IN PROGRESS */}

              <div className="stat-card">

                <div className="stat-icon progress-icon">
                  <Settings2 size={21} />
                </div>

                <div className="stat-content">

                  <span>In Progress</span>

                  <strong>
                    {loadingStats ? "—" : stats.inProgress}
                  </strong>

                </div>

              </div>


              {/* RESOLVED */}

              <div className="stat-card">

                <div className="stat-icon resolved-stat-icon">
                  <CheckCircle2 size={21} />
                </div>

                <div className="stat-content">

                  <span>Resolved</span>

                  <strong>
                    {loadingStats ? "—" : stats.resolved}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW CIVICPULSE WORKS
      ====================================================== */}

      <section className="how-section">

        <div className="section-container">

          <div className="section-heading">

            <div className="section-label">
              SIMPLE PROCESS
            </div>

            <h2>
              How CivicPulse Works
            </h2>

            <p>
              From reporting an issue to seeing it resolved,
              everything stays organized in one place.
            </p>

          </div>


          <div className="steps-grid">

            <div className="process-card">

              <div className="process-number">
                01
              </div>

              <div className="process-icon">
                <Send size={22} />
              </div>

              <h3>
                Report an Issue
              </h3>

              <p>
                Submit the details of a civic issue including
                its category, location and priority.
              </p>

            </div>


            <div className="process-card">

              <div className="process-number">
                02
              </div>

              <div className="process-icon">
                <ClipboardList size={22} />
              </div>

              <h3>
                Complaint Review
              </h3>

              <p>
                Your complaint is assigned to the concerned
                department for further action.
              </p>

            </div>


            <div className="process-card">

              <div className="process-number">
                03
              </div>

              <div className="process-icon">
                <Settings2 size={22} />
              </div>

              <h3>
                Work in Progress
              </h3>

              <p>
                Follow the progress while the concerned
                department works on the reported issue.
              </p>

            </div>


            <div className="process-card">

              <div className="process-number">
                04
              </div>

              <div className="process-icon">
                <CheckCircle2 size={22} />
              </div>

              <h3>
                Issue Resolved
              </h3>

              <p>
                Once the issue is addressed, the complaint
                status is updated as resolved.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PLATFORM FEATURES
      ====================================================== */}

      <section className="features-section">

        <div className="section-container">

          <div className="section-heading">

            <div className="section-label">
              PLATFORM FEATURES
            </div>

            <h2>
              Everything in one place
            </h2>

            <p>
              CivicPulse makes it easier for citizens to
              communicate civic issues and follow their progress.
            </p>

          </div>


          <div className="features-grid">

            <div className="feature-card">

              <div className="feature-icon">
                <Send size={22} />
              </div>

              <h3>
                Easy Complaint Filing
              </h3>

              <p>
                Report issues such as roads, street lights,
                sanitation and water services through a simple form.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                <Search size={22} />
              </div>

              <h3>
                Complaint Tracking
              </h3>

              <p>
                View your submitted complaints and check the
                latest status of each complaint.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                <Settings2 size={22} />
              </div>

              <h3>
                Department Management
              </h3>

              <p>
                Complaints can be directed to the appropriate
                department based on the reported issue.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                <ShieldCheck size={22} />
              </div>

              <h3>
                Transparent Process
              </h3>

              <p>
                Citizens can follow the status of their complaints
                instead of having to repeatedly contact authorities.
              </p>

            </div>

          </div>

        </div>

      </section>


      <Footer />

    </div>
  );
}

export default Home;