# 🎓 Victory School Smart Club Management System

<p align="center">

![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge)
![MySQL](https://img.shields.io/badge/Database-MySQL-blue?style=for-the-badge)
![EJS](https://img.shields.io/badge/Frontend-EJS-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-Educational-red?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

</p>

---

## 📖 About The Project

The **Victory School Smart Club Management System** is a modern web application designed to digitize the management of school clubs. It enables administrators to efficiently manage students, clubs, memberships, events, attendance, finances, and notifications through a centralized dashboard.

The project was developed to demonstrate practical full-stack software development skills using **Node.js**, **Express.js**, **MySQL**, **EJS**, **HTML**, **CSS**, and **JavaScript**.

---

## ✨ Features

### 🔐 Authentication

* Secure Login
* Logout
* Session Management
* Protected Routes
* Role-Based Access Control

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

* Join Club
* Leave Club
* Approve Memberships
* Membership Statistics

### 📅 Event Management

* Create Events
* Update Events
* Delete Events
* Club Activities
* Event Scheduling

### ✅ Attendance

* Record Attendance
* Attendance Reports
* Participation Tracking

### 💰 Finance

* Registration Fees
* Donations
* Club Expenses
* Financial Reports

### 🔔 Notifications

* School Announcements
* Event Notifications
* Membership Updates

### 📊 Dashboard

* Total Students
* Total Clubs
* Total Memberships
* Total Events
* Attendance Statistics
* Financial Overview

---

# 🖼️ System Preview

> **Add screenshots here after uploading them to your repository.**

```text
📷 Dashboard Screenshot

📷 Students Module

📷 Clubs Module

📷 Events Module

📷 Finance Module
```

---

# 🛠️ Built With

| Technology | Purpose             |
| ---------- | ------------------- |
| HTML5      | Structure           |
| CSS3       | Styling             |
| JavaScript | Client-side Logic   |
| EJS        | Templating Engine   |
| Node.js    | Runtime Environment |
| Express.js | Backend Framework   |
| MySQL      | Database            |
| Git        | Version Control     |
| GitHub     | Source Code Hosting |

---

# 📂 Project Structure

```text
Victory-School-Smart-Club-System
│
├── config
│   └── db.js
│
├── middleware
│   └── auth.js
│
├── public
│   ├── css
│   ├── js
│   ├── images
│   └── uploads
│
├── routes
│   ├── auth.js
│   ├── dashboard.js
│   ├── students.js
│   ├── clubs.js
│   ├── memberships.js
│   ├── events.js
│   ├── attendance.js
│   ├── finance.js
│   └── notifications.js
│
├── views
│   ├── partials
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
│   └── victory_school.sql
│
├── app.js
├── package.json
├── package-lock.json
└── README.md
```

---

# 🗄️ Database Tables

The system includes the following tables:

* Users
* Students
* Clubs
* Patrons
* Memberships
* Events
* Attendance
* Finance
* Notifications

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* MySQL
* Git
* Visual Studio Code
* XAMPP (or another MySQL server)

---

## Installation

Clone the repository

```bash
git clone https://github.com/yourusername/Victory-School-Smart-Club-System.git
```

Move into the project

```bash
cd Victory-School-Smart-Club-System
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=victory_school_membership_system

SESSION_SECRET=your_secret_key

PORT=3000
```

Import the SQL database

```
database/victory_school.sql
```

Start the server

```bash
npm start
```

or

```bash
node app.js
```

Open your browser

```
http://localhost:3000
```

---

# 🔒 Security Features

* Session Authentication
* Route Protection
* SQL Parameterized Queries
* Input Validation
* Error Handling
* Authentication Middleware

---

# 📈 Future Improvements

* Email Notifications
* SMS Integration
* QR Code Attendance
* PDF Report Generation
* Excel Export
* Parent Portal
* Club Leader Dashboard
* Student Portal
* Dark Mode
* Mobile Application
* REST API
* React Frontend
* Cloud Deployment

---

# 📚 What I Learned

This project strengthened my skills in:

* Full Stack Development
* Node.js
* Express.js
* MySQL
* CRUD Operations
* Authentication
* Database Design
* MVC Architecture
* EJS Templates
* Session Management
* Git & GitHub
* Responsive Design

---

# 🤝 Contributing

Contributions are welcome.

If you would like to improve this project:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Commit your changes
5. Push your branch
6. Open a Pull Request

---

# 👨‍💻 Developer

**Ephraim Bowen**

Full Stack Software Development Student

📍 Kenya

---

# 📄 License

This project is licensed for educational and portfolio purposes.

---

# 🙏 Acknowledgements

Special thanks to:

* Eldohub Academy
* My instructors and mentors
* The open-source community
* Everyone who contributed ideas and feedback

---

# ⭐ Support

If you found this project useful:

⭐ Star the repository

🍴 Fork the project

🐛 Report issues

💡 Suggest improvements

---

<p align="center">

**Built with ❤️ using Node.js, Express.js, MySQL & EJS**

</p>
