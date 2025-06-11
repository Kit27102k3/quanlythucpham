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

load_dotenv()

app = Flask(__name__)

# Cấu hình API key đúng cách
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Lưu trữ câu trả lời cuối cùng cho mỗi phiên
last_responses = {}

@app.route('/api/chatbot/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get("question", "")
    session_id = data.get("session_id", "default")
    
    if not question:
        return jsonify({"answer": "Bạn chưa nhập câu hỏi."}), 400

    # Kiểm tra xem có phải yêu cầu so sánh sản phẩm không
    if is_comparison_request(question):
        print(f"Phát hiện yêu cầu so sánh sản phẩm: '{question}'")
        product_ids = data.get("product_ids", [])
        print(f"Product IDs nhận được: {product_ids}")
        
        if not product_ids or len(product_ids) < 2:
            print("Không đủ product_ids để so sánh")
            return jsonify({"answer": "Vui lòng chọn ít nhất 2 sản phẩm để so sánh."}), 400
        
        comparison_result = compare_products(product_ids)
        print(f"Đã tạo kết quả so sánh dài {len(comparison_result)} ký tự")
        return jsonify({"answer": comparison_result, "type": "comparison"}), 200

    # Kiểm tra xem có phải yêu cầu tìm nguyên liệu không
    if "tìm" in question.lower() and ("nguyên liệu" in question.lower() or "như trên" in question.lower()):
        # Lấy câu trả lời cuối cùng của phiên này
        last_response = last_responses.get(session_id, "")
        
        if not last_response:
            return jsonify({"answer": "Tôi chưa có thông tin về nguyên liệu nào. Vui lòng hỏi về một món ăn trước."})
        
        # Trích xuất danh sách nguyên liệu từ câu trả lời cuối
        ingredients = extract_ingredients(last_response)
        
        if not ingredients:
            return jsonify({"answer": "Tôi không tìm thấy nguyên liệu nào trong thông tin trước đó."})
        
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
                product_info += f"  → {info['product_name'].title()}: {format_price(info['price'])} / {info['unit']}\n"
                
                # Thêm thông tin tồn kho nếu có
                if isinstance(info.get("stock"), int):
                    if info["stock"] > 0:
                        product_info += f"  → Số lượng tồn: {info['stock']} {info['unit']}\n"
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
                {"role": "system", "content": "Bạn là trợ lý tư vấn thực phẩm, trả lời ngắn gọn, dễ hiểu, thân thiện."},
                {"role": "user", "content": question}
            ],
            max_tokens=300,
            temperature=0.7
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
        "cái nào tốt hơn"
    ]
    
    # Kiểm tra các cụm từ chính xác
    for phrase in exact_phrases:
        if phrase in question:
            print(f"Phát hiện yêu cầu so sánh: '{phrase}' trong '{question}'")
            return True
    
    # Kiểm tra các từ khóa so sánh
    comparison_keywords = ["so sánh", "so với", "đối chiếu", "khác nhau", "giống nhau", "tốt hơn", "kém hơn", "nên mua"]
    
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
        return generate_detailed_comparison(products_to_compare[0], products_to_compare[1])
    
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
    if "organic" in product1.get("description", "").lower() or "hữu cơ" in product1.get("description", "").lower():
        strengths1.append("Sản phẩm hữu cơ/organic")
    if "nhập khẩu" in product1.get("description", "").lower():
        strengths1.append("Sản phẩm nhập khẩu")
    
    # Phân tích điểm mạnh của sản phẩm 2
    strengths2 = []
    if price2 < price1:
        strengths2.append("Giá thành thấp hơn")
    if rating2 > rating1:
        strengths2.append("Đánh giá cao hơn")
    if "organic" in product2.get("description", "").lower() or "hữu cơ" in product2.get("description", "").lower():
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
    lowest_price_product = min(products, key=lambda x: x.get("price", float('inf')))
    comparison += f"- **{lowest_price_product['name']}** có giá thấp nhất.\n"
    
    # Tìm sản phẩm có đánh giá cao nhất
    rated_products = [p for p in products if p.get("rating", 0) > 0]
    if rated_products:
        highest_rating_product = max(rated_products, key=lambda x: x.get("rating", 0))
        comparison += f"- **{highest_rating_product['name']}** có đánh giá cao nhất ({highest_rating_product.get('rating', 0)}/5 sao).\n"
    
    # Gợi ý lựa chọn
    comparison += "\n### Gợi ý lựa chọn:\n"
    comparison += "- Nếu bạn ưu tiên giá cả: chọn **" + lowest_price_product['name'] + "**\n"
    
    if rated_products:
        comparison += "- Nếu bạn ưu tiên đánh giá: chọn **" + highest_rating_product['name'] + "**\n"
    
    comparison += "- Để biết thêm chi tiết về từng sản phẩm, vui lòng nhấn vào sản phẩm để xem thông tin đầy đủ.\n"
    
    return comparison

