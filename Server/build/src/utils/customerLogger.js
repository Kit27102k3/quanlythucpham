"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _CustomerLog = _interopRequireDefault(require("../Model/CustomerLog.js"));

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
      return await _CustomerLog.default.createLog(logData);
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
      return await _CustomerLog.default.getCustomerLogs(customerId, limit);
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
      return await _CustomerLog.default.getLogsByAction(action, limit);
    } catch (error) {
      console.error('Error fetching logs by action:', error);
      return [];
    }
  }
}var _default = exports.default =

CustomerLogger;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQ3VzdG9tZXJMb2ciLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIkN1c3RvbWVyTG9nZ2VyIiwibG9nIiwibG9nRGF0YSIsIkN1c3RvbWVyTG9nIiwiY3JlYXRlTG9nIiwiZXJyb3IiLCJjb25zb2xlIiwibG9naW5TdWNjZXNzIiwiZGF0YSIsImN1c3RvbWVySWQiLCJjdXN0b21lckVtYWlsIiwiZW1haWwiLCJhY3Rpb24iLCJzdGF0dXMiLCJpcCIsInVzZXJBZ2VudCIsInNlc3Npb25JZCIsImRldGFpbHMiLCJtZXRob2QiLCJ0aW1lc3RhbXAiLCJEYXRlIiwibG9naW5GYWlsZWQiLCJyZWFzb24iLCJhdHRlbXB0cyIsImxvZ291dCIsInJlZ2lzdHJhdGlvbiIsIm9yZGVyUGxhY2VkIiwib3JkZXJJZCIsImFtb3VudCIsIml0ZW1zIiwicGF5bWVudCIsInBheW1lbnRJZCIsInByb2R1Y3RWaWV3IiwicHJvZHVjdElkIiwicHJvZHVjdE5hbWUiLCJjYXRlZ29yeSIsImdldEN1c3RvbWVyTG9ncyIsImxpbWl0IiwiZ2V0TG9nc0J5QWN0aW9uIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9jdXN0b21lckxvZ2dlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ3VzdG9tZXJMb2cgZnJvbSAnLi4vTW9kZWwvQ3VzdG9tZXJMb2cuanMnO1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdHkgY2xhc3MgZm9yIGxvZ2dpbmcgY3VzdG9tZXIgYWN0aXZpdGllc1xyXG4gKi9cclxuY2xhc3MgQ3VzdG9tZXJMb2dnZXIge1xyXG4gIC8qKlxyXG4gICAqIExvZyBhIGN1c3RvbWVyIGFjdGl2aXR5XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGxvZ0RhdGEgLSBUaGUgbG9nIGRhdGFcclxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3RJZH0gW2xvZ0RhdGEuY3VzdG9tZXJJZF0gLSBDdXN0b21lciBJRCAob3B0aW9uYWwpXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsb2dEYXRhLmN1c3RvbWVyRW1haWxdIC0gQ3VzdG9tZXIgZW1haWwgKG9wdGlvbmFsKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsb2dEYXRhLmFjdGlvbiAtIEFjdGlvbiBwZXJmb3JtZWQgKHJlcXVpcmVkKVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbG9nRGF0YS5zdGF0dXM9J3N1Y2Nlc3MnXSAtIFN0YXR1cyBvZiB0aGUgYWN0aW9uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtsb2dEYXRhLmRldGFpbHM9e31dIC0gQWRkaXRpb25hbCBkZXRhaWxzIGFib3V0IHRoZSBhY3Rpb25cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xvZ0RhdGEuaXBdIC0gSVAgYWRkcmVzc1xyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbG9nRGF0YS51c2VyQWdlbnRdIC0gVXNlciBhZ2VudCBzdHJpbmdcclxuICAgKiBAcGFyYW0ge09iamVjdH0gW2xvZ0RhdGEuZGV2aWNlSW5mb10gLSBEZXZpY2UgaW5mb3JtYXRpb25cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xvZ0RhdGEuc2Vzc2lvbklkXSAtIFNlc3Npb24gSURcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3R8bnVsbD59IFRoZSBjcmVhdGVkIGxvZyBvciBudWxsIGlmIGVycm9yXHJcbiAgICovXHJcbiAgc3RhdGljIGFzeW5jIGxvZyhsb2dEYXRhKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXR1cm4gYXdhaXQgQ3VzdG9tZXJMb2cuY3JlYXRlTG9nKGxvZ0RhdGEpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gQ3VzdG9tZXJMb2dnZXIubG9nOicsIGVycm9yKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2cgYSBzdWNjZXNzZnVsIGxvZ2luXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBMb2dpbiBkYXRhXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0fG51bGw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBhc3luYyBsb2dpblN1Y2Nlc3MoZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMubG9nKHtcclxuICAgICAgY3VzdG9tZXJJZDogZGF0YS5jdXN0b21lcklkLFxyXG4gICAgICBjdXN0b21lckVtYWlsOiBkYXRhLmVtYWlsLFxyXG4gICAgICBhY3Rpb246ICdsb2dpbicsXHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICBpcDogZGF0YS5pcCxcclxuICAgICAgdXNlckFnZW50OiBkYXRhLnVzZXJBZ2VudCxcclxuICAgICAgc2Vzc2lvbklkOiBkYXRhLnNlc3Npb25JZCxcclxuICAgICAgZGV0YWlsczoge1xyXG4gICAgICAgIG1ldGhvZDogZGF0YS5tZXRob2QgfHwgJ3Bhc3N3b3JkJyxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2cgYSBmYWlsZWQgbG9naW4gYXR0ZW1wdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gTG9naW4gYXR0ZW1wdCBkYXRhXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0fG51bGw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBhc3luYyBsb2dpbkZhaWxlZChkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sb2coe1xyXG4gICAgICBjdXN0b21lckVtYWlsOiBkYXRhLmVtYWlsLCAvLyBDw7MgdGjhu4Mga2jDtG5nIGPDsyBjdXN0b21lcklkIHbDrCDEkcSDbmcgbmjhuq1wIHRo4bqldCBi4bqhaVxyXG4gICAgICBhY3Rpb246ICdsb2dpbicsXHJcbiAgICAgIHN0YXR1czogJ2ZhaWxlZCcsXHJcbiAgICAgIGlwOiBkYXRhLmlwLFxyXG4gICAgICB1c2VyQWdlbnQ6IGRhdGEudXNlckFnZW50LFxyXG4gICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgcmVhc29uOiBkYXRhLnJlYXNvbiB8fCAnaW52YWxpZF9jcmVkZW50aWFscycsXHJcbiAgICAgICAgbWV0aG9kOiBkYXRhLm1ldGhvZCB8fCAncGFzc3dvcmQnLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcclxuICAgICAgICBhdHRlbXB0czogZGF0YS5hdHRlbXB0cyB8fCAxXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTG9nIGEgbG9nb3V0IGV2ZW50XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBMb2dvdXQgZGF0YVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdHxudWxsPn1cclxuICAgKi9cclxuICBzdGF0aWMgYXN5bmMgbG9nb3V0KGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLmxvZyh7XHJcbiAgICAgIGN1c3RvbWVySWQ6IGRhdGEuY3VzdG9tZXJJZCxcclxuICAgICAgY3VzdG9tZXJFbWFpbDogZGF0YS5lbWFpbCxcclxuICAgICAgYWN0aW9uOiAnbG9nb3V0JyxcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIGlwOiBkYXRhLmlwLFxyXG4gICAgICB1c2VyQWdlbnQ6IGRhdGEudXNlckFnZW50LFxyXG4gICAgICBzZXNzaW9uSWQ6IGRhdGEuc2Vzc2lvbklkLFxyXG4gICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgcmVhc29uOiBkYXRhLnJlYXNvbiB8fCAndXNlcl9pbml0aWF0ZWQnLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvZyBhIHJlZ2lzdHJhdGlvbiBldmVudFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUmVnaXN0cmF0aW9uIGRhdGFcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3R8bnVsbD59XHJcbiAgICovXHJcbiAgc3RhdGljIGFzeW5jIHJlZ2lzdHJhdGlvbihkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sb2coe1xyXG4gICAgICBjdXN0b21lcklkOiBkYXRhLmN1c3RvbWVySWQsXHJcbiAgICAgIGN1c3RvbWVyRW1haWw6IGRhdGEuZW1haWwsXHJcbiAgICAgIGFjdGlvbjogJ3JlZ2lzdGVyJyxcclxuICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyB8fCAnc3VjY2VzcycsXHJcbiAgICAgIGlwOiBkYXRhLmlwLFxyXG4gICAgICB1c2VyQWdlbnQ6IGRhdGEudXNlckFnZW50LFxyXG4gICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgbWV0aG9kOiBkYXRhLm1ldGhvZCB8fCAnZW1haWwnLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvZyBhbiBvcmRlciBwbGFjZW1lbnRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIE9yZGVyIGRhdGFcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxPYmplY3R8bnVsbD59XHJcbiAgICovXHJcbiAgc3RhdGljIGFzeW5jIG9yZGVyUGxhY2VkKGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLmxvZyh7XHJcbiAgICAgIGN1c3RvbWVySWQ6IGRhdGEuY3VzdG9tZXJJZCxcclxuICAgICAgY3VzdG9tZXJFbWFpbDogZGF0YS5lbWFpbCxcclxuICAgICAgYWN0aW9uOiAnb3JkZXJfcGxhY2VkJyxcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIGlwOiBkYXRhLmlwLFxyXG4gICAgICB1c2VyQWdlbnQ6IGRhdGEudXNlckFnZW50LFxyXG4gICAgICBkZXRhaWxzOiB7XHJcbiAgICAgICAgb3JkZXJJZDogZGF0YS5vcmRlcklkLFxyXG4gICAgICAgIGFtb3VudDogZGF0YS5hbW91bnQsXHJcbiAgICAgICAgaXRlbXM6IGRhdGEuaXRlbXMsXHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTG9nIGEgcGF5bWVudCBldmVudFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUGF5bWVudCBkYXRhXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8T2JqZWN0fG51bGw+fVxyXG4gICAqL1xyXG4gIHN0YXRpYyBhc3luYyBwYXltZW50KGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLmxvZyh7XHJcbiAgICAgIGN1c3RvbWVySWQ6IGRhdGEuY3VzdG9tZXJJZCxcclxuICAgICAgY3VzdG9tZXJFbWFpbDogZGF0YS5lbWFpbCxcclxuICAgICAgYWN0aW9uOiAncGF5bWVudCcsXHJcbiAgICAgIHN0YXR1czogZGF0YS5zdGF0dXMgfHwgJ3N1Y2Nlc3MnLFxyXG4gICAgICBpcDogZGF0YS5pcCxcclxuICAgICAgdXNlckFnZW50OiBkYXRhLnVzZXJBZ2VudCxcclxuICAgICAgZGV0YWlsczoge1xyXG4gICAgICAgIG9yZGVySWQ6IGRhdGEub3JkZXJJZCxcclxuICAgICAgICBwYXltZW50SWQ6IGRhdGEucGF5bWVudElkLFxyXG4gICAgICAgIGFtb3VudDogZGF0YS5hbW91bnQsXHJcbiAgICAgICAgbWV0aG9kOiBkYXRhLm1ldGhvZCxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb2cgYSBwcm9kdWN0IHZpZXdcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFZpZXcgZGF0YVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdHxudWxsPn1cclxuICAgKi9cclxuICBzdGF0aWMgYXN5bmMgcHJvZHVjdFZpZXcoZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMubG9nKHtcclxuICAgICAgY3VzdG9tZXJJZDogZGF0YS5jdXN0b21lcklkLFxyXG4gICAgICBjdXN0b21lckVtYWlsOiBkYXRhLmVtYWlsLFxyXG4gICAgICBhY3Rpb246ICd2aWV3X3Byb2R1Y3QnLFxyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgaXA6IGRhdGEuaXAsXHJcbiAgICAgIHVzZXJBZ2VudDogZGF0YS51c2VyQWdlbnQsXHJcbiAgICAgIGRldGFpbHM6IHtcclxuICAgICAgICBwcm9kdWN0SWQ6IGRhdGEucHJvZHVjdElkLFxyXG4gICAgICAgIHByb2R1Y3ROYW1lOiBkYXRhLnByb2R1Y3ROYW1lLFxyXG4gICAgICAgIGNhdGVnb3J5OiBkYXRhLmNhdGVnb3J5LFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBsb2dzIGZvciBhIHNwZWNpZmljIGN1c3RvbWVyXHJcbiAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0SWR9IGN1c3RvbWVySWQgLSBDdXN0b21lciBJRFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbGltaXQ9NTBdIC0gTWF4aW11bSBudW1iZXIgb2YgbG9ncyB0byByZXRyaWV2ZVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5Pn0gQXJyYXkgb2YgbG9nIGVudHJpZXNcclxuICAgKi9cclxuICBzdGF0aWMgYXN5bmMgZ2V0Q3VzdG9tZXJMb2dzKGN1c3RvbWVySWQsIGxpbWl0ID0gNTApIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiBhd2FpdCBDdXN0b21lckxvZy5nZXRDdXN0b21lckxvZ3MoY3VzdG9tZXJJZCwgbGltaXQpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgY3VzdG9tZXIgbG9nczonLCBlcnJvcik7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBsb2dzIGJ5IGFjdGlvbiB0eXBlXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiAtIEFjdGlvbiB0eXBlXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtsaW1pdD01MF0gLSBNYXhpbXVtIG51bWJlciBvZiBsb2dzIHRvIHJldHJpZXZlXHJcbiAgICogQHJldHVybnMge1Byb21pc2U8QXJyYXk+fSBBcnJheSBvZiBsb2cgZW50cmllc1xyXG4gICAqL1xyXG4gIHN0YXRpYyBhc3luYyBnZXRMb2dzQnlBY3Rpb24oYWN0aW9uLCBsaW1pdCA9IDUwKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICByZXR1cm4gYXdhaXQgQ3VzdG9tZXJMb2cuZ2V0TG9nc0J5QWN0aW9uKGFjdGlvbiwgbGltaXQpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgbG9ncyBieSBhY3Rpb246JywgZXJyb3IpO1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDdXN0b21lckxvZ2dlcjsgIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsWUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU1DLGNBQWMsQ0FBQztFQUNuQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsYUFBYUMsR0FBR0EsQ0FBQ0MsT0FBTyxFQUFFO0lBQ3hCLElBQUk7TUFDRixPQUFPLE1BQU1DLG9CQUFXLENBQUNDLFNBQVMsQ0FBQ0YsT0FBTyxDQUFDO0lBQzdDLENBQUMsQ0FBQyxPQUFPRyxLQUFLLEVBQUU7TUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsOEJBQThCLEVBQUVBLEtBQUss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QUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxhQUFhWSxXQUFXQSxDQUFDeEIsSUFBSSxFQUFFO0lBQzdCLE9BQU8sSUFBSSxDQUFDUCxHQUFHLENBQUM7TUFDZFEsVUFBVSxFQUFFRCxJQUFJLENBQUNDLFVBQVU7TUFDM0JDLGFBQWEsRUFBRUYsSUFBSSxDQUFDRyxLQUFLO01BQ3pCQyxNQUFNLEVBQUUsY0FBYztNQUN0QkMsTUFBTSxFQUFFLFNBQVM7TUFDakJDLEVBQUUsRUFBRU4sSUFBSSxDQUFDTSxFQUFFO01BQ1hDLFNBQVMsRUFBRVAsSUFBSSxDQUFDTyxTQUFTO01BQ3pCRSxPQUFPLEVBQUU7UUFDUGdCLFNBQVMsRUFBRXpCLElBQUksQ0FBQ3lCLFNBQVM7UUFDekJDLFdBQVcsRUFBRTFCLElBQUksQ0FBQzBCLFdBQVc7UUFDN0JDLFFBQVEsRUFBRTNCLElBQUksQ0FBQzJCLFFBQVE7UUFDdkJoQixTQUFTLEVBQUUsSUFBSUMsSUFBSSxDQUFDO01BQ3RCO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsYUFBYWdCLGVBQWVBLENBQUMzQixVQUFVLEVBQUU0QixLQUFLLEdBQUcsRUFBRSxFQUFFO0lBQ25ELElBQUk7TUFDRixPQUFPLE1BQU1sQyxvQkFBVyxDQUFDaUMsZUFBZSxDQUFDM0IsVUFBVSxFQUFFNEIsS0FBSyxDQUFDO0lBQzdELENBQUMsQ0FBQyxPQUFPaEMsS0FBSyxFQUFFO01BQ2RDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLCtCQUErQixFQUFFQSxLQUFLLENBQUM7TUFDckQsT0FBTyxFQUFFO0lBQ1g7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxhQUFhaUMsZUFBZUEsQ0FBQzFCLE1BQU0sRUFBRXlCLEtBQUssR0FBRyxFQUFFLEVBQUU7SUFDL0MsSUFBSTtNQUNGLE9BQU8sTUFBTWxDLG9CQUFXLENBQUNtQyxlQUFlLENBQUMxQixNQUFNLEVBQUV5QixLQUFLLENBQUM7SUFDekQsQ0FBQyxDQUFDLE9BQU9oQyxLQUFLLEVBQUU7TUFDZEMsT0FBTyxDQUFDRCxLQUFLLENBQUMsZ0NBQWdDLEVBQUVBLEtBQUssQ0FBQztNQUN0RCxPQUFPLEVBQUU7SUFDWDtFQUNGO0FBQ0YsQ0FBQyxJQUFBa0MsUUFBQSxHQUFBQyxPQUFBLENBQUFDLE9BQUE7O0FBRWN6QyxjQUFjIiwiaWdub3JlTGlzdCI6W119