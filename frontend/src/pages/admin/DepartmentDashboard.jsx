import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import "../../styles/DepartmentDashboard.css";

// Canonical Municipal Departments dataset (benchmarked from Smart City standards)
const CANONICAL_DEPARTMENTS = [
  { id: "ed", code: "ED", name: "Emergency & Public Safety Department", head: "Emergency Command Officer", contact: "emergency@civicpulse.com" },
  { id: "esl", code: "ESL", name: "Electricity & Street Lighting", head: "Sanjay Verma", contact: "power@civicpulse.com" },
  { id: "pwi", code: "PWI", name: "Public Works & Infrastructure", head: "Ananya Deshmukh", contact: "pwd@civicpulse.com" },
  { id: "wss", code: "WSS", name: "Water Supply & Sewerage", head: "Vram Kishor", contact: "water@civicpulse.com" },
  { id: "swm", code: "SWM", name: "Sanitation & Waste Management", head: "Rajesh Sharma", contact: "sanitation@civicpulse.com" },
  { id: "phh", code: "PHH", name: "Public Health & Hygiene", head: "Dr. Meera Nair", contact: "health@civicpulse.com" },
  { id: "pe", code: "PE", name: "Environment & Parks", head: "Harpreet Singh", contact: "parks@civicpulse.com" },
  { id: "tt", code: "TT", name: "Traffic & Transportation", head: "Vikram Malhotra", contact: "traffic@civicpulse.com" },
  { id: "gad", code: "GAD", name: "General Administration Department", head: "General Officer", contact: "admin@civicpulse.com" },
];

const INITIAL_DEPARTMENTS = CANONICAL_DEPARTMENTS.map((d) => ({
  ...d,
  pending: 0,
  inProgress: 0,
  resolved: 0,
  highPriority: 0,
  medPriority: 0,
  lowPriority: 0,
  avgResolutionHours: "18.5",
  slaCompliance: "N/A",
  efficiencyRating: "N/A",
  recentActivity: "No recent activity recorded",
}));

