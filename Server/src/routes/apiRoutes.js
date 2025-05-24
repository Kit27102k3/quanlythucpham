/* eslint-disable no-undef */
import express from 'express';
import { mongoose } from '../config/database.js';
import { isMongoConnected } from '../config/database.js';

const router = express.Router();

/**
 * API trung gian để truy cập MongoDB từ thiết bị di động
 * Thay vì kết nối trực tiếp từ client, client sẽ gọi các API endpoints này
 */

// Middleware kiểm tra kết nối MongoDB
const checkMongoConnection = (req, res, next) => {
  if (!isMongoConnected) {
    return res.status(503).json({ 
      success: false, 
      message: 'Database connection unavailable',
      status: 'disconnected'
    });
  }
  next();
};

// API endpoint kiểm tra trạng thái kết nối
router.get('/status', (req, res) => {
  const status = isMongoConnected ? 'connected' : 'disconnected';
  const readyState = mongoose.connection.readyState;
  
  res.json({
    success: true,
    status,
    readyState,
    timestamp: new Date().toISOString()
  });
});

// API endpoint tổng quát để truy vấn collection
router.post('/query/:collection', checkMongoConnection, async (req, res) => {
  try {
    const { collection } = req.params;
    const { query = {}, projection = {}, options = {}, limit = 100, skip = 0 } = req.body;
    
    // Giới hạn số lượng kết quả trả về để tránh quá tải
    options.limit = Math.min(limit, 100);
    options.skip = skip;
    
    // Thực hiện truy vấn
    const db = mongoose.connection.db;
    const results = await db.collection(collection)
      .find(query, projection)
      .limit(options.limit)
      .skip(options.skip)
      .toArray();
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error(`Error querying collection ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để lấy document theo ID
router.get('/document/:collection/:id', checkMongoConnection, async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ObjectId format'
      });
    }
    
    // Thực hiện truy vấn
    const db = mongoose.connection.db;
    const result = await db.collection(collection).findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error getting document from ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để tạo document mới
router.post('/document/:collection', checkMongoConnection, async (req, res) => {
  try {
    const { collection } = req.params;
    const document = req.body;
    
    // Validate document
    if (!document || Object.keys(document).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Empty document'
      });
    }
    
    // Thực hiện thêm mới
    const db = mongoose.connection.db;
    const result = await db.collection(collection).insertOne(document);
    
    res.status(201).json({
      success: true,
      insertedId: result.insertedId,
      data: document
    });
  } catch (error) {
    console.error(`Error creating document in ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để cập nhật document
router.put('/document/:collection/:id', checkMongoConnection, async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updates = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ObjectId format'
      });
    }
    
    // Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }
    
    // Thực hiện cập nhật
    const db = mongoose.connection.db;
    const result = await db.collection(collection).updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error(`Error updating document in ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để xóa document
router.delete('/document/:collection/:id', checkMongoConnection, async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ObjectId format'
      });
    }
    
    // Thực hiện xóa
    const db = mongoose.connection.db;
    const result = await db.collection(collection).deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(`Error deleting document from ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để đếm số lượng documents trong collection
router.post('/count/:collection', checkMongoConnection, async (req, res) => {
  try {
    const { collection } = req.params;
    const { query = {} } = req.body;
    
    // Thực hiện đếm
    const db = mongoose.connection.db;
    const count = await db.collection(collection).countDocuments(query);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error(`Error counting documents in ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// API endpoint để lấy danh sách collections
router.get('/collections', checkMongoConnection, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    res.json({
      success: true,
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router; 