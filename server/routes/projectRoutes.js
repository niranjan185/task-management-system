const express = require('express');
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// Include other resource routers
const taskRouter = require('./taskRoutes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:projectId/tasks', taskRouter);

router
    .route('/')
    .get(protect, getProjects)
    .post(protect, authorize('admin'), createProject);

router
    .route('/:id')
    .get(protect, getProject)
    .put(protect, authorize('admin'), updateProject)
    .delete(protect, authorize('admin'), deleteProject);

module.exports = router;
