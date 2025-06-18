/**
 * Tập dữ liệu huấn luyện chatbot - 60 câu hỏi thực tế từ khách hàng
 * Được tạo dựa trên cấu trúc database MongoDB của hệ thống siêu thị thực phẩm sạch
 */

const customerQueries = {
  // Nhóm 1: Tìm kiếm sản phẩm phù hợp với nhu cầu sức khỏe
  healthNeeds: [
    {
      query: "Tôi đang bị tiểu đường, nên ăn gì ở đây?",
      intent: "product_recommendation_health",
      entities: ["diabetes", "low_sugar"]
    },
    {
      query: "Có món nào ít muối cho người cao huyết áp không?",
      intent: "product_recommendation_health",
      entities: ["hypertension", "low_salt"]
    },
    {
      query: "Tôi đang ăn chay trường, có thực phẩm nào phù hợp không?",
      intent: "product_recommendation_health",
      entities: ["vegan", "vegetarian"]
    },
    {
      query: "Đang tập gym cần thực phẩm giàu protein, cửa hàng có gì không?",
      intent: "product_recommendation_health",
      entities: ["gym", "high_protein"]
    },
    {
      query: "Tôi cần thực phẩm giảm cân, có loại nào ít calo không?",
      intent: "product_recommendation_health",
      entities: ["weight_loss", "low_calorie"]
    },
    {
      query: "Vợ tôi đang mang thai, cần thực phẩm bổ sung dinh dưỡng cho mẹ bầu",
      intent: "product_recommendation_health",
      entities: ["pregnancy", "nutrition"]
    },
    {
      query: "Có sản phẩm nào không chứa gluten cho người bị celiac không?",
      intent: "product_recommendation_health",
      entities: ["gluten_free", "celiac"]
    },
    {
      query: "Tôi bị dị ứng đậu phộng, làm sao biết sản phẩm nào an toàn?",
      intent: "product_recommendation_health",
      entities: ["allergy", "peanut_free"]
    },
    {
      query: "Cần thực phẩm cho người già dễ nhai và tiêu hóa",
      intent: "product_recommendation_health",
      entities: ["elderly", "easy_digestion"]
    },
    {
      query: "Trẻ em biếng ăn nên mua thực phẩm gì bổ dưỡng?",
      intent: "product_recommendation_health",
      entities: ["children", "nutrition"]
    }
  ],

  // Nhóm 2: Thông tin sản phẩm
  productInfo: [
    {
      query: "Rau củ này có phải hữu cơ không? Có chứng nhận gì không?",
      intent: "product_info",
      entities: ["organic", "certification"]
    },
    {
      query: "Thịt gà này từ trang trại nào? Có được nuôi tự nhiên không?",
      intent: "product_info",
      entities: ["origin", "free_range"]
    },
    {
      query: "Sản phẩm này có chứa chất bảo quản không?",
      intent: "product_info",
      entities: ["preservatives"]
    },
    {
      query: "Hạn sử dụng của sữa chua này là bao lâu?",
      intent: "product_info",
      entities: ["expiration_date"]
    },
    {
      query: "Thành phần của bánh mì nguyên cám này là gì?",
      intent: "product_info",
      entities: ["ingredients", "whole_wheat_bread"]
    },
    {
      query: "Nước ép trái cây này có thêm đường không?",
      intent: "product_info",
      entities: ["added_sugar", "juice"]
    },
    {
      query: "Cá hồi này được nhập khẩu từ đâu?",
      intent: "product_info",
      entities: ["origin", "salmon"]
    },
    {
      query: "Gạo lứt này có bao nhiêu calo trong 100g?",
      intent: "product_info",
      entities: ["nutrition_facts", "brown_rice", "calories"]
    },
    {
      query: "Sản phẩm này có phải là non-GMO không?",
      intent: "product_info",
      entities: ["non_gmo"]
    },
    {
      query: "Bơ thực vật này có chứa dầu cọ không?",
      intent: "product_info",
      entities: ["ingredients", "palm_oil", "margarine"]
    }
  ],

  // Nhóm 3: Khuyến mãi và ưu đãi
  promotions: [
    {
      query: "Hiện tại có chương trình khuyến mãi nào cho rau củ không?",
      intent: "promotions",
      entities: ["vegetables", "discount"]
    },
    {
      query: "Tôi có thể dùng mã giảm giá FRESH100 cho đơn hàng này không?",
      intent: "promotions",
      entities: ["voucher_code", "discount"]
    },
    {
      query: "Có ưu đãi gì khi mua số lượng lớn không?",
      intent: "promotions",
      entities: ["bulk_order", "discount"]
    },
    {
      query: "Thành viên VIP được giảm giá bao nhiêu phần trăm?",
      intent: "promotions",
      entities: ["vip", "membership", "discount_percentage"]
    },
    {
      query: "Có chương trình tặng quà khi mua sản phẩm nào không?",
      intent: "promotions",
      entities: ["gift", "promotion"]
    },
    {
      query: "Tôi tích được 500 điểm, đổi được gì?",
      intent: "promotions",
      entities: ["loyalty_points", "rewards"]
    },
    {
      query: "Chi nhánh quận 7 có khuyến mãi đặc biệt nào không?",
      intent: "promotions",
      entities: ["branch_specific", "district_7", "special_offer"]
    },
    {
      query: "Khi nào sẽ có đợt sale lớn tiếp theo?",
      intent: "promotions",
      entities: ["upcoming_sale"]
    },
    {
      query: "Có giảm giá khi thanh toán bằng thẻ ngân hàng ABC không?",
      intent: "promotions",
      entities: ["payment_method", "bank_discount"]
    },
    {
      query: "Khách hàng mới có được ưu đãi gì đặc biệt không?",
      intent: "promotions",
      entities: ["new_customer", "special_offer"]
    }
  ],

  // Nhóm 4: Đơn hàng & giao hàng
  orderAndDelivery: [
    {
      query: "Đơn hàng #12345 của tôi đang ở đâu?",
      intent: "order_tracking",
      entities: ["order_id"]
    },
    {
      query: "Tôi muốn hủy đơn hàng vừa đặt, làm thế nào?",
      intent: "order_cancellation",
      entities: ["cancel_order"]
    },
    {
      query: "Giao hàng đến quận Bình Thạnh mất bao lâu?",
      intent: "delivery_time",
      entities: ["location", "binh_thanh_district"]
    },
    {
      query: "Tôi muốn thay đổi địa chỉ giao hàng được không?",
      intent: "order_modification",
      entities: ["delivery_address", "change"]
    },
    {
      query: "Đơn hàng tối thiểu để được miễn phí giao hàng là bao nhiêu?",
      intent: "delivery_fee",
      entities: ["minimum_order", "free_shipping"]
    },
    {
      query: "Tôi không nhận được email xác nhận đơn hàng",
      intent: "order_confirmation",
      entities: ["email_confirmation", "missing"]
    },
    {
      query: "Có thể đổi sản phẩm nếu bị dập nát khi giao không?",
      intent: "order_return",
      entities: ["damaged_product", "replacement"]
    },
    {
      query: "Cửa hàng có giao hàng vào cuối tuần không?",
      intent: "delivery_schedule",
      entities: ["weekend_delivery"]
    },
    {
      query: "Làm sao để theo dõi tình trạng đơn hàng?",
      intent: "order_tracking",
      entities: ["tracking"]
    },
    {
      query: "Tôi có thể đặt hàng trước và chọn thời gian giao không?",
      intent: "delivery_schedule",
      entities: ["scheduled_delivery", "pre_order"]
    }
  ],

  // Nhóm 5: Chi nhánh & giờ mở cửa
  storeInfo: [
    {
      query: "Chi nhánh gần Quận 1 nhất ở đâu?",
      intent: "store_location",
      entities: ["district_1", "nearest_branch"]
    },
    {
      query: "Cửa hàng đóng cửa mấy giờ tối nay?",
      intent: "store_hours",
      entities: ["closing_time", "today"]
    },
    {
      query: "Có chi nhánh nào mở cửa 24/7 không?",
      intent: "store_hours",
      entities: ["24_hours", "open_all_day"]
    },
    {
      query: "Chi nhánh Thủ Đức có dịch vụ đặt hàng qua điện thoại không?",
      intent: "store_services",
      entities: ["thu_duc_branch", "phone_order"]
    },
    {
      query: "Cửa hàng có chỗ đậu xe ô tô không?",
      intent: "store_facilities",
      entities: ["parking", "car"]
    },
    {
      query: "Ngày lễ cửa hàng có mở cửa không?",
      intent: "store_hours",
      entities: ["holiday", "opening_hours"]
    },
    {
      query: "Chi nhánh nào có quầy thực phẩm tươi sống lớn nhất?",
      intent: "store_facilities",
      entities: ["fresh_food_section", "largest"]
    },
    {
      query: "Có chi nhánh nào ở Bình Dương không?",
      intent: "store_location",
      entities: ["binh_duong_province"]
    },
    {
      query: "Chi nhánh Phú Nhuận có khu vực thử đồ uống không?",
      intent: "store_facilities",
      entities: ["phu_nhuan_branch", "beverage_tasting"]
    },
    {
      query: "Cửa hàng có dịch vụ giao hàng đến các tỉnh không?",
      intent: "delivery_coverage",
      entities: ["provincial_delivery"]
    }
  ],

  // Nhóm 6: Đánh giá & phản hồi
  reviewsAndFeedback: [
    {
      query: "Sản phẩm nào được đánh giá cao nhất trong mục thực phẩm hữu cơ?",
      intent: "product_reviews",
      entities: ["highest_rated", "organic_food"]
    },
    {
      query: "Khách hàng nói gì về bột ngũ cốc dinh dưỡng của cửa hàng?",
      intent: "product_reviews",
      entities: ["customer_feedback", "cereal"]
    },
    {
      query: "Làm sao để gửi phản hồi về chất lượng sản phẩm?",
      intent: "feedback_submission",
      entities: ["product_quality", "submit_feedback"]
    },
    {
      query: "Tôi muốn đánh giá dịch vụ giao hàng, làm thế nào?",
      intent: "feedback_submission",
      entities: ["delivery_service", "rating"]
    },
    {
      query: "Sản phẩm nào được mua nhiều nhất tháng này?",
      intent: "product_popularity",
      entities: ["best_seller", "this_month"]
    },
    {
      query: "Có ai phàn nàn về sản phẩm này chưa?",
      intent: "product_reviews",
      entities: ["complaints", "negative_feedback"]
    },
    {
      query: "Tôi muốn xem đánh giá của khách hàng về gạo lứt hữu cơ",
      intent: "product_reviews",
      entities: ["customer_reviews", "organic_brown_rice"]
    },
    {
      query: "Sản phẩm nào được khách hàng đánh giá tốt cho trẻ em?",
      intent: "product_reviews",
      entities: ["highly_rated", "children_products"]
    },
    {
      query: "Làm thế nào để báo cáo vấn đề về sản phẩm bị hỏng?",
      intent: "complaint_submission",
      entities: ["defective_product", "report_issue"]
    },
    {
      query: "Tôi có thể xem video đánh giá sản phẩm ở đâu?",
      intent: "product_reviews",
      entities: ["video_reviews", "product_demonstrations"]
    }
  ]
};

export default customerQueries; 