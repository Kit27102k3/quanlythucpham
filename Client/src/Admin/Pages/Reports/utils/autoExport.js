import { exportToPDF, exportToExcel } from './reportUtils';
import { toast } from 'sonner';

/**
 * Configuration options for auto export
 * @typedef {Object} AutoExportConfig
 * @property {string} reportId - ID of the report to export
 * @property {string} format - Export format ('pdf' or 'excel')
 * @property {string} frequency - How often to export ('daily', 'weekly', 'monthly')
 * @property {string} [time] - Time of day to export (HH:MM format)
 * @property {boolean} [active] - Whether this auto export is active
 * @property {string} [email] - Email to send the report to (optional)
 */

/**
 * Store for auto export configurations
 * @type {AutoExportConfig[]}
 */
const autoExportConfigs = [];

/**
 * Load saved auto export configurations from localStorage
 */
export const loadAutoExportConfigs = () => {
  try {
    const savedConfigs = localStorage.getItem('autoExportConfigs');
    if (savedConfigs) {
      const parsedConfigs = JSON.parse(savedConfigs);
      autoExportConfigs.length = 0;
      autoExportConfigs.push(...parsedConfigs);
    }
  } catch (error) {
    console.error('Error loading auto export configs:', error);
  }
  return [...autoExportConfigs];
};

/**
 * Save auto export configurations to localStorage
 */
export const saveAutoExportConfigs = () => {
  try {
    localStorage.setItem('autoExportConfigs', JSON.stringify(autoExportConfigs));
  } catch (error) {
    console.error('Error saving auto export configs:', error);
  }
};

/**
 * Add a new auto export configuration
 * @param {AutoExportConfig} config - The configuration to add
 * @returns {AutoExportConfig[]} - Updated list of configurations
 */
export const addAutoExportConfig = (config) => {
  const newConfig = {
    id: Date.now().toString(),
    ...config,
    active: true,
    lastExport: null
  };
  
  autoExportConfigs.push(newConfig);
  saveAutoExportConfigs();
  scheduleAutoExport(newConfig);
  
  return [...autoExportConfigs];
};

/**
 * Update an existing auto export configuration
 * @param {string} id - ID of the configuration to update
 * @param {Partial<AutoExportConfig>} updates - The updates to apply
 * @returns {AutoExportConfig[]} - Updated list of configurations
 */
export const updateAutoExportConfig = (id, updates) => {
  const index = autoExportConfigs.findIndex(config => config.id === id);
  if (index !== -1) {
    autoExportConfigs[index] = {
      ...autoExportConfigs[index],
      ...updates
    };
    saveAutoExportConfigs();
    
    // Reschedule if active state or timing changed
    if (autoExportConfigs[index].active) {
      scheduleAutoExport(autoExportConfigs[index]);
    }
  }
  return [...autoExportConfigs];
};

/**
 * Delete an auto export configuration
 * @param {string} id - ID of the configuration to delete
 * @returns {AutoExportConfig[]} - Updated list of configurations
 */
export const deleteAutoExportConfig = (id) => {
  const index = autoExportConfigs.findIndex(config => config.id === id);
  if (index !== -1) {
    autoExportConfigs.splice(index, 1);
    saveAutoExportConfigs();
  }
  return [...autoExportConfigs];
};

/**
 * Schedule automatic export based on configuration
 * @param {AutoExportConfig} config - The export configuration
 */
export const scheduleAutoExport = (config) => {
  if (!config.active) return;
  
  // For demonstration purposes, we'll use setTimeout to simulate scheduling
  // In a real application, you would use a more robust scheduling mechanism
  const now = new Date();
  let nextExportTime;
  
  switch (config.frequency) {
    case 'daily':
      // Set next export time to specified time today or tomorrow if that time has passed
      nextExportTime = new Date();
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        nextExportTime.setHours(hours, minutes, 0, 0);
        if (nextExportTime < now) {
          nextExportTime.setDate(nextExportTime.getDate() + 1);
        }
      } else {
        // Default to midnight if no time specified
        nextExportTime.setHours(0, 0, 0, 0);
        nextExportTime.setDate(nextExportTime.getDate() + 1);
      }
      break;
      
    case 'weekly':
      // Set next export time to specified time next Monday
      nextExportTime = new Date();
      nextExportTime.setDate(now.getDate() + (8 - now.getDay()) % 7);
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        nextExportTime.setHours(hours, minutes, 0, 0);
      } else {
        nextExportTime.setHours(0, 0, 0, 0);
      }
      break;
      
    case 'monthly':
      // Set next export time to specified time on the 1st of next month
      nextExportTime = new Date();
      nextExportTime.setMonth(now.getMonth() + 1, 1);
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        nextExportTime.setHours(hours, minutes, 0, 0);
      } else {
        nextExportTime.setHours(0, 0, 0, 0);
      }
      break;
      
    default:
      // Default to 1 hour from now for testing
      nextExportTime = new Date(now.getTime() + 60 * 60 * 1000);
  }
  
  const delay = nextExportTime.getTime() - now.getTime();
  
  // Store the timeout ID so we can cancel it if needed
  config.timeoutId = setTimeout(() => {
    performAutoExport(config);
  }, delay);
};

/**
 * Perform the actual export operation
 * @param {AutoExportConfig} config - The export configuration
 */
export const performAutoExport = async (config) => {
  try {
    const setExportLoading = () => {}; // Dummy function since we're running in background
    
    if (config.format === 'pdf') {
      await exportToPDF(config.reportId, setExportLoading);
    } else if (config.format === 'excel') {
      exportToExcel(config.reportId, setExportLoading);
    }
    
    // Update last export time
    updateAutoExportConfig(config.id, { lastExport: new Date().toISOString() });
    
    // Show success notification
    toast.success(`Báo cáo ${config.reportId} đã được xuất tự động thành công!`);
    
    // Schedule next export
    scheduleAutoExport(config);
  } catch (error) {
    console.error('Auto export failed:', error);
    toast.error(`Xuất tự động báo cáo ${config.reportId} thất bại.`);
  }
};

/**
 * Initialize auto export system
 */
export const initAutoExport = () => {
  loadAutoExportConfigs();
  autoExportConfigs.forEach(config => {
    if (config.active) {
      scheduleAutoExport(config);
    }
  });
};

/**
 * Manually trigger an export now
 * @param {string} reportId - ID of the report to export
 * @param {string} format - Export format ('pdf' or 'excel')
 * @param {function} setExportLoading - Function to set loading state
 */
export const exportNow = async (reportId, format, setExportLoading) => {
  try {
    if (setExportLoading) setExportLoading(true);
    
    if (format === 'pdf') {
      await exportToPDF(reportId, setExportLoading);
    } else if (format === 'excel') {
      exportToExcel(reportId, setExportLoading);
    }
    
    toast.success(`Báo cáo ${reportId} đã được xuất thành công!`);
  } catch (error) {
    console.error('Manual export failed:', error);
    toast.error(`Xuất báo cáo ${reportId} thất bại.`);
  } finally {
    if (setExportLoading) setExportLoading(false);
  }
}; 