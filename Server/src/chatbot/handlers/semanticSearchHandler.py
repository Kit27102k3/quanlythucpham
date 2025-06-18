"""
Module xử lý tìm kiếm ngữ nghĩa cho chatbot
"""

import re
import pymongo
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()

# Kết nối MongoDB
try:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client.get_database("quanlythucpham")
    products_collection = db.get_collection("products")
    print("Kết nối MongoDB thành công!")
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {e}")
    products_collection = None

def get_products_collection():
    """
    Lấy collection sản phẩm
    """
    return products_collection

def analyze_query_semantics(query):
    """
    Phân tích ngữ nghĩa của câu hỏi để xác định ý định, danh mục, thuộc tính, đối tượng, giá...
    """
    query = query.lower()
    
    # Khởi tạo kết quả phân tích
    semantics = {
        'intent': 'product_search',  # Mặc định là tìm kiếm sản phẩm
        'category': None,            # Danh mục sản phẩm
        'attributes': [],            # Thuộc tính đặc biệt (ít đường, hữu cơ, tươi...)
        'target_audience': None,     # Đối tượng sử dụng (người ăn kiêng, trẻ em...)
        'price_range': None,         # Khoảng giá
        'sort_by': None,             # Sắp xếp theo (giá, độ phổ biến...)
        'limit': 10                  # Giới hạn kết quả
    }
    
    # Phân tích danh mục sản phẩm
    category_map = {
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
    }
    
    # Kiểm tra nếu là câu hỏi về trái cây ít đường
    fruit_keywords = ["trái cây", "hoa quả", "quả"]
    low_sugar_keywords = ["ít đường", "đường thấp", "ít ngọt", "không ngọt", "ăn kiêng", "giảm cân", "tiểu đường"]
    
    fruit_detected = any(keyword in query for keyword in fruit_keywords)
    low_sugar_detected = any(keyword in query for keyword in low_sugar_keywords)
    
    if fruit_detected and low_sugar_detected:
        semantics['category'] = 'Trái cây'
        semantics['attributes'].append('low_sugar')
        if 'ăn kiêng' in query or 'giảm cân' in query:
            semantics['target_audience'] = 'dieter'
        elif 'tiểu đường' in query:
            semantics['target_audience'] = 'diabetic'
    else:
        # Phân tích danh mục thông thường
        for keyword, category in category_map.items():
            if keyword in query:
                semantics['category'] = category
                break
    
    # Phân tích thuộc tính đặc biệt
    attribute_patterns = [
        {'patterns': ['ít đường', 'đường thấp', 'không đường', 'ít ngọt'], 'attribute': 'low_sugar'},
        {'patterns': ['hữu cơ', 'organic'], 'attribute': 'organic'},
        {'patterns': ['tươi', 'mới'], 'attribute': 'fresh'},
        {'patterns': ['nhập khẩu', 'ngoại'], 'attribute': 'imported'},
        {'patterns': ['nội địa', 'trong nước'], 'attribute': 'domestic'},
        {'patterns': ['giá rẻ', 'rẻ', 'giá tốt'], 'attribute': 'affordable'},
        {'patterns': ['cao cấp', 'hạng sang', 'premium'], 'attribute': 'premium'},
        {'patterns': ['chay', 'thuần chay', 'ăn chay'], 'attribute': 'vegetarian'}
    ]
    
    for attr_info in attribute_patterns:
        for pattern in attr_info['patterns']:
            if pattern in query and attr_info['attribute'] not in semantics['attributes']:
                semantics['attributes'].append(attr_info['attribute'])
                break
    
    # Phân tích đối tượng sử dụng nếu chưa được xác định
    if not semantics['target_audience']:
        audience_patterns = [
            {'patterns': ['ăn kiêng', 'giảm cân', 'diet'], 'audience': 'dieter'},
            {'patterns': ['trẻ em', 'trẻ con', 'em bé', 'bé'], 'audience': 'children'},
            {'patterns': ['người già', 'cao tuổi', 'người lớn tuổi'], 'audience': 'elderly'},
            {'patterns': ['tiểu đường', 'đái tháo đường', 'bệnh tiểu đường'], 'audience': 'diabetic'},
            {'patterns': ['phụ nữ mang thai', 'bà bầu', 'mẹ bầu'], 'audience': 'pregnant'},
            {'patterns': ['vận động viên', 'người tập thể thao'], 'audience': 'athlete'}
        ]
        
        for audience_info in audience_patterns:
            for pattern in audience_info['patterns']:
                if pattern in query:
                    semantics['target_audience'] = audience_info['audience']
                    break
            if semantics['target_audience']:
                break
    
    # Phân tích khoảng giá
    if 'dưới' in query and re.search(r'\d+', query):
        price_match = re.search(r'dưới\s*(\d+)', query)
        if price_match:
            semantics['price_range'] = {'max': int(price_match.group(1)) * 1000}
    elif 'trên' in query and re.search(r'\d+', query):
        price_match = re.search(r'trên\s*(\d+)', query)
        if price_match:
            semantics['price_range'] = {'min': int(price_match.group(1)) * 1000}
    elif 'từ' in query and 'đến' in query and re.search(r'\d+', query):
        price_matches = re.search(r'từ\s*(\d+)\s*đến\s*(\d+)', query)
        if price_matches:
            semantics['price_range'] = {
                'min': int(price_matches.group(1)) * 1000,
                'max': int(price_matches.group(2)) * 1000
            }
    
    # Phân tích sắp xếp
    if 'giá thấp nhất' in query or 'rẻ nhất' in query or 'giá tăng dần' in query:
        semantics['sort_by'] = {'field': 'productPrice', 'order': 1}
    elif 'giá cao nhất' in query or 'đắt nhất' in query or 'giá giảm dần' in query:
        semantics['sort_by'] = {'field': 'productPrice', 'order': -1}
    elif 'mới nhất' in query or 'mới ra' in query:
        semantics['sort_by'] = {'field': 'createdAt', 'order': -1}
    elif 'phổ biến nhất' in query or 'bán chạy nhất' in query:
        semantics['sort_by'] = {'field': 'popularity', 'order': -1}
    
    return semantics

