/**
 * Module xử lý tìm kiếm ngữ nghĩa cho chatbot
 */

import Product from '../../../Model/Products.js';

/**
 * Phân tích ngữ nghĩa của câu hỏi để xác định ý định, danh mục, thuộc tính, đối tượng, giá...
 * @param {string} query - Câu hỏi của người dùng
 * @returns {Object} Thông tin ngữ nghĩa của câu hỏi
 */
const analyzeQuerySemantics = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Khởi tạo kết quả phân tích
    const semantics = {
        intent: 'product_search', // Mặc định là tìm kiếm sản phẩm
        category: null,           // Danh mục sản phẩm
        attributes: [],           // Thuộc tính đặc biệt (ít đường, hữu cơ, tươi...)
        targetAudience: null,     // Đối tượng sử dụng (người ăn kiêng, trẻ em...)
        priceRange: null,         // Khoảng giá
        sortBy: null,             // Sắp xếp theo (giá, độ phổ biến...)
        limit: 10                 // Giới hạn kết quả
    };
    
    // Phân tích danh mục sản phẩm
    const categoryMap = {
        'trái cây': 'Trái cây',
        'hoa quả': 'Trái cây',
        'quả': 'Trái cây',
        'rau': 'Rau củ quả',
        'củ': 'Rau củ quả',
        'rau củ': 'Rau củ quả',
        'thịt': 'Thịt',
        'cá': 'Hải sản',
        'hải sản': 'Hải sản',
        'đồ uống': 'Đồ uống',
        'nước': 'Đồ uống',
        'bánh': 'Bánh kẹo',
        'kẹo': 'Bánh kẹo',
        'bánh kẹo': 'Bánh kẹo',
        'gia vị': 'Gia vị',
        'đồ khô': 'Đồ khô',
        'sữa': 'Sữa và các sản phẩm từ sữa',
        'đồ hộp': 'Đồ hộp',
        'đồ đông lạnh': 'Đồ đông lạnh'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
        if (lowerQuery.includes(key)) {
            semantics.category = value;
            break;
        }
    }
    
    // Phân tích thuộc tính đặc biệt
    const attributePatterns = [
        { pattern: ['ít đường', 'đường thấp', 'không đường', 'ít ngọt'], attribute: 'low_sugar' },
        { pattern: ['hữu cơ', 'organic'], attribute: 'organic' },
        { pattern: ['tươi', 'mới'], attribute: 'fresh' },
        { pattern: ['nhập khẩu', 'ngoại'], attribute: 'imported' },
        { pattern: ['nội địa', 'trong nước'], attribute: 'domestic' },
        { pattern: ['giá rẻ', 'rẻ', 'giá tốt'], attribute: 'affordable' },
        { pattern: ['cao cấp', 'hạng sang', 'premium'], attribute: 'premium' },
        { pattern: ['chay', 'thuần chay', 'ăn chay'], attribute: 'vegetarian' }
    ];
    
    for (const {pattern, attribute} of attributePatterns) {
        for (const keyword of pattern) {
            if (lowerQuery.includes(keyword)) {
                semantics.attributes.push(attribute);
                break;
            }
        }
    }
    
    // Phân tích đối tượng sử dụng
    const audiencePatterns = [
        { pattern: ['ăn kiêng', 'giảm cân', 'diet'], audience: 'dieter' },
        { pattern: ['trẻ em', 'trẻ con', 'em bé', 'bé'], audience: 'children' },
        { pattern: ['người già', 'cao tuổi', 'người lớn tuổi'], audience: 'elderly' },
        { pattern: ['tiểu đường', 'đái tháo đường', 'bệnh tiểu đường'], audience: 'diabetic' },
        { pattern: ['phụ nữ mang thai', 'bà bầu', 'mẹ bầu'], audience: 'pregnant' },
        { pattern: ['vận động viên', 'người tập thể thao'], audience: 'athlete' }
    ];
    
    for (const {pattern, audience} of audiencePatterns) {
        for (const keyword of pattern) {
            if (lowerQuery.includes(keyword)) {
                semantics.targetAudience = audience;
                break;
            }
        }
    }
    
    // Phân tích khoảng giá
    if (lowerQuery.includes('dưới') && lowerQuery.match(/\d+/)) {
        const priceMatch = lowerQuery.match(/dưới\s*(\d+)/);
        if (priceMatch) {
            semantics.priceRange = { max: parseInt(priceMatch[1]) * 1000 };
        }
    } else if (lowerQuery.includes('trên') && lowerQuery.match(/\d+/)) {
        const priceMatch = lowerQuery.match(/trên\s*(\d+)/);
        if (priceMatch) {
            semantics.priceRange = { min: parseInt(priceMatch[1]) * 1000 };
        }
    } else if (lowerQuery.includes('từ') && lowerQuery.includes('đến') && lowerQuery.match(/\d+/g)) {
        const priceMatches = lowerQuery.match(/từ\s*(\d+)\s*đến\s*(\d+)/);
        if (priceMatches) {
            semantics.priceRange = { 
                min: parseInt(priceMatches[1]) * 1000, 
                max: parseInt(priceMatches[2]) * 1000 
            };
        }
    }
    
    // Phân tích sắp xếp
    if (lowerQuery.includes('giá thấp nhất') || lowerQuery.includes('rẻ nhất') || lowerQuery.includes('giá tăng dần')) {
        semantics.sortBy = { field: 'productPrice', order: 1 };
    } else if (lowerQuery.includes('giá cao nhất') || lowerQuery.includes('đắt nhất') || lowerQuery.includes('giá giảm dần')) {
        semantics.sortBy = { field: 'productPrice', order: -1 };
    } else if (lowerQuery.includes('mới nhất') || lowerQuery.includes('mới ra')) {
        semantics.sortBy = { field: 'createdAt', order: -1 };
    } else if (lowerQuery.includes('phổ biến nhất') || lowerQuery.includes('bán chạy nhất')) {
        semantics.sortBy = { field: 'popularity', order: -1 };
    }
    
    return semantics;
};

