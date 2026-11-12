# 🎓 Smart Club Management System

<p align="center">

![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge)
![MySQL](https://img.shields.io/badge/Database-MySQL-blue?style=for-the-badge)
![EJS](https://img.shields.io/badge/Frontend-EJS-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-Educational-red?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

</p>

---

## 📖 About The Project

The **Smart Club Management System** is a modern full-stack web application designed to digitize and streamline the management of school clubs. It enables administrators and club patrons to efficiently manage students, clubs, memberships, events, attendance, finances, and notifications through a centralized, role-protected dashboard.

Developed as a capstone project following full-stack software development training at **EldoHub Academy**, this project demonstrates practical software engineering skills using **Node.js**, **Express.js**, **MySQL**, **EJS**, **HTML5**, **CSS3**, and **JavaScript**.

---

## 🇩🇪 Projektübersicht (German Summary)

Das **Smart Club Management System** ist eine Full-Stack-Webanwendung zur Digitalisierung und Verwaltung von Schulclubs. Über ein zentrales Dashboard können Administratoren und Betreuer Schülerdaten, Club-Mitgliedschaften, Veranstaltungen, Anwesenheitslisten, Finanzen und Benachrichtigungen effizient verwalten.

* **Schwerpunkte:** Rollenbasierte Zugriffskontrolle (RBAC), relationale Datenbankmodellierung (MySQL), sichere SQL-Abfragen (Prepared Statements) und MVC-Architektur.
* **Tech-Stack:** Node.js, Express.js, MySQL, EJS, HTML5, CSS3, JavaScript, Git.

---

## 🖼️ Application Preview

> *Tip: Save screenshots of your running application inside `public/images/` and replace the placeholders below to showcase your UI to recruiters:*

* **Admin Dashboard:** `![Dashboard Preview](public/images/dashboard-preview.png)`
* **Membership & Event Management:** `![Events Preview](public/images/events-preview.png)`

---

## ✨ Features

### 🔐 Authentication
* Secure Login & Logout
* Session Management
* Protected Routes & Authentication Middleware
* Role-Based Access Control (RBAC)

### 👨‍🎓 Student Management
* Register Students
* Edit Student Information
* Delete Students
* Search Students
* View Student Profiles

### 🎭 Club Management
* Create Clubs
* Edit Clubs
* Delete Clubs
* Assign Club Patrons
* Registration Fee Management

### 📝 Membership Management
* Join Club & Leave Club Workflows
* Approve Memberships
* Live Membership Statistics

### 📅 Event Management
* Create, Update & Delete Events
* Club Activities Tracking
* Event Scheduling

### ✅ Attendance
* Record Attendance
* Attendance Reports
* Participation Tracking

### 💰 Finance
* Registration Fees Tracking
* Donations Ledger
* Club Expenses Management
* Financial Reports

### 🔔 Notifications
* School Announcements
* Event Notifications
* Membership Updates

### 📊 Dashboard
* Total Students & Total Clubs Overview
* Total Memberships & Total Events Metrics
* Attendance Statistics & Financial Overview

---

## 🛠️ Built With

| Technology | Purpose |
| :--- | :--- |
| **HTML5** | Semantic Page Structure |
| **CSS3** | Responsive Styling & Layout |
| **JavaScript** | Client-Side Logic & Interactivity |
| **EJS** | Server-Side Templating Engine |
| **Node.js** | Runtime Environment |
| **Express.js** | Backend Web Framework |
| **MySQL** | Relational Database |
| **Git & GitHub** | Version Control & Source Code Hosting |

---

## 📂 Project Structure

```text
Smart-Club-Management-System
│
├── config
│   └── db.js                  # MySQL connection configuration
│
├── middleware
│   └── auth.js                # Route protection & role authorization
│
├── public
│   ├── css                    # Custom stylesheets
│   ├── js                     # Client-side scripts
│   ├── images                 # Static assets & UI screenshots
│   └── uploads                # Uploaded files
│
├── routes
│   ├── auth.js                # Login, logout & session endpoints
│   ├── dashboard.js           # Dashboard metrics & analytics
│   ├── students.js            # Student CRUD endpoints
│   ├── clubs.js               # Club management endpoints
│   ├── memberships.js         # Membership approval workflows
│   ├── events.js              # Event scheduling endpoints
│   ├── attendance.js          # Attendance recording & reports
│   ├── finance.js             # Fees, donations & expense tracking
│   └── notifications.js       # System announcements
│
├── views
│   ├── partials               # Reusable header, sidebar & footer templates
│   ├── dashboard.ejs
│   ├── students.ejs
│   ├── clubs.ejs
│   ├── memberships.ejs
│   ├── events.ejs
│   ├── attendance.ejs
│   ├── finance.ejs
│   ├── notifications.ejs
│   └── login.ejs
│
├── database
│   └── victory_school.sql     # Complete MySQL schema & seed data
│
├── app.js                     # Express application entry point
├── package.json
├── package-lock.json
└── README.md
```

---

## 🗄️ Database Tables

The MySQL relational database (`victory_school_membership_system`) includes **9 structured tables**:

* `Users`
* `Students`
* `Clubs`
* `Patrons`
* `Memberships`
* `Events`
* `Attendance`
* `Finance`
* `Notifications`

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
* [Node.js](https://nodejs.org/)
* [MySQL](https://www.mysql.com/) / XAMPP
* [Git](https://git-scm.com/)
* Visual Studio Code

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bowenephraim-svg/Smart-Club-Management-System.git
   ```

2. **Move into the project directory**
   ```bash
   cd Smart-Club-Management-System
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a `.env` file in the root directory**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=victory_school_membership_system

   SESSION_SECRET=your_secret_key

   PORT=3000
   ```

5. **Import the SQL database**
   Create a database named `victory_school_membership_system` in MySQL/phpMyAdmin and import:
   ```text
   database/victory_school.sql
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   *(or `node app.js`)*

7. **Open your browser**
   ```text
   http://localhost:3000
   ```

---

## 🔒 Security Features

* Session-Based Authentication
* Protected Routes & Authentication Middleware
* SQL Parameterized Queries (Prepared Statements against SQL Injection)
* Input Validation & Error Handling

---

## 📈 Future Improvements

* REST API & React Frontend Migration
* Email & SMS Notifications
* QR Code Event Attendance
* PDF & Excel Financial/Attendance Report Exports
* Parent Portal & Club Leader Dashboard
* Mobile Application & Cloud Deployment

---

## 📚 What I Learned

This project strengthened my practical engineering skills in:
* Full-Stack Web Development (Node.js, Express.js, MySQL, EJS)
* Relational Database Design & CRUD Operations
* Session Authentication & Role-Based Security
* MVC Architecture & Modular Routing
* Git & GitHub Version Control
* Responsive UI Design

---

## 🤝 Contributing

Contributions are welcome:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes and commit (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Developer

**Ephraim Bowen**  
Aspiring Software Engineer (*Fachinformatiker für Anwendungsentwicklung*) | Full-Stack Software Developer  
📍 Eldoret, Kenya  
🔗 [GitHub Profile](https://github.com/bowenephraim-svg)

---

## 📄 License

This project is licensed for educational and portfolio purposes.

---

## 🙏 Acknowledgements

Special thanks to:
* **EldoHub Academy**
* My instructors and mentors
* The open-source developer community
* Everyone who contributed ideas and feedback

---

## ⭐ Support

If you found this project useful:
* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report issues or suggest improvements

<p align="center">

**Built with ❤️ using Node.js, Express.js, MySQL & EJS**

</p>
