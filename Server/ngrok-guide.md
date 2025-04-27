# Hướng dẫn Sử dụng Ngrok với SePay Webhook

Tài liệu này hướng dẫn cách sử dụng Ngrok để test webhook SePay trên môi trường local.

## 📋 Tổng Quan

Khi phát triển tính năng thanh toán với SePay, bạn cần một URL public để SePay có thể gửi webhook callback. Ngrok giúp tạo một tunnel từ internet đến máy local của bạn.

## 🛠️ Cài đặt

### 1. Cài đặt Ngrok

- Tải và cài đặt Ngrok từ [https://ngrok.com/download](https://ngrok.com/download)
- Đăng ký tài khoản miễn phí và lấy authtoken
- Cấu hình authtoken:
  ```
  ngrok config add-authtoken YOUR_AUTHTOKEN
  ```

### 2. Cấu hình WebHook SePay

- **Tự động**: Sử dụng script đã cung cấp trong dự án
- **Thủ công**: Cập nhật URL webhook trong dashboard SePay

## 🚀 Các Bước Sử Dụng

### Cách 1: Sử dụng script tự động (Khuyến nghị)

1. **Khởi động Ngrok** (trong terminal riêng):
   ```
   ngrok http 8080
   ```

2. **Chạy server với ngrok-dev**:
   ```
   npm run ngrok-dev
   ```
   Script này sẽ:
   - Kiểm tra xem ngrok đã chạy chưa
   - Tự động lấy URL ngrok mới
   - Cập nhật webhook URL trong file .env
   - Khởi động server

### Cách 2: Các bước thủ công

1. **Khởi động Ngrok**:
   ```
   ngrok http 8080
   ```

2. **Cập nhật webhook URL**:
   ```
   npm run update-webhook
   ```

3. **Khởi động server**:
   ```
   npm run dev
   ```

## 🔍 Kiểm Tra Webhook

Để kiểm tra xem webhook có hoạt động không:

1. **Xem logs ngrok** tại địa chỉ: http://localhost:4040
2. **Kiểm tra logs server** khi có giao dịch từ SePay

## 🛠️ Xử Lý Sự Cố

### Webhook không được nhận

1. Kiểm tra xem ngrok có đang chạy không
2. Kiểm tra URL webhook trong SePay dashboard
3. Xem logs ngrok để xem request có đến không
4. Kiểm tra server có lắng nghe đúng route không

### Lỗi "tunnel not found"

1. Khởi động lại ngrok
2. Chạy lại `npm run update-webhook`

## 🔁 Mỗi khi khởi động lại Ngrok

Mỗi khi khởi động lại ngrok, URL sẽ thay đổi. Có hai cách để cập nhật:

1. **Tự động**: Chạy `npm run ngrok-dev` (khuyên dùng)
2. **Thủ công**: Sau khi khởi động ngrok, chạy `npm run update-webhook`

## ⚠️ Lưu ý

- Ngrok free có giới hạn về số lượng connections và thời gian sử dụng
- URL ngrok thay đổi mỗi khi khởi động lại (phiên bản miễn phí)
- Đảm bảo webhook URL trong SePay đúng với URL ngrok hiện tại

## 🌐 Liên kết hữu ích

- [Ngrok Documentation](https://ngrok.com/docs)
- [SePay API Documentation](https://docs.sepay.vn) 