/**
 * Xây dựng bộ lọc MongoDB dựa trên kết quả phân tích ngữ nghĩa
 * @param {Object} semantics - Kết quả phân tích ngữ nghĩa
 * @returns {Object} Bộ lọc MongoDB
 */
const buildSemanticFilter = (semantics) => {
    const filter = {};
    
    // Lọc theo danh mục
    if (semantics.category) {
        filter.productCategory = semantics.category;
    }
    
    // Lọc theo thuộc tính
    if (semantics.attributes.includes('low_sugar')) {
        // Lọc sản phẩm có hàm lượng đường thấp
        filter.$or = [
            { productName: { $regex: /ít đường|đường thấp|không đường/i } },
            { productDescription: { $regex: /ít đường|đường thấp|không đường|hàm lượng đường thấp/i } }
        ];
    }
    
    if (semantics.attributes.includes('organic')) {
        // Lọc sản phẩm hữu cơ
        filter.$or = filter.$or || [];
        filter.$or.push(
            { productName: { $regex: /hữu cơ|organic/i } },
            { productDescription: { $regex: /hữu cơ|organic/i } }
        );
    }
    
    // Lọc theo đối tượng sử dụng
    if (semantics.targetAudience === 'dieter') {
        // Lọc sản phẩm dành cho người ăn kiêng
        filter.$or = filter.$or || [];
        filter.$or.push(
            { productName: { $regex: /ăn kiêng|giảm cân|diet/i } },
            { productDescription: { $regex: /ăn kiêng|giảm cân|diet|ít calo|ít béo/i } }
        );
    } else if (semantics.targetAudience === 'diabetic') {
        // Lọc sản phẩm dành cho người tiểu đường
        filter.$or = filter.$or || [];
        filter.$or.push(
            { productName: { $regex: /tiểu đường|đái tháo đường/i } },
            { productDescription: { $regex: /tiểu đường|đái tháo đường|ít đường|không đường/i } }
        );
    }
    
    // Lọc theo khoảng giá
    if (semantics.priceRange) {
        filter.productPrice = {};
        if (semantics.priceRange.min !== undefined) {
            filter.productPrice.$gte = semantics.priceRange.min;
        }
        if (semantics.priceRange.max !== undefined) {
            filter.productPrice.$lte = semantics.priceRange.max;
        }
    }
    
    return filter;
};

/**
 * Xây dựng bộ lọc nới lỏng hơn nếu không tìm thấy kết quả với bộ lọc chặt chẽ
 * @param {Object} semantics - Kết quả phân tích ngữ nghĩa
 * @returns {Object} Bộ lọc MongoDB nới lỏng
 */
