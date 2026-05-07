const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get tasks
// @route   GET /api/tasks
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getTasks = async (req, res) => {
    try {
        let query;

        if (req.params.projectId) {
            query = Task.find({ project: req.params.projectId }).populate('assignee', 'name email');
        } else {
            // If no project ID, get all tasks for the user (assigned or in their projects)
            query = Task.find({ assignee: req.user.id }).populate('project', 'name').populate('assignee', 'name email');
        }

        const tasks = await query;

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', 'name description')
            .populate('assignee', 'name email');

        if (!task) {
            return res.status(404).json({ success: false, message: `Task not found with id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
    try {
        if (!req.body.project && req.params.projectId) {
            req.body.project = req.params.projectId;
        }

        if (!req.body.project) {
            return res.status(400).json({ success: false, message: 'Please provide a project ID' });
        }

        const project = await Project.findById(req.body.project);

        if (!project) {
            return res.status(404).json({ success: false, message: `Project not found with id of ${req.body.project}` });
        }

        // Make sure user is project owner or admin
        if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to add a task to this project` });
        }

        const task = await Task.create(req.body);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: `Task not found with id of ${req.params.id}` });
        }

        const project = await Project.findById(task.project);
        const isOwnerOrAdmin = project && (project.owner.toString() === req.user.id || req.user.role === 'admin');
        const isAssignee = task.assignee && task.assignee.toString() === req.user.id;

        if (!isOwnerOrAdmin && !isAssignee) {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to update this task` });
        }

        // If only assignee, they can only update status
        if (!isOwnerOrAdmin && isAssignee) {
            const allowedUpdates = ['status'];
            const updates = Object.keys(req.body);
            const isValidOperation = updates.every(update => allowedUpdates.includes(update));
            if (!isValidOperation) {
                return res.status(403).json({ success: false, message: 'Members can only update task status' });
            }
        }

        // Handle completedAt timestamp
        if (req.body.status) {
            if (req.body.status === 'done' && task.status !== 'done') {
                req.body.completedAt = new Date();
            } else if (req.body.status !== 'done' && task.status === 'done') {
                req.body.completedAt = null;
            }
        }

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: `Task not found with id of ${req.params.id}` });
        }

        const project = await Project.findById(task.project);
        if (project && project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: `User ${req.user.id} is not authorized to delete a task in this project` });
        }

        await task.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
