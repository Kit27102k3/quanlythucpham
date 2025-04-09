# Hướng dẫn cài đặt và sử dụng Rasa Chatbot

## Giới thiệu

Rasa là một framework mã nguồn mở để xây dựng chatbot thông minh. Trong dự án này, chúng ta sử dụng Rasa để tạo một chatbot có thể đọc dữ liệu từ MongoDB và trả lời các câu hỏi của người dùng về sản phẩm, danh mục và đơn hàng.

## Yêu cầu hệ thống

- Python 3.7 trở lên
- MongoDB
- Node.js và npm (cho phần frontend)

## Cài đặt

1. Cài đặt Rasa và các thư viện cần thiết:

```bash
pip install rasa
pip install rasa-sdk
pip install pymongo
pip install python-dotenv
```

2. Cài đặt các thư viện cho actions server:

```bash
pip install rasa-sdk
pip install pymongo
pip install python-dotenv
```

## Cấu trúc thư mục

```
Server/
├── rasa/
│   ├── actions.py           # Custom actions để kết nối với MongoDB
│   ├── config.yml           # Cấu hình pipeline và policies
│   ├── data/
│   │   ├── nlu.yml          # Dữ liệu huấn luyện cho NLU
│   │   └── stories.yml      # Dữ liệu huấn luyện cho stories
│   ├── domain.yml           # Định nghĩa domain
│   ├── endpoints.yml        # Cấu hình endpoints
│   └── README.md            # Hướng dẫn sử dụng
```

## Huấn luyện mô hình

Để huấn luyện mô hình Rasa, chạy lệnh sau trong thư mục `Server/rasa`:

```bash
rasa train
```

## Chạy Rasa

1. Chạy Rasa server:

```bash
rasa run --enable-api
```

2. Chạy Rasa actions server:

```bash
rasa run actions
```

## Tích hợp với ứng dụng

Để tích hợp Rasa với ứng dụng Node.js, chúng ta sử dụng API của Rasa. Trong file `chatbotController.js`, chúng ta đã cấu hình để gửi tin nhắn đến Rasa và nhận phản hồi.

## Các tính năng

Chatbot có thể:

1. Trả lời các câu chào và tạm biệt
2. Cung cấp thông tin về sản phẩm
3. Liệt kê sản phẩm trong một danh mục
4. Kiểm tra trạng thái đơn hàng
5. Trả lời các câu hỏi thông thường

## Tùy chỉnh

Để thêm các tính năng mới, bạn có thể:

1. Thêm intents mới trong `data/nlu.yml`
2. Thêm stories mới trong `data/stories.yml`
3. Thêm actions mới trong `actions.py`
4. Cập nhật domain trong `domain.yml`

## Tài liệu tham khảo

- [Rasa Documentation](https://rasa.com/docs/)
- [Rasa SDK Documentation](https://rasa.com/docs/action-server/)
- [MongoDB Documentation](https://docs.mongodb.com/) 