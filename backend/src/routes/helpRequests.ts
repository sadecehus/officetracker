import { Router, Request, Response } from 'express';
import { auth, authorize, AuthRequest } from '../middleware/auth';
import { HelpRequest } from '../models/HelpRequest';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all help requests
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    let filter = {};

    // Employees see requests they made or can help with
    if (req.user.role === 'Employee') {
      filter = {
        $or: [
          { requestedBy: req.user._id },
          { helpedBy: req.user._id },
          { status: 'Bekliyor' } // Available help requests
        ]
      };
    }

    const helpRequests = await HelpRequest.find(filter)
      .populate('requestedBy', 'name surname email')
      .populate('helpedBy', 'name surname email')
      .populate({
        path: 'taskId',
        populate: {
          path: 'project',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: helpRequests
    });
  } catch (error) {
    console.error('Get help requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get help request by ID
router.get('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate('requestedBy', 'name surname email')
      .populate('helpedBy', 'name surname email')
      .populate({
        path: 'taskId',
        populate: {
          path: 'project assignedTo',
          select: 'name surname email'
        }
      });

    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    res.json({
      success: true,
      data: helpRequest
    });
  } catch (error) {
    console.error('Get help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create help request (Employee only)
router.post('/', [
  auth,
  authorize('Employee'),
  body('taskId').isMongoId(),
  body('message').optional().trim().isLength({ max: 500 })
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

    const { taskId, message } = req.body;

    // Validate task exists and is assigned to requesting user
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request help for your own tasks'
      });
    }

    // Check if there's already an active help request for this task
    const existingRequest = await HelpRequest.findOne({
      taskId,
      status: { $in: ['Bekliyor', 'Kabul Edildi'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active help request for this task'
      });
    }

    const helpRequest = new HelpRequest({
      taskId,
      requestedBy: req.user._id,
      message
    });

    await helpRequest.save();

    // Populate help request data
    await helpRequest.populate('requestedBy', 'name surname email');
    await helpRequest.populate({
      path: 'taskId',
      populate: {
        path: 'project',
        select: 'name'
      }
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Help Request Created',
      details: `Requested help for task: ${task.title}`,
      type: 'info'
    });

    res.status(201).json({
      success: true,
      message: 'Help request created successfully',
      data: helpRequest
    });

  } catch (error) {
    console.error('Create help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Accept help request (Employee only)
router.post('/:id/accept', auth, authorize('Employee'), async (req: AuthRequest, res: Response) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    if (helpRequest.status !== 'Bekliyor') {
      return res.status(400).json({
        success: false,
        message: 'Help request is not available'
      });
    }

    // Can't accept your own help request
    if (helpRequest.requestedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own help request'
      });
    }

    helpRequest.helpedBy = req.user._id;
    helpRequest.status = 'Kabul Edildi';
    await helpRequest.save();

    // Populate data
    await helpRequest.populate('requestedBy', 'name surname email');
    await helpRequest.populate('helpedBy', 'name surname email');

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Help Request Accepted',
      details: `Accepted help request`,
      type: 'success'
    });

    res.json({
      success: true,
      message: 'Help request accepted successfully',
      data: helpRequest
    });

  } catch (error) {
    console.error('Accept help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Complete help request (Employee only)
router.post('/:id/complete', auth, authorize('Employee'), async (req: AuthRequest, res: Response) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    if (helpRequest.status !== 'Kabul Edildi') {
      return res.status(400).json({
        success: false,
        message: 'Help request is not in accepted state'
      });
    }

    // Only the helper or requester can mark as complete
    const canComplete = 
      helpRequest.helpedBy?.toString() === req.user._id.toString() ||
      helpRequest.requestedBy.toString() === req.user._id.toString();

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    helpRequest.status = 'Tamamlandı';
    await helpRequest.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Help Request Completed',
      details: `Completed help request`,
      type: 'success'
    });

    res.json({
      success: true,
      message: 'Help request completed successfully',
      data: helpRequest
    });

  } catch (error) {
    console.error('Complete help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete help request
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: 'Help request not found'
      });
    }

    // Only requester or admin can delete
    const canDelete = 
      helpRequest.requestedBy.toString() === req.user._id.toString() ||
      req.user.role === 'Admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    await HelpRequest.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: 'Help Request Deleted',
      details: `Deleted help request`,
      type: 'warning'
    });

    res.json({
      success: true,
      message: 'Help request deleted successfully'
    });

  } catch (error) {
    console.error('Delete help request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
