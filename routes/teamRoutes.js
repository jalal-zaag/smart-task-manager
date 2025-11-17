const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addMember,
  updateMember,
  removeMember,
  getTeamWorkload
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.route('/')
  .post(createTeam)
  .get(getTeams);

router.route('/:id')
  .get(getTeam)
  .put(updateTeam)
  .delete(deleteTeam);

router.route('/:id/workload')
  .get(getTeamWorkload);

router.route('/:id/members')
  .post(addMember);

router.route('/:teamId/members/:memberId')
  .put(updateMember)
  .delete(removeMember);

module.exports = router;
