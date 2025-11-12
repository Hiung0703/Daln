PROJECT SYNC TEMPLATE — FOR CO-PILOT / DEV TEAM (Tiếng Việt)

## Tóm tắt ngắn (1-2 dòng)
Mục tiêu: Cung cấp endpoint `/service` để backend của app gửi ảnh cheque và nhận JSON đã trích xuất; không sửa model, chỉ build forwarder/connector và helper cho app.

Trạng thái hiện tại: file thay đổi sẵn trong repo: `main.py` (CLI + function trả dict + JSON export), `MODEL_API_SPEC.md` (spec), `server.py` (Flask forwarder), `sample_predict_test.sh` (curl test). Model nằm ngoài thay đổi này.

---

## Hiện trạng mã & môi trường (what's in repo now)
- `main.py` — script inference, có:
  - `process_job(job, save_to_file=True)` -> trả dict kết quả (parsed).
  - `main(jobs_list=None, save_to_file=True)` -> trả list dict.
  - CLI: `--image-path`, `--dataset-index`, `--output-dir`.
- `MODEL_API_SPEC.md` — spec API bằng Tiếng Việt (payload, errors, mapping, acceptance).
- `server.py` — Flask forwarder: route `/api/scan` (POST), forward tới `MODEL_URL` theo `MODEL_PAYLOAD`.
- `sample_predict_test.sh` — script test mẫu cho forwarder + model direct.
- `outputs/` — nơi `main.py` ghi JSON kết quả (timestamped).
- Virtualenv dự án: `.venv` (python3.12).

---

## Mục tiêu chính (goal)
Backend app (node/python) có thể gọi `/api/scan` (forwarder) hoặc gọi `process_job()` trực tiếp để lấy JSON parsed.
Forwarder phải:
- Hỗ trợ `multipart/form-data` field `file` (ưu tiên).
- Hỗ trợ base64 JSON nếu `MODEL_PAYLOAD=base64`.
- Forward `Authorization` header hoặc `MODEL_AUTH`.
- Không sửa mô hình: chỉ forward request và xử lý đầu vào/đầu ra.

## Non-goals (không làm)
- Không thay đổi weights/config model.
- Không deploy model container hay chỉnh driver/CUDA.
- Không cố gắng copy virtualenv giữa máy.

---

## API contract tóm tắt (rút gọn)
- Model endpoint: `POST /predict`
- Request payloads:
  - `multipart/form-data` (field=`file`) OR
  - `application/json` `{ "image": "<base64>", "filename": "..." }`
- Forwarder endpoint: `POST /api/scan` (nhận file, forward theo `MODEL_PAYLOAD`)
- Response success: HTTP 200 + JSON flat: keys => `bank_name`, `cheque_date`, `payer_name`, `address`, `payee_name`, `memo`, `amt_in_figures`, `amt_in_words`, `routing_number`, `account_number`, `cheque_number`, `signature_present`
- Errors: 400 (bad request), 422 (unprocessable), 413 (too large), 500 (internal)

---

## Công việc dev cần làm (task list — TODO-ready)
1. Kiểm tra môi trường: xác nhận python venv có Flask + requests + Pillow (nếu cần)
   - Lệnh: `python -m pip install -r requirements.txt` (hoặc `pip install flask requests pillow`)
2. Chạy forwarder dev:
   - `MODEL_URL=http://localhost:5000/predict MODEL_PAYLOAD=multipart python server.py` (hoặc `./server.py` nếu có shebang)
3. Nếu model không chạy, tạm dùng mock model: `mock_model.py` (đã sẵn) hoặc tạo mock theo spec
4. Chạy test end-to-end:
   - `./sample_predict_test.sh /tmp/cheque_demo.jpg`
5. Tích hợp vào backend app:
   - Option A (in-process): import `main.process_job` hoặc `main.main` (cần cùng venv & access model files)
   - Option B (service): backend gọi POST `/api/scan` forwarder (khuyên dùng)
6. Thêm validator/normalizer (optional): đảm bảo keys normalized (date->ISO, routing pad zeros)
7. Thêm unit test/CI step: chạy `sample_predict_test.sh` hoặc tương đương
8. Document (README) hướng dẫn deploy forwarder, env vars, và cách gọi

---

## Mẫu ENV variables (đặt trước khi start)
```
MODEL_URL=http://localhost:5000/predict
MODEL_PAYLOAD=multipart # or base64
MODEL_FIELD_NAME=file
MODEL_AUTH="Bearer ..." # optional
JSON_OUTPUT_DIR=./outputs
PORT=4000 # forwarder port
```

---

## Lệnh chạy nhanh (copy/paste)
- Cài deps (venv):
```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```
- Chạy mock model (nếu model chưa sẵn):
```bash
python mock_model.py
```
- Chạy forwarder:
```bash
MODEL_URL=http://localhost:5000/predict MODEL_PAYLOAD=multipart python server.py
```
- Test từ backend (curl):
```bash
curl -v -F "file=@/path/to/cheque.jpg" http://localhost:4000/api/scan
```
- Chạy main demo:
```bash
python main.py --image-path /path/to/cheque.jpg --output-dir outputs
```

---

## Tiêu chí chấp nhận (Acceptance Criteria — kiểm tra khi xong)
- Khi gọi `POST /api/scan` với ảnh, backend trả HTTP 200 và body JSON có ít nhất keys được liệt kê trong mapping.
- Khi gọi `main.process_job(path, save_to_file=False)` trả dict có key `parsed` chứa các trường chính.
- Các lỗi xử lý đúng: missing file -> 400, image unparseable -> 422, model error -> 500.
- Test script `sample_predict_test.sh` chạy thành công (exit 0) khi mock/model chạy.
- Mapping: backend normalize chuyển `cheque_date` -> `date`, `amt_in_figures` -> `amount_numeric`, `amt_in_words` -> `amount_words`.

---

## Các file bạn/đội dev cần kiểm tra (quick list)
- `main.py` — đã chỉnh, cung cấp in-process function
- `server.py` — forwarder
- `MODEL_API_SPEC.md` — spec chính
- `sample_predict_test.sh` — test script
- `outputs` — nơi lưu file JSON (kiểm tra file timestamped after runs)

---

## Truyền thông giữa bạn (owner) & copilot/dev team — mẫu message (copy/paste)
> Hi team, mình cần một forwarder HTTP cho model hiện có. Yêu cầu: nhận ảnh từ backend app, forward tới model theo `MODEL_PAYLOAD` (multipart|base64), trả JSON flat chứa các trường bank_name, cheque_date, payer_name, ... Xem `README_FORWARDER.md` trong repo để có spec, test script và kịch bản chạy. Nếu cần, dùng mock model `mock_model.py` để dev. Mục tiêu: không sửa model, chỉ build connector. Thanks.

---

## Rollback & safety
Nếu cần revert các file tôi đã thêm, bạn có thể sử dụng git để checkout các file đã thay đổi hoặc reset commit.
(Chỉ chạy nếu bạn muốn hoàn tác.)

---

## Ghi chú vận hành & bảo mật
- Forwarder nên chạy behind auth/TLS nếu đưa ra public.
- Nếu production, dùng gunicorn/uWSGI + reverse proxy (nginx).
- Rate-limit uploads and virus/size scanning if public.

---

## Nếu bạn muốn tôi:
- Tạo file `README_FORWARDER.md` trong repo (đã tạo),
- Thêm unit test (`tests/test_forwarder.py`) dùng pytest + requests-mock,
- Hoặc chuẩn hoá output `parsed` thành schema JSON Schema và thêm validator — nói tôi sẽ làm.