const buildRelaxedFilter = (semantics) => {
    const filter = {};
    
    // Chỉ giữ lại điều kiện về danh mục
    if (semantics.category) {
        filter.productCategory = semantics.category;
    }
    
    // Nếu là truy vấn về trái cây ít đường, thêm điều kiện tìm kiếm trái cây
    if (semantics.attributes.includes('low_sugar') && semantics.category === 'Trái cây') {
        filter.productCategory = 'Trái cây';
    }
    
    return filter;
};

/**
 * Tính điểm liên quan của sản phẩm với truy vấn
 * @param {Object} product - Sản phẩm
 * @param {Object} semantics - Kết quả phân tích ngữ nghĩa
 * @returns {number} Điểm liên quan
 */
const calculateRelevanceScore = (product, semantics) => {
    let score = 0;
    const productName = product.productName.toLowerCase();
    const productDesc = product.productDescription ? product.productDescription.join(' ').toLowerCase() : '';
    
    // Điểm cho danh mục
    if (semantics.category && product.productCategory === semantics.category) {
        score += 10;
    }
    
    // Điểm cho thuộc tính
    for (const attribute of semantics.attributes) {
        if (attribute === 'low_sugar' && 
            (productName.includes('ít đường') || 
             productName.includes('không đường') || 
             productDesc.includes('ít đường') || 
             productDesc.includes('không đường'))) {
            score += 5;
        }
        
        if (attribute === 'organic' && 
            (productName.includes('hữu cơ') || 
             productName.includes('organic') || 
             productDesc.includes('hữu cơ') || 
             productDesc.includes('organic'))) {
            score += 5;
        }
    }
    
    // Điểm cho đối tượng sử dụng
    if (semantics.targetAudience === 'diabetic' && 
        (productName.includes('tiểu đường') || 
         productDesc.includes('tiểu đường') || 
         productDesc.includes('đái tháo đường'))) {
        score += 8;
    }
    
    if (semantics.targetAudience === 'dieter' && 
        (productName.includes('ăn kiêng') || 
         productName.includes('giảm cân') || 
         productDesc.includes('ăn kiêng') || 
         productDesc.includes('giảm cân'))) {
        score += 8;
    }
    
    return score;
};

/**
 * Tìm kiếm sản phẩm dựa trên ngữ nghĩa của câu hỏi
 * @param {string} query - Câu hỏi của người dùng
 * @returns {Promise<Array>} Danh sách sản phẩm phù hợp
 */
export const semanticSearch = async (query) => {
    try {
        // Phân tích ngữ nghĩa của câu hỏi
        const semantics = analyzeQuerySemantics(query);
        console.log('Phân tích ngữ nghĩa:', semantics);
        
        // Xây dựng bộ lọc MongoDB
        const filter = buildSemanticFilter(semantics);
        console.log('Bộ lọc tìm kiếm:', filter);
        
        // Tìm kiếm sản phẩm
        let products = await Product.find(filter).limit(semantics.limit);
        
        // Nếu không tìm thấy kết quả, thử với bộ lọc nới lỏng hơn
        if (products.length === 0) {
            console.log('Không tìm thấy kết quả, thử với bộ lọc nới lỏng');
            const relaxedFilter = buildRelaxedFilter(semantics);
            console.log('Bộ lọc nới lỏng:', relaxedFilter);
            products = await Product.find(relaxedFilter).limit(semantics.limit);
        }
        
        // Tính điểm liên quan và sắp xếp kết quả
        products = products.map(product => {
            const score = calculateRelevanceScore(product, semantics);
            return { ...product.toObject(), relevanceScore: score };
        });
        
        products.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        console.log(`Tìm thấy ${products.length} sản phẩm phù hợp`);
        return products;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        return [];
    }
};

/**
 * Tìm kiếm sản phẩm dựa trên ngữ nghĩa của câu hỏi (phiên bản cũ)
 * @param {string} query - Câu hỏi của người dùng
 * @returns {Promise<Array>} Danh sách sản phẩm phù hợp
 */
export const semantic_search_products = async (query) => {
    try {
        return await semanticSearch(query);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        return [];
    }
};

export default {
    semanticSearch,
    semantic_search_products
};
