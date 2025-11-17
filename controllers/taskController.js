const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedMember, priority, status } = req.body;

    // Verify project exists and belongs to user
    const projectDoc = await Project.findById(project).populate('team');
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (projectDoc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks in this project'
      });
    }

    let assignedMemberName = 'Unassigned';
    let memberInfo = null;

    // If member is assigned, verify and get member info
    if (assignedMember) {
      const team = await Team.findById(projectDoc.team._id);
      const member = team.members.id(assignedMember);

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      assignedMemberName = member.name;
      
      // Check member capacity
      const currentTaskCount = await Task.countDocuments({
        assignedMember: assignedMember,
        status: { $ne: 'Done' }
      });

      memberInfo = {
        name: member.name,
        currentTasks: currentTaskCount,
        capacity: member.capacity,
        isOverCapacity: currentTaskCount >= member.capacity
      };
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedMember: assignedMember || null,
      assignedMemberName,
      priority: priority || 'Medium',
      status: status || 'Pending',
      owner: req.user._id
    });

    // Log the assignment
    if (assignedMember) {
      await ActivityLog.create({
        action: 'Task Assigned',
        taskTitle: title,
        fromMember: 'Unassigned',
        toMember: assignedMemberName,
        project: project,
        owner: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
      memberInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks?project=&member=&status=&priority=
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const query = { owner: req.user._id };

    // Filter by project
    if (req.query.project) {
      query.project = req.query.project;
    }

    // Filter by assigned member
    if (req.query.member) {
      if (req.query.member === 'unassigned') {
        query.assignedMember = null;
      } else {
        query.assignedMember = req.query.member;
      }
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate('project')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    const oldAssignedMember = task.assignedMember;
    const oldAssignedMemberName = task.assignedMemberName;

    // If assignedMember is being changed
    if (req.body.assignedMember !== undefined && req.body.assignedMember !== oldAssignedMember?.toString()) {
      const project = await Project.findById(task.project._id).populate('team');
      
      if (req.body.assignedMember) {
        const team = await Team.findById(project.team._id);
        const member = team.members.id(req.body.assignedMember);

        if (!member) {
          return res.status(404).json({
            success: false,
            message: 'Team member not found'
          });
        }

        req.body.assignedMemberName = member.name;

        // Log the reassignment
        await ActivityLog.create({
          action: 'Task Reassigned',
          taskTitle: task.title,
          fromMember: oldAssignedMemberName,
          toMember: member.name,
          project: task.project._id,
          owner: req.user._id
        });
      } else {
        req.body.assignedMemberName = 'Unassigned';

        // Log the unassignment
        await ActivityLog.create({
          action: 'Task Unassigned',
          taskTitle: task.title,
          fromMember: oldAssignedMemberName,
          toMember: 'Unassigned',
          project: task.project._id,
          owner: req.user._id
        });
      }
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('project');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Auto-assign task to member with least load
// @route   POST /api/tasks/:id/auto-assign
// @access  Private
exports.autoAssignTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check ownership
    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign this task'
      });
    }

    const project = await Project.findById(task.project._id).populate('team');
    const team = await Team.findById(project.team._id);

    if (team.members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No team members available for assignment'
      });
    }

    // Calculate current tasks for each member
    const membersWithLoad = await Promise.all(
      team.members.map(async (member) => {
        const taskCount = await Task.countDocuments({
          assignedMember: member._id,
          status: { $ne: 'Done' }
        });

        return {
          _id: member._id,
          name: member.name,
          capacity: member.capacity,
          currentTasks: taskCount,
          availableCapacity: member.capacity - taskCount
        };
      })
    );

    // Sort by available capacity (descending)
    membersWithLoad.sort((a, b) => b.availableCapacity - a.availableCapacity);

    const bestMember = membersWithLoad[0];

    const oldAssignedMemberName = task.assignedMemberName;

    task.assignedMember = bestMember._id;
    task.assignedMemberName = bestMember.name;
    await task.save();

    // Log the assignment
    await ActivityLog.create({
      action: 'Task Auto-Assigned',
      taskTitle: task.title,
      fromMember: oldAssignedMemberName,
      toMember: bestMember.name,
      project: task.project._id,
      owner: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Task auto-assigned to ${bestMember.name}`,
      task,
      assignedTo: {
        name: bestMember.name,
        currentTasks: bestMember.currentTasks + 1,
        capacity: bestMember.capacity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
