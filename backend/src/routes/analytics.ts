import { Router, Request, Response } from 'express';
import { auth, authorize, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { HelpRequest } from '../models/HelpRequest';

const router = Router();

// Get general analytics (Admin/Manager only)
router.get('/', auth, authorize('Admin', 'Manager'), async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalHelpRequests,
      completedHelpRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'Employee', status: 'Aktif' }),
      Project.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Tamamlandı' }),
      Task.countDocuments({ status: 'Bekliyor' }),
      Task.countDocuments({ status: 'Devam Ediyor' }),
      HelpRequest.countDocuments(),
      HelpRequest.countDocuments({ status: 'Tamamlandı' })
    ]);

    // Project status distribution
    const projectStatusStats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Task priority distribution
    const taskPriorityStats = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly task completion trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTaskStats = await Task.aggregate([
      {
        $match: {
          updatedAt: { $gte: sixMonthsAgo },
          status: 'Tamamlandı'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top performers (employees with most completed tasks)
    const topPerformers = await Task.aggregate([
      {
        $match: { status: 'Tamamlandı' }
      },
      {
        $group: {
          _id: '$assignedTo',
          completedTasks: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          completedTasks: 1,
          name: '$user.name',
          surname: '$user.surname',
          email: '$user.email'
        }
      },
      {
        $sort: { completedTasks: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      helpRequests: {
        total: totalHelpRequests,
        completed: completedHelpRequests,
        completionRate: totalHelpRequests > 0 ? Math.round((completedHelpRequests / totalHelpRequests) * 100) : 0
      },
      distributions: {
        projectStatus: projectStatusStats,
        taskPriority: taskPriorityStats
      },
      trends: {
        monthlyTaskCompletion: monthlyTaskStats
      },
      performance: {
        topPerformers
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user-specific analytics
router.get('/user/:userId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Check permissions
    if (req.user.role === 'Employee' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalHelpRequests,
      helpedOthers
    ] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'Tamamlandı' }),
      Task.countDocuments({ assignedTo: userId, status: 'Bekliyor' }),
      Task.countDocuments({ assignedTo: userId, status: 'Devam Ediyor' }),
      HelpRequest.countDocuments({ requestedBy: userId }),
      HelpRequest.countDocuments({ helpedBy: userId, status: 'Tamamlandı' })
    ]);

    // Task priority distribution for this user
    const taskPriorityStats = await Task.aggregate([
      {
        $match: { assignedTo: user._id }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly task completion for this user (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Task.aggregate([
      {
        $match: {
          assignedTo: user._id,
          updatedAt: { $gte: sixMonthsAgo },
          status: 'Tamamlandı'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Recent activity
    const recentTasks = await Task.find({ assignedTo: userId })
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const userAnalytics = {
      user: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      helpStats: {
        requested: totalHelpRequests,
        helpedOthers
      },
      distributions: {
        taskPriority: taskPriorityStats
      },
      trends: {
        monthlyCompletion: monthlyStats
      },
      recentActivity: recentTasks
    };

    res.json({
      success: true,
      data: userAnalytics
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
