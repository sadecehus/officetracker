import { Router, Request, Response } from 'express';
import { auth, authorize, AuthRequest } from '../middleware/auth';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all projects
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    let filter = {};
    
    // Employees only see projects they are assigned to
    if (req.user.role === 'Employee') {
      filter = { assignedEmployees: req.user._id };
    }

    const projects = await Project.find(filter)
      .populate('assignedEmployees', 'name surname email role')
      .populate('createdBy', 'name surname email')
      .populate('tasks')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get project by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedEmployees', 'name surname email role')
      .populate('createdBy', 'name surname email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo assignedBy',
          select: 'name surname email'
        }
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if employee is assigned to project
    if (req.user.role === 'Employee') {
      const isAssigned = project.assignedEmployees.some(
        emp => emp._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden'
        });
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create project (Manager/Admin only)
router.post('/', [
  auth,
  authorize('Manager', 'Admin'),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('deadline').isISO8601().toDate(),
  body('assignedEmployees').optional().isArray()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description, deadline, assignedEmployees = [] } = req.body;

    // Validate assigned employees
    if (assignedEmployees.length > 0) {
      const employees = await User.find({
        _id: { $in: assignedEmployees },
        role: 'Employee',
        status: 'Aktif'
      });
      
      if (employees.length !== assignedEmployees.length) {
        return res.status(400).json({
          success: false,
          message: 'Some assigned employees are invalid'
        });
      }
    }

    const project = new Project({
      name,
      description,
      deadline,
      assignedEmployees,
      createdBy: req.user._id
    });

    await project.save();

    // Populate project data
    await project.populate('assignedEmployees', 'name surname email role');
    await project.populate('createdBy', 'name surname email');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Project Created',
      details: `Created new project: ${name}`,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update project (Manager/Admin only)
router.put('/:id', [
  auth,
  authorize('Manager', 'Admin'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('deadline').optional().isISO8601().toDate(),
  body('status').optional().isIn(['Aktif', 'Tamamlandı', 'Beklemede']),
  body('progress').optional().isInt({ min: 0, max: 100 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedEmployees', 'name surname email role')
      .populate('createdBy', 'name surname email');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Project Updated',
      details: `Updated project: ${updatedProject?.name}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Assign employee to project
router.post('/:id/assign', [
  auth,
  authorize('Manager', 'Admin'),
  body('employeeId').isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { employeeId } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: 'Employee',
      status: 'Aktif'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    // Check if already assigned
    if (project.assignedEmployees.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Employee already assigned to this project'
      });
    }

    project.assignedEmployees.push(employeeId);
    await project.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Employee Assigned',
      details: `Assigned ${employee.name} ${employee.surname} to project: ${project.name}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Employee assigned to project successfully'
    });

  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete project (Manager/Admin only)
router.delete('/:id', auth, authorize('Manager', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete all tasks related to this project
    await Task.deleteMany({ project: req.params.id });

    await Project.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Project Deleted',
      details: `Deleted project: ${project.name}`,
      type: 'warning'
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
