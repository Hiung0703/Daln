# OCR Check Web - Hướng dẫn sử dụng

## Tổng quan
Hệ thống nhận diện thông tin séc (cheque) sử dụng AI model Qwen2-VL-2B với Unsloth.

## Kiến trúc
- **Frontend**: React (Vite)
- **Backend API**: Node.js + Express
- **Model Service**: Python Flask + Unsloth + PyTorch
- **Database**: JSON file (hoặc PostgreSQL)

## Cài đặt

### 1. Cài đặt dependencies

**Backend (Node.js)**:
```bash
cd server
npm install
```

**Model Service** (đã cài sẵn trong `/model/.venv`):
```bash
cd ../model
# Kiểm tra venv đã có:
.venv/bin/python --version
.venv/bin/pip list | grep -E "flask|torch|unsloth"
```

### 2. Cấu hình

File `server/.env`:
```
MODEL_URL=http://localhost:5000/predict
MODEL_PAYLOAD=multipart
MODEL_FIELD_NAME=file
PORT=4000
```

## Chạy hệ thống

### Cách 1: Sử dụng script quản lý (Khuyến nghị)

```bash
cd /home/dunhiung/Desktop/APP/check-ocr-web

# Khởi động tất cả services
./manage.sh start

# Xem trạng thái
./manage.sh status

# Xem logs
./manage.sh logs

# Dừng tất cả
./manage.sh stop
```

### Cách 2: Chạy thủ công

**Terminal 1 - Model Service**:
```bash
cd model-service/app
/home/dunhiung/Desktop/APP/model/.venv/bin/python main.py
```
⏱️ Lưu ý: Model service mất ~30-40s để load mô hình lần đầu.

**Terminal 2 - Node.js Server**:
```bash
cd server
npm start
```

**Terminal 3 - Frontend** (nếu chưa chạy):
```bash
cd check-ocr-web
npm run dev
```

## Sử dụng

### Qua giao diện web:
1. Mở trình duyệt: `http://localhost:3000`
2. Đăng nhập/Đăng ký
3. Bấm nút "Scan Check" hoặc "Add Image"
4. Chọn ảnh séc
5. Chờ ~30s (model xử lý)
6. Kết quả hiện trên màn hình

### Qua API:

**Upload ảnh**:
```bash
curl -X POST http://localhost:4000/api/scan \
  -F "file=@path/to/check.jpg"
```

**Response**:
```json
{
  "success": true,
  "filename": "check.jpg",
  "data": {
    "gt_parse": {
      "cheque_details": [
        {"payer_name": "Sharon Baldwin"},
        {"cheque_date": "2024-12-10"},
        {"amt_in_figures": "970.74"},
        ...
      ]
    }
  },
  "processing_time": 30.5
}
```

## Hiệu năng

- **Load model**: ~30-40s (chỉ 1 lần khi khởi động)
- **Xử lý mỗi ảnh**: ~30s
- **GPU**: NVIDIA RTX 3060 (6GB VRAM)
- **RAM**: ~4GB cho model

## Thư mục quan trọng

```
check-ocr-web/
├── server/                 # Node.js API server
│   ├── routes/scan.js     # API endpoint nhận ảnh
│   └── .env               # Cấu hình
├── model-service/         # Python Flask service
│   └── app/
│       ├── main.py        # Flask app + model logic
│       └── start.sh       # Script khởi động
├── model/                 # Model và training code
│   ├── main.py           # Script xử lý ảnh trực tiếp
│   ├── .venv/            # Python venv với dependencies
│   └── kaggle/working/   # Model weights
├── input/                # Thư mục chứa ảnh input
├── output/               # Thư mục lưu kết quả JSON
└── manage.sh            # Script quản lý services
```

## Troubleshooting

### Model service không khởi động
```bash
# Kiểm tra log
tail -f /tmp/ocr-model-service.log

# Kiểm tra model có tồn tại không
ls -la /home/dunhiung/Desktop/APP/model/kaggle/working/Qwen2-VL-2B/
```

### API trả về lỗi "Model error"
```bash
# Kiểm tra model service đang chạy
curl http://localhost:5000/health

# Restart model service
./manage.sh stop-model
./manage.sh start-model
```

### Xử lý chậm
- Đảm bảo đang dùng GPU (CUDA)
- Kiểm tra VRAM: `nvidia-smi`
- Giảm số ảnh xử lý đồng thời

## Development

### Test model trực tiếp (không qua API):
```bash
cd model
.venv/bin/python main.py

# Xử lý nhiều ảnh:
LIMIT=5 .venv/bin/python main.py
```

### Test API:
```bash
# Health check
curl http://localhost:5000/health

# Test với ảnh
curl -X POST http://localhost:4000/api/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@input/test.jpg"
```

## Tích hợp frontend

Frontend có thể gọi API endpoint:
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:4000/api/scan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.gt_parse.cheque_details);
```

## License
Private project
