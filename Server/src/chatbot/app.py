#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import os
import argparse
import re
from flask import Flask, request, jsonify
import openai
from openai import OpenAI
from dotenv import load_dotenv
from db_connector import get_product_data
from flask_cors import CORS

# Thêm đường dẫn hiện tại vào sys.path để có thể import các module local
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Debug thông tin về đường dẫn và module
print(f"Đường dẫn hiện tại: {os.getcwd()}")
print(f"Đường dẫn file app.py: {current_dir}")
print(f"sys.path: {sys.path}")
print(
    f"Kiểm tra thư mục handlers: {os.path.exists(os.path.join(current_dir, 'handlers'))}"
)
print(
    f"Kiểm tra file semanticSearchHandler.py: {os.path.exists(os.path.join(current_dir, 'handlers', 'semanticSearchHandler.py'))}"
)

# Thử import handlers
try:
    from handlers.semanticSearchHandler import semanticSearch, semantic_search_products

    print("Import semanticSearchHandler thành công!")
except ImportError as e:
    print(f"Lỗi khi import semanticSearchHandler: {e}")
    semanticSearch = None
    semantic_search_products = None

load_dotenv()

app = Flask(__name__)
CORS(
    app,
    origins=[
        "https://quanlythucpham.vercel.app",
        "https://quanlythucpham-kit27102k3s-projects.vercel.app",
    ],
)

# Cấu hình API key đúng cách
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Lưu trữ câu trả lời cuối cùng cho mỗi phiên
last_responses = {}

# Lưu trữ ngữ cảnh người dùng
user_contexts = {}


@app.route("/api/chatbot/ask", methods=["POST"])
def ask():
    data = request.get_json(force=True) or {}
    question = data.get("question", "")
    session_id = data.get("session_id", "default")
    
    if not question:
        return jsonify({"answer": "Bạn chưa nhập câu hỏi."}), 400

    # --- NHẬN DIỆN KIỂM TRA SẢN PHẨM (product existence check) ---
    product_check_patterns = [
        r"(?:có|bán|shop có|cửa hàng có|có bán|có sản phẩm|có mặt hàng|có loại)\\s+(.+?)\\s+không",
        r"(.+?)\\s+có\\s+không",
        r"shop\\s+còn\\s+(.+?)\\s+không",
        r"cửa hàng\\s+còn\\s+(.+?)\\s+không",
        r"có\\s+(.+?)\\s+chứ",
        r"có\\s+(.+?)\\s+à",
        r"có\\s+(.+?)\\s+vậy\\s+không",
        r"có\\s+(.+?)\\s+không\\s+shop",
        r"có\\s+(.+?)\\s+không\\s+ạ",
        r"có\\s+(.+?)\\s+không\\s+vậy",
        r"có\\s+(.+?)\\s+không\\s+nhỉ",
        r"(.+?)\\s+có\\s+không\\s+ạ",
        r"(.+?)\\s+có\\s+không\\s+shop",
        r"(.+?)\\s+có\\s+không\\s+vậy",
        r"(.+?)\\s+có\\s+không\\s+nhỉ",
        r"tìm\\s+(.+?)\\s+trong\\s+cửa hàng",
        r"danh sách\\s+(.+?)\\s+hiện có",
        r"có những loại\\s+(.+?)\\s+nào",
        r"có thể mua\\s+(.+?)\\s+ở đây không",
        r"shop bán\\s+(.+?)\\s+không",
    ]
    for pattern in product_check_patterns:
        match = re.search(pattern, question.lower())
        if match:
            product_name = match.group(1).strip()
            # Tìm sản phẩm trong DB
            products = search_products(product_name)
            if products and len(products) > 0:
                product_list = []
                for p in products[:5]:
                    name = str(p.get("productName", p.get("name", "Sản phẩm")))
                    price = p.get("productPrice", p.get("price", 0))
                    desc = ""
                    prod_desc = p.get("productDescription")
                    if isinstance(prod_desc, list):
                        desc = prod_desc[0] if prod_desc else ""
                    elif isinstance(prod_desc, str):
                        desc = prod_desc
                    product_list.append(f"- {name} ({price:,}đ): {desc}")
                answer = f"Cửa hàng hiện có các sản phẩm liên quan đến '{product_name}':\n" + "\n".join(product_list)
            else:
                answer = f"Hiện tại cửa hàng không có sản phẩm '{product_name}'."
            return jsonify({"answer": answer})
    # --- END NHẬN DIỆN KIỂM TRA SẢN PHẨM ---

    # Detect health/diet/plan/benefit intent
    health_keywords = [
        "sức khỏe",
        "bệnh",
        "dinh dưỡng",
        "thực đơn",
        "kế hoạch",
        "lợi ích",
        "tác dụng",
        "chế độ ăn",
        "ăn kiêng",
        "phòng ngừa",
        "phòng bệnh",
        "bảo vệ sức khỏe",
        "tốt cho",
        "giúp",
        "bị",
        "nên ăn",
        "không nên ăn",
        "kiêng",
        "bầu",
        "trẻ em",
        "giảm cân",
        "tăng cân",
        "ăn chay",
        "ăn thuần chay",
        "vegan",
        "vegetarian",
        "keto",
        "low carb",
        "cholesterol",
        "huyết áp",
        "tim mạch",
        "tiểu đường",
        "béo phì",
        "mang thai",
        "mẹ bầu",
        "bà bầu",
        "trẻ nhỏ",
        "em bé",
        "sức đề kháng",
        "miễn dịch",
        "thực phẩm tốt cho",
        "thực phẩm nào",
        "món ăn nào",
        "thực phẩm chức năng",
        "bổ sung",
        "vitamin",
        "khoáng chất",
        "lời khuyên",
        "tư vấn",
        "gợi ý",
    ]
    lower_q = question.lower()
    if any(kw in lower_q for kw in health_keywords):
        # Gọi GPT để sinh câu trả lời
        try:
            prompt = f"Bạn là chuyên gia dinh dưỡng và sức khỏe. Hãy trả lời ngắn gọn, dễ hiểu, thân thiện.\n\nCâu hỏi: {question}\n\nTrả lời:"
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Bạn là chuyên gia dinh dưỡng và sức khỏe, trả lời ngắn gọn, dễ hiểu, thân thiện."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=350,
                temperature=0.7
            )
            # Bọc an toàn khi lấy content
            content = response.choices[0].message.content if response.choices[0].message and hasattr(response.choices[0].message, "content") else ""
            answer = content.strip() if isinstance(content, str) else ""
            last_responses[session_id] = answer

            # Tìm sản phẩm liên quan (ưu tiên nhóm đối tượng đặc biệt)
            try:
                # Tổng hợp từ khóa tìm kiếm
                keywords = extract_keywords(question + " " + answer)
                special_groups = {
                    "trẻ em": [
                        "trẻ em",
                        "em bé",
                        "bé",
                        "thiếu nhi",
                        "trẻ nhỏ",
                        "con nít",
                        "nhóc",
                        "bé yêu",
                        "em nhỏ",
                    ],
                    "người già": [
                        "người già",
                        "người lớn tuổi",
                        "cao tuổi",
                        "lớn tuổi",
                        "người cao tuổi",
                        "ông bà",
                        "các cụ",
                    ],
                    "mẹ bầu": [
                        "mẹ bầu",
                        "bà bầu",
                        "phụ nữ mang thai",
                        "thai phụ",
                        "mang thai",
                        "bầu bí",
                        "bầu bì",
                        "mẹ đang có em bé",
                    ],
                    "ăn kiêng": [
                        "ăn kiêng",
                        "giảm cân",
                        "low carb",
                        "keto",
                        "dành cho người ăn kiêng",
                        "healthy",
                        "eat clean",
                        "ăn sạch",
                        "ăn lành mạnh",
                    ],
                    "tiểu đường": [
                        "tiểu đường",
                        "đường huyết",
                        "dành cho người tiểu đường",
                        "đái tháo đường",
                        "bệnh đường huyết cao",
                        "hạn chế đường",
                    ],
                    "tập gym": [
                        "tập gym",
                        "tập thể hình",
                        "tăng cơ",
                        "protein",
                        "dành cho người tập gym",
                        "tập luyện",
                        "thể hình",
                        "đốt mỡ",
                        "fitness",
                    ],
                    "dị ứng": [
                        "dị ứng",
                        "không dung nạp",
                        "dị ứng hải sản",
                        "dị ứng sữa",
                        "không gluten",
                        "không lactose",
                        "không chứa đậu phộng",
                    ],
                    "thực phẩm chức năng": [
                        "thực phẩm chức năng",
                        "bổ sung",
                        "vitamin",
                        "hỗ trợ sức khỏe",
                        "hỗ trợ đề kháng",
                        "tăng cường sức khỏe",
                    ],
                    "ăn chay": [
                        "ăn chay",
                        "thực phẩm chay",
                        "thuần chay",
                        "vegan",
                        "vegetarian",
                        "không ăn thịt",
                    ],
                    "tim mạch": [
                        "bệnh tim",
                        "tim mạch",
                        "cao huyết áp",
                        "huyết áp cao",
                        "cholesterol cao",
                    ],
                    "tiêu hóa": [
                        "tiêu hóa kém",
                        "đầy bụng",
                        "khó tiêu",
                        "rối loạn tiêu hóa",
                    ],
                }

                group_category = None
                q_and_a = (question + " " + answer).lower()
                for group, group_keywords in special_groups.items():
                    if any(kw in q_and_a for kw in group_keywords):
                        group_category = group
                        break
                products = []
                product_text = ""
                if group_category:
                    products = search_products(group_category)
                    print(f"Tìm theo nhóm: {group_category}, số sản phẩm: {len(products) if products else 0}")
                    if not products or len(products) == 0:
                        # Fallback sang tìm kiếm từ khóa nếu không có sản phẩm theo nhóm
                        products = search_products(" ".join(keywords))
                        print(f"Fallback sang từ khóa, số sản phẩm: {len(products) if products else 0}")
                        if products and len(products) > 0:
                            product_text = f"Không có sản phẩm chuyên biệt cho nhóm '{group_category}'. Dưới đây là các sản phẩm liên quan khác:\n"
                        else:
                            # Fallback: lấy 5 sản phẩm bất kỳ/nổi bật nếu vẫn không có gì
                            all_products = get_product_data()
                            if all_products:
                                products = all_products[:5]
                                product_text = "Không có sản phẩm phù hợp, dưới đây là một số sản phẩm nổi bật trong cửa hàng:\n"
                            else:
                                product_text = "Hiện không có sản phẩm phù hợp trong cửa hàng. Xin lỗi quý khách."
                else:
                    products = search_products(" ".join(keywords))
                    print(f"Tìm theo từ khóa, số sản phẩm: {len(products) if products else 0}")
                    if not products or len(products) == 0:
                        all_products = get_product_data()
                        if all_products:
                            products = all_products[:5]
                            product_text = "Không có sản phẩm phù hợp, dưới đây là một số sản phẩm nổi bật trong cửa hàng:\n"
                        else:
                            product_text = "Hiện không có sản phẩm phù hợp trong cửa hàng. Xin lỗi quý khách."
                print(f"Từ khóa tìm kiếm: {keywords}")

            except Exception as e:
                print(f"Lỗi khi tìm sản phẩm liên quan: {e}")
                products = []

            # Đảm bảo product_text luôn là chuỗi
            if product_text is None:
                product_text = ""
            if products and len(products) > 0:
                product_list = []
                for p in products[:5]:
                    name = str(p.get("productName", p.get("name", "Sản phẩm")))
                    price = p.get("productPrice", p.get("price", 0))
                    desc = ""
                    prod_desc = p.get("productDescription")
                    if isinstance(prod_desc, list):
                        desc = prod_desc[0] if prod_desc else ""
                    elif isinstance(prod_desc, str):
                        desc = prod_desc
                    product_list.append(f"- {name} ({price:,}đ): {desc}")
                if product_text:
                    product_text = product_text + "\n" + "\n".join(product_list)
                else:
                    product_text = f"Hiện tại có {len(products)} sản phẩm phù hợp trong cửa hàng:\n" + "\n".join(product_list)
            elif not product_text:
                product_text = "Hiện không có sản phẩm phù hợp trong cửa hàng. Xin lỗi quý khách."

            return jsonify({"answer": answer + "\n\n" + product_text})
        except Exception as e:
            print(f"Lỗi OpenAI: {str(e)}")
            return jsonify({"answer": f"Lỗi khi gọi OpenAI: {str(e)}"}), 500

    # Kiểm tra xem có phải yêu cầu so sánh sản phẩm không
    if is_comparison_request(question):
        print(f"Phát hiện yêu cầu so sánh sản phẩm: '{question}'")
        product_ids = data.get("product_ids", [])
        print(f"Product IDs nhận được: {product_ids}")
        
        if not product_ids or len(product_ids) < 2:
            print("Không đủ product_ids để so sánh")
            return (
                jsonify({"answer": "Vui lòng chọn ít nhất 2 sản phẩm để so sánh."}),
                400,
            )
        
        comparison_result = compare_products(product_ids)
        print(f"Đã tạo kết quả so sánh dài {len(comparison_result)} ký tự")
        return jsonify({"answer": comparison_result, "type": "comparison"}), 200

    # Kiểm tra xem có phải yêu cầu tìm nguyên liệu không
    if "tìm" in question.lower() and (
        "nguyên liệu" in question.lower() or "như trên" in question.lower()
    ):
        # Lấy câu trả lời cuối cùng của phiên này
        last_response = last_responses.get(session_id, "")
        
        if not last_response:
            return jsonify(
                {
                    "answer": "Tôi chưa có thông tin về nguyên liệu nào. Vui lòng hỏi về một món ăn trước."
                }
            )
        
        # Trích xuất danh sách nguyên liệu từ câu trả lời cuối
        ingredients = extract_ingredients(last_response)
        
        if not ingredients:
            return jsonify(
                {
                    "answer": "Tôi không tìm thấy nguyên liệu nào trong thông tin trước đó."
                }
            )
        
        # Kiểm tra xem nguyên liệu nào có trong cửa hàng
        ingredient_results = check_ingredient_availability(ingredients)
        
        # Tạo câu trả lời
        answer = "🛒 **Kết quả tìm kiếm nguyên liệu trong cửa hàng:**\n\n"
        
        # Phân loại nguyên liệu có sẵn và không có sẵn
        available = []
        unavailable = []
        alternatives_info = {}
        
        for ingredient, info in ingredient_results.items():
            if info["available"]:
                product_info = f"- **{ingredient}**: ✅ Có sẵn\n"
                product_name = str(info.get('product_name', ''))
                product_info += f"  → {product_name.title()}: {format_price(info['price'])} / {info['unit']}\n"
                
                # Thêm thông tin tồn kho nếu có
                if isinstance(info.get("stock"), int):
                    if info["stock"] > 0:
                        product_info += (
                            f"  → Số lượng tồn: {info['stock']} {info['unit']}\n"
                        )
                    else:
                        product_info += f"  → Hết hàng (đang nhập thêm)\n"
                        
                available.append(product_info)
            else:
                unavailable.append(f"- **{ingredient}**: ❌ Không có sẵn\n")
                
                # Tìm sản phẩm thay thế
                alternatives = suggest_alternative_products(ingredient)
                if alternatives:
                    alternatives_info[ingredient] = alternatives
        
        # Hiển thị nguyên liệu có sẵn trước
        if available:
            answer += "**Nguyên liệu có sẵn:**\n"
            answer += "".join(available)
            answer += "\n"
        
        # Hiển thị nguyên liệu không có sẵn
        if unavailable:
            answer += "**Nguyên liệu không có sẵn:**\n"
            answer += "".join(unavailable)
            
            # Hiển thị sản phẩm thay thế
            if alternatives_info:
                answer += "\n**Sản phẩm thay thế gợi ý:**\n"
                for ingredient, alternatives in alternatives_info.items():
                    answer += f"Thay thế cho {ingredient}:\n"
                    for alt in alternatives:
                        answer += f"  → {alt['name']}: {format_price(alt['price'])} / {alt['unit']}\n"
                    answer += "\n"
        
        # Thêm gợi ý
        if unavailable:
            answer += "\n💡 *Bạn có thể đặt hàng trước các nguyên liệu không có sẵn hoặc sử dụng sản phẩm thay thế.*"
        else:
            answer += "\n💡 *Tất cả nguyên liệu đều có sẵn trong cửa hàng. Chúc bạn nấu ăn ngon miệng!*"
        
        return jsonify({"answer": answer})
    
    try:
        # Gọi OpenAI API đúng cách với thư viện mới
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là trợ lý tư vấn thực phẩm, trả lời ngắn gọn, dễ hiểu, thân thiện.",
                },
                {"role": "user", "content": question},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        answer = response.choices[0].message.content.strip()
        print(f"Câu hỏi: {question}")
        print(f"Câu trả lời: {answer}")
        
        # Lưu câu trả lời cho phiên này
        last_responses[session_id] = answer
        
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Lỗi OpenAI: {str(e)}")
        return jsonify({"answer": f"Lỗi khi gọi OpenAI: {str(e)}"}), 500


