import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import pymongo
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI")


def get_database_connection():
    """Get a connection to the MongoDB database"""
    if not MONGO_URI:
        # If no MongoDB URI provided, return None
        return None

    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client["food_market"]
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        return None


def get_product_data() -> List[Dict[str, Any]]:
    """Get product data from MongoDB"""
    db = get_database_connection()
    if db is None:
        # Use local data if database connection is not available
        return []

    try:
        products_collection = db["products"]
        products = list(products_collection.find({}, {"_id": 0}))
        return products
    except Exception as e:
        print(f"Error getting product data: {str(e)}")
        return []


def get_order_data() -> List[Dict[str, Any]]:
    """Get order data from MongoDB"""
    db = get_database_connection()
    if db is None:
        # Use local data if database connection is not available
        return []

    try:
        orders_collection = db["orders"]
        orders = list(orders_collection.find({}, {"_id": 0}))
        return orders
    except Exception as e:
        print(f"Error getting order data: {str(e)}")
        return []


def get_faq_data() -> List[Dict[str, Any]]:
    """Get FAQ data from MongoDB"""
    db = get_database_connection()
    if db is None:
        # Use local data if database connection is not available
        return []

    try:
        faq_collection = db["faqs"]
        faqs = list(faq_collection.find({}, {"_id": 0}))
        return faqs
    except Exception as e:
        print(f"Error getting FAQ data: {str(e)}")
        return []


def save_conversation(user_id: str, question: str, answer: str) -> bool:
    """Save a conversation to the database"""
    db = get_database_connection()
    if db is None:
        # Can't save conversation if no database connection
        return False

    try:
        conversation_collection = db["conversations"]
        conversation_collection.insert_one(
            {
                "user_id": user_id,
                "question": question,
                "answer": answer,
                "timestamp": datetime.now(),
            }
        )
        return True
    except Exception as e:
        print(f"Error saving conversation: {str(e)}")
        return False


def get_user_data(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user data from the database"""
    db = get_database_connection()
    if db is None:
        # Use local data if database connection is not available
        return None

    try:
        users_collection = db["users"]
        user = users_collection.find_one({"user_id": user_id}, {"_id": 0})
        return user
    except Exception as e:
        print(f"Error getting user data: {str(e)}")
        return None