def build_semantic_filter(semantics):
    """
    Xây dựng bộ lọc MongoDB dựa trên kết quả phân tích ngữ nghĩa
    """
    filter_query = {}
    
    # Lọc theo danh mục
    if semantics['category']:
        filter_query['productCategory'] = semantics['category']
    
    # Xử lý đặc biệt cho trái cây ít đường
    if 'low_sugar' in semantics['attributes'] and semantics['category'] == 'Trái cây':
        # Tạo bộ lọc đặc biệt cho trái cây ít đường
        filter_query['$or'] = [
            {'productName': {'$regex': 'ít đường|đường thấp|không đường|ăn kiêng|giảm cân', '$options': 'i'}},
            {'productDescription': {'$regex': 'ít đường|đường thấp|không đường|hàm lượng đường thấp|ăn kiêng|giảm cân|tiểu đường', '$options': 'i'}}
        ]
        
        # Nếu có đối tượng sử dụng là người ăn kiêng hoặc tiểu đường, thêm điều kiện tìm kiếm
        if semantics['target_audience'] in ['dieter', 'diabetic']:
            audience_regex = 'ăn kiêng|giảm cân|diet' if semantics['target_audience'] == 'dieter' else 'tiểu đường|đái tháo đường'
            filter_query['$or'].append({'productDescription': {'$regex': audience_regex, '$options': 'i'}})
        
        return filter_query
    
    # Lọc theo thuộc tính
    or_conditions = []
    
    if 'low_sugar' in semantics['attributes']:
        # Lọc sản phẩm có hàm lượng đường thấp
        or_conditions.extend([
            {'productName': {'$regex': 'ít đường|đường thấp|không đường', '$options': 'i'}},
            {'productDescription': {'$regex': 'ít đường|đường thấp|không đường|hàm lượng đường thấp', '$options': 'i'}}
        ])
    
    if 'organic' in semantics['attributes']:
        # Lọc sản phẩm hữu cơ
        or_conditions.extend([
            {'productName': {'$regex': 'hữu cơ|organic', '$options': 'i'}},
            {'productDescription': {'$regex': 'hữu cơ|organic', '$options': 'i'}}
        ])
    
    if 'fresh' in semantics['attributes']:
        # Lọc sản phẩm tươi
        or_conditions.extend([
            {'productName': {'$regex': 'tươi|mới', '$options': 'i'}},
            {'productDescription': {'$regex': 'tươi|mới|tươi ngon', '$options': 'i'}}
        ])
    
    # Lọc theo đối tượng sử dụng
    if semantics['target_audience'] == 'dieter':
        # Lọc sản phẩm dành cho người ăn kiêng
        or_conditions.extend([
            {'productName': {'$regex': 'ăn kiêng|giảm cân|diet', '$options': 'i'}},
            {'productDescription': {'$regex': 'ăn kiêng|giảm cân|diet|ít calo|ít béo', '$options': 'i'}}
        ])
    elif semantics['target_audience'] == 'diabetic':
        # Lọc sản phẩm dành cho người tiểu đường
        or_conditions.extend([
            {'productName': {'$regex': 'tiểu đường|đái tháo đường', '$options': 'i'}},
            {'productDescription': {'$regex': 'tiểu đường|đái tháo đường|ít đường|không đường', '$options': 'i'}}
        ])
    
    # Thêm điều kiện $or nếu có
    if or_conditions:
        filter_query['$or'] = or_conditions
    
    # Lọc theo khoảng giá
    if semantics['price_range']:
        filter_query['productPrice'] = {}
        if 'min' in semantics['price_range']:
            filter_query['productPrice']['$gte'] = semantics['price_range']['min']
        if 'max' in semantics['price_range']:
            filter_query['productPrice']['$lte'] = semantics['price_range']['max']
    
    return filter_query