def is_comparison_request(question):
    """Kiểm tra xem yêu cầu có phải là so sánh sản phẩm không"""
    question = question.lower()
    
    # Danh sách các cụm từ chính xác cho yêu cầu so sánh
    exact_phrases = [
        "so sánh",
        "so sánh 2 sản phẩm",
        "so sánh hai sản phẩm",
        "so sánh 2 sản phẩm này",
        "so sánh hai sản phẩm này",
        "s nó không so sánh",
        "không thể so sánh được",
        "giúp tôi so sánh",
        "nên chọn cái nào",
        "cái nào tốt hơn",
    ]
    
    # Kiểm tra các cụm từ chính xác
    for phrase in exact_phrases:
        if phrase in question:
            print(f"Phát hiện yêu cầu so sánh: '{phrase}' trong '{question}'")
            return True
    
    # Kiểm tra các từ khóa so sánh
    comparison_keywords = [
        "so sánh",
        "so với",
        "đối chiếu",
        "khác nhau",
        "giống nhau",
        "tốt hơn",
        "kém hơn",
        "nên mua",
    ]
    
    for keyword in comparison_keywords:
        if keyword in question:
            print(f"Phát hiện từ khóa so sánh: '{keyword}' trong '{question}'")
            return True
            
    return False


def compare_products(product_ids):
    """So sánh các sản phẩm dựa trên ID"""
    # Lấy dữ liệu sản phẩm từ database
    all_products = get_product_data()
    
    # Nếu không có dữ liệu từ database, thử đọc từ file JSON
    if not all_products:
        try:
            with open("products.json", "r", encoding="utf-8") as f:
                all_products = json.load(f)
        except:
            try:
                with open("data/products.json", "r", encoding="utf-8") as f:
                    all_products = json.load(f)
            except:
                return "Không thể truy cập dữ liệu sản phẩm để so sánh."
    
    # Lọc các sản phẩm cần so sánh
    products_to_compare = []
    for product_id in product_ids:
        for product in all_products:
            if str(product.get("id", "")) == str(product_id):
                products_to_compare.append(product)
                break
    
    # Kiểm tra xem có đủ sản phẩm để so sánh không
    if len(products_to_compare) < 2:
        return "Không đủ sản phẩm để so sánh. Vui lòng chọn ít nhất 2 sản phẩm."
    
    # Nếu có đúng 2 sản phẩm, sử dụng hàm so sánh chi tiết
    if len(products_to_compare) == 2:
        return generate_detailed_comparison(
            products_to_compare[0], products_to_compare[1]
        )
    
    # Nếu có nhiều hơn 2 sản phẩm, tạo bảng so sánh
    return generate_comparison_table(products_to_compare)


