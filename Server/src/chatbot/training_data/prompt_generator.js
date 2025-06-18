/**
 * Tạo prompt huấn luyện chatbot dựa trên dữ liệu thực tế
 * Sử dụng dữ liệu từ MongoDB collections và các câu hỏi thực tế từ khách hàng
 */

import customerQueries from './customer_queries.js';

/**
 * Tạo prompt huấn luyện chatbot dựa trên cấu trúc dữ liệu và câu hỏi thực tế
 * @returns {string} - Prompt huấn luyện cho chatbot
 */
export const generateTrainingPrompt = () => {
  // Mô tả cấu trúc database
  const databaseStructure = `
Tôi đang xây dựng một chatbot hỗ trợ khách hàng cho hệ thống siêu thị thực phẩm sạch. Dưới đây là các collection có trong MongoDB của hệ thống:

* \`Product\`: thông tin sản phẩm (tên, mô tả, thành phần, loại thực phẩm, hàm lượng dinh dưỡng, lượng đường, chứng nhận hữu cơ, phù hợp với người ăn kiêng, ăn chay, mẹ bầu,...)
* \`Category\`: phân loại sản phẩm (Rau củ, Trái cây, Thịt cá, Đồ uống, Bữa ăn nhanh,...)
* \`Order\`: đơn hàng (thời gian, trạng thái, thanh toán, mã giảm giá,...)
* \`User\`: thông tin người dùng (vai trò, lịch sử mua hàng,...)
* \`Promotion\`, \`Discount\`, \`Voucher\`: chương trình khuyến mãi
* \`Branch\`: các chi nhánh đang hoạt động (địa chỉ, giờ mở cửa, dịch vụ đi kèm)
* \`Review\`: đánh giá của khách hàng về sản phẩm
* \`Supplier\`: nhà cung cấp (xuất xứ sản phẩm, chứng nhận hữu cơ, tiêu chuẩn an toàn,...)
`;

  // Tạo danh sách câu hỏi theo từng nhóm
  const generateQuestionsForCategory = (category, questions) => {
    return questions.map(item => item.query).join('\n- ');
  };

  const healthNeedsQuestions = generateQuestionsForCategory('healthNeeds', customerQueries.healthNeeds);
  const productInfoQuestions = generateQuestionsForCategory('productInfo', customerQueries.productInfo);
  const promotionsQuestions = generateQuestionsForCategory('promotions', customerQueries.promotions);
  const orderAndDeliveryQuestions = generateQuestionsForCategory('orderAndDelivery', customerQueries.orderAndDelivery);
  const storeInfoQuestions = generateQuestionsForCategory('storeInfo', customerQueries.storeInfo);
  const reviewsAndFeedbackQuestions = generateQuestionsForCategory('reviewsAndFeedback', customerQueries.reviewsAndFeedback);

  // Tạo prompt hoàn chỉnh
  const fullPrompt = `${databaseStructure}

Dựa trên hệ thống dữ liệu đó, tôi đã tạo danh sách câu hỏi khách hàng có thể hỏi chatbot, chia theo các nhóm sau:

1. **Tìm kiếm sản phẩm phù hợp với nhu cầu sức khỏe** (ít đường, ít muối, ăn chay, giảm cân, tăng cơ, mẹ bầu, người già, trẻ em…)
- ${healthNeedsQuestions}

2. **Thông tin sản phẩm** (thành phần, xuất xứ, hạn dùng, chứng nhận hữu cơ, có chất bảo quản không…)
- ${productInfoQuestions}

3. **Khuyến mãi và ưu đãi** (mã giảm giá, tích điểm, ưu đãi theo chi nhánh, quà tặng,…)
- ${promotionsQuestions}

4. **Đơn hàng & giao hàng** (tra cứu đơn, trạng thái vận chuyển, hủy đơn, đổi hàng…)
- ${orderAndDeliveryQuestions}

5. **Chi nhánh & giờ mở cửa** (địa chỉ gần nhất, có giao hàng không, giờ mở – đóng cửa…)
- ${storeInfoQuestions}

6. **Đánh giá & phản hồi** (sản phẩm nào được đánh giá cao, khách hàng nói gì về sản phẩm…)
- ${reviewsAndFeedbackQuestions}

Hãy huấn luyện chatbot để có thể:
1. Nhận diện chính xác ý định của người dùng từ các câu hỏi tự nhiên
2. Trả lời chi tiết và hữu ích dựa trên dữ liệu có sẵn trong hệ thống
3. Đề xuất sản phẩm phù hợp với nhu cầu sức khỏe cụ thể của khách hàng
4. Cung cấp thông tin chính xác về khuyến mãi, chi nhánh và chính sách giao hàng
5. Hỗ trợ khách hàng theo dõi đơn hàng và giải quyết các vấn đề phát sinh

Chatbot nên có khả năng hiểu ngữ cảnh, nhớ thông tin trong cuộc hội thoại, và cung cấp trải nghiệm hỗ trợ khách hàng mượt mà và chuyên nghiệp.`;

  return fullPrompt;
};