def extract_ingredients(text):
    """Trích xuất danh sách nguyên liệu từ văn bản"""
    ingredients = []
    
    # Tìm danh sách đánh số
    numbered_list = re.findall(r'\d+\.\s+(.*?)(?=\d+\.|$)', text, re.DOTALL)
    if numbered_list:
        for item in numbered_list:
            # Lấy tên nguyên liệu (phần đầu tiên trước dấu phẩy hoặc dấu ngoặc)
            ingredient = re.split(r'[,\(:]', item.strip())[0].strip()
            if ingredient and len(ingredient) > 1:  # Tránh các kết quả quá ngắn
                ingredients.append(ingredient)
    
    # Tìm danh sách dấu gạch đầu dòng
    bullet_list = re.findall(r'[-•*]\s+(.*?)(?=[-•*]|$)', text, re.DOTALL)
    if bullet_list:
        for item in bullet_list:
            ingredient = re.split(r'[,\(:]', item.strip())[0].strip()
            if ingredient and len(ingredient) > 1:
                ingredients.append(ingredient)
    
    # Tìm danh sách trong các phần được đánh dấu
    sections = ["nguyên liệu chính", "nguyên liệu", "gia vị", "nguyên liệu phụ", "thành phần"]
    for section in sections:
        if section in text.lower():
            # Tìm phần văn bản sau section và trước section tiếp theo hoặc kết thúc
            section_pattern = f"{section}(.*?)(?:{'|'.join(sections)}|$)"
            section_matches = re.findall(section_pattern, text.lower(), re.DOTALL | re.IGNORECASE)
            
            if section_matches:
                for section_text in section_matches:
                    # Tìm các dòng trong phần này
                    lines = section_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith((':', '.', '#', '##')) and len(line) > 1:
                            # Loại bỏ các từ khóa không phải nguyên liệu
                            non_ingredient_words = ["lượng", "gram", "kg", "cần", "yêu cầu", "chuẩn bị"]
                            if not any(word in line.lower() for word in non_ingredient_words):
                                # Lấy phần đầu tiên của dòng (trước dấu phẩy, dấu hai chấm hoặc dấu ngoặc)
                                ingredient = re.split(r'[,\(:]', line)[0].strip()
                                if ingredient and len(ingredient) > 1:
                                    ingredients.append(ingredient)
    
    # Nếu không tìm thấy danh sách theo cách trên, thử phân tích từng dòng
    if not ingredients:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            # Tìm các dòng có thể chứa nguyên liệu
            if line and len(line) < 100 and not line.startswith(('#', '##', '>')):
                # Kiểm tra xem dòng có chứa các từ khóa liên quan đến số lượng không
                quantity_keywords = ["gram", "kg", "g", "ml", "lít", "muỗng", "chén", "củ", "quả", "cái"]
                if any(keyword in line.lower() for keyword in quantity_keywords):
                    # Lấy phần đầu tiên của dòng (trước số lượng)
                    parts = re.split(r'[:–\-]', line)
                    if parts:
                        ingredient = parts[0].strip()
                        if ingredient and len(ingredient) > 1:
                            ingredients.append(ingredient)
    
    # Chuẩn hóa và nhóm các nguyên liệu tương tự
    normalized_ingredients = []
    seen = set()
    
    # Ánh xạ các nguyên liệu tương tự
    similar_ingredients = {
        "thịt heo": ["thịt lợn", "thịt ba chỉ", "ba chỉ", "thịt nạc", "thịt vai", "thịt đùi"],
        "thịt bò": ["bò", "thăn bò", "gầu bò", "nạm bò"],
        "thịt gà": ["gà", "đùi gà", "cánh gà", "ức gà"],
        "thịt vịt": ["vịt"],
        "hành": ["hành tím", "hành khô", "củ hành", "hành lá", "hành hoa"],
        "tỏi": ["củ tỏi", "tỏi tươi", "tỏi khô"],
        "ớt": ["ớt hiểm", "ớt sừng"],
        "nước mắm": ["mắm"],
        "muối": ["muối ăn", "muối tinh", "muối hạt"]
    }
    
    for ingredient in ingredients:
        normalized = ingredient.lower().strip()
        
        # Kiểm tra xem nguyên liệu này đã được xử lý chưa
        if normalized in seen:
            continue
            
        # Kiểm tra xem có phải là nguyên liệu tương tự không
        standardized_name = normalized
        for main_name, variants in similar_ingredients.items():
            if normalized in variants or any(variant in normalized for variant in variants):
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
    non_ingredients = ["cách làm", "hướng dẫn", "chế biến", "nấu", "món", "ăn", "chúc", "ngon miệng"]
    filtered_ingredients = [ing for ing in normalized_ingredients if not any(word in ing.lower() for word in non_ingredients)]
    
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
        categorized_products[category].append({
            "name": product["name"].lower(),
            "description": product.get("description", "").lower(),
            "category": category,
            "id": product.get("id", ""),
            "price": product.get("price", 0),
            "unit": product.get("unit", ""),
            "stock": product.get("stock", 0),
            "original": product
        })
    
    # Danh mục thực phẩm và phi thực phẩm
    food_categories = ["thực phẩm", "rau củ", "trái cây", "thịt", "cá", "hải sản", "gia vị", "đồ khô", 
                      "đồ uống", "bánh kẹo", "sữa", "trứng", "thực phẩm đông lạnh", "thực phẩm chế biến sẵn"]
    
    non_food_categories = ["đồ dùng", "mỹ phẩm", "chăm sóc cá nhân", "vệ sinh", "giặt giũ", "tẩy rửa", 
                          "đồ dùng nhà bếp", "đồ dùng gia đình", "văn phòng phẩm", "điện tử", "điện gia dụng"]
    
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
        "tỏi": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"]
    }
    
    # Kiểm tra từng nguyên liệu
    result = {}
    
    for ingredient in ingredients:
        # Chuẩn hóa tên nguyên liệu
        normalized = ingredient.lower().strip()
        
        # Xác định các danh mục liên quan đến thực phẩm dựa trên nguyên liệu
        relevant_food_categories = []
        
        # Xác định danh mục thực phẩm dựa trên nguyên liệu
        if any(word in normalized for word in ["thịt", "sườn", "ba chỉ", "nạc", "đùi", "cánh"]):
            relevant_food_categories.extend(["thịt", "thực phẩm tươi sống", "thực phẩm"])
        elif any(word in normalized for word in ["cá", "tôm", "mực", "cua", "ghẹ", "sò", "hàu"]):
            relevant_food_categories.extend(["hải sản", "cá", "thực phẩm tươi sống", "thực phẩm"])
        elif any(word in normalized for word in ["rau", "củ", "cải", "xà lách", "bắp cải"]):
            relevant_food_categories.extend(["rau củ", "rau củ quả", "thực phẩm tươi sống", "thực phẩm"])
        elif any(word in normalized for word in ["trái", "quả", "táo", "cam", "chuối", "xoài"]):
            relevant_food_categories.extend(["trái cây", "rau củ quả", "thực phẩm"])
        elif any(word in normalized for word in ["nước mắm", "nước tương", "tương", "gia vị", "muối", "tiêu", "đường", "hạt nêm"]):
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
            relevant_food_categories.extend(["trứng", "thực phẩm tươi sống", "thực phẩm"])
        elif any(word in normalized for word in ["hành", "tỏi", "gừng", "ớt"]):
            relevant_food_categories.extend(["rau củ", "gia vị", "thực phẩm tươi sống", "thực phẩm"])
        elif "vịt" in normalized:
            relevant_food_categories.extend(["thịt", "thịt vịt", "thực phẩm tươi sống", "thực phẩm"])
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
            is_relevant_category = any(food_cat in category_name for food_cat in relevant_food_categories)
            
            # Nếu là danh mục thực phẩm liên quan, tìm kiếm trong đó
            if is_relevant_category:
                for product in products_list:
                    # Bỏ qua sản phẩm chứa từ khóa loại trừ
                    if any(excl in product["name"] or excl in product["description"] for excl in current_exclusions):
                        continue
                        
                    # Kiểm tra tên sản phẩm có chứa nguyên liệu không
                    if normalized in product["name"] or any(word in product["name"] for word in normalized.split() if len(word) > 2):
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
                is_food_category = any(food_cat in category_name for food_cat in food_categories)
                
                # Nếu là danh mục thực phẩm, tìm kiếm trong đó
                if is_food_category:
                    for product in products_list:
                        # Bỏ qua sản phẩm chứa từ khóa loại trừ
                        if any(excl in product["name"] or excl in product["description"] for excl in current_exclusions):
                            continue
                            
                        # Kiểm tra tên sản phẩm có chứa nguyên liệu không
                        if normalized in product["name"] or any(word in product["name"] for word in normalized.split() if len(word) > 2):
                            product["match_score"] = 8
                            matches.append(product)
                        # Kiểm tra mô tả sản phẩm
                        elif normalized in product["description"]:
                            product["match_score"] = 3
                            matches.append(product)
        
        # Sắp xếp kết quả theo độ phù hợp
        matches.sort(key=lambda x: (
            x.get("match_score", 0),  # Điểm phù hợp
            1 if normalized in x["name"] else 0,  # Ưu tiên tên sản phẩm chứa đúng nguyên liệu
            1 if any(cat in x["category"] for cat in relevant_food_categories) else 0  # Ưu tiên danh mục phù hợp
        ), reverse=True)
        
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
                "stock": best_match.get("stock", "Có sẵn")
            }
        else:
            result[ingredient] = {
                "available": False
            }
    
    return result