def generate_detailed_comparison(product1, product2):
    """Tạo so sánh chi tiết giữa 2 sản phẩm"""
    # Tiêu đề
    comparison = f"## So sánh chi tiết: {product1['name']} và {product2['name']}\n\n"
    
    # So sánh giá
    price1 = product1.get("price", 0)
    price2 = product2.get("price", 0)
    unit1 = product1.get("unit", "")
    unit2 = product2.get("unit", "")
    
    comparison += "### Giá bán:\n"
    comparison += f"- **{product1['name']}**: {format_price(price1)}/{unit1}\n"
    comparison += f"- **{product2['name']}**: {format_price(price2)}/{unit2}\n"
    
    # Tính chênh lệch giá
    if price1 > 0 and price2 > 0:
        price_diff = abs(price1 - price2)
        price_diff_percent = (price_diff / min(price1, price2)) * 100
        
        if price1 > price2:
            comparison += f"- **{product1['name']}** đắt hơn **{price_diff_percent:.1f}%** so với **{product2['name']}**\n"
        elif price2 > price1:
            comparison += f"- **{product2['name']}** đắt hơn **{price_diff_percent:.1f}%** so với **{product1['name']}**\n"
        else:
            comparison += "- Hai sản phẩm có giá ngang nhau\n"
    
    comparison += "\n"
    
    # So sánh xuất xứ
    origin1 = product1.get("origin", "Không có thông tin")
    origin2 = product2.get("origin", "Không có thông tin")
    
    comparison += "### Xuất xứ:\n"
    comparison += f"- **{product1['name']}**: {origin1}\n"
    comparison += f"- **{product2['name']}**: {origin2}\n\n"
    
    # So sánh thương hiệu
    brand1 = product1.get("brand", "Không có thông tin")
    brand2 = product2.get("brand", "Không có thông tin")
    
    comparison += "### Thương hiệu:\n"
    comparison += f"- **{product1['name']}**: {brand1}\n"
    comparison += f"- **{product2['name']}**: {brand2}\n\n"
    
    # So sánh đánh giá
    rating1 = product1.get("rating", 0)
    rating2 = product2.get("rating", 0)
    
    comparison += "### Đánh giá của người dùng:\n"
    if rating1 > 0:
        comparison += f"- **{product1['name']}**: {rating1}/5 sao\n"
    else:
        comparison += f"- **{product1['name']}**: Chưa có đánh giá\n"
        
    if rating2 > 0:
        comparison += f"- **{product2['name']}**: {rating2}/5 sao\n"
    else:
        comparison += f"- **{product2['name']}**: Chưa có đánh giá\n"
    
    # So sánh chất lượng dựa trên đánh giá
    if rating1 > 0 and rating2 > 0:
        if rating1 > rating2:
            comparison += f"- **{product1['name']}** được đánh giá cao hơn\n"
        elif rating2 > rating1:
            comparison += f"- **{product2['name']}** được đánh giá cao hơn\n"
        else:
            comparison += "- Hai sản phẩm có đánh giá ngang nhau\n"
    
    comparison += "\n"
    
    # Thông tin chi tiết
    comparison += "### Mô tả sản phẩm:\n"
    description1 = product1.get("description", "Không có thông tin chi tiết")
    description2 = product2.get("description", "Không có thông tin chi tiết")
    
    comparison += f"- **{product1['name']}**: {description1}\n"
    comparison += f"- **{product2['name']}**: {description2}\n\n"
    
    # Điểm mạnh của từng sản phẩm
    comparison += "### Điểm mạnh:\n"
    
    # Phân tích điểm mạnh của sản phẩm 1
    strengths1 = []
    if price1 < price2:
        strengths1.append("Giá thành thấp hơn")
    if rating1 > rating2:
        strengths1.append("Đánh giá cao hơn")
    if (
        "organic" in product1.get("description", "").lower()
        or "hữu cơ" in product1.get("description", "").lower()
    ):
        strengths1.append("Sản phẩm hữu cơ/organic")
    if "nhập khẩu" in product1.get("description", "").lower():
        strengths1.append("Sản phẩm nhập khẩu")
    
    # Phân tích điểm mạnh của sản phẩm 2
    strengths2 = []
    if price2 < price1:
        strengths2.append("Giá thành thấp hơn")
    if rating2 > rating1:
        strengths2.append("Đánh giá cao hơn")
    if (
        "organic" in product2.get("description", "").lower()
        or "hữu cơ" in product2.get("description", "").lower()
    ):
        strengths2.append("Sản phẩm hữu cơ/organic")
    if "nhập khẩu" in product2.get("description", "").lower():
        strengths2.append("Sản phẩm nhập khẩu")
    
    # Hiển thị điểm mạnh
    if strengths1:
        comparison += f"- **{product1['name']}**: {', '.join(strengths1)}\n"
    else:
        comparison += f"- **{product1['name']}**: Không có điểm nổi bật đặc biệt\n"
        
    if strengths2:
        comparison += f"- **{product2['name']}**: {', '.join(strengths2)}\n"
    else:
        comparison += f"- **{product2['name']}**: Không có điểm nổi bật đặc biệt\n"
    
    comparison += "\n"
    
    # Kết luận
    comparison += "### Kết luận:\n"
    
    # Phân tích dựa trên giá và chất lượng
    if price1 < price2 and rating1 >= rating2:
        comparison += f"- **{product1['name']}** có giá thấp hơn và chất lượng tốt, là lựa chọn hợp lý hơn về hiệu quả kinh tế.\n"
    elif price2 < price1 and rating2 >= rating1:
        comparison += f"- **{product2['name']}** có giá thấp hơn và chất lượng tốt, là lựa chọn hợp lý hơn về hiệu quả kinh tế.\n"
    elif rating1 > rating2:
        comparison += f"- **{product1['name']}** được đánh giá cao hơn, phù hợp nếu bạn ưu tiên chất lượng.\n"
    elif rating2 > rating1:
        comparison += f"- **{product2['name']}** được đánh giá cao hơn, phù hợp nếu bạn ưu tiên chất lượng.\n"
    else:
        comparison += "- Hai sản phẩm có chất lượng tương đương, bạn có thể lựa chọn dựa trên sở thích cá nhân và ngân sách.\n"
    
    return comparison


def generate_comparison_table(products):
    """Tạo bảng so sánh cho nhiều sản phẩm"""
    # Tiêu đề
    comparison = f"## So sánh {len(products)} sản phẩm\n\n"
    
    # Tạo bảng so sánh
    comparison += "| Tiêu chí |"
    for product in products:
        comparison += f" {product['name']} |"
    comparison += "\n"
    
    # Tạo đường ngăn cách tiêu đề
    comparison += "| --- |"
    for _ in products:
        comparison += " --- |"
    comparison += "\n"
    
    # Thêm hàng giá
    comparison += "| Giá |"
    for product in products:
        price = product.get("price", 0)
        unit = product.get("unit", "")
        comparison += f" {format_price(price)}/{unit} |"
    comparison += "\n"
    
    # Thêm hàng xuất xứ
    comparison += "| Xuất xứ |"
    for product in products:
        origin = product.get("origin", "Không có thông tin")
        comparison += f" {origin} |"
    comparison += "\n"
    
    # Thêm hàng thương hiệu
    comparison += "| Thương hiệu |"
    for product in products:
        brand = product.get("brand", "Không có thông tin")
        comparison += f" {brand} |"
    comparison += "\n"
    
    # Thêm hàng đánh giá
    comparison += "| Đánh giá |"
    for product in products:
        rating = product.get("rating", 0)
        if rating > 0:
            comparison += f" {rating}/5 sao |"
        else:
            comparison += " Chưa có đánh giá |"
    comparison += "\n"
    
    # Thêm kết luận
    comparison += "\n### Phân tích nhanh:\n"
    
    # Tìm sản phẩm có giá thấp nhất
    lowest_price_product = min(products, key=lambda x: x.get("price", float("inf")))
    comparison += f"- **{lowest_price_product['name']}** có giá thấp nhất.\n"
    
    # Tìm sản phẩm có đánh giá cao nhất
    rated_products = [p for p in products if p.get("rating", 0) > 0]
    if rated_products:
        highest_rating_product = max(rated_products, key=lambda x: x.get("rating", 0))
        comparison += f"- **{highest_rating_product['name']}** có đánh giá cao nhất ({highest_rating_product.get('rating', 0)}/5 sao).\n"
    
    # Gợi ý lựa chọn
    comparison += "\n### Gợi ý lựa chọn:\n"
    comparison += (
        "- Nếu bạn ưu tiên giá cả: chọn **" + lowest_price_product["name"] + "**\n"
    )
    
    if rated_products:
        comparison += (
            "- Nếu bạn ưu tiên đánh giá: chọn **"
            + highest_rating_product["name"]
            + "**\n"
        )
    
    comparison += "- Để biết thêm chi tiết về từng sản phẩm, vui lòng nhấn vào sản phẩm để xem thông tin đầy đủ.\n"
    
    return comparison


