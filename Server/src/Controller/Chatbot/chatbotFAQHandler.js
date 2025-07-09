/**
 * Hệ thống xử lý câu hỏi thường gặp (FAQ)
 * File này chứa các hàm để trả lời các câu hỏi chung về cửa hàng, chính sách, và dịch vụ
 */

// Định nghĩa từ khóa cho mỗi intent để tăng độ chính xác khi nhận diện câu hỏi
export const intentKeywords = {
  faq_how_to_buy: [
    "mua hàng",
    "mua sản phẩm",
    "cách mua",
    "mua như thế nào",
    "làm sao để mua",
    "đặt mua",
    "mua như nào",
    "mua ở đâu",
  ],
  faq_how_to_order: [
    "đặt hàng",
    "order",
    "cách đặt",
    "các bước đặt hàng",
    "hướng dẫn đặt hàng",
    "làm sao để đặt",
    "đặt như thế nào",
  ],
  // Các intent khác giữ nguyên
};

/**
 * Xử lý câu hỏi FAQ và trả về câu trả lời phù hợp
 * @param {string} intent - Intent được phát hiện
 * @returns {string} - Câu trả lời
 */
export const handleFAQQuestion = (intent) => {
  // Các câu trả lời mặc định cho từng loại câu hỏi
  const responses = {
    greeting:
      "Xin chào! Tôi là trợ lý ảo của DNC FOOD. Tôi có thể giúp gì cho bạn?",

    faq_how_to_buy:
      "Bạn có thể mua sản phẩm của chúng tôi qua các cách sau:\n\n1. Mua trực tiếp trên website: Đăng nhập → Chọn sản phẩm → Thêm vào giỏ hàng → Thanh toán\n2. Mua qua ứng dụng di động: Tải ứng dụng DNC FOOD từ App Store hoặc Google Play\n3. Mua trực tiếp tại cửa hàng: Ghé thăm cửa hàng gần nhất của chúng tôi\n\nNếu bạn cần hỗ trợ thêm, vui lòng liên hệ hotline: 0326 743 391 hoặc vào trang thông tin cá nhân vào mục tin nhắn để được nhắn tin trực tiếp với tư vấn viên.",

    faq_how_to_order:
      "Để đặt hàng trên website hoặc ứng dụng DNC FOOD, bạn làm theo các bước sau:\n\n1. Tìm kiếm và chọn sản phẩm bạn muốn mua\n2. Thêm sản phẩm vào giỏ hàng\n3. Kiểm tra giỏ hàng và nhấn 'Thanh toán'\n4. Điền thông tin giao hàng (địa chỉ, số điện thoại)\n5. Chọn phương thức thanh toán (COD, thẻ tín dụng, chuyển khoản)\n6. Xác nhận đơn hàng\n\nBạn sẽ nhận được email xác nhận đơn hàng và có thể theo dõi trạng thái đơn hàng trong mục 'Đơn hàng của tôi'.",

    faq_payment_methods:
      "Cửa hàng chúng tôi có 2 phương thức thanh toán chính: \n1. Tiền mặt khi nhận hàng (COD). \n2. Chuyển khoản ngân hàng.",

    faq_register_account:
      "Để đăng ký tài khoản trên DNC FOOD, bạn làm theo các bước sau:\n\n1. Truy cập trang web DNC FOOD hoặc mở ứng dụng\n2. Nhấn vào nút 'Đăng ký' ở góc phải trên cùng\n3. Điền thông tin cá nhân: Họ tên, Email, Số điện thoại, Mật khẩu\n4. Xác nhận email hoặc số điện thoại (nếu yêu cầu)\n5. Hoàn tất đăng ký\n\nSau khi đăng ký thành công, bạn có thể đăng nhập và sử dụng đầy đủ tính năng của website như: theo dõi đơn hàng, lưu địa chỉ giao hàng, nhận thông báo khuyến mãi...",

    faq_promotions:
      "Hiện tại cửa hàng DNC FOOD đang có các chương trình khuyến mãi sau:\n\n1. Giảm 10% cho đơn hàng đầu tiên khi đăng ký tài khoản mới\n2. Miễn phí vận chuyển cho đơn hàng từ 300.000đ\n3. Mua 2 tặng 1 cho các sản phẩm rau củ quả hữu cơ vào thứ 3 và thứ 6 hàng tuần\n4. Giảm 15% cho khách hàng thành viên VIP\n5. Tặng voucher 50.000đ cho đơn hàng từ 500.000đ\n\nBạn có thể xem chi tiết các chương trình khuyến mãi tại mục 'Voucher' trên website hoặc ứng dụng DNC FOOD.",

    faq_store_location:
      "Cửa hàng DNC FOOD có các chi nhánh tại:\n\n1. Chi nhánh Cần Thơ: Trường Đại học Nam Cần Thơ, Nguyễn Văn Cừ nối dài, Cần Thơ City\n2. Chi nhánh Sóc Trăng: 122, ấp Mỹ Khánh A, xã Long Hưng, huyện Mỹ Tú, tỉnh Sóc Trăng\n\nGiờ mở cửa: 7:00 - 21:00 từ Thứ 2 - Chủ nhật.\n\nBạn có thể liên hệ qua số điện thoại: 0326 743 391 hoặc email: kit10012003@gmail.com",

    faq_product_quality:
      "Tại DNC FOOD, chúng tôi cam kết cung cấp các sản phẩm có chất lượng cao nhất cho khách hàng:\n\n1. Tất cả sản phẩm đều được kiểm tra nghiêm ngặt về chất lượng trước khi đưa vào hệ thống bán hàng\n2. Chúng tôi có chứng nhận an toàn thực phẩm từ các cơ quan chức năng\n3. Sản phẩm tươi sống được nhập hàng ngày từ các nhà cung cấp uy tín\n4. Chúng tôi áp dụng quy trình bảo quản tiêu chuẩn để đảm bảo độ tươi ngon\n5. Cam kết hoàn tiền 100% nếu sản phẩm không đạt chất lượng như cam kết\n\nNếu bạn có bất kỳ thắc mắc nào về chất lượng sản phẩm, vui lòng liên hệ với chúng tôi qua hotline: 0326 743 391",

    faq_diet:
      "DNC FOOD cung cấp nhiều lựa chọn thực phẩm phù hợp với các chế độ ăn kiêng khác nhau:\n\n1. Chế độ ăn kiêng giảm cân:\n   - Rau xanh các loại, salad\n   - Thịt nạc, cá, hải sản\n   - Trái cây ít đường như táo, dâu, việt quất\n   - Ngũ cốc nguyên hạt\n   - Các loại hạt không muối\n\n2. Chế độ Keto (ít carb, nhiều chất béo):\n   - Thịt, cá, hải sản\n   - Trứng\n   - Bơ, dầu dừa\n   - Các loại hạt\n   - Rau xanh ít tinh bột\n\n3. Chế độ ăn cho người tiểu đường:\n   - Rau xanh không hạn chế\n   - Protein từ thịt nạc, cá, đậu\n   - Chất béo lành mạnh từ dầu oliu, bơ\n   - Trái cây ít đường\n   - Ngũ cốc nguyên hạt\n\n4. Chế độ ăn chay/thuần chay:\n   - Đậu, đỗ các loại\n   - Đậu phụ, tempeh\n   - Rau củ quả đa dạng\n   - Các loại hạt và hạt giống\n   - Ngũ cốc nguyên hạt\n\nBạn có thể tìm thấy các sản phẩm phù hợp với chế độ ăn kiêng của mình trong mục 'Thực phẩm dinh dưỡng' trên website hoặc ứng dụng DNC FOOD. Nếu cần tư vấn chi tiết về chế độ ăn kiêng phù hợp, vui lòng liên hệ với chúng tôi qua hotline: 0326 743 391",

    faq_shipping_time:
      "Thời gian giao hàng của DNC FOOD như sau:\n\n1. Nội thành Cần Thơ: 1-2 ngày làm việc\n2. Các tỉnh lân cận: 2-3 ngày làm việc\n3. Các tỉnh xa: 3-5 ngày làm việc\n\nLưu ý: Thời gian giao hàng có thể thay đổi tùy thuộc vào điều kiện thời tiết, giao thông và các yếu tố khác. Bạn có thể theo dõi đơn hàng của mình trong mục 'Đơn hàng của tôi' trên website hoặc ứng dụng.",

    faq_return_policy:
      "Chính sách đổi trả của DNC FOOD:\n\n1. Thời gian đổi trả: Trong vòng 7 ngày kể từ ngày nhận hàng\n2. Điều kiện: Sản phẩm còn nguyên bao bì, chưa qua sử dụng, có hóa đơn mua hàng\n3. Lý do đổi trả được chấp nhận: Sản phẩm bị lỗi, hư hỏng, không đúng mô tả, không đúng sản phẩm đã đặt\n\nĐể yêu cầu đổi trả, vui lòng liên hệ hotline: 0326 743 391 hoặc gửi email đến: kit10012003@gmail.com",

    faq_trending_products:
      "Các sản phẩm bán chạy nhất tại DNC FOOD hiện nay:\n\n1. Rau củ quả hữu cơ theo mùa\n2. Thịt heo sạch từ trang trại\n3. Gạo lứt hữu cơ\n4. Sữa tươi nguyên chất\n5. Các loại hạt dinh dưỡng\n\nBạn có thể xem thêm các sản phẩm bán chạy trong mục 'Sản phẩm nổi bật' trên trang chủ website hoặc ứng dụng DNC FOOD.",

    faq_shipping_fee:
      "Phí vận chuyển của DNC FOOD:\n\n1. Đơn hàng từ 300.000đ: Miễn phí vận chuyển trong phạm vi 10km\n2. Đơn hàng dưới 300.000đ: Phí vận chuyển từ 15.000đ - 30.000đ tùy khoảng cách\n3. Vùng xa (trên 10km): Phí vận chuyển từ 30.000đ - 50.000đ\n\nPhí vận chuyển chính xác sẽ được tính toán khi bạn nhập địa chỉ giao hàng trong quá trình thanh toán.",

    faq_customer_support:
      "Bạn có thể liên hệ với bộ phận hỗ trợ khách hàng của DNC FOOD qua các kênh sau:\n\n1. Hotline: 0326 743 391 (8:00 - 21:00 hàng ngày)\n2. Email: kit10012003@gmail.com\n3. Fanpage Facebook: DNC FOOD\n4. Zalo: DNC FOOD\n5. Trò chuyện trực tiếp trên website hoặc ứng dụng\n\nChúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.",

    faq_membership:
      "Chương trình thành viên của DNC FOOD:\n\n1. Thành viên Bạc: Tích lũy từ 1-5 triệu đồng, được giảm 5% mỗi đơn hàng\n2. Thành viên Vàng: Tích lũy từ 5-10 triệu đồng, được giảm 10% mỗi đơn hàng\n3. Thành viên VIP: Tích lũy trên 10 triệu đồng, được giảm 15% mỗi đơn hàng\n\nNgoài ra, thành viên còn được hưởng nhiều ưu đãi đặc biệt khác như: quà sinh nhật, ưu tiên mua hàng mới, tham gia sự kiện độc quyền, v.v.",

    faq_organic_products:
      "Sản phẩm hữu cơ (organic) tại DNC FOOD:\n\n1. Được canh tác theo tiêu chuẩn hữu cơ nghiêm ngặt\n2. Không sử dụng thuốc trừ sâu, phân bón hóa học, chất kích thích tăng trưởng\n3. Có chứng nhận hữu cơ từ các tổ chức uy tín\n4. Đảm bảo an toàn cho sức khỏe và thân thiện với môi trường\n\nBạn có thể tìm thấy các sản phẩm hữu cơ trong mục 'Sản phẩm hữu cơ' trên website hoặc ứng dụng DNC FOOD.",

    faq_dietary_options:
      "DNC FOOD cung cấp nhiều lựa chọn thực phẩm phù hợp với các chế độ ăn đặc biệt:\n\n1. Thực phẩm chay/thuần chay (vegan)\n2. Thực phẩm không gluten\n3. Thực phẩm ít đường/không đường cho người tiểu đường\n4. Thực phẩm ít muối cho người huyết áp\n5. Thực phẩm giàu protein cho người tập gym\n6. Thực phẩm organic/hữu cơ\n\nBạn có thể tìm kiếm các sản phẩm này bằng cách sử dụng bộ lọc trên website hoặc ứng dụng.",

    faq_gift_services:
      "Dịch vụ quà tặng của DNC FOOD:\n\n1. Gói quà sang trọng với nhiều mẫu giấy gói và ruy băng\n2. Thiệp chúc mừng cá nhân hóa\n3. Giao hàng đến địa chỉ người nhận\n4. Giỏ quà tặng theo chủ đề (sinh nhật, lễ tết, khai trương, v.v.)\n\nPhí dịch vụ gói quà từ 20.000đ - 50.000đ tùy theo kích thước và yêu cầu. Vui lòng liên hệ hotline: 0326 743 391 để được tư vấn chi tiết.",

    faq_bulk_orders:
      "Đối với đơn hàng số lượng lớn tại DNC FOOD:\n\n1. Giảm giá từ 5-15% tùy theo giá trị đơn hàng\n2. Hỗ trợ vận chuyển miễn phí\n3. Có nhân viên tư vấn riêng\n4. Thanh toán linh hoạt\n\nĐể đặt hàng số lượng lớn, vui lòng liên hệ hotline: 0326 743 391 hoặc email: kit10012003@gmail.com để được tư vấn và báo giá chi tiết.",

    faq_chatbot_help:
      "Tôi là trợ lý ảo của DNC FOOD, tôi có thể giúp bạn:\n\n1. Tìm kiếm sản phẩm theo nhu cầu\n2. Trả lời các câu hỏi về sản phẩm, dịch vụ\n3. Cung cấp thông tin về khuyến mãi, ưu đãi\n4. Hướng dẫn đặt hàng, thanh toán\n5. Tư vấn về dinh dưỡng và sức khỏe\n6. Giải đáp thắc mắc về chính sách của cửa hàng\n\nBạn có thể hỏi tôi bất kỳ câu hỏi nào liên quan đến DNC FOOD!",

    faq_product_not_found:
      "Rất tiếc, tôi không tìm thấy sản phẩm bạn đang tìm kiếm. Bạn có thể thử:\n\n1. Kiểm tra lại chính tả\n2. Sử dụng từ khóa khác\n3. Tìm kiếm theo danh mục sản phẩm\n4. Liên hệ bộ phận hỗ trợ khách hàng qua hotline: 0326 743 391\n\nHoặc bạn có thể cho tôi biết chi tiết hơn về sản phẩm bạn đang tìm kiếm?",

    // Câu hỏi về giá cả
    faq_price_check:
      "Để biết giá chính xác của sản phẩm, vui lòng cho tôi biết tên cụ thể của sản phẩm bạn quan tâm. Tôi sẽ kiểm tra trong hệ thống và cung cấp thông tin giá hiện tại cho bạn.",

    // Câu hỏi về tồn kho
    faq_stock_check:
      "Để kiểm tra số lượng tồn kho, vui lòng cho tôi biết tên cụ thể của sản phẩm bạn quan tâm. Tôi sẽ kiểm tra trong hệ thống và thông báo tình trạng tồn kho hiện tại cho bạn.",

    // Câu hỏi về giờ mở cửa
    faq_opening_hours:
      "Siêu thị DNC FOOD mở cửa từ 7:00 - 21:00 mỗi ngày, kể cả cuối tuần và ngày lễ. Chúng tôi chỉ đóng cửa vào ngày mùng 1 Tết Âm lịch.",

    // Câu hỏi về khuyến mãi hiện tại
    faq_current_promotions:
      "Các chương trình khuyến mãi hiện tại tại DNC FOOD:\n\n1. Giảm 10% cho tất cả các sản phẩm rau củ quả hữu cơ vào thứ 3 và thứ 6 hàng tuần\n2. Mua 2 tặng 1 cho các sản phẩm sữa chua từ ngày 15-20 mỗi tháng\n3. Giảm 15% cho tất cả các sản phẩm nhãn hiệu riêng DNC\n4. Tặng voucher 50.000đ cho đơn hàng từ 500.000đ\n\nVui lòng kiểm tra ứng dụng hoặc website của chúng tôi để biết thêm chi tiết về các chương trình khuyến mãi.",

    // Câu hỏi về danh mục sản phẩm
    faq_product_categories:
      "DNC FOOD có các danh mục sản phẩm sau:\n\n1. Rau củ quả tươi (hữu cơ và thông thường)\n2. Trái cây nhập khẩu và nội địa\n3. Thịt, cá, hải sản tươi sống\n4. Thực phẩm khô và gia vị\n5. Sữa và các sản phẩm từ sữa\n6. Đồ uống và nước giải khát\n7. Bánh kẹo và đồ ăn vặt\n8. Thực phẩm đông lạnh\n9. Thực phẩm chế biến sẵn\n10. Đồ dùng nhà bếp\n\nBạn quan tâm đến danh mục nào? Tôi có thể cung cấp thông tin chi tiết hơn.",

    // Câu hỏi về xuất xứ sản phẩm
    faq_product_origin:
      "Để biết xuất xứ chính xác của sản phẩm, vui lòng cho tôi biết tên cụ thể của sản phẩm bạn quan tâm. DNC FOOD cung cấp sản phẩm từ nhiều nguồn khác nhau, bao gồm:\n\n1. Sản phẩm địa phương từ các trang trại đối tác tại Việt Nam\n2. Sản phẩm nhập khẩu từ các nước như Úc, New Zealand, Mỹ, Nhật Bản, Hàn Quốc và các nước Châu Âu\n\nTất cả sản phẩm đều được kiểm tra nghiêm ngặt về chất lượng và an toàn thực phẩm trước khi đưa vào kinh doanh.",

    // Câu hỏi về chương trình thành viên
    faq_membership_details:
      "Chương trình thành viên DNC FOOD có 3 hạng:\n\n1. Thành viên Bạc: Tích lũy từ 1-5 triệu đồng, được giảm 5% mỗi đơn hàng\n2. Thành viên Vàng: Tích lũy từ 5-10 triệu đồng, được giảm 10% mỗi đơn hàng\n3. Thành viên VIP: Tích lũy trên 10 triệu đồng, được giảm 15% mỗi đơn hàng\n\nĐặc quyền thành viên:\n- Tích điểm với mỗi đơn hàng (1.000đ = 1 điểm)\n- Đổi điểm lấy voucher giảm giá\n- Quà tặng sinh nhật\n- Ưu tiên tham gia các sự kiện đặc biệt\n- Thông báo khuyến mãi sớm\n\nĐăng ký thành viên miễn phí tại quầy thu ngân hoặc trên ứng dụng DNC FOOD.",

    // Các câu trả lời khác giữ nguyên
  };

  // Trả về câu trả lời tương ứng với intent
  return (
    responses[intent] ||
    "Xin lỗi, tôi không có thông tin về câu hỏi này. Bạn có thể liên hệ với bộ phận hỗ trợ khách hàng để được giúp đỡ."
  );
};
