# 🏛️ CivicPulse — Smart Governance Platform

> A full-stack web application that bridges the gap between citizens and local government — enabling transparent complaint management, real-time status tracking, and data-driven governance.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [Modules](#modules)
- [Team](#team)
- [License](#license)

---

## 🌐 Overview

**CivicPulse** is a Smart Governance Platform designed to digitize and streamline the civic complaint management process. It empowers citizens to register and track complaints, enables department officers to manage and resolve issues efficiently, and gives administrators a bird's-eye view of governance operations through dashboards and reports.

---

## ✨ Features

### 👤 Citizen Module
- Register & login with secure JWT-based authentication
- Submit civic complaints with priority levels
- Track complaint status in real-time
- Receive notifications on complaint updates
- Submit feedback on resolved complaints
- Manage personal profile

### 🏢 Department Officer Module
- Dedicated login portal
- View and manage assigned complaints
- Update complaint statuses
- Access department-specific dashboards

### 🛡️ Admin Module
- Admin dashboard with system-wide analytics
- Manage all complaints across departments
- Monitor and update complaint statuses
- Department management and oversight
- Track complaint resolutions
- Generate reports and analysis

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI Framework |
| React Router DOM | 7.x | Client-side Routing |
| Vite | 8.x | Build Tool & Dev Server |
| Lucide React | 1.x | Icon Library |
| Vanilla CSS | — | Styling |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Language |
| Spring Boot | 3.5.5 | Application Framework |
| Spring Security | — | Authentication & Authorization |
| Spring Data JPA | — | ORM & Database Access |
| JWT (jjwt) | 0.12.6 | Token-based Auth |
| MySQL | — | Primary Database |
| H2 | — | In-memory DB (Testing) |
| Lombok | — | Boilerplate Reduction |
| Maven | — | Build Tool |

---

## 📁 Project Structure

```
CivicPulse-Smart-Governance-Platform/
├── frontend/                          # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── citizen/               # Citizen-facing pages
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Registration.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── CitizenDashboard.jsx
│   │   │   │   ├── RegisterComplaint.jsx
│   │   │   │   ├── TrackComplaint.jsx
│   │   │   │   ├── Feedback.jsx
│   │   │   │   ├── Notifications.jsx
│   │   │   │   └── Profile.jsx
│   │   │   ├── admin/                 # Admin-facing pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ComplaintManagement.jsx
│   │   │   │   ├── StatusUpdates.jsx
│   │   │   │   ├── ComplaintTracking.jsx
│   │   │   │   └── DepartmentDashboard.jsx
│   │   │   ├── department/            # Department Officer pages
│   │   │   │   └── DepartmentLogin.jsx
│   │   │   └── RoleSelect.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── AdminNavbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── RegisterOfficerModal.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # Spring Boot backend
│   └── src/main/java/com/civicpulse/backend/
│       ├── controller/
│       │   ├── CitizenController.java
│       │   ├── ComplaintController.java
│       │   ├── DepartmentController.java
│       │   ├── DashboardController.java
│       │   ├── FeedbackController.java
│       │   ├── NotificationController.java
│       │   └── ReportController.java
│       ├── entity/
│       │   ├── Citizen.java
│       │   ├── Complaint.java
│       │   ├── Department.java
│       │   ├── DepartmentOfficer.java
│       │   ├── Feedback.java
│       │   ├── Notification.java
│       │   └── User.java
│       ├── service/
│       ├── repository/
│       ├── dto/
│       ├── exception/
│       └── Authentication/
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 17+**
- **Maven 3.6+**
- **Node.js 18+**
- **MySQL 8+**
- **Git**

---

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shami-768/CivicPulse-Smart-Governance-Platform.git
   cd CivicPulse-Smart-Governance-Platform/backend
   ```

2. **Configure the database**

   Create a MySQL database:
   ```sql
   CREATE DATABASE civicpulse;
   ```

   Update `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/civicpulse
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   ```

3. **Run the backend**
   ```bash
   ./mvnw spring-boot:run
   ```
   The server starts at **http://localhost:8080**

---

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   App available at **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Citizen registration |
| `POST` | `/api/auth/login` | Login (Citizen / Admin / Officer) |
| `GET` | `/api/citizens` | Get all citizens (Admin) |
| `GET` | `/api/citizens/{id}` | Get citizen by ID |
| `POST` | `/api/complaints` | Register a new complaint |
| `GET` | `/api/complaints` | Get all complaints |
| `GET` | `/api/complaints/{id}` | Get complaint by ID |
| `PUT` | `/api/complaints/{id}/status` | Update complaint status |
| `GET` | `/api/departments` | Get all departments |
| `POST` | `/api/departments` | Create a department |
| `GET` | `/api/dashboard` | Get dashboard analytics |
| `POST` | `/api/feedback` | Submit feedback |
| `GET` | `/api/notifications/{citizenId}` | Get citizen notifications |
| `GET` | `/api/reports` | Generate reports |

---

## 🧩 Modules

### 🟢 Citizen Module
Citizens can file complaints about civic issues (roads, water, electricity, sanitation, etc.), assign priorities, track status, get notified on updates, and submit feedback after resolution.

### 🔵 Department Officer Module
Government officers log in to their department portal, view assigned complaints, update statuses (Pending → In Progress → Resolved), and manage department-level operations.

### 🔴 Admin Module
Admins get a comprehensive dashboard with key metrics, full complaint management across all departments, officer registration, and analytical reports for governance decisions.

---

## 👥 Team

| Member | Role | Contributions |
|---|---|---|
| **Shamiha Asmi** | Full Stack | Backend Auth, Citizen & Department Management, Frontend Department Dashboard & Reports |
| **Niranjana** | Full Stack | Frontend Home, Registration, Login, Citizen Dashboard, Register & Track Complaint |
| **Dharanika** | Full Stack | Backend Complaint & Admin Management, Dashboard, Frontend Admin Dashboard, Status & Tracking |

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ by Team D — CivicPulse</p>
  <p><i>"Empowering citizens, enabling transparency, evolving governance."</i></p>
</div>
