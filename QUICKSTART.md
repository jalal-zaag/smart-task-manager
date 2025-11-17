# Quick Start Guide - Smart Task Manager API

## Prerequisites
- Node.js (v12 or higher)
- MongoDB (running on localhost:27017 or configured in .env)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - The `.env` file is already created with default settings
   - Update `MONGODB_URI` if your MongoDB is running on a different port
   - Change `JWT_SECRET` to a secure random string in production

3. **Start MongoDB**
   Make sure MongoDB is running:
   ```bash
   sudo systemctl start mongodb
   # or
   sudo service mongodb start
   ```

4. **Run the Application**
   
   Development mode (with auto-restart):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

5. **Test the API**
   The server will run on `http://localhost:5000`
   
   Visit `http://localhost:5000/` to see all available endpoints

## Testing the API with Example Requests

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```
Copy the `token` from the response and use it in subsequent requests.

### 3. Create a Team
```bash
curl -X POST http://localhost:5000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Development Team",
    "members": [
      {
        "name": "Alice",
        "role": "Frontend Developer",
        "capacity": 3
      },
      {
        "name": "Bob",
        "role": "Backend Developer",
        "capacity": 4
      },
      {
        "name": "Charlie",
        "role": "Designer",
        "capacity": 3
      }
    ]
  }'
```

### 4. Create a Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "E-commerce Platform",
    "description": "Build a complete online store",
    "team": "TEAM_ID_FROM_PREVIOUS_STEP"
  }'
```

### 5. Create Tasks
```bash
# High Priority Task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Design Homepage",
    "description": "Create landing page mockups",
    "project": "PROJECT_ID",
    "assignedMember": "ALICE_MEMBER_ID",
    "priority": "High",
    "status": "In Progress"
  }'

# Medium Priority Task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Setup Database",
    "description": "Configure MongoDB schemas",
    "project": "PROJECT_ID",
    "assignedMember": "BOB_MEMBER_ID",
    "priority": "Medium",
    "status": "Pending"
  }'
```

### 6. View Dashboard
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Auto-Reassign Overloaded Tasks
```bash
curl -X POST http://localhost:5000/api/dashboard/reassign-tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Using Postman or Thunder Client

1. Import the API endpoints into your preferred API client
2. Set up an environment variable for the JWT token
3. Use the bearer token authentication for protected routes

## Project Structure

```
smart_task_manager_backend/
├── app.js                      # Main application file
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables
├── .env.example                # Example environment file
├── README.md                   # Complete documentation
├── QUICKSTART.md               # This file
│
├── models/                     # Database models
│   ├── User.js                 # User model with authentication
│   ├── Team.js                 # Team and member model
│   ├── Project.js              # Project model
│   ├── Task.js                 # Task model
│   └── ActivityLog.js          # Activity logging
│
├── controllers/                # Business logic
│   ├── authController.js       # Authentication logic
│   ├── teamController.js       # Team management
│   ├── projectController.js    # Project management
│   ├── taskController.js       # Task management
│   └── dashboardController.js  # Dashboard & reassignment
│
├── routes/                     # API routes
│   ├── authRoutes.js
│   ├── teamRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   └── dashboardRoutes.js
│
└── middleware/                 # Custom middleware
    └── auth.js                 # JWT authentication
```

## Key Features Workflow

### 1. Task Assignment with Capacity Check
When creating a task and assigning to a member:
- System shows current tasks vs capacity
- Warns if member is over capacity
- Allows override or choosing another member

### 2. Auto-Assignment
Use the auto-assign endpoint to automatically assign to the member with least workload:
```bash
POST /api/tasks/:taskId/auto-assign
```

### 3. Smart Reassignment
The reassignment algorithm:
- Finds members with currentTasks > capacity
- Only moves Low and Medium priority tasks
- Keeps High priority tasks with original assignee
- Redistributes to members with available capacity
- Logs all changes

### 4. Activity Tracking
All task assignments and reassignments are logged with:
- Timestamp
- Task title
- From member
- To member
- Action type

## Common Issues & Solutions

### MongoDB Connection Error
- Make sure MongoDB is running
- Check if the port in .env matches your MongoDB port
- Verify MongoDB is accessible at localhost

### JWT Authentication Error
- Make sure you're including the token in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token expires after 30 days, login again if expired

### Port Already in Use
- Change the PORT in .env file
- Or kill the process using port 5000

## Next Steps

1. Test all endpoints with your API client
2. Create a frontend application to consume this API
3. Add more features like:
   - Task comments
   - File attachments
   - Notifications
   - Task due dates
   - Team chat

## Support

For issues or questions, refer to the README.md file for detailed API documentation.
