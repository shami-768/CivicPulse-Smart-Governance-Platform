/**
 * CivicPulse Smart Governance Platform
 * Standardized Municipal SLA & Escalation Utility
 * Benchmarked from Smart City Municipal Charters:
 * - Critical / High Priority: 24 Hours
 * - Medium Priority: 48 Hours
 * - Low Priority: 72 Hours
 */

export const calculateSlaHours = (priority) => {
  if (!priority) return 48;
  const p = String(priority).trim().toUpperCase();
  if (p === "CRITICAL" || p === "HIGH") return 24;
  if (p === "MEDIUM") return 48;
  return 72;
};

export const getComplaintSlaDeadline = (complaint) => {
  if (complaint.slaDeadline) {
    return new Date(complaint.slaDeadline);
  }
  const slaHours = complaint.slaHours || calculateSlaHours(complaint.priority);
  const created = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
  return new Date(created.getTime() + slaHours * 60 * 60 * 1000);
};

export const getSlaStatus = (complaint, nowTime = Date.now()) => {
  const normStatus = String(complaint.status || "PENDING").trim().toUpperCase();
  const slaHours = complaint.slaHours || calculateSlaHours(complaint.priority);
  const createdDate = complaint.createdAt ? new Date(complaint.createdAt) : new Date();
  const deadline = getComplaintSlaDeadline(complaint);
  const deadlineTime = deadline.getTime();
  const totalDurationMs = slaHours * 60 * 60 * 1000;

  // Case 1: Already Resolved
  if (normStatus === "RESOLVED") {
    return {
      text: "Resolved within SLA",
      shortText: "Resolved",
      isResolved: true,
      isBreached: false,
      color: "#16a34a",
      bg: "#dcfce7",
      borderColor: "#86efac",
      badgeClass: "sla-resolved",
      progressPercent: 100,
      hoursLeft: 0,
      minsLeft: 0,
      secsLeft: 0,
      deadline,
      slaHours,
    };
  }

  // Case 2: Rejected / Invalidated
  if (normStatus === "REJECTED") {
    return {
      text: "Closed (Rejected)",
      shortText: "Rejected",
      isResolved: true,
      isBreached: false,
      color: "#64748b",
      bg: "#f1f5f9",
      borderColor: "#cbd5e1",
      badgeClass: "sla-rejected",
      progressPercent: 100,
      hoursLeft: 0,
      minsLeft: 0,
      secsLeft: 0,
      deadline,
      slaHours,
    };
  }

  const diffMs = deadlineTime - nowTime;

  // Case 3: Active - Within SLA Window
  if (diffMs > 0) {
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

    const elapsedMs = Math.max(0, nowTime - createdDate.getTime());
    const progressPercent = Math.min(100, Math.max(2, Math.round((elapsedMs / totalDurationMs) * 100)));

    let color = "#0284c7";
    let bg = "#e0f2fe";
    let borderColor = "#7dd3fc";
    let urgencyClass = "sla-normal";

    if (hoursLeft < 4) {
      color = "#dc2626";
      bg = "#fee2e2";
      borderColor = "#fca5a5";
      urgencyClass = "sla-critical";
    } else if (hoursLeft < 12) {
      color = "#ea580c";
      bg = "#ffedd5";
      borderColor = "#fdba74";
      urgencyClass = "sla-warning";
    }

    return {
      text: `⏳ ${hoursLeft}h ${minsLeft}m ${secsLeft}s left`,
      shortText: `⏳ ${hoursLeft}h ${minsLeft}m left`,
      isResolved: false,
      isBreached: false,
      color,
      bg,
      borderColor,
      badgeClass: urgencyClass,
      progressPercent,
      hoursLeft,
      minsLeft,
      secsLeft,
      deadline,
      slaHours,
    };
  }

  // Case 4: Overdue / Breached -> Auto-Escalated to Higher Authority
  const breachedMs = Math.abs(diffMs);
  const hoursOver = Math.floor(breachedMs / (1000 * 60 * 60));
  const minsOver = Math.floor((breachedMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    text: `🚨 SLA Breached (${hoursOver}h ${minsOver}m overdue)`,
    shortText: `🚨 Breached by ${hoursOver}h ${minsOver}m`,
    isResolved: false,
    isBreached: true,
    color: "#dc2626",
    bg: "#fee2e2",
    borderColor: "#fca5a5",
    badgeClass: "sla-breached",
    progressPercent: 100,
    hoursLeft: 0,
    minsLeft: 0,
    secsLeft: 0,
    hoursOver,
    minsOver,
    deadline,
    slaHours,
  };
};

export const isAutoSlaBreach = (complaint) => {
  const reason = String(complaint.escalationReason || "").toLowerCase();
  return reason.includes("sla breach") || reason.includes("auto-escalated") || reason.includes("expired");
};
