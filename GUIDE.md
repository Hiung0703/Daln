# 🏦 Check OCR Web - Hướng dẫn sử dụng

## ✅ Tính năng hoàn chỉnh

### Backend
- ✅ Flask Model Service (port 5000) - Wrap Qwen2-VL-2B OCR model
- ✅ Node.js API Gateway (port 4000) - REST API với authentication
- ✅ PostgreSQL database - Lưu user, history
- ✅ JWT authentication
- ✅ Image upload & processing (~20-30s per image)

### Frontend  
- ✅ React + Vite (port 5173)
- ✅ Đăng nhập/đăng ký
- ✅ Upload ảnh séc (drag & drop hoặc chọn file)
- ✅ Nhận diện tự động bằng AI với loading state
- ✅ Hiển thị kết quả trích xuất
- ✅ Lưu vào lịch sử
- ✅ Xem/sửa/xóa lịch sử

## 🚀 Khởi động hệ thống

### 1. Start backend services
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh start

# Đợi ~45s cho model load
./manage.sh status
```

### 2. Start frontend
```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web
pnpm dev
```

Truy cập: **http://localhost:5173/**

## 👤 Tài khoản test

**Username:** testuser  
**Password:** test123

Hoặc đăng ký tài khoản mới trực tiếp trên web.

## 📖 Workflow sử dụng

### 1. Đăng nhập
- Mở http://localhost:5173/
- Nhập username/password
- Hoặc click "Sign up" để tạo tài khoản mới

### 2. Upload ảnh séc
- **Cách 1:** Kéo thả ảnh vào vùng "Drop document here"
- **Cách 2:** Click "Select from device" để chọn file

### 3. Nhận diện tự động
- Sau khi chọn ảnh, hệ thống tự động:
  - Hiển thị preview ảnh bên trái
  - Gọi AI model để nhận diện (~20-30s)
  - Hiển thị loading spinner: "🔄 Đang nhận diện bằng AI..."
  - Tự động điền kết quả vào các trường bên phải

### 4. Xem & chỉnh sửa kết quả
- **11 trường được nhận diện:**
  - 🏢 Ngân hàng phát hành (bank_name)
  - 📅 Ngày séc (cheque_date)
  - 👤 Người trả (payer_name)
  - 📍 Địa chỉ (address)
  - 👥 Người thụ hưởng (payee_name)
  - 📝 Ghi chú (memo)
  - 💵 Số tiền (số) (amt_in_figures)
  - 💬 Số tiền (chữ) (amt_in_words)
  - 🔢 Routing number
  - 🏦 Account number
  - 🎫 Check number

- Bạn có thể **chỉnh sửa** bất kỳ trường nào nếu cần

### 5. Lưu vào lịch sử
- Click nút ✅ để lưu
- Mục mới xuất hiện ở sidebar "Lịch sử tra cứu"

### 6. Quản lý lịch sử
- **Xem:** Click vào mục trong sidebar
- **Sửa:** Click icon ✏️ (edit)
- **Xóa:** Click icon 🗑️ (delete)

## 🛠️ Quản lý services

### Start/Stop/Restart
```bash
./manage.sh start    # Khởi động cả 2 services
./manage.sh stop     # Dừng cả 2 services
./manage.sh restart  # Restart cả 2 services
./manage.sh status   # Kiểm tra trạng thái
./manage.sh logs     # Xem logs
```

### Logs
```bash
# Model service logs
tail -f /tmp/ocr-model-service.log

# Node API logs
tail -f /tmp/ocr-node-server.log

# Frontend logs
tail -f /tmp/vite-dev.log
```

## 🧪 Test API trực tiếp

### Test với curl
```bash
./test-api.sh
```

### Test manual
```bash
# 1. Register/Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Scan image
curl -X POST http://localhost:4000/api/scan \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./input/image.jpg" \
  | python3 -m json.tool
```

## 📊 Hiệu năng

- **Model load time:** ~37-51s (chỉ lần đầu)
- **Processing time:** ~18-30s per image
- **First request:** Chậm hơn vì CUDA warmup
- **Subsequent requests:** Nhanh hơn (~18s)

## 🔧 Cấu hình

### Backend `.env` file
```bash
cd server
cat .env
```

```env
MODEL_URL=http://localhost:5000/predict
MODEL_PAYLOAD=multipart
MODEL_FIELD_NAME=file
PORT=4000
```

### Model service
```bash
# Port, model path
cd model-service/app
nano main.py  # Line 11-14
```

## ❌ Troubleshooting

### Services không start
```bash
# Kill processes và restart
./manage.sh stop
killall -9 python3 node
./manage.sh start
```

### Port đã được sử dụng
```bash
# Check ports
lsof -i :4000  # Node API
lsof -i :5000  # Model service
lsof -i :5173  # Frontend

# Kill specific port
lsof -ti:4000 | xargs kill -9
```

### Model không load
```bash
# Check CUDA
nvidia-smi

# Check logs
tail -50 /tmp/ocr-model-service.log

# Restart model service
./manage.sh stop
sleep 5
./manage.sh start
```

### Frontend không kết nối được backend
```bash
# Check CORS settings
curl http://localhost:4000/

# Check API_URL in frontend
grep API_URL src/lib/api.js
```

## 📁 Cấu trúc project

```
check-ocr-web/
├── src/                    # Frontend React code
│   ├── pages/CheckApp.jsx  # Main OCR page
│   ├── lib/api.js          # API calls
│   └── components/         # UI components
├── server/                 # Node.js API
│   ├── routes/scan.js      # Upload & scan endpoint
│   ├── routes/auth.js      # Authentication
│   └── routes/history.js   # History CRUD
├── model-service/          # Flask model wrapper
│   └── app/main.py         # OCR inference API
├── model/                  # AI model files
│   └── kaggle/working/Qwen2-VL-2B/
├── input/                  # Sample images
├── output/                 # OCR results
├── manage.sh               # Service management
└── test-api.sh             # API testing script
```

## 🎯 Kết quả mẫu

Với ảnh séc mẫu (`input/image.jpg`):

```json
{
  "payer_name": "Sharon Baldwin",
  "address": "0677 Michael Drives Apt. 893, West Derrick, MS 37716",
  "cheque_date": "2024-12-10",
  "payee_name": "Newton-Hughes",
  "memo": "Devolved stable application",
  "amt_in_figures": "970.74",
  "amt_in_words": "Nine Hundred And Seventy Dollars and 74/100",
  "routing_number": 13843300,
  "account_number": 90085445931,
  "cheque_number": 124277,
  "bank_name": "JP Morgan Chase & Co."
}
```

## 📝 Notes

- Model sử dụng GPU (RTX 3060 6GB VRAM)
- Hỗ trợ ảnh JPG, PNG
- Kết quả lưu vào PostgreSQL
- Có thể chỉnh sửa kết quả trước khi lưu
- History được đồng bộ với database

---

**🎉 Chúc bạn sử dụng thành công!**

Nếu có vấn đề, xem logs hoặc chạy `./manage.sh status` để kiểm tra.
