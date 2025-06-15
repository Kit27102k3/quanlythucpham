# Hướng dẫn sử dụng Supabase với Quản Lý Thực Phẩm

## Giới thiệu

Dự án Quản Lý Thực Phẩm sử dụng Supabase làm giải pháp dự phòng khi MongoDB không khả dụng. Khi MongoDB không thể kết nối, hệ thống sẽ tự động chuyển sang sử dụng Supabase.

## Cấu hình

1. Tạo tài khoản Supabase tại https://supabase.com
2. Tạo dự án mới
3. Cập nhật thông tin kết nối trong file `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

## Cấu trúc dữ liệu

Supabase sử dụng PostgreSQL làm cơ sở dữ liệu. Các bảng được tạo để phù hợp với schema MongoDB:

### Bảng products

```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  product_images TEXT[] DEFAULT '{}',
  product_category VARCHAR(100) NOT NULL,
  product_description TEXT[] DEFAULT '{}',
  product_brand VARCHAR(100),
  product_brand_id UUID,
  product_supplier VARCHAR(100),
  product_supplier_id UUID,
  branch_id UUID,
  product_status VARCHAR(50),
  product_discount DECIMAL(10, 2) DEFAULT 0,
  product_info TEXT,
  product_details TEXT,
  product_stock INTEGER DEFAULT 0,
  product_code VARCHAR(50),
  product_weight DECIMAL(10, 2) DEFAULT 0,
  product_promo_price DECIMAL(10, 2) DEFAULT 0,
  product_warranty INTEGER DEFAULT 0,
  product_origin VARCHAR(100),
  product_introduction TEXT,
  product_unit VARCHAR(50) DEFAULT 'gram',
  unit_options JSONB DEFAULT '[]',
  discount_start_date TIMESTAMP WITH TIME ZONE,
  discount_end_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  sold_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  num_of_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng users

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_image TEXT DEFAULT '',
  is_blocked BOOLEAN DEFAULT FALSE,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  facebook_id VARCHAR(100),
  google_id VARCHAR(100),
  auth_provider VARCHAR(20) DEFAULT 'local',
  addresses JSONB DEFAULT '[]',
  push_subscriptions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng orders

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  products JSONB DEFAULT '[]',
  total_amount DECIMAL(10, 2) NOT NULL,
  coupon JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_info JSONB,
  payment_method VARCHAR(50),
  order_code VARCHAR(50),
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  branch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng branches

```sql
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

Khi MongoDB không khả dụng, các API endpoint sau sẽ được sử dụng:

- `GET /api/supabase/products`: Lấy danh sách sản phẩm
- `GET /api/supabase/products/:id`: Lấy thông tin sản phẩm theo ID
- `GET /api/supabase/orders`: Lấy danh sách đơn hàng
- `GET /api/supabase/users/:id`: Lấy thông tin người dùng theo ID
- `GET /api/supabase/branches`: Lấy danh sách chi nhánh
- `POST /api/supabase/query`: Thực hiện truy vấn SQL tùy chỉnh

## Chuyển đổi dữ liệu

Dữ liệu từ Supabase được chuyển đổi sang định dạng MongoDB trước khi trả về cho client. Điều này đảm bảo tính nhất quán trong API response, ngay cả khi nguồn dữ liệu thay đổi.

## Kiểm tra trạng thái kết nối

Bạn có thể kiểm tra trạng thái kết nối bằng cách gọi API endpoint:

```
GET /health
```

Response sẽ chứa thông tin về trạng thái kết nối MongoDB và Supabase:

```json
{
  "status": "ok",
  "timestamp": "2023-06-15T12:34:56.789Z",
  "env": "production",
  "mongodb": {
    "status": 0,
    "statusText": "disconnected"
  },
  "supabase": {
    "status": true,
    "url": "configured"
  }
}
``` 