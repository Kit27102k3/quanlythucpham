/**
 * Script kiểm thử chatbot với các prompt tối ưu
 * Gửi các câu hỏi mẫu và đánh giá phản hồi
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import customerQueries from './training_data/customer_queries.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL API chatbot
const CHATBOT_API_URL = process.env.CHATBOT_API_URL || 'http://localhost:3000/api/chatbot/process';

/**
 * Gửi câu hỏi đến chatbot và nhận phản hồi
 * @param {string} question - Câu hỏi cần gửi
 * @returns {Promise<string>} - Phản hồi từ chatbot
 */
const askChatbot = async (question) => {
  try {
    const response = await axios.post(CHATBOT_API_URL, {
      message: question,
      userId: 'test-user-id'
    });
    
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi gửi câu hỏi "${question}":`, error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Kiểm thử chatbot với một danh sách câu hỏi
 * @param {Array<string>} questions - Danh sách câu hỏi
 * @returns {Promise<Array>} - Kết quả kiểm thử
 */
const testChatbot = async (questions) => {
  const results = [];
  
  console.log(`Bắt đầu kiểm thử với ${questions.length} câu hỏi...`);
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\nCâu hỏi ${i + 1}/${questions.length}: "${question}"`);
    
    const startTime = Date.now();
    const response = await askChatbot(question);
    const endTime = Date.now();
    
    const result = {
      question,
      response,
      responseTime: endTime - startTime
    };
    
    results.push(result);
    
    console.log(`Phản hồi (${result.responseTime}ms): ${JSON.stringify(response)}`);
  }
  
  return results;
};

/**
 * Lưu kết quả kiểm thử vào file
 * @param {Array} results - Kết quả kiểm thử
 * @param {string} filename - Tên file để lưu
 */
const saveResults = (results, filename) => {
  const filePath = path.join(__dirname, 'test_results', filename);
  
  // Đảm bảo thư mục tồn tại
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Lưu kết quả
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nĐã lưu kết quả vào file: ${filePath}`);
};

/**
 * Phân tích kết quả kiểm thử
 * @param {Array} results - Kết quả kiểm thử
 * @returns {Object} - Báo cáo phân tích
 */
const analyzeResults = (results) => {
  const totalQuestions = results.length;
  let successfulResponses = 0;
  let totalResponseTime = 0;
  
  for (const result of results) {
    if (result.response && result.response.success) {
      successfulResponses++;
    }
    totalResponseTime += result.responseTime;
  }
  
  const averageResponseTime = totalResponseTime / totalQuestions;
  const successRate = (successfulResponses / totalQuestions) * 100;
  
  return {
    totalQuestions,
    successfulResponses,
    failedResponses: totalQuestions - successfulResponses,
    successRate: successRate.toFixed(2) + '%',
    averageResponseTime: averageResponseTime.toFixed(2) + 'ms',
    timestamp: new Date().toISOString()
  };
};

/**
 * Chạy kiểm thử với các câu hỏi từ một danh mục cụ thể
 * @param {string} category - Tên danh mục cần kiểm thử
 */
const testCategory = async (category) => {
  if (!customerQueries[category]) {
    console.error(`Không tìm thấy danh mục "${category}"`);
    return;
  }
  
  const questions = customerQueries[category].map(item => item.query);
  const results = await testChatbot(questions);
  
  const analysis = analyzeResults(results);
  console.log('\nKết quả phân tích:');
  console.log(analysis);
  
  // Lưu kết quả
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  saveResults(
    { results, analysis },
    `test_${category}_${timestamp}.json`
  );
};

/**
 * Chạy kiểm thử với tất cả các câu hỏi
 */
const testAll = async () => {
  const allQuestions = [];
  
  // Lấy tất cả câu hỏi từ các danh mục
  for (const category in customerQueries) {
    const categoryQuestions = customerQueries[category].map(item => item.query);
    allQuestions.push(...categoryQuestions);
  }
  
  const results = await testChatbot(allQuestions);
  
  const analysis = analyzeResults(results);
  console.log('\nKết quả phân tích tổng thể:');
  console.log(analysis);
  
  // Lưu kết quả
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  saveResults(
    { results, analysis },
    `test_all_${timestamp}.json`
  );
};

/**
 * Hàm main để chạy kiểm thử
 */
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'all') {
    await testAll();
  } else {
    await testCategory(args[0]);
  }
};

// Chạy chương trình
main().catch(error => {
  console.error('Lỗi khi chạy kiểm thử:', error);
}); 