const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    // Get total projects
    const totalProjects = await Project.countDocuments({ owner: req.user._id });

    // Get total tasks
    const totalTasks = await Task.countDocuments({ owner: req.user._id });

    // Get tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { owner: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get all teams with member workload
    const teams = await Team.find({ owner: req.user._id });
    
    const teamSummary = await Promise.all(
      teams.map(async (team) => {
        const membersWithWorkload = await Promise.all(
          team.members.map(async (member) => {
            const taskCount = await Task.countDocuments({
              assignedMember: member._id,
              status: { $ne: 'Done' }
            });

            return {
              _id: member._id,
              name: member.name,
              role: member.role,
              capacity: member.capacity,
              currentTasks: taskCount,
              isOverloaded: taskCount > member.capacity
            };
          })
        );

        return {
          teamId: team._id,
          teamName: team.name,
          members: membersWithWorkload
        };
      })
    );

    // Get recent activity logs (last 10)
    const recentActivity = await ActivityLog.find({ owner: req.user._id })
      .sort('-timestamp')
      .limit(10)
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      dashboard: {
        totalProjects,
        totalTasks,
        tasksByStatus,
        teamSummary,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reassign overloaded tasks automatically
// @route   POST /api/dashboard/reassign-tasks
// @access  Private
exports.reassignTasks = async (req, res) => {
  try {
    const reassignments = [];
    
    // Get all teams for the user
    const teams = await Team.find({ owner: req.user._id });

    for (const team of teams) {
      // Get projects linked to this team
      const projects = await Project.find({ team: team._id, owner: req.user._id });

      if (projects.length === 0) continue;

      // Calculate current workload for each member
      const membersWithLoad = await Promise.all(
        team.members.map(async (member) => {
          const tasks = await Task.find({
            assignedMember: member._id,
            status: { $ne: 'Done' },
            project: { $in: projects.map(p => p._id) }
          });

          return {
            _id: member._id,
            name: member.name,
            capacity: member.capacity,
            currentTasks: tasks.length,
            tasks: tasks
          };
        })
      );

      // Find overloaded members (currentTasks > capacity)
      const overloadedMembers = membersWithLoad.filter(m => m.currentTasks > m.capacity);

      if (overloadedMembers.length === 0) continue;

      // For each overloaded member, move Low and Medium priority tasks
      for (const overloadedMember of overloadedMembers) {
        const tasksToMove = overloadedMember.tasks.filter(
          task => task.priority !== 'High'
        ).sort((a, b) => {
          // Sort by priority: Low first, then Medium
          const priorityOrder = { 'Low': 0, 'Medium': 1 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        const excessTaskCount = overloadedMember.currentTasks - overloadedMember.capacity;

        // Move tasks until member is no longer overloaded
        for (let i = 0; i < Math.min(tasksToMove.length, excessTaskCount); i++) {
          const taskToMove = tasksToMove[i];

          // Find a member with available capacity
          const availableMember = membersWithLoad.find(m => 
            m._id.toString() !== overloadedMember._id.toString() &&
            m.currentTasks < m.capacity
          );

          if (!availableMember) break; // No available members

          // Reassign the task
          taskToMove.assignedMember = availableMember._id;
          taskToMove.assignedMemberName = availableMember.name;
          await taskToMove.save();

          // Log the reassignment
          await ActivityLog.create({
            action: 'Task Auto-Reassigned',
            taskTitle: taskToMove.title,
            fromMember: overloadedMember.name,
            toMember: availableMember.name,
            project: taskToMove.project,
            owner: req.user._id
          });

          // Update local counts
          overloadedMember.currentTasks--;
          availableMember.currentTasks++;

          reassignments.push({
            task: taskToMove.title,
            from: overloadedMember.name,
            to: availableMember.name
          });
        }
      }
    }

    if (reassignments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No tasks needed reassignment',
        reassignments: []
      });
    }

    res.status(200).json({
      success: true,
      message: `${reassignments.length} task(s) reassigned successfully`,
      reassignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/dashboard/activity
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const activityLogs = await ActivityLog.find({ owner: req.user._id })
      .sort('-timestamp')
      .limit(limit)
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      count: activityLogs.length,
      activityLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
