import CustomerLog from '../Model/CustomerLog.js';

/**
 * Utility class for logging customer activities
 */
class CustomerLogger {
  /**
   * Log a customer activity
   * @param {Object} logData - The log data
   * @param {string|ObjectId} [logData.customerId] - Customer ID (optional)
   * @param {string} [logData.customerEmail] - Customer email (optional)
   * @param {string} logData.action - Action performed (required)
   * @param {string} [logData.status='success'] - Status of the action
   * @param {Object} [logData.details={}] - Additional details about the action
   * @param {string} [logData.ip] - IP address
   * @param {string} [logData.userAgent] - User agent string
   * @param {Object} [logData.deviceInfo] - Device information
   * @param {string} [logData.sessionId] - Session ID
   * @returns {Promise<Object|null>} The created log or null if error
   */
  static async log(logData) {
    try {
      return await CustomerLog.createLog(logData);
    } catch (error) {
      console.error('Error in CustomerLogger.log:', error);
      return null;
    }
  }

  /**
   * Log a successful login
   * @param {Object} data - Login data
   * @returns {Promise<Object|null>}
   */
  static async loginSuccess(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'login',
      status: 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
      details: {
        method: data.method || 'password',
        timestamp: new Date()
      }
    });
  }

  /**
   * Log a failed login attempt
   * @param {Object} data - Login attempt data
   * @returns {Promise<Object|null>}
   */
  static async loginFailed(data) {
    return this.log({
      customerEmail: data.email, // Có thể không có customerId vì đăng nhập thất bại
      action: 'login',
      status: 'failed',
      ip: data.ip,
      userAgent: data.userAgent,
      details: {
        reason: data.reason || 'invalid_credentials',
        method: data.method || 'password',
        timestamp: new Date(),
        attempts: data.attempts || 1
      }
    });
  }

  /**
   * Log a logout event
   * @param {Object} data - Logout data
   * @returns {Promise<Object|null>}
   */
  static async logout(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'logout',
      status: 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      sessionId: data.sessionId,
      details: {
        reason: data.reason || 'user_initiated',
        timestamp: new Date()
      }
    });
  }

  /**
   * Log a registration event
   * @param {Object} data - Registration data
   * @returns {Promise<Object|null>}
   */
  static async registration(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'register',
      status: data.status || 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      details: {
        method: data.method || 'email',
        timestamp: new Date()
      }
    });
  }

  /**
   * Log an order placement
   * @param {Object} data - Order data
   * @returns {Promise<Object|null>}
   */
  static async orderPlaced(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'order_placed',
      status: 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      details: {
        orderId: data.orderId,
        amount: data.amount,
        items: data.items,
        timestamp: new Date()
      }
    });
  }

  /**
   * Log a payment event
   * @param {Object} data - Payment data
   * @returns {Promise<Object|null>}
   */
  static async payment(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'payment',
      status: data.status || 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      details: {
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: data.amount,
        method: data.method,
        timestamp: new Date()
      }
    });
  }

  /**
   * Log a product view
   * @param {Object} data - View data
   * @returns {Promise<Object|null>}
   */
  static async productView(data) {
    return this.log({
      customerId: data.customerId,
      customerEmail: data.email,
      action: 'view_product',
      status: 'success',
      ip: data.ip,
      userAgent: data.userAgent,
      details: {
        productId: data.productId,
        productName: data.productName,
        category: data.category,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get logs for a specific customer
   * @param {string|ObjectId} customerId - Customer ID
   * @param {number} [limit=50] - Maximum number of logs to retrieve
   * @returns {Promise<Array>} Array of log entries
   */
  static async getCustomerLogs(customerId, limit = 50) {
    try {
      return await CustomerLog.getCustomerLogs(customerId, limit);
    } catch (error) {
      console.error('Error fetching customer logs:', error);
      return [];
    }
  }

  /**
   * Get logs by action type
   * @param {string} action - Action type
   * @param {number} [limit=50] - Maximum number of logs to retrieve
   * @returns {Promise<Array>} Array of log entries
   */
  static async getLogsByAction(action, limit = 50) {
    try {
      return await CustomerLog.getLogsByAction(action, limit);
    } catch (error) {
      console.error('Error fetching logs by action:', error);
      return [];
    }
  }
}

export default CustomerLogger; 