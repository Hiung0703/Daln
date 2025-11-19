# 🏦 Check OCR Web Application

Ứng dụng web tự động trích xuất thông tin từ séc ngân hàng sử dụng AI OCR với Qwen2-VL model.

## ✨ Tính năng chính

- 🤖 **AI OCR**: Trích xuất tự động thông tin từ ảnh séc với Qwen2-VL-2B Vision-Language Model
- 🔐 **Phân quyền RBAC**: Hệ thống quản lý vai trò (Admin, Bank Staff, User)
- 🔍 **Tìm kiếm nâng cao**: Lọc lịch sử theo trường thông tin cụ thể và thời gian
- 💾 **Lưu trữ lịch sử**: Lưu tất cả kết quả OCR với metadata đầy đủ
- 📊 **Dashboard quản lý**: Giao diện thân thiện cho admin và nhân viên ngân hàng
- 🔒 **Xác thực JWT**: Bảo mật với JSON Web Token
- ⚡ **GPU Acceleration**: Hỗ trợ CUDA để tăng tốc xử lý OCR

---

## 🚀 Khởi Động Nhanh (Quick Start)

```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web

# Khởi động tất cả services
./start.sh

# Kiểm tra trạng thái
./status.sh

# Dừng hệ thống
./stop.sh
```

**📖 Chi tiết:** Xem [QUICK_START.md](QUICK_START.md) hoặc [STARTUP_GUIDE.md](STARTUP_GUIDE.md)

---

## 📋 Mục lục

