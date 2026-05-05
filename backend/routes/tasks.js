const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// GET /api/tasks — Get tasks (filtered by project, user, status)
router.get('/', protect, async (req, res) => {
  try {
    const { project, assignedTo, status, priority, overdue } = req.query;
    let filter = {};

    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Non-admin users only see tasks in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.project = project
        ? (projectIds.map(String).includes(project) ? project : null)
        : { $in: projectIds };

      if (filter.project === null) {
        return res.json({ tasks: [] });
      }
    }

    let tasks = await Task.find(filter)
      .populate('project', 'title color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    // Filter overdue
    if (overdue === 'true') {
      const now = new Date();
      tasks = tasks.filter(
        (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
      );
    }

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/dashboard — Dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    let projectFilter = {};
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      projectFilter = { project: { $in: userProjects.map((p) => p._id) } };
    }

    const now = new Date();

    const [total, todo, inProgress, done, overdue, recentTasks] = await Promise.all([
      Task.countDocuments(projectFilter),
      Task.countDocuments({ ...projectFilter, status: 'todo' }),
      Task.countDocuments({ ...projectFilter, status: 'in-progress' }),
      Task.countDocuments({ ...projectFilter, status: 'done' }),
      Task.countDocuments({
        ...projectFilter,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
      }),
      Task.find(projectFilter)
        .populate('project', 'title color')
        .populate('assignedTo', 'name avatar')
        .sort({ updatedAt: -1 })
        .limit(8),
    ]);

    res.json({
      stats: { total, todo, inProgress, done, overdue },
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id — Get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title color members owner')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check access
    if (req.user.role !== 'admin') {
      const isMember = task.project.members?.some(
        (m) => m.toString() === req.user._id.toString()
      );
      if (!isMember) return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks — Create task (admin only)
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 150 }),
    body('project').notEmpty().withMessage('Project is required').isMongoId(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date'),
    body('assignedTo').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // Only admins can create tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

    try {
      const proj = await Project.findById(project);
      if (!proj) return res.status(404).json({ message: 'Project not found' });

      // Validate assignee is a project member
      if (assignedTo) {
        const isMember = proj.members.some((m) => m.toString() === assignedTo);
        if (!isMember) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
      }

      const task = await Task.create({
        title,
        description,
        project,
        assignedTo: assignedTo || null,
        createdBy: req.user._id,
        status,
        priority,
        dueDate,
      });

      await task.populate('project', 'title color');
      await task.populate('assignedTo', 'name email avatar');
      await task.populate('createdBy', 'name email avatar');

      res.status(201).json({ message: 'Task created', task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/tasks/:id — Update task
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().notEmpty().isLength({ min: 3, max: 150 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
    body('assignedTo').optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const task = await Task.findById(req.params.id).populate('project');
      if (!task) return res.status(404).json({ message: 'Task not found' });

      // Members can only update status of their assigned tasks
      if (req.user.role !== 'admin') {
        const isAssigned = task.assignedTo?.toString() === req.user._id.toString();
        const isMember = task.project.members?.some(
          (m) => m.toString() === req.user._id.toString()
        );

        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        // Members can only update status
        if (Object.keys(req.body).some((k) => k !== 'status')) {
          return res.status(403).json({ message: 'Members can only update task status' });
        }
      }

      const { title, description, status, priority, dueDate, assignedTo } = req.body;

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

      await task.save();
      await task.populate('project', 'title color');
      await task.populate('assignedTo', 'name email avatar');
      await task.populate('createdBy', 'name email avatar');

      res.json({ message: 'Task updated', task });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/tasks/:id — Delete task (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