def build_relaxed_filter(semantics):
    """
    Xây dựng bộ lọc nới lỏng hơn nếu không tìm thấy kết quả với bộ lọc chặt chẽ
    """
    filter_query = {}
    
    # Chỉ giữ lại điều kiện về danh mục
    if semantics['category']:
        filter_query['productCategory'] = semantics['category']
    
    # Nếu là truy vấn về trái cây ít đường, thêm điều kiện tìm kiếm trái cây
    if 'low_sugar' in semantics['attributes'] and semantics['category'] == 'Trái cây':
        filter_query['productCategory'] = 'Trái cây'
    
    return filter_query

def calculate_relevance_score(product, semantics):
    """
    Tính điểm liên quan của sản phẩm với truy vấn
    """
    score = 0
    product_name = product.get('productName', '').lower()
    product_desc = ' '.join(product.get('productDescription', [])).lower() if product.get('productDescription') else ''
    
    # Điểm cho danh mục
    if semantics['category'] and product.get('productCategory') == semantics['category']:
        score += 10
    
    # Điểm đặc biệt cho trái cây ít đường
    if 'low_sugar' in semantics['attributes'] and semantics['category'] == 'Trái cây':
        # Kiểm tra từ khóa về đường trong tên sản phẩm
        low_sugar_name_patterns = ['ít đường', 'đường thấp', 'không đường', 'ăn kiêng', 'giảm cân']
        for pattern in low_sugar_name_patterns:
            if pattern in product_name:
                score += 15  # Điểm cao hơn cho tên sản phẩm chứa từ khóa về ít đường
        
        # Kiểm tra từ khóa về đường trong mô tả sản phẩm
        low_sugar_desc_patterns = [
            'ít đường', 'đường thấp', 'không đường', 'hàm lượng đường thấp',
            'ăn kiêng', 'giảm cân', 'tiểu đường', 'lượng đường thấp',
            'chỉ số đường huyết thấp', 'gi thấp'
        ]
        for pattern in low_sugar_desc_patterns:
            if pattern in product_desc:
                score += 10
        
        # Kiểm tra nếu có đề cập đến hàm lượng đường cụ thể
        sugar_content_patterns = [
            r'(\d+[.,]?\d*)g đường', 
            r'đường: (\d+[.,]?\d*)g',
            r'hàm lượng đường (\d+[.,]?\d*)g',
            r'(\d+[.,]?\d*)% đường'
        ]
        
        for pattern in sugar_content_patterns:
            matches = re.findall(pattern, product_desc)
            if matches:
                try:
                    sugar_content = float(matches[0].replace(',', '.'))
                    # Điểm cao hơn cho sản phẩm có hàm lượng đường thấp
                    if sugar_content < 5:
                        score += 20
                    elif sugar_content < 10:
                        score += 15
                    elif sugar_content < 15:
                        score += 10
                except:
                    # Nếu không thể chuyển đổi thành số, vẫn cộng điểm vì có đề cập đến hàm lượng đường
                    score += 5
        
        # Điểm cho đối tượng sử dụng
        if semantics['target_audience'] == 'dieter':
            dieter_patterns = ['ăn kiêng', 'giảm cân', 'diet', 'ít calo', 'ít béo']
            for pattern in dieter_patterns:
                if pattern in product_name:
                    score += 10
                elif pattern in product_desc:
                    score += 5
        elif semantics['target_audience'] == 'diabetic':
            diabetic_patterns = ['tiểu đường', 'đái tháo đường', 'đường huyết']
            for pattern in diabetic_patterns:
                if pattern in product_name:
                    score += 10
                elif pattern in product_desc:
                    score += 5
        
        return score
    
    # Điểm cho thuộc tính thông thường
    if 'low_sugar' in semantics['attributes']:
        low_sugar_patterns = ['ít đường', 'đường thấp', 'không đường', 'hàm lượng đường thấp']
        for pattern in low_sugar_patterns:
            if pattern in product_name:
                score += 5
            elif pattern in product_desc:
                score += 3
    
    if 'organic' in semantics['attributes']:
        organic_patterns = ['hữu cơ', 'organic']
        for pattern in organic_patterns:
            if pattern in product_name:
                score += 5
            elif pattern in product_desc:
                score += 3
    
    if 'fresh' in semantics['attributes']:
        fresh_patterns = ['tươi', 'mới', 'tươi ngon']
        for pattern in fresh_patterns:
            if pattern in product_name:
                score += 5
            elif pattern in product_desc:
                score += 3
    
    # Điểm cho đối tượng sử dụng
    if semantics['target_audience'] == 'dieter':
        dieter_patterns = ['ăn kiêng', 'giảm cân', 'diet', 'ít calo', 'ít béo']
        for pattern in dieter_patterns:
            if pattern in product_name:
                score += 5
            elif pattern in product_desc:
                score += 3
    elif semantics['target_audience'] == 'diabetic':
        diabetic_patterns = ['tiểu đường', 'đái tháo đường', 'đường huyết']
        for pattern in diabetic_patterns:
            if pattern in product_name:
                score += 5
            elif pattern in product_desc:
                score += 3
    
    return score