- [Khởi động nhanh](#-khởi-động-nhanh-quick-start)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt từng bước](#cài-đặt-từng-bước)
- [Khởi động ứng dụng](#khởi-động-ứng-dụng)
- [Sử dụng ứng dụng](#sử-dụng-ứng-dụng)
- [API Documentation](#api-documentation)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Troubleshooting](#troubleshooting)

## 🔧 Yêu cầu hệ thống

### 1. Node.js và npm
- **Node.js** >= 16.x (khuyến nghị LTS 18.x hoặc 20.x)
- **npm** >= 8.x (đi kèm với Node.js)

**Cài đặt:**
```bash
# Kiểm tra phiên bản hiện tại
node --version
npm --version

# Nếu chưa có, tải từ: https://nodejs.org
# Chọn phiên bản LTS (Long Term Support)
```

### 2. PNPM Package Manager
- **PNPM** >= 8.x (nhanh hơn và tiết kiệm dung lượng hơn npm)

**Cài đặt PNPM:**

#### Windows
```powershell
# Qua npm
npm install -g pnpm

# Hoặc qua PowerShell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

#### macOS / Linux
```bash
# Qua npm
npm install -g pnpm

# Hoặc qua curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Sau khi cài đặt, thêm vào PATH (nếu cần)
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

**Kiểm tra cài đặt:**
```bash
pnpm --version
# Nên hiển thị: 8.x.x hoặc cao hơn
```

### 3. PostgreSQL Database
- **PostgreSQL** >= 12.x

**Cài đặt PostgreSQL:**

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (qua Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Windows
- Tải từ: https://www.postgresql.org/download/windows/
- Chạy installer và làm theo hướng dẫn

**Tạo database:**
```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Tạo database và user
CREATE DATABASE ocr_app;
CREATE USER ocr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ocr_app TO ocr_user;
\q
```

### 4. Python và AI Model (Tùy chọn)
- **Python** >= 3.8
- **CUDA** (nếu có GPU NVIDIA)

**Cài đặt Python dependencies:**
```bash
cd model
pip install -r requirements.txt
```

## 📦 Cài đặt từng bước

### Bước 1: Clone repository

```bash
# Clone project từ GitHub
git clone https://github.com/theha11/check-ocr-web.git

# Di chuyển vào thư mục project
cd check-ocr-web
```

### Bước 2: Cài đặt dependencies cho Frontend

```bash
# Từ thư mục gốc của project
pnpm install

# Kết quả mong đợi:
# ✓ Dependencies installed
# Packages: +XXX
```

### Bước 3: Cài đặt dependencies cho Backend

```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt packages
pnpm install

# Quay lại thư mục gốc
cd ..
```

### Bước 4: Cấu hình database

```bash
# Copy file cấu hình mẫu
cp server/config/database.js.example server/config/database.js

# Chỉnh sửa thông tin database
nano server/config/database.js
```

**Nội dung file `server/config/database.js`:**
```javascript
module.exports = {
  host: 'localhost',
  port: 5432,
  database: 'ocr_app',
  user: 'ocr_user',
  password: 'your_password'
};
```

### Bước 5: Chạy migrations

```bash
# Tạo bảng database
cd server
node migrations/run.js

# Kết quả mong đợi:
# ✅ Migration initial.js completed
# ✅ Migration add_roles.js completed
```

### Bước 6: Tạo tài khoản admin (Tùy chọn)

```bash
# Chạy script tạo user
node scripts/reset-passwords.js

# Tài khoản mặc định:
# - Admin: testuser / test123
# - Staff: staff01 / staff123  
# - User: test / test123
```

## 🚀 Khởi động ứng dụng

### Cách 1: Sử dụng script quản lý (Khuyến nghị)

```bash
# Từ thư mục gốc của project
./manage.sh start

# Kết quả:
# ✅ Model Service started (PID: XXXXX) on port 5000
# ✅ Node Server started (PID: XXXXX) on port 4000
```

**Khởi động Frontend (Terminal mới):**
```bash
pnpm dev

# Kết quả:
# VITE v5.x.x ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

**Truy cập ứng dụng:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- AI Model Service: http://localhost:5000

### Cách 2: Khởi động từng service riêng lẻ

**Terminal 1 - AI Model Service:**
```bash
cd model
python main.py

# Lưu ý: Service này cần GPU mạnh hoặc sẽ chạy chậm
```

**Terminal 2 - Backend API:**
```bash
cd server
node index.js

# Hoặc dùng nodemon để auto-reload:
npm install -g nodemon
nodemon index.js
```

**Terminal 3 - Frontend:**
```bash
# Từ thư mục gốc
pnpm dev
```

### Dừng ứng dụng

```bash
# Dừng tất cả services
./manage.sh stop

# Hoặc dừng từng service:
# - Nhấn Ctrl+C trong mỗi terminal
```

## 📖 Sử dụng ứng dụng

### Đăng nhập

1. Truy cập http://localhost:5173
2. Đăng nhập với tài khoản:
   - **Admin**: `testuser` / `test123`
   - **Staff**: `staff01` / `staff123`
   - **User**: `test` / `test123`

### Upload và xử lý séc

1. **Upload ảnh séc**: Kéo thả hoặc click để chọn file
2. **Trích xuất thông tin**: Click "Extract" để AI xử lý
3. **Xem kết quả**: Thông tin được điền tự động vào form
4. **Lưu lịch sử**: Click "Save" để lưu vào database
5. **Xem lịch sử**: Tất cả séc đã xử lý hiển thị ở sidebar trái

### Tìm kiếm và lọc

**Tìm kiếm theo trường:**
- Chọn loại tìm kiếm (Tất cả, Người rút, Người nhận, Số séc, v.v.)
- Nhập từ khóa vào ô tìm kiếm

**Lọc theo thời gian:**
- 1 giờ qua
- 6 giờ qua
- 12 giờ qua
- 24 giờ qua
- 7 ngày qua
- 30 ngày qua

### Quản lý người dùng (Chỉ Admin)

1. Truy cập: http://localhost:5173/#/admin
2. Xem danh sách users
3. Thêm/Sửa/Xóa tài khoản
4. Phân quyền (admin, bank_staff, user)

## 🔌 API Documentation

For a complete, code-accurate reference of all backend endpoints and RBAC, see `docs/BACKEND_API.md`.

### Authentication

**POST /api/auth/login**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "test",
    "role": "user",
    "fullName": "Test User"
  }
}
```

### History Management

**GET /api/history**
```bash
# Lấy danh sách lịch sử
curl -X GET http://localhost:4000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**POST /api/history**
```bash
# Lưu kết quả OCR mới
curl -X POST http://localhost:4000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check data",
    "meta": {
      "fields": {...},
      "image": "data:image/jpeg;base64,...",
      "raw": {...}
    }
  }'
```

**DELETE /api/history/:id**
```bash
# Xóa một mục lịch sử
curl -X DELETE http://localhost:4000/api/history/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### OCR Processing

**POST /api/scan**
```bash
# Upload và xử lý ảnh séc
curl -X POST http://localhost:5000/extract \
  -F "image=@check.jpg"

# Response:
{
  "check_number": 951624,
  "payer_name": "John Doe",
  "payee_name": "Jane Smith",
  "amount": "1000.00",
  "date": "2025-11-12",
  ...
}
```

## 📁 Cấu trúc dự án

```
check-ocr-web/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                   # UI components (Button, Card, Input...)
│   │   ├── TopBar.jsx            # Header navigation
│   │   └── HistoryItem.jsx       # History list item
│   ├── pages/                    # Page components
│   │   ├── CheckApp.jsx          # Main OCR page
│   │   └── AuthPages.jsx         # Login/Register pages
│   ├── lib/                      # Utilities
│   │   ├── api.js                # API client
│   │   ├── constants.js          # App constants
│   │   └── format.js             # Format helpers
│   └── hooks/                    # Custom React hooks
│       ├── useHashRoute.js       # Routing hook
│       └── useLocalState.js      # Local storage hook
├── server/                       # Backend source code
│   ├── index.js                  # Express server entry
│   ├── config/                   # Configuration files
│   │   └── database.js           # Database config
│   ├── models/                   # Database models
│   │   └── db.js                 # PostgreSQL queries
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Authentication routes
│   │   ├── history.js            # History CRUD routes
│   │   ├── users.js              # User management
│   │   └── scan.js               # OCR processing
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   └── rbac.js               # Role-based access control
│   ├── migrations/               # Database migrations
│   │   ├── initial.js            # Initial schema
│   │   ├── add_roles.js          # RBAC schema
│   │   └── run.js                # Migration runner
│   └── scripts/                  # Utility scripts
│       └── reset-passwords.js    # User setup script
├── model/                        # AI Model service
│   ├── main.py                   # Flask server
│   └── kaggle/working/           # Qwen2-VL model files
├── COMMANDS.md                   # Command reference
├── RBAC_GUIDE.md                 # RBAC documentation
├── manage.sh                     # Service management script
└── README.md                     # This file
```

## 🛠️ Troubleshooting

### 1. Port đã được sử dụng

**Lỗi:** `Error: listen EADDRINUSE: address already in use :::4000`

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :4000

# Kill process
kill -9 PID

# Hoặc dùng script
./manage.sh stop
```

### 2. Database connection failed

**Lỗi:** `Connection to PostgreSQL failed`

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Khởi động PostgreSQL
sudo systemctl start postgresql

# Kiểm tra thông tin kết nối trong server/config/database.js
```

### 3. AI Model chạy chậm

**Nguyên nhân:** Không có GPU hoặc GPU không đủ mạnh

**Giải pháp:**
```bash
# Option 1: Dùng CPU (chậm hơn)
cd model
CUDA_VISIBLE_DEVICES="" python main.py

# Option 2: Dùng GPU nhỏ hơn
# Giảm batch size trong model config

# Option 3: Dùng API cloud (khuyến nghị)
# Cấu hình MODEL_API_URL trong .env
```

### 4. Frontend không kết nối được backend

**Kiểm tra:**
```bash
# Test API endpoint
curl http://localhost:4000/health

# Kiểm tra CORS settings trong server/index.js
# Đảm bảo origin includes http://localhost:5173
```

### 5. Token hết hạn

**Lỗi:** `401 Unauthorized - Token expired`

**Giải pháp:**
- Đăng xuất và đăng nhập lại
- Token có thời hạn 24h (cấu hình trong `server/routes/auth.js`)

## 🔐 Bảo mật

- ✅ Password được hash với bcrypt
- ✅ JWT token cho authentication
- ✅ RBAC cho phân quyền
- ✅ Input validation
- ✅ SQL injection protection với pg-promise
- ✅ CORS configuration
- ⚠️ Chưa có HTTPS (nên dùng nginx/Apache làm reverse proxy cho production)

## 🚢 Deploy Production

### 1. Build Frontend
```bash
pnpm build

# Output: dist/ folder
```

### 2. Setup Environment Variables
```bash
# Tạo file .env trong server/
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_random_secret_key_here
MODEL_API_URL=http://ai-service:5000
```

### 3. Deploy với PM2
```bash
# Cài đặt PM2
npm install -g pm2

# Start services
pm2 start server/index.js --name "ocr-api"
pm2 start model/main.py --name "ocr-model" --interpreter python3

# Auto start on reboot
pm2 startup
pm2 save
```

### 4. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/check-ocr-web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Mở Pull Request

## 📧 Support

- GitHub Issues: https://github.com/theha11/check-ocr-web/issues
- Email: support@example.com

## 🙏 Acknowledgments

- Qwen2-VL Model by Alibaba
- React + Vite
- PostgreSQL
- Express.js

---

