const express = require('express');
const router = express.Router();
const {
  getDashboard,
  reassignTasks,
  getActivityLogs
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.get('/', getDashboard);
router.post('/reassign-tasks', reassignTasks);
router.get('/activity', getActivityLogs);

module.exports = router;
