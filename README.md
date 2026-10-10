name: N.S Joshitha
roll:244m1a05L5

# 🎓 VEMU Student Mid Marks Management System

A full-stack **MERN** web application to manage college **mid-exam marks** for VEMU Institute of Technology (Autonomous). Faculty enter marks, the HOD reviews them, the Admin manages the system, and students view their own results, all in one place.

🔗 **Live Demo:** _add your Vercel link here_

---

## ✨ Features

- 🔐 **Role-based login** for Admin, HOD, Faculty and Student
- 📝 **Faculty:** enter question-wise marks, save as draft, and submit to the HOD
- ⭐ **HOD:** review and approve the marks submitted by faculty
- 🛡️ **Admin:** manage users and academic settings (branches, years, sections, subjects)
- 🎓 **Student:** view own mid marks and totals
- 🧮 **Automatic calculation** of Part A, Part B, written marks, and total
- 📊 **Reports:** download class reports as **Excel** and **PDF**
- 📚 Supports **Year 1 to 4** and **Sections A and B**

---

## 🧮 Marks Structure

| Component | Details | Marks |
|---|---|---|
| Part A | 5 questions × 2 marks | 10 |
| Part B | 3 questions × 10 marks, divided by 2 | 15 |
| **Written Exam** | Part A + Part B | **25** |
| Assignment | Internal work | 5 |
| **Total Internal** | Written + Assignment | **30** |

Final internal marks use the **best of two mids** weightage (80% best mid + 20% other mid).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App), Axios, React Router, React Toastify |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Authentication | JWT (JSON Web Tokens) |
| Reports | Excel and PDF export |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📁 Project Structure

```
marks_of_students/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── AcademicConfig.js
│   │   ├── MidMark.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── faculty.js
│   │   ├── hod.js
│   │   ├── marks.js
│   │   ├── reports.js
│   │   └── student.js
│   ├── seed.js
│   ├── clearmarks.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    └── package.json
```

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js (v18 or above)
- A MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/joshithanoothi/student-mid-marks.git
cd student-mid-marks
```

### 2. Setup the backend
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
```

Add the default users and academic data (run only once, it clears existing users):
```bash
node seed.js
```

Start the server:
```bash
npm start
```

### 3. Setup the frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```

The app opens at **http://localhost:3000**.

---

## 🔑 Demo Login

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin@123` |
| HOD | `hod_cse` | `hod@123` |
| Faculty | `faculty1` | `faculty@123` |
| Student | `22B91A0501` | `student@123` |

> ⚠️ These are demo accounts created by `seed.js`. Change or remove them before real use.

---

## ☁️ Deployment

- **Frontend:** Vercel (Root Directory: `frontend`, environment variable `REACT_APP_API_URL` = backend URL)
- **Backend:** Render (Root Directory: `backend`, add `MONGO_URI` and `JWT_SECRET` as environment variables)
- **Database:** MongoDB Atlas (allow network access from anywhere for Render)

---

## 🔄 Workflow

1. **Faculty** selects Branch, Year, Section, Subject and Mid, then enters marks.
2. Marks are saved as **Draft**, then **Submitted** to the HOD.
3. **HOD** reviews and approves the submitted marks.
4. **Students** see their approved marks and totals.
5. **Admin / Faculty** download Excel and PDF reports.

---

## 👤 Author

**Joshitha Noothi**
GitHub: [@joshithanoothi](https://github.com/joshithanoothi)

---

## 📄 License

This project is built for educational purposes.
