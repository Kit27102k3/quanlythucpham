"""
Chatbot Runner Script
This script helps to run the chatbot server and handle any setup required.
"""

import os
import sys
import subprocess
import time

def check_directories():
    """Ensure all required directories exist"""
    directories = ["static", "templates", "data"]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")

def check_data_files():
    """Check if all necessary data files exist"""
    if not os.path.exists("data/faq.json"):
        print("Error: data/faq.json not found. Please make sure you have the data files.")
        return False
    return True

def run_server():
    """Run the FastAPI server"""
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\nServer shutdown by user")
    except Exception as e:
        print(f"Error running server: {str(e)}")

def main():
    """Main function to run the chatbot"""
    print("="*50)
    print("Starting Siêu Thị Thực Phẩm Sạch Chatbot")
    print("="*50)
    
    # Check environment
    print("Checking environment...")
    check_directories()
    
    # Check data files
    print("Checking data files...")
    if not check_data_files():
        return
    
    # Run server
    print("Starting server...")
    time.sleep(1)
    run_server()

if __name__ == "__main__":
    main() 