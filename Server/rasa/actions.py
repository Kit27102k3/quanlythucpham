from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import pymongo
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGOOSE_URI", "mongodb://localhost:27017/quanlythucpham")
client = pymongo.MongoClient(MONGO_URI)
db = client.get_database()

class ActionProductInfo(Action):
    def name(self) -> Text:
        return "action_product_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        product_name = tracker.get_slot("product")
        if not product_name:
            dispatcher.utter_message(text="Xin lỗi, tôi không biết bạn muốn tìm thông tin về sản phẩm nào.")
            return []
        
        # Tìm sản phẩm trong MongoDB
        product = db.products.find_one({"productName": {"$regex": product_name, "$options": "i"}})
        
        if not product:
            dispatcher.utter_message(text=f"Xin lỗi, tôi không tìm thấy sản phẩm '{product_name}'.")
            return []
        
        # Format thông tin sản phẩm
        message = f"Thông tin sản phẩm {product['productName']}:\n"
        message += f"- Giá: {product['productPrice']}đ\n"
        
        if product.get('productDiscount', 0) > 0:
            message += f"- Giảm giá: {product['productDiscount']}%\n"
            message += f"- Giá sau giảm: {product['productPromoPrice']}đ\n"
        
        message += f"- Còn hàng: {product['productStock']}\n"
        
        if product.get('productDescription'):
            message += f"- Mô tả: {', '.join(product['productDescription'])}\n"
        
        if product.get('productOrigin'):
            message += f"- Nguồn gốc: {product['productOrigin']}\n"
        
        if product.get('productWarranty'):
            message += f"- Bảo hành: {product['productWarranty']} tháng\n"
        
        dispatcher.utter_message(text=message)
        return []

class ActionCategoryProducts(Action):
    def name(self) -> Text:
        return "action_category_products"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        category_name = tracker.get_slot("category")
        if not category_name:
            dispatcher.utter_message(text="Xin lỗi, tôi không biết bạn muốn xem sản phẩm trong danh mục nào.")
            return []
        
        # Tìm sản phẩm trong danh mục từ MongoDB
        products = list(db.products.find({"productCategory": {"$regex": category_name, "$options": "i"}}).limit(5))
        
        if not products:
            dispatcher.utter_message(text=f"Xin lỗi, tôi không tìm thấy sản phẩm nào trong danh mục '{category_name}'.")
            return []
        
        # Format danh sách sản phẩm
        message = f"Các sản phẩm trong danh mục {category_name}:\n\n"
        
        for product in products:
            message += f"- {product['productName']}: {product['productPrice']}đ"
            if product.get('productDiscount', 0) > 0:
                message += f" (Giảm {product['productDiscount']}%)"
            message += "\n"
        
        dispatcher.utter_message(text=message)
        return []

class ActionOrderStatus(Action):
    def name(self) -> Text:
        return "action_order_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        if not order_id:
            dispatcher.utter_message(text="Xin lỗi, tôi không biết bạn muốn kiểm tra đơn hàng nào.")
            return []
        
        # Tìm đơn hàng trong MongoDB
        order = db.orders.find_one({"_id": order_id})
        
        if not order:
            dispatcher.utter_message(text=f"Xin lỗi, tôi không tìm thấy đơn hàng với mã '{order_id}'.")
            return []
        
        # Format thông tin đơn hàng
        message = f"Thông tin đơn hàng {order_id}:\n"
        message += f"- Trạng thái: {order['orderStatus']}\n"
        message += f"- Tổng tiền: {order['orderTotal']}đ\n"
        
        if order.get('orderItems'):
            message += "- Sản phẩm:\n"
            for item in order['orderItems']:
                message += f"  + {item['productName']}: {item['quantity']} x {item['price']}đ\n"
        
        dispatcher.utter_message(text=message)
        return [] 