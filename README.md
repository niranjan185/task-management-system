# Team Task Manager MVP

A fully functional, production-ready MVP for a Team Task Manager built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS.

## Features

*   **Authentication & Authorization**: Secure JWT-based authentication with bcrypt password hashing.
*   **Role-Based Access Control (RBAC)**:
    *   `Admin`: Full access to create, update, and delete projects.
    *   `Member`: Can view assigned projects and manage tasks within them.
*   **Project Management**: Admins can create projects and view all projects. Members can view projects they own or are members of.
*   **Task Management**: Create tasks, assign them to projects, update their status (Todo, In Progress, Done), and delete them.
*   **Responsive UI**: Clean, modern interface built with Tailwind CSS.

## Tech Stack

*   **Frontend**: React, Vite, React Router, Axios, Tailwind CSS, Lucide React (icons).
*   **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt.
*   **Deployment**: Railway

## Project Structure

This is a monorepo containing both the frontend and backend:
*   `/client`: Vite React frontend.
*   `/server`: Express/Node.js backend.

## Local Setup Instructions

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Instance (e.g., MongoDB Atlas)

### 1. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add the environment variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   ```
4. Start the development server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
*(Note: The Vite config includes a proxy that routes `/api` requests to `http://localhost:5000` during development).*

## Environment Variables

### Backend (`server/.env`)
*   `MONGO_URI`: The connection string for your MongoDB database.
*   `JWT_SECRET`: A secret string used to sign JSON Web Tokens. Keep this secure!
*   `PORT`: The port the backend server runs on (defaults to 5000).

### Frontend (Production Only)
*   `VITE_API_URL`: During deployment, you will need to set this environment variable or configure Axios to point to the deployed backend URL.

## Deployment Steps (Railway)

We recommend deploying the frontend and backend as two separate services on Railway from the same repository.

### Backend Deployment
1. In Railway, click **New > GitHub Repo** and select your repository.
2. Go to the service settings and set the **Root Directory** to `/server`.
3. Under the **Variables** tab, add `MONGO_URI` and `JWT_SECRET`.
4. Railway will automatically detect the Node.js environment and start the server using `npm start` (ensure you have `"start": "node server.js"` in your `server/package.json`, or Railway will just run `node server.js`).

### Frontend Deployment
1. In Railway, add another service from the same GitHub Repo.
2. Go to the service settings and set the **Root Directory** to `/client`.
3. Railway will detect Vite and automatically build the project (`npm run build`).
4. **Important Configuration**:
    *   Update `client/src/services/api.js` to point to your backend Railway URL in production.
    *   Example: 
      ```javascript
      const api = axios.create({
          baseURL: import.meta.env.VITE_API_URL || '/api'
      });
      ```
    *   Set the `VITE_API_URL` environment variable in Railway to your backend service's public domain (e.g., `https://your-backend.up.railway.app/api`).

## Deployment Checklist

- [ ] Ensure MongoDB Atlas network access allows connections from anywhere (0.0.0.0/0) so Railway can connect.
- [ ] Ensure `JWT_SECRET` is strong and generated securely for production.
- [ ] Add `"start": "node server.js"` to the scripts in `server/package.json`.
- [ ] Update frontend `api.js` to use `import.meta.env.VITE_API_URL` for production routing.
- [ ] Deploy backend service on Railway and generate a public domain.
- [ ] Deploy frontend service on Railway, setting the `VITE_API_URL` environment variable.

## Final Commands Summary

**Install all dependencies:**
```bash
# In /server
npm install
# In /client
npm install
```

**Run locally:**
```bash
# Terminal 1 (Backend)
cd server && node server.js

# Terminal 2 (Frontend)
cd client && npm run dev
```

**Build frontend for production:**
```bash
cd client && npm run build
```

## Deployment Troubleshooting

*   **Vite Build Fails on Railway**: Railway automatically detects Vite and runs `npm run build`. If it fails, ensure you don't have any strict Typescript errors (we use JavaScript here, so it should be fine). 
*   **API Requests Failing in Production**: Ensure `VITE_API_URL` is set correctly in your frontend service's variables on Railway. It must be the exact HTTPS URL of your backend service (e.g., `https://my-backend-production.up.railway.app/api`).
*   **Database Connection Errors**: If your backend crashes immediately on deployment, it is almost always because the `MONGO_URI` is either missing in the Railway variables, or your MongoDB Atlas instance restricts IP addresses. Go to Atlas > Network Access > Add IP Address > "Allow Access from Anywhere".
*   **CORS Issues**: The Express backend currently uses `app.use(cors())` which allows all origins. This is safe for an MVP and prevents CORS errors between your Railway frontend and backend.
