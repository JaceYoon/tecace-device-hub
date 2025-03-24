
# Tecace Device Management System

A comprehensive device management system for tracking, requesting, and managing company devices.

## Project Description

Tecace Device Management System is a full-stack web application designed to help companies manage their device inventory. The system allows users to:

- Track devices (status, location, specifications)
- Request devices
- Approve or reject device requests
- View device history
- Manage users and permissions
- Export device data

## Project Structure

This project consists of two main components:

1. **Frontend**: React application with TypeScript, Tailwind CSS, and shadcn/ui
2. **Backend**: Express.js server with MariaDB/MySQL database using Sequelize ORM

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16.x or later)
- npm (v8.x or later)
- MariaDB or MySQL database

## Setup Instructions

### Step 1: Clone the repository

```bash
git clone <repository-url>
cd tecace-device-management
```

### Step 2: Set up the database

1. Create a new MariaDB/MySQL database
2. Create a `.env` file in the `server` directory by copying the `.env.example` file:

```bash
cd server
cp .env.example .env
```

3. Update the database configuration in the `.env` file:

```
DB_HOST=localhost
DB_USER=your_database_username
DB_PASS=your_database_password
DB_NAME=tecace_device_management
DB_PORT=3306
```

### Step 3: Install dependencies

Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 4: Start the application

You can use the convenience script to start both frontend and backend:

```bash
node start.js
```

If you encounter issues with the start script, you can start both services separately:

```bash
# Start the backend (from the root directory)
cd server
npm run dev

# Start the frontend (in a new terminal, from the root directory)
npm run dev
```

## Default Admin Account

After starting the server for the first time, a default admin account is created:

- Email: admin@tecace.com
- Password: admin123

**Important**: Change the default admin password after first login for security.

## Ports

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

## Available API Endpoints

- Authentication: `/api/auth`
- Devices: `/api/devices`
- Users: `/api/users`

## Features

- **Dashboard**: Overview of device status and recent activities
- **Device Management**: Add, edit, delete, and export devices
- **User Management**: Manage user accounts and permissions
- **Request Management**: Request devices and approve/reject requests
- **Profile Management**: Update user profile information

## Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui components
  - React Query for data fetching
  - React Router for navigation
  - React Hook Form for form handling

- **Backend**:
  - Express.js
  - Sequelize ORM
  - MariaDB/MySQL
  - Passport.js for authentication
  - bcrypt for password hashing
  - Express Session for session management

## Development Notes

- The application uses React Query for efficient data fetching and caching
- Authentication is handled using session-based authentication with Passport.js
- Database schema is managed using Sequelize models

## Troubleshooting

- If you encounter connection issues with the database, verify your database credentials in the `.env` file
- For CORS issues, check the CORS configuration in `server.js`
- For authentication issues, ensure the session is configured properly
- If you encounter issues with ES modules vs. CommonJS, check that your start.js script matches your project configuration (type: "module" in package.json)
- If you get "Error: spawn npm ENOENT" when running start.js, it means npm executable is not found in your PATH:
  - On Windows, try using `node start.js` from a terminal with admin privileges
  - Make sure npm is properly installed and available in your PATH
  - As an alternative, start the frontend and backend separately as described in the "Start the application" section

## Environment Variables

### Frontend
No specific environment variables are required for the frontend.

### Backend
Required environment variables in `server/.env`:

- `PORT`: Server port (default: 5000)
- `CLIENT_URL`: Frontend URL (default: http://localhost:8080)
- `SESSION_SECRET`: Secret for session encryption
- Database configuration:
  - `DB_HOST`: Database host
  - `DB_USER`: Database username
  - `DB_PASS`: Database password
  - `DB_NAME`: Database name
  - `DB_PORT`: Database port
- Optional:
  - `RESET_DATABASE`: Set to "true" to reset the database on startup
  - `NODE_ENV`: Set to "production" for production environment
