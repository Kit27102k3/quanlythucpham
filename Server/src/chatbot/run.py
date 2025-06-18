"""
Chatbot Runner Script
This script helps to run the chatbot server and handle any setup required.
"""

import os
import sys
import subprocess
import time
import argparse
import signal
import json

def check_directories():
    """Ensure all required directories exist"""
    directories = ["static", "templates", "data", "config"]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")

def check_data_files():
    """Check if all necessary data files exist"""
    if not os.path.exists("data/faq.json"):
        print("Warning: data/faq.json not found. Creating empty file.")
        with open("data/faq.json", "w", encoding="utf-8") as f:
            json.dump([], f)
    return True

def find_chatbot_process():
    """Find running chatbot process"""
    try:
        import psutil
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if proc.info['cmdline'] and len(proc.info['cmdline']) > 1:
                if 'python' in proc.info['name'].lower() and 'rag_chatbot.py' in ' '.join(proc.info['cmdline']):
                    return proc.info['pid']
    except (ImportError, Exception) as e:
        print(f"Error finding chatbot process: {str(e)}")
    return None

def stop_chatbot():
    """Stop running chatbot process"""
    pid = find_chatbot_process()
    if pid:
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"Stopped chatbot process with PID {pid}")
            time.sleep(2)  # Give it time to shut down
            return True
        except Exception as e:
            print(f"Error stopping chatbot: {str(e)}")
            return False
    else:
        print("No running chatbot process found")
        return True

def start_chatbot():
    """Start the chatbot server"""
    check_directories()
    check_data_files()
    
    # Check if optimized prompt exists
    if not os.path.exists("config/chatbot_prompt.txt"):
        print("No optimized prompt found. Using default prompt.")
    else:
        print("Using optimized prompt from config/chatbot_prompt.txt")
    
    # Start the chatbot in the background
    try:
        process = subprocess.Popen(
            ["python", "rag_chatbot.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"Started chatbot with PID {process.pid}")
        
        # Wait a bit to see if it crashes immediately
        time.sleep(2)
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            print("Error starting chatbot:")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return False
        
        return True
    except Exception as e:
        print(f"Error starting chatbot: {str(e)}")
        return False

def restart_chatbot():
    """Restart the chatbot server"""
    print("Restarting chatbot...")
    stop_chatbot()
    return start_chatbot()

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Chatbot Runner")
    parser.add_argument("--restart", action="store_true", help="Restart the chatbot")
    parser.add_argument("--stop", action="store_true", help="Stop the chatbot")
    args = parser.parse_args()
    
    if args.stop:
        stop_chatbot()
    elif args.restart:
        restart_chatbot()
    else:
        start_chatbot()

if __name__ == "__main__":
    main() 