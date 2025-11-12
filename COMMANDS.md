# 📋 Các Lệnh Quản Lý Ứng Dụng OCR

## 🚀 Khởi động ứng dụng

### 1. Khởi động Backend (Model + API Server)
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh start
```

Lệnh này sẽ:
- ✅ Khởi động Model Service (port 5000)
- ✅ Khởi động Node.js API Server (port 4000)
- Logs lưu tại:
  - Model: `/tmp/ocr-model-service.log`
  - API: `/tmp/ocr-node-server.log`

### 2. Khởi động Frontend
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
pnpm dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🛑 Dừng ứng dụng

### Dừng tất cả services
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh stop
```

### Hoặc dừng thủ công từng service:

#### Dừng Model Service và Node Server
```bash
killall -9 node python3
```

#### Dừng Frontend (trong terminal đang chạy pnpm dev)
Nhấn `Ctrl + C`

---

## 🔍 Kiểm tra trạng thái

### Kiểm tra backend có đang chạy không
```bash
# Kiểm tra API Server
curl http://localhost:4000/

# Kiểm tra Model Service
curl http://localhost:5000/health
```

### Xem logs
```bash
# Model Service log
tail -f /tmp/ocr-model-service.log

# Node API log
tail -f /tmp/ocr-node-server.log
```

### Xem process đang chạy
```bash
ps aux | grep -E "(node|python)" | grep -v grep
```

---

## 🔄 Khởi động lại toàn bộ

```bash
# Dừng tất cả
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh stop

# Đợi 2 giây
sleep 2

# Khởi động lại backend
./manage.sh start

# Đợi 5 giây cho services khởi động
sleep 5

# Khởi động frontend (terminal mới)
pnpm dev
```

---

## 🧪 Test RBAC (Role-Based Access Control)

```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
./test-rbac.sh
```

---

## 👤 Tài khoản test

### Admin
- Username: `testuser`
- Password: `admin123`
- Quyền: Toàn quyền (quản lý users, xem tất cả checks)

### Bank Staff
- Username: `staff01`
- Password: `staff123`
- Quyền: Xem tất cả checks, xem users (không tạo/xóa users)

### Regular User
- Username: `test`
- Password: `test123`
- Quyền: Chỉ xem checks của chính mình

---

## 🗄️ Database (PostgreSQL)

### Kết nối database
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d ocr_app
```

### Reset mật khẩu test users
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web/server
node scripts/reset-passwords.js
```

---

## 📦 Cài đặt dependencies (nếu cần)

### Frontend
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
pnpm install
```

### Backend (Node.js)
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web/server
pnpm install
```

### Model Service (Python)
```bash
cd /home/dunhiung/Desktop/APP/model
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 🎯 Workflow thông thường

**Mở ứng dụng:**
1. `cd /home/dunhiung/Desktop/APP/check-ocr-web`
2. `./manage.sh start` (backend)
3. `pnpm dev` (frontend - terminal mới)
4. Mở browser: `http://localhost:5173`

**Đóng ứng dụng:**
1. Nhấn `Ctrl+C` ở terminal frontend
2. `./manage.sh stop` (dừng backend)

---

## 🆘 Troubleshooting

### Port đã được sử dụng
```bash
# Tìm process đang dùng port
sudo lsof -i :4000  # API server
sudo lsof -i :5000  # Model service
sudo lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

### Backend không kết nối database
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Khởi động PostgreSQL
sudo systemctl start postgresql
```

### Xem log chi tiết khi có lỗi
```bash
tail -100 /tmp/ocr-model-service.log
tail -100 /tmp/ocr-node-server.log
```