def extract_ingredients(text):
    """Trích xuất danh sách nguyên liệu từ văn bản"""
    ingredients = []
    
    # Tìm danh sách đánh số
    numbered_list = re.findall(r"\d+\.\s+(.*?)(?=\d+\.|$)", text, re.DOTALL)
    if numbered_list:
        for item in numbered_list:
            # Lấy tên nguyên liệu (phần đầu tiên trước dấu phẩy hoặc dấu ngoặc)
            ingredient = re.split(r"[,\(:]", item.strip())[0].strip()
            if ingredient and len(ingredient) > 1:  # Tránh các kết quả quá ngắn
                ingredients.append(ingredient)
    
    # Tìm danh sách dấu gạch đầu dòng
    bullet_list = re.findall(r"[-•*]\s+(.*?)(?=[-•*]|$)", text, re.DOTALL)
    if bullet_list:
        for item in bullet_list:
            ingredient = re.split(r"[,\(:]", item.strip())[0].strip()
            if ingredient and len(ingredient) > 1:
                ingredients.append(ingredient)
    
    # Tìm danh sách trong các phần được đánh dấu
    sections = [
        "nguyên liệu chính",
        "nguyên liệu",
        "gia vị",
        "nguyên liệu phụ",
        "thành phần",
    ]
    for section in sections:
        if section in text.lower():
            # Tìm phần văn bản sau section và trước section tiếp theo hoặc kết thúc
            section_pattern = f"{section}(.*?)(?:{'|'.join(sections)}|$)"
            section_matches = re.findall(
                section_pattern, text.lower(), re.DOTALL | re.IGNORECASE
            )
            
            if section_matches:
                for section_text in section_matches:
                    # Tìm các dòng trong phần này
                    lines = section_text.split("\n")
                    for line in lines:
                        line = line.strip()
                        if (
                            line
                            and not line.startswith((":", ".", "#", "##"))
                            and len(line) > 1
                        ):
                            # Loại bỏ các từ khóa không phải nguyên liệu
                            non_ingredient_words = [
                                "lượng",
                                "gram",
                                "kg",
                                "cần",
                                "yêu cầu",
                                "chuẩn bị",
                            ]
                            if not any(
                                word in line.lower() for word in non_ingredient_words
                            ):
                                # Lấy phần đầu tiên của dòng (trước dấu phẩy, dấu hai chấm hoặc dấu ngoặc)
                                ingredient = re.split(r"[,\(:]", line)[0].strip()
                                if ingredient and len(ingredient) > 1:
                                    ingredients.append(ingredient)
    
    # Nếu không tìm thấy danh sách theo cách trên, thử phân tích từng dòng
    if not ingredients:
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            # Tìm các dòng có thể chứa nguyên liệu
            if line and len(line) < 100 and not line.startswith(("#", "##", ">")):
                # Kiểm tra xem dòng có chứa các từ khóa liên quan đến số lượng không
                quantity_keywords = [
                    "gram",
                    "kg",
                    "g",
                    "ml",
                    "lít",
                    "muỗng",
                    "chén",
                    "củ",
                    "quả",
                    "cái",
                ]
                if any(keyword in line.lower() for keyword in quantity_keywords):
                    # Lấy phần đầu tiên của dòng (trước số lượng)
                    parts = re.split(r"[:–\-]", line)
                    if parts:
                        ingredient = parts[0].strip()
                        if ingredient and len(ingredient) > 1:
                            ingredients.append(ingredient)
    
    # Chuẩn hóa và nhóm các nguyên liệu tương tự
    normalized_ingredients = []
    seen = set()
    
    # Ánh xạ các nguyên liệu tương tự
    similar_ingredients = {
        "thịt heo": [
            "thịt lợn",
            "thịt ba chỉ",
            "ba chỉ",
            "thịt nạc",
            "thịt vai",
            "thịt đùi",
        ],
        "thịt bò": ["bò", "thăn bò", "gầu bò", "nạm bò"],
        "thịt gà": ["gà", "đùi gà", "cánh gà", "ức gà"],
        "thịt vịt": ["vịt"],
        "hành": ["hành tím", "hành khô", "củ hành", "hành lá", "hành hoa"],
        "tỏi": ["củ tỏi", "tỏi tươi", "tỏi khô"],
        "ớt": ["ớt hiểm", "ớt sừng"],
        "nước mắm": ["mắm"],
        "muối": ["muối ăn", "muối tinh", "muối hạt"],
    }
    
    for ingredient in ingredients:
        normalized = ingredient.lower().strip()
        
        # Kiểm tra xem nguyên liệu này đã được xử lý chưa
        if normalized in seen:
            continue
            
        # Kiểm tra xem có phải là nguyên liệu tương tự không
        standardized_name = normalized
        for main_name, variants in similar_ingredients.items():
            if normalized in variants or any(
                variant in normalized for variant in variants
            ):
                standardized_name = main_name
                break
                
        # Thêm vào danh sách kết quả
        normalized_ingredients.append(standardized_name)
        seen.add(normalized)
        
        # Đánh dấu tất cả các biến thể đã được xử lý
        for main_name, variants in similar_ingredients.items():
            if standardized_name == main_name:
                for variant in variants:
                    seen.add(variant)
    
    # Loại bỏ các từ không phải nguyên liệu
    non_ingredients = [
        "cách làm",
        "hướng dẫn",
        "chế biến",
        "nấu",
        "món",
        "ăn",
        "chúc",
        "ngon miệng",
    ]
    filtered_ingredients = [
        ing
        for ing in normalized_ingredients
        if not any(word in ing.lower() for word in non_ingredients)
    ]
    
    # Sắp xếp theo bảng chữ cái
    filtered_ingredients.sort()
    
    return filtered_ingredients


def check_ingredient_availability(ingredients):
    """Kiểm tra xem nguyên liệu có sẵn trong cửa hàng không"""
    # Lấy dữ liệu sản phẩm từ database
    products = get_product_data()
    
    # Nếu không có dữ liệu từ database, thử đọc từ file JSON
    if not products:
        try:
            with open("products.json", "r", encoding="utf-8") as f:
                products = json.load(f)
        except:
            # Nếu không tìm thấy file, thử đường dẫn khác
            try:
                with open("data/products.json", "r", encoding="utf-8") as f:
                    products = json.load(f)
            except:
                # Nếu không có file nào, trả về tất cả là không có sẵn
                return {ingredient: {"available": False} for ingredient in ingredients}
    
    # Phân loại sản phẩm theo danh mục
    categorized_products = {}
    for product in products:
        category = product.get("category", "").lower()
        if category not in categorized_products:
            categorized_products[category] = []
        categorized_products[category].append(
            {
            "name": product["name"].lower(),
            "description": product.get("description", "").lower(),
            "category": category,
            "id": product.get("id", ""),
            "price": product.get("price", 0),
            "unit": product.get("unit", ""),
            "stock": product.get("stock", 0),
                "original": product,
            }
        )
    
    # Danh mục thực phẩm và phi thực phẩm
    food_categories = [
        "thực phẩm",
        "rau củ",
        "trái cây",
        "thịt",
        "cá",
        "hải sản",
        "gia vị",
        "đồ khô",
        "đồ uống",
        "bánh kẹo",
        "sữa",
        "trứng",
        "thực phẩm đông lạnh",
        "thực phẩm chế biến sẵn",
    ]

    non_food_categories = [
        "đồ dùng",
        "mỹ phẩm",
        "chăm sóc cá nhân",
        "vệ sinh",
        "giặt giũ",
        "tẩy rửa",
        "đồ dùng nhà bếp",
        "đồ dùng gia đình",
        "văn phòng phẩm",
        "điện tử",
        "điện gia dụng",
    ]
    
    # Từ khóa loại trừ cho từng loại nguyên liệu
    exclusion_keywords = {
        "thịt": ["giả", "chay", "kem", "bánh", "kẹo", "mì gói"],
        "cá": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "rau": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "trái cây": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "gia vị": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "dầu ăn": ["gội", "xả", "dưỡng", "kem", "sữa tắm", "dưỡng thể", "đánh răng"],
        "nước mắm": ["ngọt", "pepsi", "coca", "giặt", "tẩy", "rửa"],
        "trứng": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "hành": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "tỏi": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
    }
    
    # Kiểm tra từng nguyên liệu
    result = {}
    
    for ingredient in ingredients:
        # Chuẩn hóa tên nguyên liệu
        normalized = ingredient.lower().strip()
        
        # Xác định các danh mục liên quan đến thực phẩm dựa trên nguyên liệu
        relevant_food_categories = []
        
        # Xác định danh mục thực phẩm dựa trên nguyên liệu
        if any(
            word in normalized
            for word in ["thịt", "sườn", "ba chỉ", "nạc", "đùi", "cánh"]
        ):
            relevant_food_categories.extend(
                ["thịt", "thực phẩm tươi sống", "thực phẩm"]
            )
        elif any(
            word in normalized
            for word in ["cá", "tôm", "mực", "cua", "ghẹ", "sò", "hàu"]
        ):
            relevant_food_categories.extend(
                ["hải sản", "cá", "thực phẩm tươi sống", "thực phẩm"]
            )
        elif any(
            word in normalized for word in ["rau", "củ", "cải", "xà lách", "bắp cải"]
        ):
            relevant_food_categories.extend(
                ["rau củ", "rau củ quả", "thực phẩm tươi sống", "thực phẩm"]
            )
        elif any(
            word in normalized
            for word in ["trái", "quả", "táo", "cam", "chuối", "xoài"]
        ):
            relevant_food_categories.extend(["trái cây", "rau củ quả", "thực phẩm"])
        elif any(
            word in normalized
            for word in [
                "nước mắm",
                "nước tương",
                "tương",
                "gia vị",
                "muối",
                "tiêu",
                "đường",
                "hạt nêm",
            ]
        ):
            relevant_food_categories.extend(["gia vị", "đồ khô", "thực phẩm"])
        elif any(word in normalized for word in ["dầu ăn", "dầu hào", "dầu mè", "bơ"]):
            relevant_food_categories.extend(["dầu ăn", "gia vị", "đồ khô", "thực phẩm"])
        elif any(word in normalized for word in ["gạo", "bột", "ngũ cốc"]):
            relevant_food_categories.extend(["đồ khô", "gạo", "bột", "thực phẩm"])
        elif any(word in normalized for word in ["mì", "bún", "phở", "miến"]):
            relevant_food_categories.extend(["mì", "bún", "phở", "đồ khô", "thực phẩm"])
        elif any(word in normalized for word in ["sữa", "phô mai", "bơ sữa"]):
            relevant_food_categories.extend(["sữa", "thực phẩm"])
        elif any(word in normalized for word in ["trứng"]):
            relevant_food_categories.extend(
                ["trứng", "thực phẩm tươi sống", "thực phẩm"]
            )
        elif any(word in normalized for word in ["hành", "tỏi", "gừng", "ớt"]):
            relevant_food_categories.extend(
                ["rau củ", "gia vị", "thực phẩm tươi sống", "thực phẩm"]
            )
        elif "vịt" in normalized:
            relevant_food_categories.extend(
                ["thịt", "thịt vịt", "thực phẩm tươi sống", "thực phẩm"]
            )
        else:
            # Mặc định xem là thực phẩm
            relevant_food_categories.extend(["thực phẩm"])
        
        # Lấy từ khóa loại trừ cho nguyên liệu này
        current_exclusions = []
        for key, exclusions in exclusion_keywords.items():
            if key in normalized or normalized in key:
                current_exclusions.extend(exclusions)
        
        # Tìm sản phẩm phù hợp
        matches = []
        
        # Ưu tiên tìm trong các danh mục thực phẩm liên quan
        for category_name, products_list in categorized_products.items():
            # Kiểm tra xem danh mục có phải là thực phẩm liên quan không
            is_relevant_category = any(
                food_cat in category_name for food_cat in relevant_food_categories
            )
            
            # Nếu là danh mục thực phẩm liên quan, tìm kiếm trong đó
            if is_relevant_category:
                for product in products_list:
                    # Bỏ qua sản phẩm chứa từ khóa loại trừ
                    if any(
                        excl in product["name"] or excl in product["description"]
                        for excl in current_exclusions
                    ):
                        continue
                        
                    # Kiểm tra tên sản phẩm có chứa nguyên liệu không
                    if normalized in product["name"] or any(
                        word in product["name"]
                        for word in normalized.split()
                        if len(word) > 2
                    ):
                        # Thêm điểm phù hợp để sắp xếp sau này
                        product["match_score"] = 10
                        matches.append(product)
                    # Kiểm tra mô tả sản phẩm
                    elif normalized in product["description"]:
                        product["match_score"] = 5
                        matches.append(product)
        
        # Nếu không tìm thấy trong danh mục thực phẩm liên quan, tìm trong tất cả danh mục thực phẩm
        if not matches:
            for category_name, products_list in categorized_products.items():
                # Kiểm tra xem danh mục có phải là thực phẩm không
                is_food_category = any(
                    food_cat in category_name for food_cat in food_categories
                )
                
                # Nếu là danh mục thực phẩm, tìm kiếm trong đó
                if is_food_category:
                    for product in products_list:
                        # Bỏ qua sản phẩm chứa từ khóa loại trừ
                        if any(
                            excl in product["name"] or excl in product["description"]
                            for excl in current_exclusions
                        ):
                            continue
                            
                        # Kiểm tra tên sản phẩm có chứa nguyên liệu không
                        if normalized in product["name"] or any(
                            word in product["name"]
                            for word in normalized.split()
                            if len(word) > 2
                        ):
                            product["match_score"] = 8
                            matches.append(product)
                        # Kiểm tra mô tả sản phẩm
                        elif normalized in product["description"]:
                            product["match_score"] = 3
                            matches.append(product)
        
        # Sắp xếp kết quả theo độ phù hợp
        matches.sort(
            key=lambda x: (
            x.get("match_score", 0),  # Điểm phù hợp
                (
                    1 if normalized in x["name"] else 0
                ),  # Ưu tiên tên sản phẩm chứa đúng nguyên liệu
                (
                    1
                    if any(cat in x["category"] for cat in relevant_food_categories)
                    else 0
                ),  # Ưu tiên danh mục phù hợp
            ),
            reverse=True,
        )
        
        # Lọc kết quả không liên quan dựa trên điểm phù hợp
        filtered_matches = [m for m in matches if m.get("match_score", 0) >= 3]
        
        if filtered_matches:
            # Lấy sản phẩm phù hợp nhất
            best_match = filtered_matches[0]
            result[ingredient] = {
                "available": True,
                "product_name": best_match["original"]["name"],
                "price": best_match["price"],
                "unit": best_match["unit"],
                "stock": best_match.get("stock", "Có sẵn"),
            }
        else:
            result[ingredient] = {"available": False}
    
    return result


