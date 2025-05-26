# Hướng dẫn chạy ứng dụng với Docker

## Yêu cầu
- Docker
- Docker Compose

## Cách chạy

### 1. Build và chạy container

```bash
docker-compose up --build
```

Lệnh này sẽ build image và chạy container theo cấu hình trong file docker-compose.yml.

### 2. Chạy container ở chế độ nền

```bash
docker-compose up -d
```

### 3. Dừng container

```bash
docker-compose down
```

### 4. Xem logs

```bash
docker-compose logs -f
```

### 5. Truy cập ứng dụng

Sau khi chạy thành công, ứng dụng sẽ có thể truy cập tại:
- API Server: http://localhost:8080

## Cấu trúc Docker

- `Server/Dockerfile`: Cấu hình build image cho server Node.js
- `docker-compose.yml`: Cấu hình các dịch vụ (server)
- `Server/.dockerignore`: Danh sách các file/thư mục bị bỏ qua khi build image

## Lưu ý

- Các biến môi trường được lấy từ file `.env` trong thư mục `Server`
- MongoDB được kết nối thông qua biến môi trường `MONGODB_URI`
- Dữ liệu được lưu trong volume để đảm bảo tính liên tục khi container khởi động lại 