/**
 * Tạo prompt huấn luyện chatbot tập trung vào một nhóm câu hỏi cụ thể
 * @param {string} category - Tên nhóm câu hỏi (healthNeeds, productInfo, promotions, orderAndDelivery, storeInfo, reviewsAndFeedback)
 * @returns {string} - Prompt huấn luyện tập trung vào nhóm câu hỏi cụ thể
 */
export const generateCategorySpecificPrompt = (category) => {
  if (!customerQueries[category]) {
    return `Không tìm thấy nhóm câu hỏi "${category}". Vui lòng chọn một trong các nhóm: healthNeeds, productInfo, promotions, orderAndDelivery, storeInfo, reviewsAndFeedback`;
  }

  // Mô tả cấu trúc database
  const databaseStructure = `
Tôi đang xây dựng một chatbot hỗ trợ khách hàng cho hệ thống siêu thị thực phẩm sạch. Dưới đây là các collection có trong MongoDB của hệ thống:

* \`Product\`: thông tin sản phẩm (tên, mô tả, thành phần, loại thực phẩm, hàm lượng dinh dưỡng, lượng đường, chứng nhận hữu cơ, phù hợp với người ăn kiêng, ăn chay, mẹ bầu,...)
* \`Category\`: phân loại sản phẩm (Rau củ, Trái cây, Thịt cá, Đồ uống, Bữa ăn nhanh,...)
* \`Order\`: đơn hàng (thời gian, trạng thái, thanh toán, mã giảm giá,...)
* \`User\`: thông tin người dùng (vai trò, lịch sử mua hàng,...)
* \`Promotion\`, \`Discount\`, \`Voucher\`: chương trình khuyến mãi
* \`Branch\`: các chi nhánh đang hoạt động (địa chỉ, giờ mở cửa, dịch vụ đi kèm)
* \`Review\`: đánh giá của khách hàng về sản phẩm
* \`Supplier\`: nhà cung cấp (xuất xứ sản phẩm, chứng nhận hữu cơ, tiêu chuẩn an toàn,...)
`;

  // Tạo danh sách câu hỏi cho nhóm được chọn
  const questions = customerQueries[category].map(item => item.query).join('\n- ');

  // Các tiêu đề và hướng dẫn cụ thể cho từng nhóm
  const categoryTitles = {
    healthNeeds: "Tìm kiếm sản phẩm phù hợp với nhu cầu sức khỏe",
    productInfo: "Thông tin sản phẩm",
    promotions: "Khuyến mãi và ưu đãi",
    orderAndDelivery: "Đơn hàng & giao hàng",
    storeInfo: "Chi nhánh & giờ mở cửa",
    reviewsAndFeedback: "Đánh giá & phản hồi"
  };

  const categoryGuidelines = {
    healthNeeds: `
Hãy huấn luyện chatbot để có thể:
1. Nhận diện chính xác các nhu cầu sức khỏe cụ thể từ câu hỏi của khách hàng
2. Đề xuất các sản phẩm phù hợp với từng nhu cầu đặc biệt (tiểu đường, cao huyết áp, ăn chay, giảm cân, v.v.)
3. Giải thích lý do tại sao sản phẩm đề xuất phù hợp với nhu cầu sức khỏe đó
4. Cung cấp thông tin dinh dưỡng liên quan đến sản phẩm được đề xuất`,
    
    productInfo: `
Hãy huấn luyện chatbot để có thể:
1. Cung cấp thông tin chi tiết về thành phần, xuất xứ và chứng nhận của sản phẩm
2. Trả lời các câu hỏi về hạn sử dụng, cách bảo quản và hướng dẫn sử dụng
3. Giải thích các tiêu chuẩn chất lượng và chứng nhận hữu cơ
4. Cung cấp thông tin về giá trị dinh dưỡng và các chất có trong sản phẩm`,
    
    promotions: `
Hãy huấn luyện chatbot để có thể:
1. Thông báo về các chương trình khuyến mãi đang diễn ra
2. Hướng dẫn sử dụng mã giảm giá và voucher
3. Giải thích chương trình tích điểm và quyền lợi thành viên
4. Cung cấp thông tin về các ưu đãi đặc biệt theo chi nhánh hoặc phương thức thanh toán`,
    
    orderAndDelivery: `
Hãy huấn luyện chatbot để có thể:
1. Hỗ trợ theo dõi trạng thái đơn hàng
2. Giải thích các chính sách giao hàng và phí vận chuyển
3. Hướng dẫn cách hủy đơn hoặc thay đổi thông tin đơn hàng
4. Xử lý các vấn đề phát sinh trong quá trình giao hàng`,
    
    storeInfo: `
Hãy huấn luyện chatbot để có thể:
1. Cung cấp thông tin về địa chỉ và giờ mở cửa của các chi nhánh
2. Hướng dẫn tìm chi nhánh gần nhất dựa trên vị trí của khách hàng
3. Thông báo về các dịch vụ đặc biệt tại từng chi nhánh
4. Trả lời các câu hỏi về cơ sở vật chất và tiện ích tại cửa hàng`,
    
    reviewsAndFeedback: `
Hãy huấn luyện chatbot để có thể:
1. Cung cấp thông tin về các sản phẩm được đánh giá cao
2. Tổng hợp phản hồi của khách hàng về sản phẩm cụ thể
3. Hướng dẫn cách gửi đánh giá hoặc phản hồi
4. Xử lý các khiếu nại và báo cáo vấn đề về sản phẩm`
  };

  // Tạo prompt hoàn chỉnh cho nhóm được chọn
  const categoryPrompt = `${databaseStructure}

Tôi muốn tập trung huấn luyện chatbot để xử lý các câu hỏi liên quan đến **${categoryTitles[category]}**. Dưới đây là các câu hỏi mẫu trong nhóm này:

- ${questions}

${categoryGuidelines[category]}

Chatbot nên có khả năng hiểu ngữ cảnh, nhớ thông tin trong cuộc hội thoại, và cung cấp trải nghiệm hỗ trợ khách hàng mượt mà và chuyên nghiệp.`;

  return categoryPrompt;
};

