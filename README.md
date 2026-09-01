# Habit Tracker

A full-stack habit tracking productivity dashboard designed to help users build consistency and track daily goals.

## 🚀 Tech Stack

- **Frontend**: React, Vite, CSS Custom Properties
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose

## ✨ Key Features

- **Habit CRUD**: Add, Edit, Delete, and Mark habits complete for today.
- **Streak & Analytics**: Current streak (🔥), Best streak (🏆), and Completion percentage rate.
- **Categorization & Priority**: Organize habits by category (*Study*, *Health*, *Fitness*, *Personal*, *Other*) and priority (*Low*, *Medium*, *High*).
- **Dashboard Controls**: Real-time habit search, filtering (*All*, *Completed*, *Remaining*), and sorting (*Newest*, *Oldest*, *Highest Streak*, *Alphabetical*).
- **Weekly Progress & Today's Summary**: Active day tracking for the past 7 days and daily summary cards.
- **Responsive Theme Support**: Dark and Light theme toggle with `localStorage` persistence.

---

## 🛠️ Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### 1. Clone the Repository
```bash
git clone https://github.com/Shelly-Saini/habit-tracker.git
cd habit-tracker
```

### 2. Backend Configuration & Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on `.env.example`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Start the backend development server:
```bash
npm run dev
```
*(The server runs on `http://localhost:5000`)*

### 3. Frontend Setup
In a new terminal window, navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*(The application opens at `http://localhost:5173`)*

---

## 📄 License
This project is open-source and available under the MIT License.


CI webhook test
