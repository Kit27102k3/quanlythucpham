#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import os
import argparse
from flask import Flask, request, jsonify
from rag_chatbot import RagChatbot

app = Flask(__name__)

@app.route('/api/chatbot/ask', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('question', '')
    if not message:
        return jsonify({"error": "No message provided", "text": "Không nhận được câu hỏi"})
    
    bot = RagChatbot()
    response = bot.get_answer(message)
    return jsonify({"answer": response, "status": "success"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True) 