/**
 * Tạo prompt huấn luyện chatbot với các ví dụ về cách trả lời
 * @returns {string} - Prompt huấn luyện với ví dụ
 */
export const generatePromptWithExamples = () => {
  // Lấy prompt cơ bản
  const basePrompt = generateTrainingPrompt();
  
  // Thêm các ví dụ về cách trả lời
  const exampleResponses = `
Dưới đây là một số ví dụ về cách chatbot nên trả lời:

**Ví dụ 1:**
Khách hàng: "Tôi đang bị tiểu đường, nên ăn gì ở đây?"
Chatbot: "Dạ, với người tiểu đường, tôi xin giới thiệu các sản phẩm có chỉ số đường huyết thấp như: Rau xanh hữu cơ, các loại đậu, gạo lứt, quả óc chó, hạnh nhân không đường, và các loại cá giàu omega-3. Cửa hàng chúng tôi có bộ sản phẩm dành riêng cho người tiểu đường với nhãn 'Low GI' được chứng nhận. Tôi có thể gợi ý cụ thể hơn nếu anh/chị cho biết loại thực phẩm yêu thích."

**Ví dụ 2:**
Khách hàng: "Sản phẩm này có chứa chất bảo quản không?"
Chatbot: "Dạ, sản phẩm [tên sản phẩm] của chúng tôi không sử dụng chất bảo quản nhân tạo. Chúng tôi chỉ sử dụng các phương pháp bảo quản tự nhiên như chiết xuất từ thảo mộc, muối biển và phương pháp lên men tự nhiên. Anh/chị có thể xem chi tiết thành phần đầy đủ trong mục 'Thành phần' trên trang sản phẩm hoặc trực tiếp trên bao bì."

**Ví dụ 3:**
Khách hàng: "Đơn hàng #12345 của tôi đang ở đâu?"
Chatbot: "Dạ, để tôi kiểm tra đơn hàng #12345 giúp anh/chị. Đơn hàng này hiện đang trong trạng thái 'Đang giao hàng' và dự kiến sẽ được giao đến địa chỉ của anh/chị vào ngày mai (25/10/2023) trong khung giờ 9:00-12:00. Anh/chị có thể theo dõi vị trí đơn hàng chi tiết hơn bằng cách nhấp vào đường link theo dõi đơn hàng đã được gửi qua email hoặc SMS."

**Ví dụ 4:**
Khách hàng: "Có chi nhánh nào gần Quận 1 không?"
Chatbot: "Dạ, chúng tôi có 2 chi nhánh gần Quận 1:
1. Chi nhánh Nguyễn Huệ: 123 Nguyễn Huệ, Quận 1 (cách trung tâm Quận 1 khoảng 0.5km)
   - Giờ mở cửa: 7:00 - 22:00 mỗi ngày
   - Điện thoại: 028.1234.5678
   - Có bãi đậu xe và dịch vụ giao hàng

2. Chi nhánh Lê Lợi: 45 Lê Lợi, Quận 1 (cách trung tâm Quận 1 khoảng 1.2km)
   - Giờ mở cửa: 8:00 - 21:00 mỗi ngày
   - Điện thoại: 028.8765.4321
   - Có quầy thực phẩm tươi sống và khu vực thử đồ uống miễn phí

Anh/chị muốn biết thêm thông tin về chi nhánh nào không ạ?"`;

  return `${basePrompt}\n${exampleResponses}`;
};

export default {
  generateTrainingPrompt,
  generateCategorySpecificPrompt,
  generatePromptWithExamples
}; 