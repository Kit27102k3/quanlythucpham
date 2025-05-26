# Chatbot RAG cho Siêu Thị Thực Phẩm Sạch

Đây là hệ thống chatbot sử dụng mô hình RAG (Retrieval-Augmented Generation) để trả lời câu hỏi liên quan đến siêu thị thực phẩm sạch. Chatbot có thể truy xuất thông tin từ cơ sở dữ liệu hoặc từ các tài liệu (FAQ, chính sách, thông tin sản phẩm) và tạo ra câu trả lời phù hợp.

## Tính năng

- Tìm kiếm ngữ nghĩa thông tin từ nhiều nguồn dữ liệu
- Tạo câu trả lời tự nhiên và mạch lạc
- Kết nối với cơ sở dữ liệu để lấy thông tin cập nhật
- Giao diện web thân thiện với người dùng
- Hỗ trợ tải lên tài liệu mới
- Lưu trữ và phân tích lịch sử hội thoại

## Cài đặt

### Yêu cầu hệ thống

- Python 3.7+
- MongoDB (tùy chọn, để lưu trữ dữ liệu)
- Đủ không gian đĩa cho vector database

### Cài đặt thư viện

```bash
# Clone repository
git clone https://github.com/your-username/food-market-chatbot.git
cd food-market-chatbot

# Tạo và kích hoạt môi trường ảo (tùy chọn nhưng khuyến nghị)
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate

# Cài đặt thư viện
pip install -r requirements.txt
```

### Cấu hình

1. Tạo file `.env` trong thư mục gốc với nội dung sau:

```
# OpenAI API Key (tùy chọn, nếu sử dụng mô hình của OpenAI)

# MongoDB connection string (tùy chọn, nếu sử dụng MongoDB)
MONGO_URI=mongodb://localhost:27017/
```

2. Chuẩn bị dữ liệu:
   - Dữ liệu mẫu đã được cung cấp trong thư mục `data/`
   - Bạn có thể thêm hoặc sửa dữ liệu trong các file tương ứng

## Chạy ứng dụng

```bash
# Chạy ứng dụng
python app.py
```

Truy cập ứng dụng tại: http://localhost:8000

## Cấu trúc thư mục

```
chatbot/
├── app.py                 # Ứng dụng FastAPI
├── rag_chatbot.py         # Mô hình RAG chatbot
├── db_connector.py        # Kết nối với cơ sở dữ liệu
├── requirements.txt       # Thư viện cần thiết
├── data/                  # Dữ liệu
│   ├── faq.json           # Câu hỏi thường gặp
│   ├── products.json      # Thông tin sản phẩm
│   ├── shipping_policy.txt # Chính sách vận chuyển
│   ├── return_policy.txt  # Chính sách đổi trả
│   ├── payment_policy.txt # Chính sách thanh toán
│   └── privacy_policy.txt # Chính sách bảo mật
├── templates/             # Templates HTML
│   └── index.html         # Giao diện chatbot
├── static/                # File tĩnh (CSS, JS)
│   └── ...
└── vector_db/            # Vector database (được tạo tự động)
```

## Tùy chỉnh nâng cao

### Thay đổi mô hình embedding

Mặc định, chatbot sử dụng mô hình `sentence-transformers/all-MiniLM-L6-v2` cho embedding. Bạn có thể thay đổi mô hình này trong file `rag_chatbot.py`:

```python
self.embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2" # Thay thế bằng mô hình khác
)
```

### Sử dụng mô hình ngôn ngữ khác

Mặc định, chatbot sử dụng OpenAI ChatGPT nếu bạn cung cấp API key. Bạn có thể sử dụng các mô hình ngôn ngữ khác bằng cách sửa đổi file `rag_chatbot.py`.

### Kết nối với cơ sở dữ liệu khác

Mặc định, chatbot kết nối với MongoDB (nếu cung cấp MONGO_URI). Bạn có thể kết nối với các cơ sở dữ liệu khác bằng cách sửa đổi file `db_connector.py`.

## Sử dụng

1. Truy cập ứng dụng tại: http://localhost:8000
2. Nhập câu hỏi của bạn vào hộp chat
3. Chatbot sẽ trả lời dựa trên thông tin có sẵn

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request nếu bạn muốn cải thiện chatbot.

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết. 