def format_price(price):
    """
    Định dạng giá tiền với dấu phân cách hàng nghìn
    """
    try:
        # Chuyển đổi giá thành số nguyên
        price_int = int(price)
        # Định dạng với dấu phân cách hàng nghìn
        return "{:,}".format(price_int).replace(",", ".")
    except (ValueError, TypeError):
        # Nếu không thể chuyển đổi, trả về giá gốc
        return str(price)


def suggest_alternative_products(ingredient):
    """Gợi ý các sản phẩm thay thế khi không tìm thấy nguyên liệu"""
    from db_connector import get_product_data
    
    # Lấy dữ liệu sản phẩm từ database
    products = get_product_data()
    
    # Nếu không có dữ liệu từ database, thử đọc từ file JSON
    if not products:
        try:
            with open("products.json", "r", encoding="utf-8") as f:
                products = json.load(f)
        except:
            try:
                with open("data/products.json", "r", encoding="utf-8") as f:
                    products = json.load(f)
            except:
                return []
    
    # Chuẩn hóa tên nguyên liệu
    normalized = ingredient.lower().strip()
    
    # Danh mục thực phẩm và phi thực phẩm
    food_categories = [
        "thực phẩm",
        "rau củ",
        "trái cây",
        "thịt",
        "cá",
        "hải sản",
        "gia vị",
        "đồ khô",
        "đồ uống",
        "bánh kẹo",
        "sữa",
        "trứng",
        "thực phẩm đông lạnh",
        "thực phẩm chế biến sẵn",
    ]
    
    # Từ khóa loại trừ cho từng loại nguyên liệu
    exclusion_keywords = {
        "thịt": ["giả", "chay", "kem", "bánh", "kẹo", "mì gói"],
        "cá": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "rau": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "trái cây": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "gia vị": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "dầu ăn": ["gội", "xả", "dưỡng", "kem", "sữa tắm", "dưỡng thể", "đánh răng"],
        "nước mắm": ["ngọt", "pepsi", "coca", "giặt", "tẩy", "rửa"],
        "trứng": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "hành": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
        "tỏi": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"],
    }
    
    # Xác định loại nguyên liệu để tìm thay thế phù hợp
    ingredient_type = ""
    if any(
        word in normalized for word in ["thịt", "sườn", "ba chỉ", "nạc", "đùi", "cánh"]
    ):
        ingredient_type = "thịt"
    elif any(
        word in normalized for word in ["cá", "tôm", "mực", "cua", "ghẹ", "sò", "hàu"]
    ):
        ingredient_type = "hải sản"
    elif any(word in normalized for word in ["rau", "củ", "cải", "xà lách", "bắp cải"]):
        ingredient_type = "rau củ"
    elif any(
        word in normalized for word in ["trái", "quả", "táo", "cam", "chuối", "xoài"]
    ):
        ingredient_type = "trái cây"
    elif any(
        word in normalized
        for word in [
            "nước mắm",
            "nước tương",
            "tương",
            "gia vị",
            "muối",
            "tiêu",
            "đường",
            "hạt nêm",
        ]
    ):
        ingredient_type = "gia vị"
    elif any(word in normalized for word in ["dầu ăn", "dầu hào", "dầu mè", "bơ"]):
        ingredient_type = "dầu ăn"
    elif any(word in normalized for word in ["gạo", "bột", "ngũ cốc"]):
        ingredient_type = "đồ khô"
    elif any(word in normalized for word in ["mì", "bún", "phở", "miến"]):
        ingredient_type = "mì bún phở"
    elif any(word in normalized for word in ["sữa", "phô mai", "bơ sữa"]):
        ingredient_type = "sữa"
    elif any(word in normalized for word in ["trứng"]):
        ingredient_type = "trứng"
    elif any(word in normalized for word in ["hành", "tỏi", "gừng", "ớt"]):
        ingredient_type = "gia vị"
    elif "vịt" in normalized:
        ingredient_type = "thịt"
    else:
        ingredient_type = "thực phẩm"
    
    # Lấy từ khóa loại trừ cho nguyên liệu này
    current_exclusions = []
    for key, exclusions in exclusion_keywords.items():
        if key in normalized or normalized in key:
            current_exclusions.extend(exclusions)
    
    # Phân loại sản phẩm theo danh mục
    categorized_products = {}
    for product in products:
        category = product.get("category", "").lower()
        if category not in categorized_products:
            categorized_products[category] = []
        categorized_products[category].append(
            {
            "name": product["name"].lower(),
            "description": product.get("description", "").lower(),
            "category": category,
            "id": product.get("id", ""),
            "price": product.get("price", 0),
            "unit": product.get("unit", ""),
            "stock": product.get("stock", 0),
                "original": product,
            }
        )
    
    # Tìm các sản phẩm thay thế
    alternatives = []
    
    # Ánh xạ các loại thay thế theo loại nguyên liệu
    alternative_mapping = {
        "thịt": ["thịt", "hải sản", "đạm thực vật", "đồ chay"],
        "hải sản": ["hải sản", "thịt", "đạm thực vật", "đồ chay"],
        "rau củ": ["rau củ", "rau củ quả", "thực phẩm tươi sống"],
        "trái cây": ["trái cây", "rau củ quả"],
        "gia vị": ["gia vị", "đồ khô"],
        "dầu ăn": ["dầu ăn", "gia vị", "dầu"],
        "đồ khô": ["đồ khô", "thực phẩm"],
        "mì bún phở": ["mì", "bún", "phở", "đồ khô"],
        "sữa": ["sữa", "đồ uống"],
        "trứng": ["trứng", "đạm", "thịt"],
        "thực phẩm": ["thực phẩm"],
    }
    
    # Lấy các loại thay thế cho nguyên liệu hiện tại
    alternative_types = alternative_mapping.get(ingredient_type, ["thực phẩm"])
    
    # Tìm sản phẩm thay thế từ các danh mục liên quan
    for alt_type in alternative_types:
        for category_name, products_list in categorized_products.items():
            # Kiểm tra xem danh mục có phù hợp với loại thay thế không
            if alt_type in category_name:
                for product in products_list:
                    # Bỏ qua sản phẩm chứa từ khóa loại trừ
                    if any(
                        excl in product["name"] or excl in product["description"]
                        for excl in current_exclusions
                    ):
                        continue
                        
                    # Kiểm tra xem sản phẩm này không phải là nguyên liệu gốc
                    if normalized not in product["name"] and not any(
                        word in product["name"]
                        for word in normalized.split()
                        if len(word) > 2
                    ):
                        # Chỉ lấy sản phẩm thực phẩm
                        if any(
                            food_cat in category_name for food_cat in food_categories
                        ):
                            # Tính điểm phù hợp
                            relevance_score = 2 if alt_type == ingredient_type else 1
                            
                            alternatives.append(
                                {
                                "name": product["original"]["name"],
                                "price": product.get("price", 0),
                                "unit": product.get("unit", ""),
                                "category": category_name,
                                    "relevance": relevance_score,
                                }
                            )
                            
                            # Giới hạn số lượng sản phẩm thay thế mỗi danh mục
                            if len(alternatives) >= 10:
                                break
    
    # Sắp xếp theo độ liên quan và giá cả
    alternatives.sort(
        key=lambda x: (x.get("relevance", 0), -x.get("price", 0)), reverse=True
    )
    
    # Loại bỏ các sản phẩm trùng lặp
    unique_alternatives = []
    seen_names = set()
    for alt in alternatives:
        if alt["name"].lower() not in seen_names:
            seen_names.add(alt["name"].lower())
            unique_alternatives.append(alt)
    
    # Giới hạn số lượng gợi ý
    return unique_alternatives[:3]


