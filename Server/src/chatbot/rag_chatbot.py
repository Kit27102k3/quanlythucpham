import os
import json
from typing import List, Dict, Any
import pandas as pd
from dotenv import load_dotenv
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
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
            
        # Create QA chain
        if self.llm:
            template = """
            Bạn là trợ lý ảo của website siêu thị thực phẩm sạch. Hãy trả lời câu hỏi của khách hàng một cách chuyên nghiệp, 
            thân thiện và hữu ích. Dựa vào thông tin được cung cấp bên dưới để trả lời.
            Nếu không có thông tin, hãy nói rằng bạn không có thông tin để trả lời và đề nghị khách hàng 
            liên hệ với bộ phận chăm sóc khách hàng.
            
            Thông tin: {context}
            
            Câu hỏi: {question}
            
            Trả lời:
            """
            
            prompt = PromptTemplate(
                template=template,
                input_variables=["context", "question"]
            )
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_db.as_retriever(search_kwargs={"k": 3}),
                chain_type_kwargs={"prompt": prompt}
            )
    
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
        """Create or load the vector database with all documents"""
        # Check if vector database exists
        if os.path.exists("vector_db"):
            # Load existing vector database
            self.vector_db = FAISS.load_local("vector_db", self.embeddings)
            print("Loaded existing vector database")
        else:
            # Create new vector database from documents
            documents = self.prepare_documents()
            
            # Create text splitter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            
            # Split documents
            splits = text_splitter.split_documents(documents)
            
            # Create vector database
            self.vector_db = FAISS.from_documents(splits, self.embeddings)
            
            # Save vector database
            self.vector_db.save_local("vector_db")
            print("Created and saved new vector database")
    
    def prepare_documents(self) -> List[Document]:
        """Prepare documents from various sources"""
        documents = []
        
        # Add FAQ documents
        faq_docs = self.prepare_faq_documents()
        documents.extend(faq_docs)
        
        # Add product documents
        product_docs = self.prepare_product_documents()
        documents.extend(product_docs)
        
        # Add policy documents
        policy_docs = self.prepare_policy_documents()
        documents.extend(policy_docs)
        
        # Add database documents
        db_docs = self.prepare_db_documents()
        documents.extend(db_docs)
        
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
        # Load product data from json file
        with open("data/products.json", "r", encoding="utf-8") as f:
            product_data = json.load(f)
        
        # Also try to get product data from database
        try:
            db_product_data = get_product_data()
            if db_product_data:
                product_data.extend(db_product_data)
        except:
            pass
        
        # Create documents
        documents = []
        for product in product_data:
            content = f"""
            Tên sản phẩm: {product['name']}
            Mô tả: {product['description']}
            Giá: {product['price']} đồng
            Danh mục: {product['category']}
            Nguồn gốc: {product.get('origin', 'Việt Nam')}
            Chứng nhận: {', '.join(product.get('certifications', []))}
            """
            doc = Document(
                page_content=content,
                metadata={"source": "Product", "category": product["category"]}
            )
            documents.append(doc)
        
        return documents
    
    def prepare_policy_documents(self) -> List[Document]:
        """Prepare policy documents"""
        # Load policy data
        policy_files = [
            "data/shipping_policy.txt",
            "data/return_policy.txt",
            "data/payment_policy.txt",
            "data/privacy_policy.txt"
        ]
        
        documents = []
        for file_path in policy_files:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                policy_type = os.path.basename(file_path).replace("_policy.txt", "").replace("_", " ").title()
                
                doc = Document(
                    page_content=content,
                    metadata={"source": "Policy", "type": policy_type}
                )
                documents.append(doc)
        
        return documents
    
    def prepare_db_documents(self) -> List[Document]:
        """Prepare documents from database"""
        documents = []
        
        # Try to get order data from database
        try:
            order_data = get_order_data()
            if order_data:
                for order in order_data:
                    content = f"""
                    Mã đơn hàng: {order['order_id']}
                    Trạng thái: {order['status']}
                    Tổng tiền: {order['total']} đồng
                    Phương thức thanh toán: {order['payment_method']}
                    Phương thức vận chuyển: {order['shipping_method']}
                    """
                    doc = Document(
                        page_content=content,
                        metadata={"source": "Order", "order_id": order['order_id']}
                    )
                    documents.append(doc)
        except:
            pass
        
        return documents
    
    def find_direct_faq_match(self, question: str) -> str:
        """Find a direct match in FAQ data"""
        # Normalize the question for comparison
        normalized_question = question.lower().strip()
        
        # Check for exact match
        for item in self.faq_data:
            if item['question'].lower().strip() == normalized_question:
                return item['answer']
        
        # Check for substring match
        for item in self.faq_data:
            if normalized_question in item['question'].lower() or item['question'].lower() in normalized_question:
                # Calculate similarity score (basic)
                similarity = len(set(normalized_question.split()) & set(item['question'].lower().split())) / len(set(normalized_question.split() + item['question'].lower().split()))
                if similarity > 0.6:  # Threshold for similarity
                    return item['answer']
        
        return ""
    
    def get_answer(self, question: str) -> str:
        """Generate an answer for the given question"""
        # Attempt to find a direct match first
        direct_match = self.find_direct_faq_match(question)
        if direct_match:
            return direct_match
        
        if self.llm:
            # Use the QA chain to generate an answer
            try:
                response = self.qa_chain.invoke({"query": question})
                return response["result"]
            except Exception as e:
                print(f"Error generating response: {str(e)}")
                return self.generate_fallback_response(question)
        else:
            # Use a simple response generator
            return self.generate_fallback_response(question)
    
    def generate_fallback_response(self, question: str) -> str:
        """Generate a simple response based on retrieved documents"""
        docs = self.vector_db.similarity_search(question, k=2)
        
        if not docs:
            return "Xin lỗi, tôi không có thông tin để trả lời câu hỏi của bạn. Vui lòng liên hệ với bộ phận chăm sóc khách hàng qua số điện thoại 1900 1234 để được hỗ trợ."
        
        response = "Dựa trên thông tin tôi có:\n\n"
        for i, doc in enumerate(docs):
            response += f"{doc.page_content}\n\n"
        
        response += "Nếu bạn cần thêm thông tin, vui lòng liên hệ với chúng tôi qua số điện thoại 1900 1234."
        return response 