const DepartmentDashboard = () => {
  const navigate = useNavigate();

  // User & Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaintsList, setComplaintsList] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: "" });

  // Modals & Feedback State
  const [activeModalDept, setActiveModalDept] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [actionToast, setActionToast] = useState("");

  // Department Notifications State (Replacing separate escalation page)
  const [deptNotifications, setDeptNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); // "all" | "unread" | "escalated"

  // Determine Role & Department
  const isOfficer = useMemo(() => {
    return (
      currentUser?.role === "DEPARTMENT_OFFICER" ||
      currentUser?.role === "DEPARTMENT"
    );
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return currentUser?.role === "ADMIN";
  }, [currentUser]);

  // Identify Officer's Assigned Department strictly
  const officerDept = useMemo(() => {
    if (!currentUser) return null;

    // Match by departmentCode
    if (currentUser.departmentCode) {
      const match = CANONICAL_DEPARTMENTS.find(
        (d) => d.code.toUpperCase() === currentUser.departmentCode.toUpperCase()
      );
      if (match) return match;
    }

    // Match by departmentName
    if (currentUser.departmentName) {
      const match = CANONICAL_DEPARTMENTS.find(
        (d) =>
          d.name.toLowerCase().includes(currentUser.departmentName.toLowerCase()) ||
          currentUser.departmentName.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) return match;
    }

    // Match by email
    if (currentUser.email) {
      const cleanEmail = currentUser.email.toLowerCase();
      const match = CANONICAL_DEPARTMENTS.find(
        (d) =>
          d.contact.toLowerCase() === cleanEmail ||
          cleanEmail.includes(d.code.toLowerCase())
      );
      if (match) return match;
    }

    // Default fallback if officer role but code not set
    return isOfficer ? CANONICAL_DEPARTMENTS[3] : null;
  }, [currentUser, isOfficer]);

  // Require login & lock department for officer
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/department/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (
        user.role !== "DEPARTMENT_OFFICER" &&
        user.role !== "DEPARTMENT" &&
        user.role !== "ADMIN"
      ) {
        navigate("/department/login");
        return;
      }
      setCurrentUser(user);

      // If officer, lock the selected department to their assigned department
      if (user.role === "DEPARTMENT_OFFICER" || user.role === "DEPARTMENT") {
        const code = user.departmentCode || "";
        const match = CANONICAL_DEPARTMENTS.find(
          (d) => d.code.toUpperCase() === code.toUpperCase()
        );
        if (match) {
          setSelectedDeptId(match.id);
        } else {
          setSelectedDeptId("wss"); // sensible default
        }
      }
    } catch (e) {
      navigate("/department/login");
    }
  }, [navigate]);

  // Active department code for fetching notifications & filtering
  const activeDeptCode = useMemo(() => {
    if (isOfficer && officerDept) {
      return officerDept.code;
    }
    if (selectedDeptId !== "all") {
      const found = CANONICAL_DEPARTMENTS.find((d) => d.id === selectedDeptId);
      return found?.code || null;
    }
    return null;
  }, [isOfficer, officerDept, selectedDeptId]);

  // Fetch Department Notifications from Backend
  const fetchDepartmentNotifications = useCallback(async () => {
    const code = activeDeptCode || (officerDept ? officerDept.code : null);
    if (!code) return;

    try {
      const res = await fetch(`http://localhost:8081/api/notifications/department/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setDeptNotifications(list);
        const unread = list.filter((n) => !n.read && !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn("Unable to fetch department notifications:", err.message);
    }
  }, [activeDeptCode, officerDept]);

  // Fetch API complaints & department analytics
  const fetchAllData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8081/api/departments").then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch("http://localhost:8081/api/complaints").then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch("http://localhost:8081/api/complaints/priority-distribution").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([apiDepartments, apiComplaints, apiPriorityDist]) => {
        const rawComplaints = Array.isArray(apiComplaints) ? apiComplaints : [];
        setComplaintsList(rawComplaints);

        const deptMap = {};
        CANONICAL_DEPARTMENTS.forEach((d) => {
          deptMap[d.code] = {
            ...d,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            highPriority: 0,
            medPriority: 0,
            lowPriority: 0,
            avgResolutionHours: "18.5",
            slaCompliance: "N/A",
            efficiencyRating: "N/A",
            recentActivity: "No recent activity recorded",
          };
        });

        // Map live dynamic priority distribution
        if (apiPriorityDist && Array.isArray(apiPriorityDist.departments)) {
          apiPriorityDist.departments.forEach((item) => {
            if (deptMap[item.departmentCode]) {
              deptMap[item.departmentCode].highPriority = item.high || 0;
              deptMap[item.departmentCode].medPriority = item.medium || 0;
              deptMap[item.departmentCode].lowPriority = item.low || 0;
            }
          });
        }

        // Aggregate actual complaints per department
        rawComplaints.forEach((c) => {
          let code = c.departmentCode;
          if (!code || !deptMap[code]) {
            const cat = (c.category || "").toLowerCase();
            if (cat.includes("fire") || cat.includes("emergency")) code = "ED";
            else if (cat.includes("street light") || cat.includes("electricity") || cat.includes("power")) code = "ESL";
            else if (cat.includes("road") || cat.includes("pothole") || cat.includes("infrastructure")) code = "PWI";
            else if (cat.includes("water") || cat.includes("drainage") || cat.includes("sewerage")) code = "WSS";
            else if (cat.includes("sanitation") || cat.includes("garbage") || cat.includes("waste")) code = "SWM";
            else if (cat.includes("health") || cat.includes("hygiene")) code = "PHH";
            else if (cat.includes("park") || cat.includes("tree")) code = "PE";
            else if (cat.includes("traffic") || cat.includes("signal")) code = "TT";
            else code = "GAD";
          }

          if (deptMap[code]) {
            const st = (c.status || "").toUpperCase();
            if (st === "RESOLVED") deptMap[code].resolved += 1;
            else if (st === "IN_PROGRESS" || st === "IN PROGRESS") deptMap[code].inProgress += 1;
            else deptMap[code].pending += 1;

            // If priorityDistribution API wasn't provided, aggregate directly from complaints
            if (!apiPriorityDist || !apiPriorityDist.departments || apiPriorityDist.departments.length === 0) {
              const pr = String(c.priority || "LOW").toUpperCase();
              if (pr.includes("HIGH") || pr.includes("CRITICAL")) deptMap[code].highPriority += 1;
              else if (pr.includes("MED")) deptMap[code].medPriority += 1;
              else deptMap[code].lowPriority += 1;
            }
          }
        });

        // Calculate dynamic SLA & Efficiency metrics
        Object.values(deptMap).forEach((d) => {
          const total = d.pending + d.inProgress + d.resolved;
          if (total > 0) {
            const resRate = ((d.resolved / total) * 100).toFixed(1);
            d.slaCompliance = `${resRate}%`;
            d.efficiencyRating = d.resolved > 0 ? (resRate >= 80 ? "A+" : resRate >= 50 ? "A" : "B") : "N/A";
          } else {
            d.slaCompliance = "N/A";
            d.efficiencyRating = "N/A";
          }
        });

        setDepartments(Object.values(deptMap));
      })
      .catch((err) => {
        console.error("Department analytics error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchDepartmentNotifications();
  }, [fetchDepartmentNotifications]);

  // Scoped Department Complaints for the Officer (matching department only)
  const officerComplaints = useMemo(() => {
    if (!complaintsList || complaintsList.length === 0) return [];
    const targetCode = isOfficer && officerDept ? officerDept.code : (selectedDeptId !== "all" ? CANONICAL_DEPARTMENTS.find(d => d.id === selectedDeptId)?.code : null);

    if (!targetCode) {
      return complaintsList;
    }

    return complaintsList.filter((c) => {
      if (c.departmentCode && c.departmentCode.toUpperCase() === targetCode.toUpperCase()) return true;
      const cat = (c.category || "").toLowerCase();
      if (targetCode === "ED" && (cat.includes("fire") || cat.includes("emergency"))) return true;
      if (targetCode === "ESL" && (cat.includes("street light") || cat.includes("electricity") || cat.includes("power"))) return true;
      if (targetCode === "PWI" && (cat.includes("road") || cat.includes("pothole") || cat.includes("infrastructure"))) return true;
      if (targetCode === "WSS" && (cat.includes("water") || cat.includes("drainage") || cat.includes("sewerage") || cat.includes("leakage"))) return true;
      if (targetCode === "SWM" && (cat.includes("sanitation") || cat.includes("garbage") || cat.includes("waste"))) return true;
      if (targetCode === "PHH" && (cat.includes("health") || cat.includes("hygiene") || cat.includes("hospital"))) return true;
      if (targetCode === "PE" && (cat.includes("park") || cat.includes("tree") || cat.includes("environment"))) return true;
      if (targetCode === "TT" && (cat.includes("traffic") || cat.includes("signal") || cat.includes("transport"))) return true;
      if (targetCode === "GAD") return true;
      return false;
    });
  }, [complaintsList, isOfficer, officerDept, selectedDeptId]);

  // Filtered departments list for Admin Performance Matrix
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesDept = selectedDeptId === "all" || d.id === selectedDeptId;
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.head.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [departments, selectedDeptId, searchQuery]);

  // Scoped Priority Breakdown List (strictly officer department if officer, all if admin)
  const priorityDistributionList = useMemo(() => {
    if (isOfficer && officerDept) {
      const match = departments.find((d) => d.code === officerDept.code);
      return match ? [match] : [officerDept];
    }
    return filteredDepartments;
  }, [isOfficer, officerDept, departments, filteredDepartments]);

  // Aggregate KPI Statistics (Strictly scoped to officer's department if officer)
  const aggregateStats = useMemo(() => {
    if (isOfficer) {
      const total = officerComplaints.length;
      const pending = officerComplaints.filter(c => {
        const s = String(c.status || "").toUpperCase();
        return s === "PENDING" || !s;
      }).length;
      const inProgress = officerComplaints.filter(c => {
        const s = String(c.status || "").toUpperCase();
        return s === "IN_PROGRESS" || s === "IN PROGRESS";
      }).length;
      const resolved = officerComplaints.filter(c => {
        const s = String(c.status || "").toUpperCase();
        return s === "RESOLVED";
      }).length;
      const avgSla = total > 0 ? `${((resolved / total) * 100).toFixed(1)}%` : "0.0%";
      const avgHours = total > 0 ? "18.5" : "N/A";
      return { total, pending, inProgress, resolved, avgSla, avgHours };
    }

    const targetDepts = selectedDeptId === "all"
      ? departments
      : departments.filter((d) => d.id === selectedDeptId);

    const pending = targetDepts.reduce((acc, curr) => acc + curr.pending, 0);
    const inProgress = targetDepts.reduce((acc, curr) => acc + curr.inProgress, 0);
    const resolved = targetDepts.reduce((acc, curr) => acc + curr.resolved, 0);
    const total = pending + inProgress + resolved;
    const avgSla = total > 0 ? `${((resolved / total) * 100).toFixed(1)}%` : "N/A";
    const avgHours = "18.5";

    return { total, pending, inProgress, resolved, avgSla, avgHours };
  }, [isOfficer, officerComplaints, departments, selectedDeptId]);

  // Mark single notification as read
  const handleMarkNotifRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setDeptNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    const code = activeDeptCode || officerDept?.code;
    if (!code) return;
    try {
      const res = await fetch(`http://localhost:8081/api/notifications/department/${encodeURIComponent(code)}/read-all`, {
        method: "PUT",
      });
      if (res.ok) {
        setDeptNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  // Tooltip handlers
  const handleMouseEnter = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, text: "" });
  };

  // CSV Export functionality
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (isOfficer) {
      csvContent += "Complaint ID,Title,Category,Priority,Status,Citizen Location,Created At\n";
      officerComplaints.forEach((c) => {
        csvContent += `"#CMP-${c.id}","${c.title}","${c.category}","${c.priority}","${c.status}","${c.location}","${c.createdAt || ""}"\n`;
      });
    } else {
      csvContent += "Department Code,Department Name,Head,Existing (Pending),In Progress,Done (Resolved),Total,SLA Compliance (%),Avg Resolution (Hrs)\n";
      filteredDepartments.forEach((d) => {
        const total = d.pending + d.inProgress + d.resolved;
        csvContent += `"${d.code}","${d.name}","${d.head}",${d.pending},${d.inProgress},${d.resolved},${total},${d.slaCompliance}%,${d.avgResolutionHours}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${isOfficer ? (officerDept?.code || "Department") : "Municipal"}_Complaints_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRatingClass = (rating) => {
    if (rating === "A+") return "rating-tag rating-aplus";
    if (rating === "A") return "rating-tag rating-a";
    return "rating-tag rating-b";
  };

  // Compute Donut SVG Arc paths
  const donutData = useMemo(() => {
    const { pending, inProgress, resolved, total } = aggregateStats;
    if (total === 0) return [];

    const items = [
      { label: "Done (Resolved)", value: resolved, color: "#10b981" },
      { label: "In Progress", value: inProgress, color: "#0284c7" },
      { label: "Existing (Pending)", value: pending, color: "#f97316" },
    ];

    let cumulativePercent = 0;
    return items.map((item) => {
      const percent = item.value / total;
      const startAngle = cumulativePercent * 2 * Math.PI;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 2 * Math.PI;

      const rOuter = 85;
      const rInner = 55;
      const cx = 110;
      const cy = 110;

      const x1Outer = cx + rOuter * Math.sin(startAngle);
      const y1Outer = cy - rOuter * Math.cos(startAngle);
      const x2Outer = cx + rOuter * Math.sin(endAngle);
      const y2Outer = cy - rOuter * Math.cos(endAngle);

      const x1Inner = cx + rInner * Math.sin(endAngle);
      const y1Inner = cy - rInner * Math.cos(endAngle);
      const x2Inner = cx + rInner * Math.sin(startAngle);
      const y2Inner = cy - rInner * Math.cos(startAngle);

      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
        "Z",
      ].join(" ");

      return {
        ...item,
        percent: (percent * 100).toFixed(1),
        pathData,
      };
    });
  }, [aggregateStats]);

  // Dynamic 7-day Timeline Data
  const timelineData = useMemo(() => {
    const list = isOfficer ? officerComplaints : complaintsList;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = days[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];

      let incoming = 0;
      let resolved = 0;
      list.forEach((c) => {
        const cDate = (c.createdAt || "").split("T")[0];
        if (cDate === dateStr) {
          incoming += 1;
          const st = String(c.status || "").toUpperCase();
          if (st === "RESOLVED") resolved += 1;
        }
      });
      result.push({ label: dayLabel, incoming, resolved });
    }
    return result;
  }, [isOfficer, officerComplaints, complaintsList]);

  // Compute Timeline Chart SVG points
  const timelineSvg = useMemo(() => {
    const maxVal = Math.max(1, ...timelineData.map((d) => Math.max(d.incoming, d.resolved))) + 2;
    const width = 500;
    const height = 180;
    const padding = 30;

    const dx = (width - padding * 2) / Math.max(1, timelineData.length - 1);

    const incomingPoints = timelineData.map((d, i) => {
      const x = padding + i * dx;
      const y = height - padding - (d.incoming / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    const resolvedPoints = timelineData.map((d, i) => {
      const x = padding + i * dx;
      const y = height - padding - (d.resolved / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    return { incomingPoints, resolvedPoints, width, height, padding, dx, maxVal };
  }, [timelineData]);

  // Max volume for bar chart
  const maxDeptComplaints = useMemo(() => {
    const counts = (departments || []).map((d) => (Number(d.pending) || 0) + (Number(d.inProgress) || 0) + (Number(d.resolved) || 0));
    const m = Math.max(1, ...counts);
    return isNaN(m) || m <= 0 ? 1 : m;
  }, [departments]);

  // Filtered notifications for drawer
  const filteredNotifications = useMemo(() => {
    return deptNotifications.filter((n) => {
      if (notifFilter === "unread") return !n.read && !n.isRead;
      if (notifFilter === "escalated") return n.type === "escalated";
      return true;
    });
  }, [deptNotifications, notifFilter]);

  return (
    <div>
      <AdminNavbar />

      <div className="department-dashboard">

        {/* Floating Tooltip */}
        {tooltip.show && (
          <div
            className="chart-tooltip"
            style={{ top: tooltip.y, left: tooltip.x, transform: "translate(-50%, -100%)" }}
          >
            {tooltip.text}
          </div>
        )}

        {/* Action Toast Feedback */}
        {actionToast && (
          <div className="action-toast-banner">
            <span>{actionToast}</span>
            <button
              onClick={() => setActionToast("")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "inherit" }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Page Header */}
        <header className="dept-header">
          <div className="dept-title-area">
            <h1>
              {isOfficer && officerDept ? (
                <>
                  🏛️ {officerDept.name}
                  <span className="dept-badge">{officerDept.code} Portal</span>
                </>
              ) : (
                <>
                  Department-Wise Dashboard
                  <span className="dept-badge">Analytics & Reports</span>
                </>
              )}
            </h1>
            <p>
              {isOfficer && officerDept ? (
                <>
                  Official Department Officer Portal • <strong>{currentUser?.name || "Officer"}</strong> • Jurisdiction: {officerDept.code} ({officerDept.contact})
                </>
              ) : (
                "Real-time complaint distribution, SLAs, and performance metrics across municipal departments"
              )}
            </p>
          </div>

          <div className="dept-header-actions">

            {/* If Officer: Locked Department Badge (Cannot switch to other departments) */}
            {isOfficer && officerDept ? (
              <div className="dept-locked-badge" title="You are authorized only for this department">
                🏛️ {officerDept.name} ({officerDept.code})
              </div>
            ) : (
              /* If Admin: Department Selector Dropdown */
              <select
                className="dept-select-dropdown"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Department Notifications Center Button (Replaces separate escalation page) */}
            <button
              type="button"
              className="dept-notif-btn"
              onClick={() => setShowNotificationDrawer(true)}
              title="View department notifications & escalation updates"
            >
              🔔 Notifications
              {unreadCount > 0 && <span className="dept-notif-badge">{unreadCount}</span>}
            </button>

          {/* Time Range Filter */}
          <select
            className="date-filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>

            {/* Export Report Action */}
            <button className="export-btn" onClick={() => setShowExportModal(true)}>
              📊 Generate Report
            </button>
          </div>
        </header>

        {/* KPI Cards Grid (Scoped to Officer's Department) */}
        <section className="kpi-grid">
          <div className="kpi-card total">
            <div className="kpi-header">
              <span className="kpi-title">Total Complaints</span>
              <div className="kpi-icon">📁</div>
            </div>
            <div className="kpi-value">{aggregateStats.total}</div>
            <div className="kpi-footer">
              <span className="trend-up">&uarr; Active</span> {isOfficer ? `${officerDept?.code || "Dept"} queue` : "all departments"}
            </div>
          </div>

          <div className="kpi-card pending">
            <div className="kpi-header">
              <span className="kpi-title">Existing / Pending</span>
              <div className="kpi-icon">⏳</div>
            </div>
            <div className="kpi-value">{aggregateStats.pending}</div>
            <div className="kpi-footer">
              <span className="trend-down">Awaiting</span> field review
            </div>
          </div>

          <div className="kpi-card progress">
            <div className="kpi-header">
              <span className="kpi-title">In Progress</span>
              <div className="kpi-icon">⚙️</div>
            </div>
            <div className="kpi-value">{aggregateStats.inProgress}</div>
            <div className="kpi-footer">
              <span className="trend-up">Active</span> field crew work
            </div>
          </div>

          <div className="kpi-card resolved">
            <div className="kpi-header">
              <span className="kpi-title">Done / Resolved</span>
              <div className="kpi-icon">✅</div>
            </div>
            <div className="kpi-value">{aggregateStats.resolved}</div>
            <div className="kpi-footer">
              <span className="trend-up">&uarr;</span> successfully closed
            </div>
          </div>

          <div className="kpi-card sla">
            <div className="kpi-header">
              <span className="kpi-title">SLA Compliance</span>
              <div className="kpi-icon">🎯</div>
            </div>
            <div className="kpi-value">{aggregateStats.avgSla}</div>
            <div className="kpi-footer">
              Avg resolution: <strong>{aggregateStats.avgHours} hrs</strong>
            </div>
          </div>
        </section>

        {/* Visual Analytics & Diagrams Grid */}
        <section className="analytics-grid">

          {/* 1. Status Distribution Donut Diagram */}
          <div className="diagram-card col-4">
            <div className="diagram-header">
              <div className="diagram-title">
                <h3>Status Distribution</h3>
                <p>{isOfficer ? `${officerDept?.name || "Department"} status share` : "Overall status proportions"}</p>
              </div>
            </div>

            <div className="donut-container">
              <svg className="svg-donut" viewBox="0 0 220 220">
                {donutData.map((slice, i) => (
                  <path
                    key={i}
                    d={slice.pathData}
                    fill={slice.color}
                    onMouseEnter={(e) => handleMouseEnter(e, `${slice.label}: ${slice.value} (${slice.percent}%)`)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  />
                ))}

                <text x="110" y="105" className="donut-center-text donut-center-value">
                  {aggregateStats.total}
                </text>
                <text x="110" y="125" className="donut-center-text donut-center-label">
                  Complaints
                </text>
              </svg>

              <div className="donut-legend-list">
                {donutData.map((slice, i) => (
                  <div key={i} className="donut-legend-row">
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="legend-dot" style={{ background: slice.color }}></span>
                      {slice.label}
                    </span>
                    <strong>{slice.value} ({slice.percent}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Timeline Curve */}
          <div className="diagram-card col-8">
            <div className="diagram-header">
              <div className="diagram-title">
                <h3>Complaint Reception vs Resolution Trend</h3>
                <p>Daily complaint volume received vs successfully resolved (Last 7 Days)</p>
              </div>

              <div className="diagram-legend">
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "#3b82f6" }}></span> Incoming
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: "#10b981" }}></span> Resolved
                </div>
              </div>
            </div>

            <svg className="svg-timeline-chart" viewBox="0 0 500 180" preserveAspectRatio="none">
              {[0.2, 0.5, 0.8].map((ratio) => (
                <line
                  key={ratio}
                  x1="30"
                  y1={180 * ratio}
                  x2="470"
                  y2={180 * ratio}
                  stroke="#f1f5f9"
                />
              ))}

              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                points={timelineSvg.incomingPoints}
              />

              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                points={timelineSvg.resolvedPoints}
              />

              {timelineData.map((d, i) => {
                const x = timelineSvg.padding + i * timelineSvg.dx;
                const yIn = timelineSvg.height - timelineSvg.padding - (d.incoming / timelineSvg.maxVal) * (timelineSvg.height - timelineSvg.padding * 2);
                const yRes = timelineSvg.height - timelineSvg.padding - (d.resolved / timelineSvg.maxVal) * (timelineSvg.height - timelineSvg.padding * 2);

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={yIn}
                      r="4"
                      fill="#3b82f6"
                      onMouseEnter={(e) => handleMouseEnter(e, `${d.label} Incoming: ${d.incoming}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                    <circle
                      cx={x}
                      cy={yRes}
                      r="4"
                      fill="#10b981"
                      onMouseEnter={(e) => handleMouseEnter(e, `${d.label} Resolved: ${d.resolved}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                    <text x={x} y="172" textAnchor="middle" fontSize="11" fill="#64748b">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 3. Bar Chart (If Admin) */}
          {!isOfficer && (
            <div className="diagram-card col-12">
              <div className="diagram-header">
                <div className="diagram-title">
                  <h3>Department Complaint Breakdown Diagram</h3>
                  <p>Comparative volume per department</p>
                </div>
                <div className="diagram-legend">
                  <div className="legend-item"><span className="legend-dot dot-pending"></span> Existing (Pending)</div>
                  <div className="legend-item"><span className="legend-dot dot-progress"></span> In Progress</div>
                  <div className="legend-item"><span className="legend-dot dot-resolved"></span> Done (Resolved)</div>
                </div>
              </div>

              <div className="bar-chart-container">
                <svg className="svg-bar-chart" viewBox="0 0 700 240" preserveAspectRatio="none">
                  {[0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line key={ratio} x1="40" y1={200 - ratio * 170} x2="680" y2={200 - ratio * 170} stroke="#e2e8f0" strokeDasharray="4 4" />
                  ))}
                  {departments.map((d, index) => {
                    const groupWidth = (640 / departments.length);
                    const xBase = 50 + index * groupWidth;
                    const barW = Math.min(18, groupWidth / 3.5);

                    const hPending = Math.max(0, Math.min(160, (((Number(d.pending) || 0) / (maxDeptComplaints || 1)) * 160)));
                    const hProgress = Math.max(0, Math.min(160, (((Number(d.inProgress) || 0) / (maxDeptComplaints || 1)) * 160)));
                    const hResolved = Math.max(0, Math.min(160, (((Number(d.resolved) || 0) / (maxDeptComplaints || 1)) * 160)));

                    return (
                      <g key={d.id} className="bar-group">
                        <rect x={xBase} y={200 - hPending} width={barW} height={hPending} fill="#f97316" rx="3" />
                        <rect x={xBase + barW + 3} y={200 - hProgress} width={barW} height={hProgress} fill="#0284c7" rx="3" />
                        <rect x={xBase + (barW + 3) * 2} y={200 - hResolved} width={barW} height={hResolved} fill="#10b981" rx="3" />
                        <text x={xBase + barW * 1.5 + 3} y="218" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                          {d.code}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* 4. Department Urgency & Priority Breakdown */}
          <div className="diagram-card col-12">
            <div className="diagram-header">
              <div className="diagram-title">
                <h3>Department Urgency & Priority Breakdown</h3>
                <p>
                  {isOfficer
                    ? `Breakdown of High, Medium, and Low urgency complaints for ${officerDept?.name || "your department"}`
                    : "Breakdown of High, Medium, and Low urgency complaints across municipal departments"}
                </p>
              </div>

              <div className="diagram-legend">
                <div className="legend-item"><span className="legend-dot dot-high"></span> High Urgency</div>
                <div className="legend-item"><span className="legend-dot dot-medium"></span> Medium Urgency</div>
                <div className="legend-item"><span className="legend-dot dot-low"></span> Low Urgency</div>
              </div>
            </div>

            <div className="priority-list">
              {priorityDistributionList.map((d) => {
                const totalP = (d.highPriority || 0) + (d.medPriority || 0) + (d.lowPriority || 0) || 1;
                const pctHigh = (((d.highPriority || 0) / totalP) * 100).toFixed(1);
                const pctMed = (((d.medPriority || 0) / totalP) * 100).toFixed(1);
                const pctLow = (((d.lowPriority || 0) / totalP) * 100).toFixed(1);

                return (
                  <div key={d.id} className="priority-item">
                    <div className="priority-item-header">
                      <span><strong>{d.name}</strong> ({d.code})</span>
                      <span>High: {d.highPriority || 0} | Med: {d.medPriority || 0} | Low: {d.lowPriority || 0}</span>
                    </div>

                    <div className="priority-bar-track">
                      <div
                        className="priority-segment segment-high"
                        style={{ width: `${pctHigh}%` }}
                        onMouseEnter={(e) => handleMouseEnter(e, `High Urgency: ${d.highPriority || 0} (${pctHigh}%)`)}
                        onMouseLeave={handleMouseLeave}
                      ></div>
                      <div
                        className="priority-segment segment-med"
                        style={{ width: `${pctMed}%` }}
                        onMouseEnter={(e) => handleMouseEnter(e, `Medium Urgency: ${d.medPriority || 0} (${pctMed}%)`)}
                        onMouseLeave={handleMouseLeave}
                      ></div>
                      <div
                        className="priority-segment segment-low"
                        style={{ width: `${pctLow}%` }}
                        onMouseEnter={(e) => handleMouseEnter(e, `Low Urgency: ${d.lowPriority || 0} (${pctLow}%)`)}
                        onMouseLeave={handleMouseLeave}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* Departmental Performance Matrix Table */}
        <section className="table-section">
          <div className="table-controls">
            <div className="diagram-title">
              <h3>Departmental Performance Matrix</h3>
              <p>
                {isOfficer
                  ? `Official operational register and resolution metrics for ${officerDept?.name || "your department"}`
                  : "Complete status register and resolution metrics across municipal departments"}
              </p>
            </div>

            {!isOfficer && (
              <div className="table-search-box">
                <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search department or head..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="dept-table-wrapper">
            <table className="dept-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Head of Dept</th>
                  <th>Existing (Pending)</th>
                  <th>In Progress</th>
                  <th>Done (Resolved)</th>
                  <th>Total Volume</th>
                  <th>SLA Compliance</th>
                  <th>Efficiency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(isOfficer && officerDept
                  ? filteredDepartments.filter((d) => d.code === officerDept.code)
                  : filteredDepartments
                ).map((d) => {
                  const totalComp = d.pending + d.inProgress + d.resolved;
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="dept-name-cell">
                          <div className="dept-avatar">{d.code}</div>
                          <div className="dept-name-text">
                            <strong>{d.name}</strong>
                            <small>{d.contact}</small>
                          </div>
                        </div>
                      </td>
                      <td>{d.head}</td>
                      <td>
                        <span className="badge-count badge-pending">{d.pending}</span>
                      </td>
                      <td>
                        <span className="badge-count badge-progress">{d.inProgress}</span>
                      </td>
                      <td>
                        <span className="badge-count badge-resolved">{d.resolved}</span>
                      </td>
                      <td><strong>{totalComp}</strong></td>
                      <td>
                        <div className="sla-progress-wrap">
                          <div className="sla-bar-bg">
                            <div className="sla-bar-fill" style={{ width: `${parseFloat(d.slaCompliance) || 0}%` }}></div>
                          </div>
                          <small><strong>{d.slaCompliance}</strong></small>
                        </div>
                      </td>
                      <td>
                        <span className={getRatingClass(d.efficiencyRating)}>
                          {d.efficiencyRating}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action-btn"
                          onClick={() => setActiveModalDept(d)}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal 1: Department Detail Report Modal */}
        {activeModalDept && (
          <div className="modal-overlay" onClick={() => setActiveModalDept(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{activeModalDept.name} ({activeModalDept.code})</h2>
                <button className="modal-close-btn" onClick={() => setActiveModalDept(null)}>&times;</button>
              </div>

              <div className="modal-body">
                <div className="modal-stats-row">
                  <div className="modal-stat-box">
                    <small>Existing (Pending)</small>
                    <strong style={{ color: "#ea580c" }}>{activeModalDept.pending}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>In Progress</small>
                    <strong style={{ color: "#0284c7" }}>{activeModalDept.inProgress}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>Done (Resolved)</small>
                    <strong style={{ color: "#10b981" }}>{activeModalDept.resolved}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>SLA Compliance</small>
                    <strong style={{ color: "#8b5cf6" }}>{activeModalDept.slaCompliance}</strong>
                  </div>
                </div>

                <div>
                  <h4>Department Overview & Contacts</h4>
                  <p><strong>Department Head:</strong> {activeModalDept.head}</p>
                  <p><strong>Support Contact:</strong> {activeModalDept.contact}</p>
                  <p><strong>Average Resolution Time:</strong> {activeModalDept.avgResolutionHours} hours</p>
                  <p><strong>Efficiency Rating:</strong> {activeModalDept.efficiencyRating}</p>
                </div>

                <div>
                  <h4>Recent Field Activity & Logs</h4>
                  <p style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #0ea5a5" }}>
                    {activeModalDept.recentActivity}
                  </p>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  className="export-btn"
                  style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer" }}
                  onClick={() => {
                    setActiveModalDept(null);
                    navigate("/admin/complaints");
                  }}
                >
                  📁 View Complaints & Breakdown ➔
                </button>
                <button className="table-action-btn" onClick={() => setActiveModalDept(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Printable Report Summary Modal */}
        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="modal-card printable-report-area" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Municipal Performance & Compliance Executive Report</h2>
                <button className="modal-close-btn" onClick={() => setShowExportModal(false)}>&times;</button>
              </div>

              <div className="modal-body">
                <div style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#64748b" }}>
                    Generated on: <strong>{new Date().toLocaleDateString()}</strong> | Period: <strong>{dateRange}</strong> | Scope: <strong>{isOfficer ? officerDept?.name : "All Municipal Departments"}</strong>
                  </p>
                </div>

                <div className="modal-stats-row">
                  <div className="modal-stat-box">
                    <small>Total Complaints</small>
                    <strong>{aggregateStats.total}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>Existing (Pending)</small>
                    <strong style={{ color: "#ea580c" }}>{aggregateStats.pending}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>Done (Resolved)</small>
                    <strong style={{ color: "#10b981" }}>{aggregateStats.resolved}</strong>
                  </div>
                  <div className="modal-stat-box">
                    <small>SLA Compliance</small>
                    <strong style={{ color: "#0284c7" }}>{aggregateStats.avgSla}</strong>
                  </div>
                </div>

                <h4>Detailed Departmental Metrics</h4>
                <div className="dept-table-wrapper" style={{ maxHeight: "240px", overflowY: "auto" }}>
                  <table className="dept-table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Existing</th>
                        <th>In Progress</th>
                        <th>Resolved</th>
                        <th>Total</th>
                        <th>Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isOfficer && officerDept ? [officerDept] : departments).map((d) => (
                        <tr key={d.id}>
                          <td><strong>{d.code}</strong> - {d.name}</td>
                          <td>{d.pending}</td>
                          <td>{d.inProgress}</td>
                          <td>{d.resolved}</td>
                          <td>{d.pending + d.inProgress + d.resolved}</td>
                          <td>{d.slaCompliance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button className="export-btn" onClick={handleExportCSV}>
                  📥 Download CSV Data
                </button>
                <button className="table-action-btn" onClick={() => window.print()}>
                  🖨️ Print Executive Report
                </button>
                <button className="table-action-btn" onClick={() => setShowExportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Notifications Center Drawer (Slide-Over Panel) */}
        {showNotificationDrawer && (
          <div className="notif-modal-overlay" onClick={() => setShowNotificationDrawer(false)}>
            <div className="notif-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="notif-drawer-header">
                <h2>
                  🔔 {officerDept?.code || "Department"} Notifications
                  {unreadCount > 0 && <span className="dept-notif-badge">{unreadCount}</span>}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllNotifsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0ea5a5",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setShowNotificationDrawer(false)}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Notification Filter Pills */}
              <div style={{ padding: "12px 20px 0 20px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setNotifFilter("all")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    background: notifFilter === "all" ? "#0ea5a5" : "#f1f5f9",
                    color: notifFilter === "all" ? "white" : "#475569"
                  }}
                >
                  All ({deptNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter("unread")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    background: notifFilter === "unread" ? "#0ea5a5" : "#f1f5f9",
                    color: notifFilter === "unread" ? "white" : "#475569"
                  }}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter("escalated")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    background: notifFilter === "escalated" ? "#e11d48" : "#f1f5f9",
                    color: notifFilter === "escalated" ? "white" : "#475569"
                  }}
                >
                  🚨 Escalated & Received
                </button>
              </div>

              <div className="notif-drawer-body">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => {
                    const isUnread = !n.read && !n.isRead;
                    const isEsc = n.type === "escalated";
                    const isAdminAction = n.type === "admin_action";

                    return (
                      <div
                        key={n.id}
                        className={`dept-notif-card ${isUnread ? "unread" : ""} ${isEsc ? "escalated" : ""} ${isAdminAction ? "admin_action" : ""}`}
                      >
                        <div className="dept-notif-header">
                          <span className={`dept-notif-tag ${isEsc ? "escalated" : isAdminAction ? "admin" : "default"}`}>
                            {isEsc ? "🚨 Escalated & Received" : isAdminAction ? "👑 Admin Action" : "🔔 Notification"}
                          </span>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => handleMarkNotifRead(n.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#0284c7",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                              }}
                            >
                              Mark read
                            </button>
                          )}
                        </div>

                        <div className="dept-notif-title">{n.title}</div>
                        <div className="dept-notif-msg">{n.message}</div>

                        <div className="dept-notif-meta">
                          <span>
                            {n.complaintId ? `#CMP-${n.complaintId}` : ""}
                          </span>
                          <span>
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>🔔</div>
                    <strong>No notifications found</strong>
                    <p style={{ fontSize: "13px", marginTop: "4px" }}>
                      When complaints are escalated or updated by Administration, alerts appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DepartmentDashboard;
