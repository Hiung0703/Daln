# 🔧 Troubleshooting - Web đang tải mãi

## Vấn đề
React app mở http://localhost:5173/ nhưng đang loading mãi không hiển thị gì.

## Nguyên nhân có thể

### 1. Backend không chạy
```bash
# Check
curl http://localhost:4000/
curl http://localhost:5000/heae_date": "2026-11-13"
      },
      {
        "payee_name": "Solis Ltd"
      },
      {
        "memo": "Exclusive stable neural-net"
      },
      {
        "amt_in_figures": "8452.9"
      },
      {
        "amt_in_words": "Eight Thousand, Four Hundred And Fifty-Two Dollars and 90/100"
      },
      {
        "routing_number": 78495758
      },
      {
        "account_number": 73319068211
      },
      {
        "cheque_number": 951624lth

# Fix
./manage.sh restart
```

### 2. Frontend có lỗi JavaScript
```bash
# Check logs
tail -50 /tmp/vite-dev.log

# Mở browser console (F12) xem lỗi
```

### 3. Database không kết nối
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check connection
psql -U postgres -d ocr_app -c "SELECT 1"
```

### 4. CORS hoặc API call bị block
Mở browser console (F12) → Network tab → xem requests nào bị failed

## Giải pháp nhanh

### Option 1: Restart toàn bộ
```bash
./full-restart.sh
```

### Option 2: Restart từng service
```bash
# Stop all
./manage.sh stop
killall -9 node python3

# Start backend
./manage.sh start
sleep 45  # Đợi model load

# Start frontend (terminal mới)
pnpm dev
```

### Option 3: Dùng trang test đơn giản
```bash
# Mở file HTML trực tiếp (không cần React)
xdg-open test-simple.html

# Hoặc
xdg-open test-upload.html
```

## Debug steps

### 1. Check tất cả services đang chạy
```bash
./manage.sh status
lsof -i :4000  # Node API
lsof -i :5000  # Model Service  
lsof -i :5173  # Frontend
```

### 2. Test API trực tiếp
```bash
# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Test history (cần token)
TOKEN="your-token-here"
curl http://localhost:4000/api/history \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Check browser console
1. Mở http://localhost:5173/
2. Nhấn **F12** để mở DevTools
3. Tab **Console** → xem có lỗi đỏ gì
4. Tab **Network** → xem requests nào failed

### 4. Check Vite logs
```bash
tail -100 /tmp/vite-dev.log | grep -i error
```

## Các lỗi thường gặp

### ❌ "Failed to fetch" / "Network error"
**Nguyên nhân:** Backend không chạy hoặc CORS  
**Fix:**
```bash
./manage.sh restart
# Check CORS trong server/index.js
```

### ❌ "Cannot GET /api/..."
**Nguyên nhân:** Route không tồn tại  
**Fix:** Check server/routes/

### ❌ "401 Unauthorized"
**Nguyên nhân:** Token hết hạn hoặc invalid  
**Fix:**
```bash
# Clear localStorage trong browser console
localStorage.clear()
# Reload page và đăng nhập lại
```

### ❌ White screen / Loading forever
**Nguyên nhân:** 
- API call getHistory() bị treo
- Database không response
- JavaScript error

**Fix:**
```bash
# 1. Check browser console errors
# 2. Check if DB is running
sudo systemctl status postgresql

# 3. Bypass history load - sửa tạm trong App.jsx
# Comment out getHistory() call để test
```

### ❌ "EADDRINUSE" (Port in use)
```bash
lsof -ti:5173 | xargs kill -9
lsof -ti:4000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

## Workaround: Dùng trang test HTML

Nếu React app không chạy được, dùng trang HTML đơn giản:

### test-simple.html
```bash
xdg-open /home/dunhiung/Desktop/APP/check-ocr-web/test-simple.html
```
- Không cần React
- Không cần authentication
- Test trực tiếp /api/scan endpoint

### test-upload.html
```bash
xdg-open /home/dunhiung/Desktop/APP/check-ocr-web/test-upload.html
```
- Giao diện đẹp hơn
- Drag & drop
- Hiển thị kết quả đầy đủ

## Files đã dọn dẹp

✅ Đã xóa các file không cần thiết:
- `ocr_processor.py` (duplicate, đã có trong model-service)
- `ocr_runner.py` (duplicate)
- `ocr_utils.py` (duplicate)
- `test_run.py` (không dùng)
- `__pycache__/` (cache)

## Checklist debug

- [ ] Backend services chạy: `./manage.sh status`
- [ ] Model đã load xong (~45s): `curl http://localhost:5000/health`
- [ ] Frontend Vite chạy: `lsof -i :5173`
- [ ] Browser console không có lỗi đỏ (F12)
- [ ] Network tab không có failed requests
- [ ] Database PostgreSQL running
- [ ] Có thể đăng nhập: testuser / test123

## Nếu vẫn không được

1. **Test API trực tiếp:**
   ```bash
   ./test-api.sh
   ```

2. **Dùng trang HTML test:**
   ```bash
   xdg-open test-simple.html
   ```

3. **Check toàn bộ logs:**
   ```bash
   tail -100 /tmp/ocr-model-service.log
   tail -100 /tmp/ocr-node-server.log
   tail -100 /tmp/vite-dev.log
   ```

4. **Fresh start:**
   ```bash
   killall -9 node python3
   rm /tmp/*.pid /tmp/*.log
   ./full-restart.sh
   ```

## Liên hệ support

Nếu vẫn gặp vấn đề, cung cấp:
1. Output của `./manage.sh status`
2. Browser console errors (F12)
3. Last 50 lines của `/tmp/vite-dev.log`
4. Test API result: `./test-api.sh`
