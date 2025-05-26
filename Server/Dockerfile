FROM node:18-alpine

WORKDIR /app

# Sao chép các file cấu hình
COPY package*.json ./
COPY babel.config.json ./

# Cài đặt dependencies
RUN npm install
# Cài đặt nodemon toàn cục
RUN npm install -g nodemon

# Sao chép mã nguồn
COPY . .

# Sửa các lỗi cú pháp trong mã nguồn (nếu cần)
RUN find ./src -name "*.js" -exec sed -i 's/\([^:]\) *\n *? */\1 ? /g' {} \;
# Chuyển đổi optional chaining thành cú pháp thông thường
RUN find ./src -name "*.js" -exec sed -i 's/\([a-zA-Z0-9_]\+\)?\.\([a-zA-Z0-9_]\+\)/\1 \&\& \1.\2/g' {} \;
RUN find ./src -name "*.js" -exec sed -i 's/\([a-zA-Z0-9_]\+\)?\[\([^]]*\)\]/\1 \&\& \1[\2]/g' {} \;

# Build ứng dụng
RUN npm run build

# Mở cổng
EXPOSE 8080

# Khởi động ứng dụng không phụ thuộc vào cross-env
ENV NODE_ENV=production
CMD ["node", "./build/src/index.js"]