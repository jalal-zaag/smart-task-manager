# Smart Task Manager API# NodeJS Softlab IT API



A comprehensive task management system with intelligent task assignment and workload balancing features.This project was generated with Node Js & MongoDB.

(Based on Angular 8)

## Features

## Development By

- **User Authentication**: Register and login with JWT authentication

- **Team Management**: Create teams and add members with capacity settings (0-5 tasks)Md Iqbal Hossen Sazib.

- **Project Management**: Create projects linked to specific teams

- **Task Management**: Full CRUD operations with filtering by project, member, status, and priorityEmail: ikbal.sazib@gmail.com

- **Smart Assignment**: Auto-assign tasks to members with the least workload

- **Auto-Reassignment**: Intelligently redistribute overloaded tasks while respecting priority levels## Code copyright

- **Dashboard**: View statistics, team workload, and activity logs@SoftLab IT & Software

- **Activity Logging**: Track all task assignments and reassignments


## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/smart_task_manager
JWT_SECRET=your-secret-key
PORT=5000
```

5. Make sure MongoDB is running on your system

6. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Teams
- `POST /api/teams` - Create a team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get single team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/:id/workload` - Get team with member workload
- `POST /api/teams/:id/members` - Add member to team
- `PUT /api/teams/:teamId/members/:memberId` - Update member
- `DELETE /api/teams/:teamId/members/:memberId` - Remove member

### Projects
- `POST /api/projects` - Create a project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/tasks` - Create a task
- `GET /api/tasks` - Get all tasks (supports filters: ?project=&member=&status=&priority=)
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/auto-assign` - Auto-assign task to member with least load

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics
- `POST /api/dashboard/reassign-tasks` - Auto-reassign overloaded tasks
- `GET /api/dashboard/activity` - Get activity logs

## Usage Examples

### Register a User
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Create a Team
```bash
POST /api/teams
Authorization: Bearer YOUR_JWT_TOKEN
{
  "name": "Development Team",
  "members": [
    {
      "name": "Alice",
      "role": "Frontend Developer",
      "capacity": 4
    },
    {
      "name": "Bob",
      "role": "Backend Developer",
      "capacity": 3
    }
  ]
}
```

### Create a Project
```bash
POST /api/projects
Authorization: Bearer YOUR_JWT_TOKEN
{
  "name": "E-commerce Website",
  "description": "Build an online store",
  "team": "TEAM_ID"
}
```

### Create a Task
```bash
POST /api/tasks
Authorization: Bearer YOUR_JWT_TOKEN
{
  "title": "Design landing page",
  "description": "Create mockups for homepage",
  "project": "PROJECT_ID",
  "assignedMember": "MEMBER_ID",
  "priority": "High",
  "status": "Pending"
}
```

### Reassign Overloaded Tasks
```bash
POST /api/dashboard/reassign-tasks
Authorization: Bearer YOUR_JWT_TOKEN
```

This will automatically:
- Check all team members for overload (currentTasks > capacity)
- Move Low and Medium priority tasks to members with available capacity
- Keep High priority tasks with original assignee
- Log all reassignments in the activity log

## Key Features Explained

### Task Assignment Flow
When creating a task, you can:
1. Manually select a team member (system shows their current load vs capacity)
2. Get a warning if the member is over capacity
3. Use auto-assign to pick the member with the least workload

### Auto-Reassignment Algorithm
The reassignment feature:
- Identifies members with more tasks than their capacity
- Only moves Low and Medium priority tasks
- Keeps High priority tasks with current assignee
- Distributes to members with available capacity
- Records all changes in the Activity Log

### Dashboard Insights
The dashboard provides:
- Total projects and tasks
- Tasks grouped by status
- Team summary with member workload (marks overloaded members)
- Recent reassignments and activity logs

## License

ISC
