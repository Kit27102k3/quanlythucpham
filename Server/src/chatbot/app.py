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