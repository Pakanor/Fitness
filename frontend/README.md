![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-MIT-green)

# FitnessApp Frontend

React frontend for the FitnessApp full-stack fitness tracking application. Provides user interface for calorie monitoring and  exercise tracking,

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Connecting to Backend](#connecting-to-backend)
- [Future Improvements](#future-improvements)

## Features

- User login and registration
- Email verification flow
- Calorie & nutrition tracking
- Exercise selection and logging
- Dashboard with daily totals and history
- Responsive UI and smooth animations

## Tech Stack

- **React 19.1.0**
- **React Router 7.6.1**
- **Material-UI 7.1.1**
- **Axios 1.9.0**
- **Framer Motion 12.16.0**
- **JWT Decode 4.0.0**

## Project Structure


```fitness-app/
├── frontend/
│ ├── public/
│ 
│ 
│ ├── src/
│ │ ├── api/ # API service layers
│ ├── components/ # Reusable components
│ ├── features/ # Feature-specific components
│ ├── hooks/ # Custom hooks (AuthContext)
│ ├── pages/ # Page components
│   ├── App.jsx
│   └── index.js
│ ├── package.json
│ └── README.md
```

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
cd frontend
npm install
npm start

Frontend will run on: http://localhost:3000

Build for Production
npm run build
Usage
Navigate to /register to create an account
Verify your email via link
Login at /login
Access Calorie Tracker and Exercise pages
View dashboards and daily summaries
Connecting to Backend

This frontend communicates with the YARP Gateway (port 8000), which routes to:
- AuthAPI (Port 5010)
- ExerciseAPI (Port 5185)
- BackendLogicApi (Port 5142)

See the backend repository for API documentation:
Backend Repository

Authentication uses HttpOnly cookies - no manual token management required:

```javascript
// Axios requests automatically include cookies
const response = await axios.post('/api/auth/login', formData);
// Token is stored as __Host-FitnessApp-Auth cookie automatically
```
Future Improvements
Dark mode toggle
Mobile optimization
Offline caching
Enhanced error messages and form validations