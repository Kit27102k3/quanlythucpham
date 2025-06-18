import os
import json
from typing import List, Dict, Any
import pandas as pd
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from db_connector import get_product_data, get_order_data, get_faq_data

# Load environment variables
load_dotenv()

class RagChatbot:
    def __init__(self):
        # Initialize embeddings model (using a free model from Hugging Face)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Create or load vector database
        self.create_or_load_vector_db()
        
        # Initialize language model (if you have an OpenAI API key)
        # Otherwise, you can use a local model or other free alternatives
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            self.llm = ChatOpenAI(temperature=0, api_key=api_key)
        else:
            # Fall back to a simple response generator if no API key
            self.llm = None
            
        # Load FAQ data for direct matching
        self.faq_data = self.load_faq_data()
            
        # Create QA chain with optimized prompt
        if self.llm:
            # Đọc prompt từ file cấu hình nếu có
            prompt_template = self.load_optimized_prompt()
            
            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["context", "question"]
            )
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_db.as_retriever(search_kwargs={"k": 3}),
                chain_type_kwargs={"prompt": prompt}
            )
    
    def load_optimized_prompt(self):
        """Đọc prompt tối ưu từ file cấu hình"""
        prompt_path = os.path.join(os.path.dirname(__file__), "config", "chatbot_prompt.txt")
        
        # Prompt mặc định nếu không tìm thấy file
        default_prompt = """
        Bạn là trợ lý ảo của website siêu thị thực phẩm sạch. Hãy trả lời câu hỏi của khách hàng một cách chuyên nghiệp, 
        thân thiện và hữu ích. Dựa vào thông tin được cung cấp bên dưới để trả lời.
        Nếu không có thông tin, hãy nói rằng bạn không có thông tin để trả lời và đề nghị khách hàng 
        liên hệ với bộ phận chăm sóc khách hàng.
        
        Thông tin: {context}
        
        Câu hỏi: {question}
        
        Trả lời:
        """
        
        try:
            if os.path.exists(prompt_path):
                with open(prompt_path, "r", encoding="utf-8") as f:
                    prompt_content = f.read()
                    
                # Thêm các biến {context} và {question} vào prompt nếu chưa có
                if "{context}" not in prompt_content or "{question}" not in prompt_content:
                    prompt_content += "\n\nThông tin: {context}\n\nCâu hỏi: {question}\n\nTrả lời:"
                    
                return prompt_content
            else:
                return default_prompt
        except Exception as e:
            print(f"Error loading optimized prompt: {str(e)}")
            return default_prompt
    
    def load_faq_data(self):
        """Load FAQ data for direct matching"""
        try:
            with open("data/faq.json", "r", encoding="utf-8") as f:
                faq_data = json.load(f)
            return faq_data
        except Exception as e:
            print(f"Error loading FAQ data: {str(e)}")
            return []
    
    def create_or_load_vector_db(self):
        """Create or load vector database"""
        db_path = "vector_db"
        
        if os.path.exists(db_path):
            try:
                self.vector_db = FAISS.load_local(db_path, self.embeddings)
            print("Loaded existing vector database")
                return
            except Exception as e:
                print(f"Error loading vector database: {str(e)}")
                print("Creating new vector database...")
        
        # Create new vector database
            documents = self.prepare_documents()
            
        if documents:
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            texts = text_splitter.split_documents(documents)
            
            # Create vector database
            self.vector_db = FAISS.from_documents(texts, self.embeddings)
            
            # Save vector database
            os.makedirs(db_path, exist_ok=True)
            self.vector_db.save_local(db_path)
            print("Created and saved new vector database")
        else:
            # Create empty vector database
            self.vector_db = FAISS.from_texts(["Empty database"], self.embeddings)
            print("Created empty vector database")
    
    def prepare_documents(self) -> List[Document]:
        """Prepare documents for vector database"""
        documents = []
        
        # Add FAQ documents
        faq_docs = self.prepare_faq_documents()
        if faq_docs:
        documents.extend(faq_docs)
            print(f"Added {len(faq_docs)} FAQ documents")
        
        # Add product documents
        product_docs = self.prepare_product_documents()
        if product_docs:
        documents.extend(product_docs)
            print(f"Added {len(product_docs)} product documents")
        
        return documents
    
    def prepare_faq_documents(self) -> List[Document]:
        """Prepare FAQ documents"""
        # Load FAQ data from json file
        with open("data/faq.json", "r", encoding="utf-8") as f:
            faq_data = json.load(f)
        
        # Also try to get FAQ data from database
        try:
            db_faq_data = get_faq_data()
            if db_faq_data:
                faq_data.extend(db_faq_data)
        except:
            pass
        
        # Create documents
        documents = []
        for item in faq_data:
            content = f"Câu hỏi: {item['question']}\nTrả lời: {item['answer']}"
            doc = Document(
                page_content=content,
                metadata={"source": "FAQ", "category": item.get("category", "Chung")}
            )
            documents.append(doc)
        
        return documents
    
    def prepare_product_documents(self) -> List[Document]:
        """Prepare product documents"""
        try:
            products = get_product_data()
            
            if not products:
                return []
        
        documents = []
            for product in products:
                # Create a detailed description of the product
                content = f"""
                Tên sản phẩm: {product.get('productName', 'Không có tên')}
                Danh mục: {product.get('productCategory', 'Không có danh mục')}
                Giá: {product.get('productPrice', 0)} VND
                Mô tả: {product.get('productDescription', 'Không có mô tả')}
                Chi tiết: {product.get('productDetails', 'Không có chi tiết')}
                Thành phần: {product.get('ingredients', 'Không có thông tin')}
                Xuất xứ: {product.get('origin', 'Không có thông tin')}
                Chứng nhận: {product.get('certifications', 'Không có thông tin')}
                Hướng dẫn sử dụng: {product.get('usageInstructions', 'Không có thông tin')}
                Bảo quản: {product.get('storage', 'Không có thông tin')}
                Hạn sử dụng: {product.get('expiryDate', 'Không có thông tin')}
                Giá trị dinh dưỡng: {product.get('nutritionalValue', 'Không có thông tin')}
                Phù hợp với: {product.get('suitableFor', 'Mọi người')}
                """
                
                # Add special dietary information if available
                if product.get('isVegan'):
                    content += "Sản phẩm chay: Có\n"
                if product.get('isGlutenFree'):
                    content += "Không chứa gluten: Có\n"
                if product.get('isOrganic'):
                    content += "Hữu cơ: Có\n"
                if product.get('isLowSugar'):
                    content += "Ít đường: Có\n"
                if product.get('isLowFat'):
                    content += "Ít chất béo: Có\n"
                if product.get('isLowSodium'):
                    content += "Ít muối: Có\n"
                if product.get('isHighProtein'):
                    content += "Giàu protein: Có\n"
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": "Product",
                        "id": str(product.get('_id', '')),
                        "name": product.get('productName', ''),
                        "category": product.get('productCategory', ''),
                        "price": product.get('productPrice', 0)
                    }
                )
                documents.append(doc)
        
        return documents
        except Exception as e:
            print(f"Error preparing product documents: {str(e)}")
            return []
    
    def answer_question(self, question: str) -> Dict[str, Any]:
        """Answer a question using the RAG system"""
        if not question:
            return {
                "answer": "Vui lòng đặt câu hỏi.",
                "source": "system"
            }
        
        # Check if question is in FAQ data first (direct matching)
        for item in self.faq_data:
            if question.lower() in item['question'].lower():
                return {
                    "answer": item['answer'],
                    "source": "FAQ"
                }
        
        # Use RAG system if available
        if self.llm and self.qa_chain:
            try:
                result = self.qa_chain({"query": question})
                return {
                    "answer": result['result'],
                    "source": "RAG"
                }
            except Exception as e:
                print(f"Error in RAG system: {str(e)}")
                return {
                    "answer": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
                    "source": "error"
                }
        else:
            # Fallback to simple response if no LLM available
            return {
                "answer": "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng liên hệ với bộ phận chăm sóc khách hàng để được hỗ trợ.",
                "source": "fallback"
            }
    
    def update_vector_db(self):
        """Update vector database with new documents"""
        try:
            # Prepare new documents
            documents = self.prepare_documents()
            
            if not documents:
                return False
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            texts = text_splitter.split_documents(documents)
            
            # Create new vector database
            self.vector_db = FAISS.from_documents(texts, self.embeddings)
            
            # Save vector database
            db_path = "vector_db"
            os.makedirs(db_path, exist_ok=True)
            self.vector_db.save_local(db_path)
            
            # Update QA chain
            if self.llm:
                prompt_template = self.load_optimized_prompt()
                
                prompt = PromptTemplate(
                    template=prompt_template,
                    input_variables=["context", "question"]
                )
                
                self.qa_chain = RetrievalQA.from_chain_type(
                    llm=self.llm,
                    chain_type="stuff",
                    retriever=self.vector_db.as_retriever(search_kwargs={"k": 3}),
                    chain_type_kwargs={"prompt": prompt}
                )
            
            return True
        except Exception as e:
            print(f"Error updating vector database: {str(e)}")
            return False 