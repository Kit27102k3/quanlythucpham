# Hướng dẫn sử dụng MongoDB API Middleware

API Middleware này cung cấp các endpoints để truy cập MongoDB từ client mà không cần kết nối trực tiếp đến MongoDB. Đặc biệt hữu ích cho các ứng dụng di động.

## Base URL

```
https://your-server.com/api/db
```

## Xác thực

Tất cả các API endpoints (ngoại trừ `/status`) yêu cầu xác thực bằng JWT token.

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Để lấy JWT token, sử dụng API đăng nhập của hệ thống:

```
POST /api/auth/login
```

với body:

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Lưu ý:** Chỉ tài khoản có quyền `admin` hoặc `manager` mới có thể truy cập API này.

## Kiểm tra trạng thái kết nối

### GET /api/db/status

Kiểm tra trạng thái kết nối MongoDB. Endpoint này **không yêu cầu xác thực**.

**Response:**

```json
{
  "success": true,
  "status": "connected", // hoặc "disconnected"
  "readyState": 1, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  "timestamp": "2023-05-24T05:01:42.478Z"
}
```

## Truy vấn dữ liệu

### POST /api/db/query/:collection

Truy vấn dữ liệu từ một collection.

**Parameters:**
- `collection`: Tên collection (ví dụ: "products", "users", v.v.)

**Request Body:**

```json
{
  "query": { "category": "food" }, // MongoDB query
  "projection": { "name": 1, "price": 1 }, // Các field cần lấy
  "options": {}, // Các tùy chọn khác
  "limit": 20, // Số lượng kết quả tối đa (mặc định: 100)
  "skip": 0 // Số lượng bản ghi bỏ qua (mặc định: 0)
}
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    { "_id": "...", "name": "Product 1", "price": 100 },
    { "_id": "...", "name": "Product 2", "price": 200 }
  ]
}
```

## Lấy document theo ID

### GET /api/db/document/:collection/:id

Lấy một document theo ID.

**Parameters:**
- `collection`: Tên collection
- `id`: MongoDB ObjectId

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Product 1",
    "price": 100,
    // ... các field khác
  }
}
```

## Tạo document mới

### POST /api/db/document/:collection

Tạo một document mới trong collection.

**Parameters:**
- `collection`: Tên collection

**Request Body:**

```json
{
  "name": "New Product",
  "price": 150,
  "category": "food"
  // ... các field khác
}
```

**Response:**

```json
{
  "success": true,
  "insertedId": "...",
  "data": {
    "name": "New Product",
    "price": 150,
    "category": "food"
    // ... các field khác
  }
}
```

## Cập nhật document

### PUT /api/db/document/:collection/:id

Cập nhật một document theo ID.

**Parameters:**
- `collection`: Tên collection
- `id`: MongoDB ObjectId

**Request Body:**

```json
{
  "price": 180,
  "inStock": true
  // ... các field cần cập nhật
}
```

**Response:**

```json
{
  "success": true,
  "modifiedCount": 1,
  "matchedCount": 1
}
```

## Xóa document

### DELETE /api/db/document/:collection/:id

Xóa một document theo ID.

**Parameters:**
- `collection`: Tên collection
- `id`: MongoDB ObjectId

**Response:**

```json
{
  "success": true,
  "deletedCount": 1
}
```

## Đếm số lượng documents

### POST /api/db/count/:collection

Đếm số lượng documents trong một collection.

**Parameters:**
- `collection`: Tên collection

**Request Body:**

```json
{
  "query": { "category": "food" } // MongoDB query
}
```

**Response:**

```json
{
  "success": true,
  "count": 42
}
```

## Lấy danh sách collections

### GET /api/db/collections

Lấy danh sách tất cả collections trong database.

**Response:**

```json
{
  "success": true,
  "collections": ["products", "users", "orders", "categories"]
}
```

## Xử lý lỗi

Tất cả các endpoints đều trả về lỗi theo định dạng:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Các mã lỗi HTTP:
- `400`: Bad Request (dữ liệu không hợp lệ)
- `404`: Not Found (không tìm thấy document)
- `500`: Internal Server Error (lỗi server)
- `503`: Service Unavailable (MongoDB không khả dụng)

## Ví dụ sử dụng với Axios

```javascript
// Kiểm tra trạng thái kết nối
const checkStatus = async () => {
  const response = await axios.get('https://your-server.com/api/db/status');
  console.log(response.data);
};

// Truy vấn sản phẩm
const getProducts = async () => {
  const response = await axios.post('https://your-server.com/api/db/query/products', {
    query: { category: 'food' },
    limit: 20
  });
  console.log(response.data.data);
};

// Lấy chi tiết sản phẩm
const getProductDetails = async (productId) => {
  const response = await axios.get(`https://your-server.com/api/db/document/products/${productId}`);
  console.log(response.data.data);
};
```

## Bảo mật

API này nên được bảo vệ bằng xác thực và phân quyền. Hãy đảm bảo:
1. Sử dụng HTTPS
2. Thêm JWT hoặc API key vào header
3. Giới hạn quyền truy cập theo vai trò người dùng 