# 🚀 Quick Reference - Check OCR Web

## Start Everything

```bash
# Terminal 1: Backend services
cd /home/dunhiung/Desktop/APP/check-ocr-web
./manage.sh start
# Wait ~45s for model to load

# Terminal 2: Frontend
cd /home/dunhiung/Desktop/APP/check-ocr-web
pnpm dev

# Terminal 3: Open browser
xdg-open http://localhost:5173/
```

## Stop Everything

```bash
# Stop backend
./manage.sh stop

# Stop frontend
# Press Ctrl+C in Terminal 2

# Kill all (if needed)
killall -9 python3 node
```

## Login Info

```
URL: http://localhost:5173/
Username: testuser
Password: test123
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173/ | React web UI |
| Node API | http://localhost:4000/api | REST API gateway |
| Model Service | http://localhost:5000/predict | OCR inference |

## Quick Commands

```bash
# Check status
./manage.sh status

# View logs
./manage.sh logs

# Restart services
./manage.sh restart

# Test API
./test-api.sh

# Check GPU
nvidia-smi
```

## Workflow

1. **Login** → http://localhost:5173/
2. **Upload image** → Drag & drop or click "Select from device"
3. **Wait ~20-30s** → AI processing with loading spinner
4. **Review fields** → Auto-filled from OCR results
5. **Save** → Click ✅ button
6. **View history** → Left sidebar

## Troubleshooting

```bash
# Port conflicts
lsof -ti:4000 | xargs kill -9  # Kill Node
lsof -ti:5000 | xargs kill -9  # Kill Flask
lsof -ti:5173 | xargs kill -9  # Kill Vite

# Model not responding
tail -50 /tmp/ocr-model-service.log
./manage.sh restart

# Database issues
sudo systemctl status postgresql
```

## Files

| Path | Purpose |
|------|---------|
| `GUIDE.md` | Complete user guide |
| `SUMMARY.md` | Project overview |
| `README_OCR.md` | Technical docs |
| `manage.sh` | Service control |
| `test-api.sh` | API testing |
| `test-upload.html` | Standalone test |

## Key Metrics

- **Model startup**: ~40s
- **Processing**: ~20-30s/image
- **Accuracy**: 11 fields extracted
- **GPU**: RTX 3060 6GB

---

**Quick help**: `cat GUIDE.md` or `./manage.sh --help`