def process_message(message, userId):
    """
    Xử lý tin nhắn từ người dùng
    """
    try:
        log_debug("Xử lý tin nhắn từ người dùng", userId, message)
        
        # Kiểm tra từ khóa liên quan đến trái cây ít đường
        fruit_keywords = ["trái cây", "hoa quả", "quả", "trái"]
        low_sugar_keywords = [
            "ít đường",
            "đường thấp",
            "không đường",
            "ăn kiêng",
            "giảm cân",
            "tiểu đường",
        ]
        
        message_lower = message.lower()
        is_fruit_query = any(kw in message_lower for kw in fruit_keywords)
        is_low_sugar_query = any(kw in message_lower for kw in low_sugar_keywords)
        is_low_sugar_fruit_query = is_fruit_query and is_low_sugar_query
        
        log_debug(
            "Phân tích tin nhắn:",
            "is_fruit_query=",
            is_fruit_query,
            "is_low_sugar_query=",
            is_low_sugar_query,
            "is_low_sugar_fruit_query=",
            is_low_sugar_fruit_query,
        )
        
        # Kiểm tra các mẫu câu cụ thể về trái cây ít đường
        low_sugar_fruit_patterns = [
            r"trái cây nào ít đường",
            r"trái cây ít đường",
            r"hoa quả ít đường",
            r"quả nào ít đường",
            r"trái cây phù hợp cho người tiểu đường",
            r"hoa quả phù hợp cho người ăn kiêng",
            r"trái cây tốt cho người giảm cân",
        ]
        
        for pattern in low_sugar_fruit_patterns:
            if re.search(pattern, message_lower):
                is_low_sugar_fruit_query = True
                log_debug("Phát hiện mẫu câu về trái cây ít đường:", pattern)
                break
        
        # Xử lý câu hỏi về trái cây ít đường
        if is_low_sugar_fruit_query:
            log_debug("Chuyển hướng xử lý sang handle_low_sugar_fruit_query")
            return handle_low_sugar_fruit_query(message, userId)
        
        # Phân tích ý định
        intent = analyze_intent(message)
        log_debug("Phân tích ý định:", intent)
        
        # Xử lý theo ý định
        if intent == "greeting":
            log_debug("Xử lý lời chào")
            return "Xin chào! Tôi là trợ lý ảo của cửa hàng thực phẩm. Tôi có thể giúp bạn tìm kiếm sản phẩm, kiểm tra giá cả hoặc thông tin về khuyến mãi. Bạn cần giúp đỡ gì không?"
        
        elif intent == "price_inquiry":
            log_debug("Xử lý hỏi giá")
            # Lấy thông tin sản phẩm từ context
            context = get_or_create_context(userId)
            if "current_product" in context:
                product = context["current_product"]
                product_name = product.get("productName", "Sản phẩm")
                product_price = f"{int(product.get('productPrice', 0)):,}đ"
                return f"Giá của {product_name} là {product_price}."
            else:
                return "Bạn muốn biết giá của sản phẩm nào? Vui lòng cho tôi biết tên sản phẩm."
        
        elif intent == "promotion_inquiry":
            log_debug("Xử lý hỏi khuyến mãi")
            return "Hiện tại cửa hàng đang có chương trình giảm giá 10% cho tất cả các sản phẩm rau củ quả tươi và 15% cho các sản phẩm hữu cơ. Khuyến mãi áp dụng đến hết tháng này."
        
        else:  # product_search là mặc định
            log_debug("Xử lý tìm kiếm sản phẩm")
            # Tìm kiếm sản phẩm
            products = search_products(message)
            log_debug("Kết quả tìm kiếm:", len(products) if products else 0, "sản phẩm")
            
            if products and len(products) > 0:
                response = format_product_response(message, products, userId)
                log_debug("Đã tạo câu trả lời từ format_product_response")
                return response
            else:
                log_debug("Không tìm thấy sản phẩm phù hợp")
                return "Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn hoặc thử tìm kiếm với từ khóa khác không?"
    
    except Exception as e:
        log_debug("Lỗi khi xử lý tin nhắn:", str(e))
        return (
            f"Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Chi tiết lỗi: {str(e)}"
        )


# Thêm hàm xử lý câu hỏi về trái cây ít đường
def handle_low_sugar_fruit_query(message, context):
    print("Xử lý câu hỏi về trái cây ít đường")
    
    # Tìm kiếm sản phẩm trái cây trong database
    try:
        # Thử sử dụng tìm kiếm ngữ nghĩa nếu có
        products = []
        if (
            "semantic_search_products" in globals()
            and semantic_search_products is not None
        ):
            print("Sử dụng tìm kiếm ngữ nghĩa cho trái cây ít đường")
            products = semantic_search_products(message)
            print(
                f"Tìm thấy {len(products) if products else 0} sản phẩm trái cây ít đường bằng tìm kiếm ngữ nghĩa"
            )
        
        # Nếu không tìm thấy sản phẩm bằng tìm kiếm ngữ nghĩa, thử sử dụng tìm kiếm thông thường
        if not products or len(products) == 0:
            print(
                "Không tìm thấy sản phẩm bằng tìm kiếm ngữ nghĩa, thử tìm kiếm thông thường"
            )
            
            # Đảm bảo tìm kiếm trong danh mục Trái cây
            print("Đặt danh mục thành Trái cây cho truy vấn về trái cây ít đường")
            
            # Sử dụng hàm search_products với từ khóa đặc biệt
            search_message = "trái cây ít đường ăn kiêng"
            products = search_products(search_message)
            print(
                f"Tìm thấy {len(products) if products else 0} sản phẩm trái cây ít đường bằng tìm kiếm thông thường"
            )
            
            # Nếu vẫn không tìm thấy, thử tìm kiếm trực tiếp trong danh mục Trái cây
            if not products or len(products) == 0:
                print(
                    "Vẫn không tìm thấy, thử tìm kiếm trực tiếp trong danh mục Trái cây"
                )
                products = search_products_by_category(
                    "Trái cây", ["ít đường", "ăn kiêng"], None
                )
                
                # Nếu vẫn không tìm thấy, lấy tất cả trái cây
                if not products or len(products) == 0:
                    print("Vẫn không tìm thấy, thử tìm tất cả trái cây")
                    products = search_products_by_category("Trái cây", [], None)
    except Exception as e:
        print(f"Lỗi khi tìm kiếm sản phẩm: {e}")
        products = []
    
    # Tạo câu trả lời
    response = "Dựa trên yêu cầu của bạn về trái cây ít đường phù hợp cho người ăn kiêng, tôi xin giới thiệu:\n\n"
    
    # Nếu tìm thấy sản phẩm trái cây trong database
    if products and len(products) > 0:
        # Giới hạn số lượng sản phẩm hiển thị
        max_products = min(5, len(products))
        
        for i, product in enumerate(products[:max_products]):
            response += f"{i+1}. {product.get('productName', product.get('name', 'Sản phẩm'))} - {format_price(product.get('productPrice', product.get('price', 0)))} đồng\n"
            if "productDescription" in product and product["productDescription"]:
                response += f"   • {product['productDescription'][0]}\n"
            response += "\n"
        
        response += "Những loại trái cây này đều có hàm lượng đường thấp, phù hợp cho người ăn kiêng hoặc người cần kiểm soát lượng đường. Bạn có muốn biết thêm chi tiết về sản phẩm nào không?"
    else:
        # Nếu không tìm thấy sản phẩm, thông báo cho người dùng
        response = "Xin lỗi, hiện tại cửa hàng chúng tôi không tìm thấy sản phẩm trái cây phù hợp với yêu cầu của bạn. Vui lòng thử lại sau hoặc liên hệ với nhân viên cửa hàng để được tư vấn thêm."
    
    # Lưu ngữ cảnh
    if products and len(products) > 0:
        save_product_context(context.get("userId", "anonymous"), products[0], products)
    
    return response


# Hàm trích xuất danh mục sản phẩm từ tin nhắn
def extract_product_category(message):
    """
    Trích xuất danh mục sản phẩm từ tin nhắn
    """
    message_lower = message.lower()
    
    # Kiểm tra từ khóa liên quan đến trái cây ít đường
    fruit_keywords = ["trái cây", "hoa quả", "quả", "trái"]
    low_sugar_keywords = [
        "ít đường",
        "đường thấp",
        "không đường",
        "ăn kiêng",
        "giảm cân",
        "tiểu đường",
    ]
    
    is_fruit_query = any(kw in message_lower for kw in fruit_keywords)
    is_low_sugar_query = any(kw in message_lower for kw in low_sugar_keywords)
    
    # Nếu là truy vấn về trái cây ít đường, luôn trả về danh mục Trái cây
    if is_fruit_query and is_low_sugar_query:
        log_debug("Phát hiện truy vấn trái cây ít đường, trả về danh mục Trái cây")
        return "Trái cây"
    
    # Danh sách các danh mục và từ khóa tương ứng
    categories = {
        "Rau củ quả": [
            "rau",
            "củ",
            "rau củ",
            "rau xanh",
            "rau sống",
            "rau củ quả",
            "cà chua",
            "cà rốt",
            "bắp cải",
            "súp lơ",
        ],
        "Trái cây": [
            "trái cây",
            "hoa quả",
            "quả",
            "trái",
            "táo",
            "cam",
            "xoài",
            "chuối",
            "dưa hấu",
            "dưa lưới",
        ],
        "Thịt": [
            "thịt",
            "thịt heo",
            "thịt bò",
            "thịt gà",
            "thịt vịt",
            "thịt cừu",
            "thịt dê",
            "thịt trâu",
            "thịt tươi",
            "thịt đông lạnh",
        ],
        "Hải sản": [
            "hải sản",
            "cá",
            "tôm",
            "cua",
            "ghẹ",
            "mực",
            "bạch tuộc",
            "sò",
            "ốc",
            "ngao",
            "sushi",
            "sashimi",
        ],
        "Đồ khô": [
            "đồ khô",
            "thực phẩm khô",
            "hạt",
            "đậu",
            "gạo",
            "ngũ cốc",
            "bột",
            "mì",
            "miến",
            "nui",
        ],
        "Đồ uống": [
            "đồ uống",
            "nước",
            "nước ngọt",
            "bia",
            "rượu",
            "trà",
            "cà phê",
            "sữa",
            "nước ép",
            "sinh tố",
        ],
    }
    
    # Tìm danh mục phù hợp nhất
    max_matches = 0
    best_category = None
    
    for category, keywords in categories.items():
        matches = sum(1 for keyword in keywords if keyword in message_lower)
        if matches > max_matches:
            max_matches = matches
            best_category = category
    
    if best_category:
        log_debug(
            "Phát hiện danh mục", best_category, "với", max_matches, "từ khóa khớp"
        )
    else:
        log_debug("Không phát hiện danh mục cụ thể")
    
    return best_category


