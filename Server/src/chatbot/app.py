import os
from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
from dotenv import load_dotenv
from rag_chatbot import RagChatbot
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Siêu Thị Thực Phẩm Sạch Chatbot")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Initialize chatbot
chatbot = RagChatbot()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/ask")
async def ask(question: str = Form(...)):
    try:
        # Log the question for debugging
        print(f"Received question: {question}")
        
        # Get answer from chatbot
        response = chatbot.get_answer(question)
        
        # Log the response for debugging
        print(f"Response: {response[:100]}...")
        
        return {"answer": response, "status": "success"}
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"answer": f"Xin lỗi, đã có lỗi xảy ra: {str(e)}", "status": "error"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 