def semanticSearch(query):
    """
    Tìm kiếm sản phẩm dựa trên ngữ nghĩa của câu hỏi
    """
    try:
        # Kiểm tra nếu là câu hỏi về trái cây ít đường
        query_lower = query.lower()
        is_low_sugar_fruit_query = False
        
        # Kiểm tra các từ khóa liên quan đến trái cây ít đường
        fruit_keywords = ["trái cây", "hoa quả", "quả"]
        low_sugar_keywords = ["ít đường", "đường thấp", "ít ngọt", "không ngọt", "ăn kiêng", "giảm cân", "tiểu đường"]
        
        # Đếm số từ khóa xuất hiện trong tin nhắn
        fruit_count = sum(1 for keyword in fruit_keywords if keyword in query_lower)
        low_sugar_count = sum(1 for keyword in low_sugar_keywords if keyword in query_lower)
        
        # Nếu có từ khóa về trái cây và từ khóa về ít đường, xác định là câu hỏi về trái cây ít đường
        if fruit_count > 0 and low_sugar_count > 0:
            is_low_sugar_fruit_query = True
            
        # Kiểm tra các mẫu câu cụ thể
        low_sugar_fruit_patterns = [
            "trái cây nào ít đường",
            "trái cây ít đường",
            "hoa quả ít đường",
            "quả nào ít đường",
            "trái cây cho người ăn kiêng",
            "hoa quả cho người tiểu đường",
            "trái cây phù hợp cho người ăn kiêng",
            "trái cây dành cho người giảm cân"
        ]
        
        for pattern in low_sugar_fruit_patterns:
            if pattern in query_lower:
                is_low_sugar_fruit_query = True
                break
        
        # Nếu là câu hỏi về trái cây ít đường, sử dụng hàm chuyên biệt
        if is_low_sugar_fruit_query:
            print("Phát hiện câu hỏi về trái cây ít đường, chuyển sang semantic_search_products")
            return semantic_search_products(query)
        
        # Phân tích ngữ nghĩa của câu hỏi
        semantics = analyze_query_semantics(query)
        
        # Xây dựng bộ lọc
        filter_query = build_semantic_filter(semantics)
        
        # Lấy collection sản phẩm
        if not products_collection:
            print("Không có kết nối đến database")
            return []
        
        # Thực hiện tìm kiếm với bộ lọc
        products = list(products_collection.find(filter_query).limit(10))
        
        # Nếu không tìm thấy sản phẩm nào, thử với bộ lọc nới lỏng hơn
        if not products:
            relaxed_filter = build_relaxed_filter(semantics)
            products = list(products_collection.find(relaxed_filter).limit(10))
        
        # Tính điểm liên quan và sắp xếp kết quả
        if products:
            for product in products:
                product['relevanceScore'] = calculate_relevance_score(product, semantics)
            
            products.sort(key=lambda x: x.get('relevanceScore', 0), reverse=True)
        
        # Giới hạn số lượng kết quả
        return products[:semantics['limit']]
    except Exception as e:
        print(f"Lỗi khi thực hiện tìm kiếm ngữ nghĩa: {e}")
        return []

