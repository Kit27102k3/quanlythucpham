import CustomerLog from '../Model/CustomerLog.js';

/**
 * Controller for customer log operations
 */
export const customerLogController = {
  /**
   * Get all logs with pagination and filtering
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getAllLogs: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        action, 
        status, 
        startDate, 
        endDate,
        customerId,
        customerEmail,
        sort = 'timestamp',
        order = -1
      } = req.query;

      // Build filter
      const filter = {};
      
      if (action) filter.action = action;
      if (status) filter.status = status;
      if (customerId) filter.customerId = customerId;
      if (customerEmail) filter.customerEmail = { $regex: customerEmail, $options: 'i' };
      
      // Date range filter
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Sort options
      const sortOptions = {};
      sortOptions[sort] = parseInt(order);

      // Get logs
      const logs = await CustomerLog.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // Get total count for pagination
      const total = await CustomerLog.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving logs',
        error: error.message
      });
    }
  },

  /**
   * Get logs for a specific customer
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getCustomerLogs: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20, action, status } = req.query;

      // Build filter
      const filter = { customerId };
      if (action) filter.action = action;
      if (status) filter.status = status;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get logs
      const logs = await CustomerLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // Get total count for pagination
      const total = await CustomerLog.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting customer logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving customer logs',
        error: error.message
      });
    }
  },

  /**
   * Get logs by action type
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getLogsByAction: async (req, res) => {
    try {
      const { action } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      // Build filter
      const filter = { action };
      if (status) filter.status = status;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get logs
      const logs = await CustomerLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // Get total count for pagination
      const total = await CustomerLog.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting logs by action:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving logs by action',
        error: error.message
      });
    }
  },

  /**
   * Get logs by status
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getLogsByStatus: async (req, res) => {
    try {
      const { status } = req.params;
      const { page = 1, limit = 20, action } = req.query;

      // Build filter
      const filter = { status };
      if (action) filter.action = action;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get logs
      const logs = await CustomerLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec();

      // Get total count for pagination
      const total = await CustomerLog.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting logs by status:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving logs by status',
        error: error.message
      });
    }
  },

  /**
   * Get log statistics
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getLogStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Date range filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.timestamp = {};
        if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
        if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
      }

      // Get statistics
      const stats = await Promise.all([
        // Total logs
        CustomerLog.countDocuments(dateFilter),
        
        // Logs by action
        CustomerLog.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // Logs by status
        CustomerLog.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        // Failed login attempts
        CustomerLog.countDocuments({ 
          ...dateFilter, 
          action: 'login', 
          status: 'failed' 
        }),
        
        // Successful logins
        CustomerLog.countDocuments({ 
          ...dateFilter, 
          action: 'login', 
          status: 'success' 
        })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          total: stats[0],
          byAction: stats[1],
          byStatus: stats[2],
          failedLogins: stats[3],
          successfulLogins: stats[4]
        }
      });
    } catch (error) {
      console.error('Error getting log statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving log statistics',
        error: error.message
      });
    }
  },

  /**
   * Delete logs older than a certain date
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  deleteOldLogs: async (req, res) => {
    try {
      const { olderThan } = req.body;
      
      if (!olderThan) {
        return res.status(400).json({
          success: false,
          message: 'Missing olderThan parameter'
        });
      }

      const date = new Date(olderThan);
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      const result = await CustomerLog.deleteMany({
        timestamp: { $lt: date }
      });

      return res.status(200).json({
        success: true,
        message: `Deleted ${result.deletedCount} logs older than ${date.toISOString()}`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting old logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting old logs',
        error: error.message
      });
    }
  }
};

export default customerLogController; 