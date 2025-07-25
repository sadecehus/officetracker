import { Router, Request, Response } from 'express';
import { auth, authorize, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { body, validationResult } from 'express-validator';
import { updateProjectProgress } from '../utils/projectProgress';

const router = Router();

// Get all tasks
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    let filter = {};
    
    // Employees only see their assigned tasks
    if (req.user.role === 'Employee') {
      filter = { assignedTo: { $in: [req.user._id] } }; // Array içinde arama
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name surname email')
      .populate('assignedBy', 'name surname email')
      .populate('project', 'name description')
      .sort({ deadline: 1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get my tasks (for current user)
router.get('/my', auth, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ assignedTo: { $in: [req.user._id] } }) // Array içinde arama
      .populate('assignedBy', 'name surname email')
      .populate('project', 'name description')
      .sort({ deadline: 1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get task by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name surname email')
      .populate('assignedBy', 'name surname email')
      .populate('project', 'name description');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if employee can access this task
    if (req.user.role === 'Employee' && !task.assignedTo.some(userId => userId.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create task (Manager/Admin only)
router.post('/', [
  auth,
  authorize('Manager', 'Admin'),
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('project').isMongoId(),
  body('assignedTo').isArray().withMessage('assignedTo must be an array'),
  body('assignedTo.*').isMongoId().withMessage('Each assignedTo must be a valid user ID'),
  body('priority').isIn(['Düşük', 'Orta', 'Yüksek']),
  body('deadline').isISO8601().toDate()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => {
        const field = (error as any).path || (error as any).param
        switch (field) {
          case 'title':
            return 'Görev başlığı 5-200 karakter arasında olmalıdır'
          case 'description':
            return 'Görev açıklaması 10-1000 karakter arasında olmalıdır'
          case 'project':
            return 'Geçerli bir proje seçilmelidir'
          case 'assignedTo':
            return 'Geçerli çalışanlar seçilmelidir'
          case 'priority':
            return 'Öncelik Düşük, Orta veya Yüksek olmalıdır'
          case 'deadline':
            return 'Geçerli bir tarih girilmelidir'
          default:
            return error.msg
        }
      })
      
      return res.status(400).json({
        success: false,
        message: `Validation errors: ${errorMessages.join(', ')}`,
        errors: errors.array()
      });
    }

    const { title, description, project, assignedTo, priority, deadline } = req.body;

    // Validate project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate assigned users (array)
    const assignedUsers = await User.find({
      _id: { $in: assignedTo },
      role: 'Employee',
      status: 'Aktif'
    });

    if (assignedUsers.length !== assignedTo.length) {
      return res.status(404).json({
        success: false,
        message: 'Some assigned users not found or inactive'
      });
    }

    // Check if all users are assigned to the project
    const unassignedUsers = assignedTo.filter((userId: string) => 
      !projectDoc.assignedEmployees.some(empId => empId.toString() === userId)
    );

    if (unassignedUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some users are not assigned to this project'
      });
    }

    const task = new Task({
      title,
      description,
      project,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline
    });

    await task.save();

    // Add task to project
    projectDoc.tasks.push(task._id as any);
    await projectDoc.save();

    // Populate task data
    await task.populate('assignedTo', 'name surname email');
    await task.populate('assignedBy', 'name surname email');
    await task.populate('project', 'name description');

    // Log activity
    const assignedUserNames = assignedUsers.map(user => `${user.name} ${user.surname}`).join(', ');
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Task Created',
      details: `Created task: ${title} for ${assignedUserNames}`,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update task
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('priority').optional().isIn(['Düşük', 'Orta', 'Yüksek']),
  body('status').optional().isIn(['Bekliyor', 'Devam Ediyor', 'Tamamlandı']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('deadline').optional().isISO8601().toDate()
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

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    const canEdit = 
      req.user.role === 'Admin' ||
      req.user.role === 'Manager' ||
      task.assignedTo.some(userId => userId.toString() === req.user._id.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    // Employees can only update progress and status
    if (req.user.role === 'Employee') {
      const allowedFields = ['progress', 'status'];
      const updateFields = Object.keys(req.body);
      const hasInvalidField = updateFields.some(field => !allowedFields.includes(field));
      
      if (hasInvalidField) {
        return res.status(403).json({
          success: false,
          message: 'Employees can only update progress and status'
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name surname email')
      .populate('assignedBy', 'name surname email')
      .populate('project', 'name description');

    // Update project progress if task progress changed
    if (req.body.progress !== undefined || req.body.status !== undefined) {
      await updateProjectProgress(task.project);
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Task Updated',
      details: `Updated task: ${updatedTask?.title}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete task (Manager/Admin only)
router.delete('/:id', auth, authorize('Manager', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Remove task from project
    await Project.findByIdAndUpdate(
      task.project,
      { $pull: { tasks: task._id } }
    );

    await Task.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Task Deleted',
      details: `Deleted task: ${task.title}`,
      type: 'warning'
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