def semantic_search_products(query):
    """
    Tìm kiếm sản phẩm trái cây ít đường cho người ăn kiêng
    """
    try:
        # Phân tích ngữ nghĩa của câu hỏi
        semantics = analyze_query_semantics(query)
        
        # Thêm thuộc tính low_sugar nếu chưa có
        if 'low_sugar' not in semantics['attributes']:
            semantics['attributes'].append('low_sugar')
        
        # Đảm bảo danh mục là trái cây
        if not semantics['category']:
            semantics['category'] = 'Trái cây'
        
        # Tạo bộ lọc đặc biệt cho trái cây ít đường
        filter_query = {
            'productCategory': semantics['category'],
            '$or': [
                {'productName': {'$regex': 'ít đường|đường thấp|không đường', '$options': 'i'}},
                {'productDescription': {'$regex': 'ít đường|đường thấp|không đường|hàm lượng đường thấp', '$options': 'i'}}
            ]
        }
        
        # Lấy collection sản phẩm
        if not products_collection:
            print("Không có kết nối đến database")
            return []
        
        # Thực hiện tìm kiếm với bộ lọc
        products = list(products_collection.find(filter_query).limit(10))
        
        # Nếu không tìm thấy sản phẩm nào, thử tìm tất cả trái cây
        if not products:
            print("Không tìm thấy trái cây ít đường, tìm tất cả trái cây trong danh mục")
            products = list(products_collection.find({'productCategory': semantics['category']}).limit(10))
            
            # Sắp xếp theo tên (để đảm bảo kết quả ổn định)
            products.sort(key=lambda x: x.get('productName', ''))
            
            # Tính điểm liên quan và sắp xếp lại nếu có kết quả
            if products:
                for product in products:
                    product['relevanceScore'] = calculate_relevance_score(product, semantics)
                
                products.sort(key=lambda x: x.get('relevanceScore', 0), reverse=True)
        
        # Nếu vẫn không tìm thấy và danh mục không phải là Trái cây, thử tìm trong danh mục Trái cây
        if not products and semantics['category'] != 'Trái cây':
            print("Không tìm thấy sản phẩm trong danh mục hiện tại, thử tìm trong danh mục Trái cây")
            products = list(products_collection.find({'productCategory': 'Trái cây'}).limit(10))
            
            # Sắp xếp theo tên
            products.sort(key=lambda x: x.get('productName', ''))
        
        return products
    except Exception as e:
        print(f"Lỗi khi thực hiện tìm kiếm trái cây ít đường: {e}")
        return [] 