#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import json
import os
import argparse
from flask import Flask, request, jsonify
import openai
from openai import OpenAI

app = Flask(__name__)

# Cấu hình API key đúng cách
client = OpenAI(api_key="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")

@app.route('/api/chatbot/ask', methods=['POST'])
def ask():
    data = request.json
    question = data.get("question", "")
    if not question:
        return jsonify({"answer": "Bạn chưa nhập câu hỏi."}), 400

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
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Lỗi OpenAI: {str(e)}")
        return jsonify({"answer": f"Lỗi khi gọi OpenAI: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True) 