#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import os
import argparse

def get_simple_response(message):
    """Tạo phản hồi đơn giản cho câu hỏi"""
    message = message.lower()
    
    if any(greeting in message for greeting in ["xin chào", "chào", "hello", "hi"]):
        return "Xin chào! Tôi là chatbot của DNC Food. Tôi có thể giúp gì cho bạn?"
    
    if any(food in message for food in ["thực phẩm", "đồ ăn", "món ăn", "thức ăn"]):
        return "DNC Food cung cấp nhiều loại thực phẩm sạch, an toàn và chất lượng cao. Bạn quan tâm đến loại thực phẩm nào?"
    
    if any(healthy in message for healthy in ["sạch", "organic", "hữu cơ", "an toàn", "sức khỏe"]):
        return "Tại DNC Food, chúng tôi cam kết cung cấp thực phẩm sạch và an toàn với nguồn gốc rõ ràng, đảm bảo sức khỏe của khách hàng."
    
    if any(price in message for price in ["giá", "bao nhiêu", "chi phí"]):
        return "Giá cả sản phẩm tại DNC Food rất cạnh tranh và phù hợp với chất lượng. Bạn có thể tham khảo giá chi tiết trên trang sản phẩm của chúng tôi."
    
    if any(delivery in message for delivery in ["giao hàng", "vận chuyển", "ship"]):
        return "DNC Food cung cấp dịch vụ giao hàng nhanh chóng trong vòng 24h đối với khu vực nội thành và 2-3 ngày đối với các khu vực khác."
    
    if any(product in message for product in ["sản phẩm", "bán", "mua"]):
        return "Chúng tôi có nhiều loại sản phẩm như rau củ quả, thịt, cá, đồ khô, gia vị và thực phẩm chế biến sẵn. Bạn quan tâm loại nào?"
    
    # Trả về message thông thường nếu không khớp với pattern nào
    return "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể diễn đạt theo cách khác hoặc hỏi về các sản phẩm, giá cả, giao hàng hay chất lượng thực phẩm của DNC Food."

def main():
    """Main function to process arguments and return a response"""
    parser = argparse.ArgumentParser(description='Simple RAG Chatbot for DNC Food')
    parser.add_argument('--message', type=str, help='User message to process')
    
    args = parser.parse_args()
    
    # Use argument or temp file
    message = args.message
    if not message:
        # Try to read from temp file
        temp_file = os.path.join(os.getcwd(), 'temp_message.json')
        if os.path.exists(temp_file):
            try:
                with open(temp_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    message = data.get('message', '')
            except Exception as e:
                print(json.dumps({"error": str(e), "text": "Không thể đọc dữ liệu từ file tạm"}))
                sys.exit(1)
    
    if not message:
        print(json.dumps({"error": "No message provided", "text": "Không nhận được câu hỏi"}))
        sys.exit(1)
    
    # Get response
    response = get_simple_response(message)
    
    # Return as JSON
    print(json.dumps({"answer": response, "status": "success"}, ensure_ascii=False))
    sys.exit(0)

if __name__ == "__main__":
    main() 