const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

// GET /api/projects — Get all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar role')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({ members: req.user._id })
        .populate('owner', 'name email avatar')
        .populate('members', 'name email avatar role')
        .sort({ createdAt: -1 });
    }

    // Add task count to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const completedCount = await Task.countDocuments({ project: project._id, status: 'done' });
        return {
          ...project.toObject(),
          taskCount,
          completedCount,
        };
      })
    );

    res.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id — Get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects — Create project (admin only)
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('deadline').optional().isISO8601().withMessage('Invalid date format'),
    body('color').optional().isHexColor().withMessage('Invalid color'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, deadline, color, members } = req.body;

    try {
      const memberIds = members
        ? [...new Set([req.user._id.toString(), ...members])]
        : [req.user._id];

      // Validate all member IDs exist
      const validMembers = await User.find({ _id: { $in: memberIds } });
      if (validMembers.length !== memberIds.length) {
        return res.status(400).json({ message: 'One or more member IDs are invalid' });
      }

      const project = await Project.create({
        title,
        description,
        deadline,
        color,
        owner: req.user._id,
        members: memberIds,
      });

      await project.populate('owner', 'name email avatar');
      await project.populate('members', 'name email avatar role');

      res.status(201).json({ message: 'Project created', project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/projects/:id — Update project (admin only)
router.put(
  '/:id',
  protect,
  adminOnly,
  [
    body('title').optional().trim().notEmpty().isLength({ min: 3, max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('status').optional().isIn(['active', 'archived']),
    body('deadline').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const { title, description, status, deadline, color } = req.body;
      if (title) project.title = title;
      if (description !== undefined) project.description = description;
      if (status) project.status = status;
      if (deadline !== undefined) project.deadline = deadline;
      if (color) project.color = color;

      await project.save();
      await project.populate('owner', 'name email avatar');
      await project.populate('members', 'name email avatar role');

      res.json({ message: 'Project updated', project });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/projects/:id/members — Add member (admin only)
router.post('/:id/members', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.members.includes(userId)) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email avatar role');

    res.json({ message: 'Member added', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId — Remove member (admin only)
router.delete('/:id/members/:userId', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id — Delete project (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Delete all tasks in this project
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
