FROM node:18-alpine

WORKDIR /app

# Sao chép các file cấu hình
COPY package*.json ./
COPY babel.config.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Mở cổng
EXPOSE 8080

# Khởi động ứng dụng
CMD ["npm", "run", "start:prod"] 