# Hàm trích xuất khoảng giá từ tin nhắn
def extract_price_range(message):
    """
    Trích xuất khoảng giá từ tin nhắn
    """
    price_range = {}
    message_lower = message.lower()
    
    # Mẫu giá tối thiểu
    min_price_patterns = [
        r"từ (\d+)[kK]",
        r"từ (\d+)\s*\.\s*\d{3}",
        r"từ (\d+)\s*nghìn",
        r"trên (\d+)[kK]",
        r"trên (\d+)\s*\.\s*\d{3}",
        r"trên (\d+)\s*nghìn",
        r"lớn hơn (\d+)[kK]",
        r"lớn hơn (\d+)\s*\.\s*\d{3}",
        r"lớn hơn (\d+)\s*nghìn",
    ]
    
    # Mẫu giá tối đa
    max_price_patterns = [
        r"dưới (\d+)[kK]",
        r"dưới (\d+)\s*\.\s*\d{3}",
        r"dưới (\d+)\s*nghìn",
        r"nhỏ hơn (\d+)[kK]",
        r"nhỏ hơn (\d+)\s*\.\s*\d{3}",
        r"nhỏ hơn (\d+)\s*nghìn",
        r"không quá (\d+)[kK]",
        r"không quá (\d+)\s*\.\s*\d{3}",
        r"không quá (\d+)\s*nghìn",
        r"tối đa (\d+)[kK]",
        r"tối đa (\d+)\s*\.\s*\d{3}",
        r"tối đa (\d+)\s*nghìn",
        r"đến (\d+)[kK]",
        r"đến (\d+)\s*\.\s*\d{3}",
        r"đến (\d+)\s*nghìn",
    ]
    
    # Mẫu khoảng giá
    range_patterns = [
        r"từ (\d+)[kK] đến (\d+)[kK]",
        r"từ (\d+)\s*\.\s*\d{3} đến (\d+)\s*\.\s*\d{3}",
        r"từ (\d+)\s*nghìn đến (\d+)\s*nghìn",
        r"khoảng (\d+)[kK] đến (\d+)[kK]",
        r"khoảng (\d+)\s*\.\s*\d{3} đến (\d+)\s*\.\s*\d{3}",
        r"khoảng (\d+)\s*nghìn đến (\d+)\s*nghìn",
        r"giá (\d+)[kK] đến (\d+)[kK]",
        r"giá (\d+)\s*\.\s*\d{3} đến (\d+)\s*\.\s*\d{3}",
        r"giá (\d+)\s*nghìn đến (\d+)\s*nghìn",
    ]
    
    # Kiểm tra mẫu khoảng giá
    for pattern in range_patterns:
        matches = re.search(pattern, message_lower)
        if matches:
            try:
                min_price = int(matches.group(1)) * 1000
                max_price = int(matches.group(2)) * 1000
                price_range["min"] = min_price
                price_range["max"] = max_price
                log_debug("Phát hiện khoảng giá từ", min_price, "đến", max_price)
                return price_range
            except:
                pass
    
    # Kiểm tra mẫu giá tối thiểu
    for pattern in min_price_patterns:
        matches = re.search(pattern, message_lower)
        if matches:
            try:
                min_price = int(matches.group(1)) * 1000
                price_range["min"] = min_price
                log_debug("Phát hiện giá tối thiểu:", min_price)
                break
            except:
                pass
    
    # Kiểm tra mẫu giá tối đa
    for pattern in max_price_patterns:
        matches = re.search(pattern, message_lower)
        if matches:
            try:
                max_price = int(matches.group(1)) * 1000
                price_range["max"] = max_price
                log_debug("Phát hiện giá tối đa:", max_price)
                break
            except:
                pass
    
    # Kiểm tra nếu có khoảng giá
    if price_range["min"] is not None or price_range["max"] is not None:
        log_debug("Kết quả trích xuất khoảng giá:", price_range)
        return price_range
    
    log_debug("Không phát hiện khoảng giá")
    return None


# Hàm trích xuất từ khóa từ tin nhắn
def extract_keywords(message):
    """
    Trích xuất từ khóa tìm kiếm từ tin nhắn
    """
    message_lower = message.lower()
    
    # Danh sách từ dừng (stopwords) tiếng Việt
    stopwords = [
        "của",
        "và",
        "các",
        "có",
        "được",
        "là",
        "trong",
        "cho",
        "với",
        "để",
        "trên",
        "này",
        "đến",
        "từ",
        "những",
        "một",
        "về",
        "như",
        "nhiều",
        "đã",
        "không",
        "nào",
        "tôi",
        "muốn",
        "cần",
        "giúp",
        "tìm",
        "kiếm",
        "mua",
        "bán",
        "giá",
        "tiền",
        "đồng",
        "vnd",
        "k",
        "nghìn",
        "giúp",
        "tôi",
        "mình",
        "bạn",
        "tôi",
        "tìm",
        "kiếm",
        "mua",
        "bán",
        "giá",
        "tiền",
        "đồng",
        "vnd",
        "k",
        "nghìn",
        "giúp",
        "tôi",
        "mình",
        "bạn",
        "tôi",
        "có",
        "không",
        "đây",
        "kia",
        "đó",
        "thế",
        "vậy",
        "đang",
        "sẽ",
        "rất",
        "quá",
        "lắm",
        "thì",
        "mà",
        "là",
        "đi",
        "đến",
        "từ",
        "tại",
        "trong",
        "ngoài",
        "dưới",
        "trên",
        "xin",
        "vui",
        "lòng",
        "làm",
        "ơn",
        "hãy",
        "đừng",
        "chưa",
        "đã",
        "sẽ",
        "nên",
        "cần",
        "phải",
        "thể",
        "thể",
        "biết",
        "hay",
        "thích",
        "muốn",
        "được",
        "thấy",
        "còn",
        "nữa",
        "lại",
        "đang",
        "đó",
        "này",
        "kia",
        "thế",
        "vậy",
    ]
    
    # Loại bỏ dấu câu
    message_clean = re.sub(r'[.,;:!?"()]', " ", message_lower)
    
    # Tách từ
    words = message_clean.split()
    
    # Lọc bỏ stopwords và từ quá ngắn
    keywords = [word for word in words if word not in stopwords and len(word) > 1]
    
    # Thêm từ ghép
    bigrams = []
    for i in range(len(words) - 1):
        bigram = words[i] + " " + words[i + 1]
        if not any(word in stopwords for word in bigram.split()):
            bigrams.append(bigram)
    
    # Kết hợp từ đơn và từ ghép
    all_keywords = keywords + bigrams
    
    # Loại bỏ trùng lặp và sắp xếp theo độ dài (ưu tiên từ dài hơn)
    unique_keywords = sorted(set(all_keywords), key=len, reverse=True)
    
    # Giới hạn số lượng từ khóa
    result = unique_keywords[:10]
    
    log_debug("Trích xuất từ khóa:", result)
    return result


# Hàm tìm kiếm sản phẩm theo danh mục
def search_products_by_category(category, keywords=None, price_range=None):
    """
    Tìm kiếm sản phẩm theo danh mục và từ khóa
    """
    try:
        # Lấy collection sản phẩm
        from db import getProductsCollection
    except ImportError:
        print("Không thể import module 'db'. Vui lòng kiểm tra lại đường dẫn hoặc cài đặt module.")
        return []

        products_collection = getProductsCollection()
        
        # Xây dựng bộ lọc
        filter_query = {}
        
        # Đảm bảo danh mục là Trái cây khi tìm kiếm trái cây ít đường
        is_low_sugar_fruit_search = False
        if keywords and any(
            kw in ["ít đường", "đường thấp", "ăn kiêng", "giảm cân"] for kw in keywords
        ):
            if category == "Trái cây" or any(
                kw in ["trái cây", "hoa quả", "quả", "trái"] for kw in keywords
            ):
                category = "Trái cây"
                is_low_sugar_fruit_search = True
                log_debug(
                    "Đã xác định là tìm kiếm trái cây ít đường, đặt danh mục thành Trái cây"
                )
        
        # Lọc theo danh mục
        if category:
            filter_query["productCategory"] = category
            print(f"Tìm kiếm trong danh mục: {category}")
        
        # Kiểm tra xem có phải tìm kiếm trái cây ít đường không
        if not is_low_sugar_fruit_search:
            is_low_sugar_fruit_search = (
                category == "Trái cây"
                and keywords
                and any(
                    kw in ["ít đường", "đường thấp", "ăn kiêng", "giảm cân"]
                    for kw in keywords
                )
            )
        
        # Lọc theo từ khóa
        if keywords and len(keywords) > 0:
            # Nếu là tìm kiếm trái cây ít đường, sử dụng bộ lọc đặc biệt
            if is_low_sugar_fruit_search:
                print("Áp dụng bộ lọc đặc biệt cho trái cây ít đường")
                filter_query["$or"] = [
                    {
                        "productName": {
                            "$regex": "ít đường|đường thấp|không đường|ăn kiêng|giảm cân",
                            "$options": "i",
                        }
                    },
                    {
                        "productDescription": {
                            "$regex": "ít đường|đường thấp|không đường|hàm lượng đường thấp|ăn kiêng|giảm cân|tiểu đường",
                            "$options": "i",
                        }
                    },
                ]
            else:
                # Tạo điều kiện tìm kiếm thông thường
                keyword_conditions = []
                for keyword in keywords:
                    keyword_conditions.append(
                        {"productName": {"$regex": keyword, "$options": "i"}}
                    )
                    keyword_conditions.append(
                        {"productDescription": {"$regex": keyword, "$options": "i"}}
                    )
                
                if len(keyword_conditions) > 0:
                    filter_query["$or"] = keyword_conditions
        
        # Lọc theo khoảng giá
        if price_range:
            price_filter = {}
            if "min" in price_range and price_range["min"] is not None:
                price_filter["$gte"] = price_range["min"]
            if "max" in price_range and price_range["max"] is not None:
                price_filter["$lte"] = price_range["max"]
            
            if price_filter:
                filter_query["productPrice"] = price_filter
        
        print(f"Filter tìm kiếm: {filter_query}")
        
        # Thực hiện truy vấn
        products = list(products_collection.find(filter_query).limit(10))
        
        # Nếu không tìm thấy sản phẩm và là tìm kiếm trái cây ít đường, thử tìm tất cả trái cây và sắp xếp theo điểm phù hợp
        if is_low_sugar_fruit_search and (not products or len(products) == 0):
            print(
                "Không tìm thấy trái cây ít đường, thử tìm tất cả trái cây và đánh giá độ phù hợp"
            )
            all_fruits = list(
                products_collection.find({"productCategory": "Trái cây"}).limit(20)
            )
            
            # Đánh giá độ phù hợp cho mỗi trái cây
            scored_fruits = []
            for fruit in all_fruits:
                score = 0
                fruit_name = fruit.get("productName", "").lower()
                fruit_desc = (
                    " ".join(fruit.get("productDescription", [])).lower()
                    if fruit.get("productDescription")
                    else ""
                )
                
                # Tính điểm dựa trên tên và mô tả
                low_sugar_patterns = [
                    "ít đường",
                    "đường thấp",
                    "không đường",
                    "hàm lượng đường thấp",
                    "ăn kiêng",
                    "giảm cân",
                ]
                for pattern in low_sugar_patterns:
                    if pattern in fruit_name:
                        score += 10
                    elif pattern in fruit_desc:
                        score += 5
                
                # Kiểm tra nếu có đề cập đến hàm lượng đường cụ thể
                sugar_content_patterns = [
                    r"(\d+[.,]?\d*)g đường",
                    r"đường: (\d+[.,]?\d*)g",
                    r"hàm lượng đường (\d+[.,]?\d*)g",
                    r"(\d+[.,]?\d*)% đường",
                ]
                
                for pattern in sugar_content_patterns:
                    matches = re.findall(pattern, fruit_desc)
                    if matches:
                        try:
                            sugar_content = float(matches[0].replace(",", "."))
                            # Điểm cao hơn cho sản phẩm có hàm lượng đường thấp
                            if sugar_content < 5:
                                score += 15
                            elif sugar_content < 10:
                                score += 10
                            elif sugar_content < 15:
                                score += 5
                        except:
                            score += 2
                
                # Thêm vào danh sách với điểm
                fruit["relevance_score"] = score
                scored_fruits.append(fruit)
            
            # Lọc các trái cây có điểm > 0 và sắp xếp theo điểm giảm dần
            relevant_fruits = [f for f in scored_fruits if f["relevance_score"] > 0]
            relevant_fruits.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            if relevant_fruits:
                print(
                    f"Tìm thấy {len(relevant_fruits)} sản phẩm bằng từ khóa với điểm phù hợp"
                )
                return relevant_fruits
            else:
                # Nếu không có trái cây nào phù hợp, trả về tất cả
                print("Không tìm thấy trái cây phù hợp, trả về tất cả trái cây")
                return all_fruits
        
        return products
    except Exception as e:
        print(f"Lỗi khi tìm kiếm sản phẩm theo danh mục: {e}")
        return []