def format_price(price):
    """Format price with commas and VND"""
    return f"{price:,} VND"

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
    food_categories = ["thực phẩm", "rau củ", "trái cây", "thịt", "cá", "hải sản", "gia vị", "đồ khô", 
                      "đồ uống", "bánh kẹo", "sữa", "trứng", "thực phẩm đông lạnh", "thực phẩm chế biến sẵn"]
    
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
        "tỏi": ["kem", "bánh", "kẹo", "nước giặt", "tẩy rửa"]
    }
    
    # Xác định loại nguyên liệu để tìm thay thế phù hợp
    ingredient_type = ""
    if any(word in normalized for word in ["thịt", "sườn", "ba chỉ", "nạc", "đùi", "cánh"]):
        ingredient_type = "thịt"
    elif any(word in normalized for word in ["cá", "tôm", "mực", "cua", "ghẹ", "sò", "hàu"]):
        ingredient_type = "hải sản"
    elif any(word in normalized for word in ["rau", "củ", "cải", "xà lách", "bắp cải"]):
        ingredient_type = "rau củ"
    elif any(word in normalized for word in ["trái", "quả", "táo", "cam", "chuối", "xoài"]):
        ingredient_type = "trái cây"
    elif any(word in normalized for word in ["nước mắm", "nước tương", "tương", "gia vị", "muối", "tiêu", "đường", "hạt nêm"]):
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
        categorized_products[category].append({
            "name": product["name"].lower(),
            "description": product.get("description", "").lower(),
            "category": category,
            "id": product.get("id", ""),
            "price": product.get("price", 0),
            "unit": product.get("unit", ""),
            "stock": product.get("stock", 0),
            "original": product
        })
    
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
        "thực phẩm": ["thực phẩm"]
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
                    if any(excl in product["name"] or excl in product["description"] for excl in current_exclusions):
                        continue
                        
                    # Kiểm tra xem sản phẩm này không phải là nguyên liệu gốc
                    if normalized not in product["name"] and not any(word in product["name"] for word in normalized.split() if len(word) > 2):
                        # Chỉ lấy sản phẩm thực phẩm
                        if any(food_cat in category_name for food_cat in food_categories):
                            # Tính điểm phù hợp
                            relevance_score = 2 if alt_type == ingredient_type else 1
                            
                            alternatives.append({
                                "name": product["original"]["name"],
                                "price": product.get("price", 0),
                                "unit": product.get("unit", ""),
                                "category": category_name,
                                "relevance": relevance_score
                            })
                            
                            # Giới hạn số lượng sản phẩm thay thế mỗi danh mục
                            if len(alternatives) >= 10:
                                break
    
    # Sắp xếp theo độ liên quan và giá cả
    alternatives.sort(key=lambda x: (x.get("relevance", 0), -x.get("price", 0)), reverse=True)
    
    # Loại bỏ các sản phẩm trùng lặp
    unique_alternatives = []
    seen_names = set()
    for alt in alternatives:
        if alt["name"].lower() not in seen_names:
            seen_names.add(alt["name"].lower())
            unique_alternatives.append(alt)
    
    # Giới hạn số lượng gợi ý
    return unique_alternatives[:3]

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True) 