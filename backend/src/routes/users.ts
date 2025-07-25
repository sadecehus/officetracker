import { Router, Request, Response } from 'express';
import { auth, authorize, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { ActivityLog } from '../models/ActivityLog';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all users (Admin/Manager only)
router.get('/', auth, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only see their own profile unless they are Admin
    if (req.user.role !== 'Admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get employee statistics (Manager/Admin only)
router.get('/employees/statistics', auth, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    // Get all employees
    const employees = await User.find({ role: 'Employee', status: 'Aktif' }).select('-password');
    
    const employeeStats = await Promise.all(employees.map(async (employee) => {
      // Get all tasks assigned to this employee
      const allTasks = await Task.find({ 
        assignedTo: { $in: [employee._id] } 
      });
      
      // Calculate statistics
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(task => task.status === 'Tamamlandı').length;
      const activeTasks = allTasks.filter(task => task.status === 'Devam Ediyor').length;
      const pendingTasks = allTasks.filter(task => task.status === 'Bekliyor').length;
      
      // Calculate average progress
      const avgProgress = totalTasks > 0 
        ? Math.round(allTasks.reduce((total, task) => total + task.progress, 0) / totalTasks)
        : 0;
      
      // Get overdue tasks
      const overdueTasks = allTasks.filter(task => 
        task.status !== 'Tamamlandı' && 
        new Date(task.deadline) < new Date()
      ).length;
      
      // Get tasks completed this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const tasksCompletedThisMonth = allTasks.filter(task => 
        task.status === 'Tamamlandı' && 
        new Date(task.updatedAt) >= firstDayOfMonth
      ).length;
      
      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          surname: employee.surname,
          email: employee.email,
          role: employee.role,
          status: employee.status
        },
        statistics: {
          totalTasks,
          completedTasks,
          activeTasks,
          pendingTasks,
          overdueTasks,
          tasksCompletedThisMonth,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          avgProgress
        }
      };
    }));
    
    // Sort by total tasks descending
    employeeStats.sort((a, b) => b.statistics.totalTasks - a.statistics.totalTasks);
    
    res.json({
      success: true,
      data: employeeStats
    });
  } catch (error) {
    console.error('Get employee statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create user (Admin/Manager only)
router.post('/', [
  auth,
  authorize('Admin', 'Manager'),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('surname').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['Admin', 'Manager', 'Employee'])
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

    const { name, surname, email, password, role } = req.body;

    // Manager can only create Employee users
    if (req.user.role === 'Manager' && role !== 'Employee') {
      return res.status(403).json({
        success: false,
        message: 'Managers can only create Employee users'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      surname,
      email,
      password: hashedPassword,
      role,
      status: 'Aktif'
    });

    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'User Created',
      details: `Created new user: ${name} ${surname} (${role})`,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('surname').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['Admin', 'Manager', 'Employee']),
  body('status').optional().isIn(['Aktif', 'Pasif'])
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const isOwnProfile = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    // Only admin can change role and status
    if (!isAdmin && (req.body.role || req.body.status)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change role or status'
      });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Password should be updated separately

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'User Updated',
      details: `Updated user: ${updatedUser?.name} ${updatedUser?.surname}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, authorize('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'User Deleted',
      details: `Deleted user: ${user.name} ${user.surname}`,
      type: 'warning'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
