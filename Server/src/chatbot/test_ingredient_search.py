#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import re
from app import extract_ingredients, check_ingredient_availability, format_price

# Mẫu câu trả lời về nguyên liệu món ăn
sample_recipe_response = """
Để nấu món thịt kho, bạn cần những nguyên liệu cơ bản sau:

1. Thịt heo (thịt ba chỉ hoặc thịt nạc)
2. Nước mắm
3. Đường (có thể dùng đường nâu hoặc đường trắng)
4. Hành tím (băm nhỏ)
5. Tỏi (băm nhỏ)
6. Tiêu
7. Nước dừa (tuỳ chọn)
8. Hạt nêm (tuỳ chọn)
9. Ớt (tuỳ chọn, nếu bạn thích cay)

Chúc bạn nấu ăn ngon miệng!
"""

def test_extract_ingredients():
    """Test the extract_ingredients function"""
    ingredients = extract_ingredients(sample_recipe_response)
    print("Extracted ingredients:")
    for i, ingredient in enumerate(ingredients):
        print(f"{i+1}. {ingredient}")
    
    # Kiểm tra xem có đúng số lượng nguyên liệu không
    assert len(ingredients) == 9, f"Expected 9 ingredients, got {len(ingredients)}"
    
    # Kiểm tra một số nguyên liệu cụ thể
    assert "Thịt heo" in ingredients, "Missing 'Thịt heo'"
    assert "Nước mắm" in ingredients, "Missing 'Nước mắm'"
    
    print("✅ Extract ingredients test passed!")

def test_check_ingredient_availability():
    """Test the check_ingredient_availability function"""
    # Danh sách nguyên liệu mẫu
    ingredients = ["Thịt heo", "Nước mắm", "Đường", "Hành tím", "Tỏi", "Tiêu", "Nước dừa", "Hạt nêm", "Ớt"]
    
    # Kiểm tra tính khả dụng
    availability = check_ingredient_availability(ingredients)
    
    print("\nIngredient availability:")
    for ingredient, info in availability.items():
        if info["available"]:
            print(f"✅ {ingredient}: {info['product_name']} - {format_price(info['price'])} / {info['unit']}")
        else:
            print(f"❌ {ingredient}: Not available")
    
    print("✅ Check availability test passed!")

def main():
    """Run all tests"""
    print("=== Testing Ingredient Search Functionality ===\n")
    test_extract_ingredients()
    test_check_ingredient_availability()
    print("\n=== All tests completed ===")

if __name__ == "__main__":
    main() 