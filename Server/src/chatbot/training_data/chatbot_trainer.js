/**
 * Công cụ huấn luyện chatbot sử dụng prompt được tạo từ dữ liệu thực tế
 * Tích hợp với hệ thống chatbot hiện có
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import promptGenerator from './prompt_generator.js';

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục lưu trữ prompt
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * Đảm bảo thư mục lưu trữ prompt tồn tại
 */
const ensurePromptDirectory = () => {
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    console.log(`Đã tạo thư mục lưu trữ prompt: ${PROMPTS_DIR}`);
  }
};

/**
 * Lưu prompt vào file
 * @param {string} prompt - Nội dung prompt
 * @param {string} filename - Tên file (không bao gồm đường dẫn)
 * @returns {string} - Đường dẫn đầy đủ đến file đã lưu
 */
export const savePromptToFile = (prompt, filename) => {
  ensurePromptDirectory();
  const filePath = path.join(PROMPTS_DIR, filename);
  fs.writeFileSync(filePath, prompt, 'utf8');
  console.log(`Đã lưu prompt vào file: ${filePath}`);
  return filePath;
};

/**
 * Đọc prompt từ file
 * @param {string} filename - Tên file (không bao gồm đường dẫn)
 * @returns {string|null} - Nội dung prompt hoặc null nếu file không tồn tại
 */
export const loadPromptFromFile = (filename) => {
  const filePath = path.join(PROMPTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Không tìm thấy file prompt: ${filePath}`);
    return null;
  }
  
  return fs.readFileSync(filePath, 'utf8');
};

/**
 * Tạo và lưu tất cả các loại prompt
 * @returns {Object} - Đối tượng chứa đường dẫn đến các file prompt đã lưu
 */
export const generateAndSaveAllPrompts = () => {
  ensurePromptDirectory();
  
  // Tạo và lưu prompt cơ bản
  const basicPrompt = promptGenerator.generateTrainingPrompt();
  const basicPromptPath = savePromptToFile(basicPrompt, 'basic_prompt.txt');
  
  // Tạo và lưu prompt với ví dụ
  const promptWithExamples = promptGenerator.generatePromptWithExamples();
  const promptWithExamplesPath = savePromptToFile(promptWithExamples, 'prompt_with_examples.txt');
  
  // Tạo và lưu các prompt theo từng nhóm
  const categoryPrompts = {};
  const categories = ['healthNeeds', 'productInfo', 'promotions', 'orderAndDelivery', 'storeInfo', 'reviewsAndFeedback'];
  
  for (const category of categories) {
    const categoryPrompt = promptGenerator.generateCategorySpecificPrompt(category);
    const categoryPromptPath = savePromptToFile(categoryPrompt, `${category}_prompt.txt`);
    categoryPrompts[category] = categoryPromptPath;
  }
  
  return {
    basic: basicPromptPath,
    withExamples: promptWithExamplesPath,
    categories: categoryPrompts
  };
};

/**
 * Tích hợp prompt huấn luyện với hệ thống chatbot
 * @param {string} promptType - Loại prompt (basic, withExamples, hoặc tên category)
 * @returns {string} - Nội dung prompt để sử dụng cho chatbot
 */
export const getTrainingPrompt = (promptType = 'withExamples') => {
  // Kiểm tra xem có file prompt đã lưu chưa
  let filename;
  
  if (promptType === 'basic') {
    filename = 'basic_prompt.txt';
  } else if (promptType === 'withExamples') {
    filename = 'prompt_with_examples.txt';
  } else {
    // Giả sử promptType là tên category
    filename = `${promptType}_prompt.txt`;
  }
  
  // Thử đọc từ file
  let prompt = loadPromptFromFile(filename);
  
  // Nếu không có file, tạo mới
  if (!prompt) {
    if (promptType === 'basic') {
      prompt = promptGenerator.generateTrainingPrompt();
    } else if (promptType === 'withExamples') {
      prompt = promptGenerator.generatePromptWithExamples();
    } else {
      prompt = promptGenerator.generateCategorySpecificPrompt(promptType);
    }
    
    // Lưu lại để sử dụng sau này
    savePromptToFile(prompt, filename);
  }
  
  return prompt;
};

/**
 * Cập nhật prompt cho chatbot đang chạy
 * @param {string} promptType - Loại prompt cần sử dụng
 * @returns {boolean} - Kết quả cập nhật
 */
export const updateChatbotPrompt = async (promptType = 'withExamples') => {
  try {
    // Lấy prompt phù hợp
    const prompt = getTrainingPrompt(promptType);
    
    // Lưu vào file cấu hình của chatbot
    const configPath = path.join(__dirname, '..', 'config', 'chatbot_prompt.txt');
    
    // Đảm bảo thư mục config tồn tại
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Lưu prompt vào file cấu hình
    fs.writeFileSync(configPath, prompt, 'utf8');
    console.log(`Đã cập nhật prompt cho chatbot: ${configPath}`);
    
    // TODO: Thêm logic khởi động lại chatbot nếu cần
    
    return true;
  } catch (error) {
    console.error('Lỗi khi cập nhật prompt cho chatbot:', error);
    return false;
  }
};

export default {
  savePromptToFile,
  loadPromptFromFile,
  generateAndSaveAllPrompts,
  getTrainingPrompt,
  updateChatbotPrompt
}; 