const Team = require('../models/Team');
const Task = require('../models/Task');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { name, members } = req.body;

    const team = await Team.create({
      name,
      owner: req.user._id,
      members: members || []
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all teams for logged-in user
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ owner: req.user._id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this team'
      });
    }

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this team'
      });
    }

    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this team'
      });
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members to this team'
      });
    }

    const { name, role, capacity } = req.body;

    team.members.push({
      name,
      role,
      capacity: capacity || 3,
      currentTasks: 0
    });

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update member in team
// @route   PUT /api/teams/:teamId/members/:memberId
// @access  Private
exports.updateMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update members in this team'
      });
    }

    const member = team.members.id(req.params.memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Update member fields
    if (req.body.name) member.name = req.body.name;
    if (req.body.role) member.role = req.body.role;
    if (req.body.capacity !== undefined) member.capacity = req.body.capacity;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:teamId/members/:memberId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members from this team'
      });
    }

    // Remove the member
    team.members.pull(req.params.memberId);
    await team.save();

    // Unassign tasks from this member
    await Task.updateMany(
      { assignedMember: req.params.memberId },
      { 
        assignedMember: null,
        assignedMemberName: 'Unassigned'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get team with member workload
// @route   GET /api/teams/:id/workload
// @access  Private
exports.getTeamWorkload = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this team'
      });
    }

    // Calculate current tasks for each member
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

    res.status(200).json({
      success: true,
      team: {
        _id: team._id,
        name: team.name,
        members: membersWithWorkload
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
