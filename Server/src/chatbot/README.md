# Hệ thống Chatbot Tối ưu cho Siêu thị Thực phẩm Sạch

Hệ thống chatbot này đã được tối ưu để trả lời các câu hỏi từ khách hàng dựa trên dữ liệu thực tế từ MongoDB của hệ thống siêu thị thực phẩm sạch.

## Tính năng chính

- **Prompt tối ưu dựa trên dữ liệu thực tế**: Sử dụng cấu trúc dữ liệu MongoDB để tạo prompt huấn luyện chatbot chính xác và phù hợp.
- **60 câu hỏi thực tế từ khách hàng**: Được phân loại thành 6 nhóm chính để huấn luyện chatbot.
- **RAG (Retrieval Augmented Generation)**: Kết hợp tìm kiếm thông tin từ cơ sở dữ liệu với khả năng sinh văn bản của mô hình ngôn ngữ.
- **Giao diện quản lý prompt**: Cho phép admin tùy chỉnh và cập nhật prompt cho chatbot.
- **Công cụ kiểm thử**: Đánh giá hiệu suất của chatbot với các câu hỏi thực tế.

## Cấu trúc thư mục

```
Server/src/chatbot/
├── config/                  # Cấu hình cho chatbot
│   └── chatbot_prompt.txt   # Prompt hiện tại đang sử dụng
├── training_data/           # Dữ liệu huấn luyện
│   ├── customer_queries.js  # 60 câu hỏi thực tế từ khách hàng
│   ├── prompt_generator.js  # Tạo prompt từ dữ liệu
│   ├── chatbot_trainer.js   # Công cụ huấn luyện chatbot
│   └── prompts/             # Thư mục lưu trữ các prompt đã tạo
├── admin/                   # Giao diện quản lý cho admin
│   └── prompt_manager.js    # Quản lý prompt
├── test_results/            # Kết quả kiểm thử
├── rag_chatbot.py           # Mã nguồn chính của chatbot
├── run.py                   # Script chạy và quản lý chatbot
├── test_chatbot.js          # Công cụ kiểm thử chatbot
└── README.md                # Tài liệu hướng dẫn
```

## Cách sử dụng

### 1. Khởi động chatbot

```bash
cd Server/src/chatbot
python run.py
```

### 2. Cập nhật prompt cho chatbot

#### Sử dụng API (yêu cầu quyền admin)

```bash
curl -X POST http://localhost:3000/api/chatbot/update-prompt \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"promptType": "withExamples"}'
```

Các loại prompt có sẵn:
- `basic`: Prompt cơ bản
- `withExamples`: Prompt với các ví dụ về cách trả lời
- `healthNeeds`: Prompt tập trung vào nhu cầu sức khỏe
- `productInfo`: Prompt tập trung vào thông tin sản phẩm
- `promotions`: Prompt tập trung vào khuyến mãi và ưu đãi
- `orderAndDelivery`: Prompt tập trung vào đơn hàng và giao hàng
- `storeInfo`: Prompt tập trung vào chi nhánh và giờ mở cửa
- `reviewsAndFeedback`: Prompt tập trung vào đánh giá và phản hồi

#### Tạo mới tất cả các prompt

```bash
curl -X POST http://localhost:3000/api/chatbot/generate-prompts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Khởi động lại chatbot sau khi cập nhật prompt

```bash
curl -X POST http://localhost:3000/api/chatbot/restart \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Kiểm thử chatbot

#### Kiểm thử tất cả các câu hỏi

```bash
cd Server/src/chatbot
node test_chatbot.js all
```

#### Kiểm thử một nhóm câu hỏi cụ thể

```bash
node test_chatbot.js healthNeeds
```

Các nhóm câu hỏi có sẵn:
- `healthNeeds`: Câu hỏi về nhu cầu sức khỏe
- `productInfo`: Câu hỏi về thông tin sản phẩm
- `promotions`: Câu hỏi về khuyến mãi và ưu đãi
- `orderAndDelivery`: Câu hỏi về đơn hàng và giao hàng
- `storeInfo`: Câu hỏi về chi nhánh và giờ mở cửa
- `reviewsAndFeedback`: Câu hỏi về đánh giá và phản hồi

## Tùy chỉnh thêm

### Thêm câu hỏi mới

Mở file `Server/src/chatbot/training_data/customer_queries.js` và thêm câu hỏi mới vào nhóm phù hợp.

### Tùy chỉnh prompt

Bạn có thể chỉnh sửa trực tiếp các prompt đã tạo trong thư mục `Server/src/chatbot/training_data/prompts/` hoặc chỉnh sửa logic tạo prompt trong file `Server/src/chatbot/training_data/prompt_generator.js`.

## Yêu cầu hệ thống

- Node.js >= 14
- Python >= 3.8
- MongoDB
- Các thư viện Python: langchain, langchain_community, langchain_openai, faiss-cpu, sentence-transformers

## Tác giả

Hệ thống chatbot này được phát triển bởi đội ngũ phát triển Siêu thị Thực phẩm Sạch. 