# Hàm ghi log debug
def log_debug(message, *args):
    """
    Ghi log debug với thông tin chi tiết
    """
    log_message = f"[DEBUG] {message}"
    if args:
        log_message += ": " + ", ".join(str(arg) for arg in args)
    print(log_message)


# Sửa lại hàm search_products để sử dụng log_debug
def search_products(message):
    """
    Tìm kiếm sản phẩm dựa trên tin nhắn của người dùng
    """
    try:
        log_debug("Bắt đầu tìm kiếm sản phẩm cho tin nhắn:", message)
        
        # Kiểm tra từ khóa liên quan đến trái cây ít đường
        fruit_keywords = ["trái cây", "hoa quả", "quả", "trái"]
        low_sugar_keywords = [
            "ít đường",
            "đường thấp",
            "không đường",
            "ăn kiêng",
            "giảm cân",
            "tiểu đường",
        ]
        
        message_lower = message.lower()
        is_fruit_query = any(kw in message_lower for kw in fruit_keywords)
        is_low_sugar_query = any(kw in message_lower for kw in low_sugar_keywords)
        is_low_sugar_fruit_query = is_fruit_query and is_low_sugar_query
        
        # Nếu là truy vấn về trái cây ít đường, đặt danh mục là Trái cây
        category = None
        if is_low_sugar_fruit_query:
            category = "Trái cây"
            log_debug(
                "Phát hiện truy vấn trái cây ít đường, đặt danh mục thành Trái cây"
            )
        else:
            # Trích xuất danh mục từ tin nhắn
            category = extract_product_category(message)
            log_debug("Trích xuất danh mục:", category)
        
        # Trích xuất khoảng giá
        price_range = extract_price_range(message)
        log_debug("Trích xuất khoảng giá:", price_range)
        
        # Trích xuất từ khóa
        keywords = extract_keywords(message)
        log_debug("Trích xuất từ khóa:", keywords)
        
        # Đảm bảo rằng nếu là truy vấn về trái cây ít đường, danh mục vẫn là Trái cây
        if is_low_sugar_fruit_query:
            category = "Trái cây"
            # Thêm từ khóa liên quan đến ít đường nếu chưa có
            low_sugar_terms = ["ít đường", "đường thấp", "ăn kiêng"]
            for term in low_sugar_terms:
                if term not in keywords:
                    keywords.append(term)
            log_debug("Đã thêm từ khóa liên quan đến ít đường:", keywords)
        
        # Tìm kiếm sản phẩm
        products = search_products_by_category(category, keywords, price_range)
        log_debug("Kết quả tìm kiếm:", len(products) if products else 0, "sản phẩm")
        
        return products
    except Exception as e:
        log_debug("Lỗi khi tìm kiếm sản phẩm:", str(e))
        return []


# Hàm định dạng câu trả lời về sản phẩm
def format_product_response(user_message, products, user_id):
    """
    Format câu trả lời về sản phẩm dựa trên kết quả tìm kiếm
    """
    # Kiểm tra xem có phải là truy vấn về trái cây ít đường không
    fruit_keywords = ["trái cây", "hoa quả", "quả", "trái"]
    low_sugar_keywords = [
        "ít đường",
        "đường thấp",
        "không đường",
        "ăn kiêng",
        "giảm cân",
        "tiểu đường",
    ]
    
    message_lower = user_message.lower()
    is_fruit_query = any(kw in message_lower for kw in fruit_keywords)
    is_low_sugar_query = any(kw in message_lower for kw in low_sugar_keywords)
    is_low_sugar_fruit_query = is_fruit_query and is_low_sugar_query
    
    # Kiểm tra xem tất cả sản phẩm có thuộc danh mục Trái cây không
    all_fruits = (
        all(product.get("productCategory") == "Trái cây" for product in products)
        if products
        else False
    )

    log_debug(
        "Format câu trả lời sản phẩm:",
        "is_fruit_query=",
        is_fruit_query,
        "is_low_sugar_query=",
        is_low_sugar_query,
        "all_fruits=",
        all_fruits,
    )
    
    # Xây dựng câu trả lời
    if is_low_sugar_fruit_query or (is_low_sugar_query and all_fruits):
        log_debug("Định dạng câu trả lời cho trái cây ít đường")
        response = "Dưới đây là một số trái cây có hàm lượng đường thấp phù hợp cho người ăn kiêng hoặc bệnh nhân tiểu đường:\n\n"
    else:
        log_debug("Định dạng câu trả lời cho sản phẩm thông thường")
        response = "Dưới đây là một số sản phẩm phù hợp với yêu cầu của bạn:\n\n"
    
    # Lưu context sản phẩm cho người dùng
    save_product_context(user_id, products)
    
    # Hiển thị tối đa 5 sản phẩm
    for i, product in enumerate(products[:5]):
        product_name = product.get("productName", "Không có tên")
        product_price = f"{int(product.get('productPrice', 0)):,}đ"
        product_desc = product.get("productDescription", [])
        desc_text = (
            product_desc[0]
            if product_desc and len(product_desc) > 0
            else "Không có mô tả"
        )
        
        # Thêm điểm phù hợp nếu là truy vấn trái cây ít đường
        relevance_info = ""
        if (
            is_low_sugar_fruit_query or (is_low_sugar_query and all_fruits)
        ) and "relevance_score" in product:
            if product["relevance_score"] >= 15:
                relevance_info = " (Rất phù hợp cho chế độ ăn ít đường)"
            elif product["relevance_score"] >= 10:
                relevance_info = " (Phù hợp cho chế độ ăn ít đường)"
            elif product["relevance_score"] >= 5:
                relevance_info = " (Khá phù hợp cho chế độ ăn ít đường)"
        
        response += f"{i+1}. {product_name}{relevance_info}\n   Giá: {product_price}\n   {desc_text}\n\n"
    
    response += "Bạn có muốn biết thêm thông tin về sản phẩm cụ thể nào không?"
    log_debug("Đã tạo câu trả lời với", min(5, len(products)), "sản phẩm")
    return response


# Hàm lưu ngữ cảnh sản phẩm
def save_product_context(user_id, current_product, all_products=None):
    """
    Lưu ngữ cảnh sản phẩm cho người dùng
    """
    context = get_or_create_context(user_id)
    context["currentProduct"] = current_product
    if all_products:
        context["productList"] = all_products
    return context


# Hàm lấy hoặc tạo ngữ cảnh cho người dùng
def get_or_create_context(user_id):
    """
    Lấy hoặc tạo mới ngữ cảnh cho người dùng
    """
    global user_contexts
    if user_id not in user_contexts:
        log_debug("Tạo mới ngữ cảnh cho user", user_id)
        user_contexts[user_id] = {}
    return user_contexts[user_id]


# Hàm phân tích ý định của tin nhắn
def analyze_intent(message):
    """
    Phân tích ý định của tin nhắn người dùng
    """
    message_lower = message.lower()
    
    # Kiểm tra lời chào
    greeting_patterns = [
        "xin chào",
        "chào",
        "hi ",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
    ]
    if any(pattern in message_lower for pattern in greeting_patterns):
        log_debug("Phát hiện ý định: greeting")
        return "greeting"
    
    # Kiểm tra hỏi giá
    price_patterns = [
        "giá",
        "bao nhiêu tiền",
        "giá bao nhiêu",
        "giá cả",
        "mấy tiền",
        "đắt không",
        "rẻ không",
    ]
    if any(pattern in message_lower for pattern in price_patterns):
        log_debug("Phát hiện ý định: price_inquiry")
        return "price_inquiry"
    
    # Kiểm tra hỏi khuyến mãi
    promotion_patterns = [
        "khuyến mãi",
        "giảm giá",
        "ưu đãi",
        "sale",
        "discount",
        "voucher",
        "coupon",
    ]
    if any(pattern in message_lower for pattern in promotion_patterns):
        log_debug("Phát hiện ý định: promotion_inquiry")
        return "promotion_inquiry"
    
    # Mặc định là tìm kiếm sản phẩm
    log_debug("Phát hiện ý định mặc định: product_search")
    return "product_search"


@app.route("/api/chatbot/process_message", methods=["POST"])
def api_process_message():
    """
    API endpoint để xử lý tin nhắn từ người dùng
    """
    try:
        data = request.get_json()
        message = data.get("message", "")
        userId = data.get("userId", "anonymous")
        
        log_debug("Nhận tin nhắn từ user", userId, ":", message)
        
        # Kiểm tra nếu tin nhắn trống
        if not message.strip():
            log_debug("Tin nhắn trống, trả về lời chào")
            return jsonify(
                {
                    "response": "Xin chào! Tôi là trợ lý ảo của cửa hàng thực phẩm. Bạn cần giúp gì không?"
                }
            )
        
        # Xử lý tin nhắn bằng hàm process_message
        response = process_message(message, userId)
        log_debug(
            "Trả về câu trả lời:",
            response[:100] + "..." if len(response) > 100 else response,
        )
        
        return jsonify({"response": response})
    except Exception as e:
        log_debug("Lỗi khi xử lý API request:", str(e))
        return jsonify(
            {
                "response": "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."
            }
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
