DEV TODO (FOR DEV TEAM) — Forwarder / Model Integration (Tiếng Việt)

Mục tiêu
-------
Cung cấp connector/forwarder để backend của app gửi ảnh cheque và nhận lại JSON trích xuất từ model. Không thay đổi mô hình. Yêu cầu rõ ràng, TODO-ready cho dev thực hiện trong 3 lần trao đổi.

Tổng quan trạng thái hiện có
---------------------------
- Frontend: `src/pages/CheckApp.jsx` đã gọi `/api/scan` và có cơ chế normalize + lưu `meta.raw` + `meta.fields`.
- Backend: `server/index.js`, route `/api/scan` implemented (see `server/routes/scan.js`) — đã hỗ trợ multipart và base64, env-driven.
- DB (file-based): `server/lib/db.js` lưu `meta` và `parsed` summary.
- Docs: `README_FORWARDER.md` (spec) và `MODEL_API_SPEC.md` (nội dung mô tả model) có trong repo.

Môi trường & phụ thuộc
----------------------
- Node backend: ở `server/` (node, express). Start bằng `pnpm start` hoặc `node index.js`.
- Model: chạy ngoài repo (ví dụ `http://localhost:5000/predict`).
- Env vars quan trọng (forwarder):
  - MODEL_URL (required)
  - MODEL_PAYLOAD = multipart | base64 (default multipart)
  - MODEL_FIELD_NAME (default: file)
  - MODEL_AUTH (optional, ví dụ: "Bearer ...")
- Yêu cầu dev cài đặt (server): `axios`, `multer`, `form-data` (đã có trong `server/package.json`).

Giao tiếp 3 lần (3 exchanges) — kế hoạch deliverables
----------------------------------------------------
- Exchange 1 (Dev implement core):
  - Mục tiêu: Đảm bảo `server/routes/scan.js` implement forwarding theo env (multipart/base64/field name/auth).
  - Deliverable: code chạy, unit manual test bằng curl thành công (forwarder → model/mock).
  - Kiểm thử: chạy `curl -F "file=@path" http://localhost:4000/api/scan` → 200 + JSON.

- Exchange 2 (Normalization & persistence):
  - Mục tiêu: Nếu model trả nested hoặc tên khác, cập nhật mapping/normalizer (frontend `normalizeModelOutput` hoặc backend mapping) và đảm bảo `meta.raw`, `meta.fields`, `parsed` lưu đúng.
  - Deliverable: mapping table + small adapter (backend or frontend) và sample saved JSON in `server/data/db.json`.
  - Kiểm thử: upload qua UI/ curl, sau đó kiểm tra `server/data/db.json` tồn tại record có `meta.raw` và `parsed`.

- Exchange 3 (Tests, docs, CI):
  - Mục tiêu: Thêm test script và documentation, finalize acceptance criteria.
  - Deliverable: `server/mock_model.py` (optional), `server/scripts/test_forwarder.sh`, update `README_FORWARDER.md`, add simple CI step (optional).
  - Kiểm thử: chạy test script -> exit 0; run end-to-end via UI.

Task list (TODO-ready)
----------------------
1) Xác nhận model endpoint & payload (Dev Owner: Partner/Model team)  
   - Input: URL model, supported payload type (multipart | base64), required headers (API key / Bearer).  
   - Output: ENV values (MODEL_URL, MODEL_PAYLOAD, MODEL_AUTH) để dev chạy.  
   - Steps:
     1. Partner xác nhận mô hình chạy tại ví dụ: `http://localhost:5000/predict`.
     2. Xác nhận mô hình chấp nhận multipart `file` hay JSON base64 `{ image }`.
     3. Gửi 1-2 sample response JSON từ model (file `.json`) để dev mapping.
   - Command mẫu (partner test):
     - Multipart: `curl -v -F "file=@/path/to/cheque.jpg" http://localhost:5000/predict`
     - JSON base64: `b64=$(base64 -w0 /path/to/cheque.jpg); curl -v -H "Content-Type: application/json" -d '{"image":"'$b64'","filename":"cheque.jpg"}' http://localhost:5000/predict`
   - Acceptance: Model trả 200 + JSON có cấu trúc hoặc trường cần thiết (ví dụ `cheque_date` etc.).

2) Kiểm tra & fix forwarder (Dev Owner: Backend dev)  
   - Input: Repo hiện tại, `server/routes/scan.js` (phiên bản mới nhất), env vars.
   - Output: forwarder chạy local, có thể nhận multipart và JSON base64, forward đúng tới MODEL_URL.
   - Steps:
     1. Pull latest repo, cd server, `pnpm install`.
     2. Đặt env: `export MODEL_URL=...; export MODEL_PAYLOAD=multipart`.
     3. Start server: `node index.js`.
     4. Test multipart -> forwarder: `curl -v -F "file=@/tmp/cheque.jpg" http://localhost:4000/api/scan`.
     5. Test JSON base64 -> forwarder: `b64=...; curl -v -H "Content-Type: application/json" -d '{"image":"'$b64'"}' http://localhost:4000/api/scan`.
   - Command mẫu: như trên.
   - Acceptance: Forwarder trả HTTP 200 + JSON nội dung model trả; nếu model trả lỗi thì forwarder trả lỗi tương ứng.

3) Add support for MODEL_AUTH and MODEL_FIELD_NAME (Dev Owner: Backend dev)
   - Input: MODEL_AUTH value (string) and MODEL_FIELD_NAME (string) if model expects custom field.
   - Output: forwarder sử dụng MODEL_AUTH when calling model; uses MODEL_FIELD_NAME for multipart field.
   - Steps:
     1. Set env and restart server.
     2. Run same curl tests.
   - Commands:
     - `export MODEL_AUTH="Bearer <KEY>"`
     - `export MODEL_FIELD_NAME=image`
   - Acceptance: Model receives Authorization header and field name as expected.

4) Normalize model output (Dev Owner: Backend or Frontend dev — choose one)
   - Input: 1-3 sample model JSON outputs (may have variations), current frontend `normalizeModelOutput` code.
   - Output: a mapping function that converts model keys to frontend keys (`bank_name`, `date`, `payer_name`, `address`, `payee`, `memo`, `amount_numeric`, `amount_words`, `routing_number`, `account_number`, `check_number`, `signature_present`). Save mapping into code and add unit tests.
   - Steps:
     1. Gather model sample outputs.
     2. Implement mapping in `src/pages/CheckApp.jsx` or `server` (pick one; frontend currently normalizes).
     3. Add tests that given sample raw JSON -> normalized output object.
   - Command mẫu:
     - Run frontend dev and import model JSON to test UI: `pnpm run dev`.
   - Acceptance: Normalized object has expected keys and values; UI displays date/amount/account as expected.

5) Persist raw + normalized (Dev Owner: Backend dev)
   - Input: POST `/api/history` call from frontend (already implemented) containing meta: `{ fields, raw, image }`.
   - Output: `server/data/db.json` contains new history record with `meta` and `parsed` top-level.
   - Steps:
     1. Save via frontend or curl: `curl -X POST -H 'Content-Type: application/json' -d '{"content":"test","meta":{...}}' http://localhost:4000/api/history` with auth.
     2. Verify `parsed` exists in `server/data/db.json`.
   - Acceptance: saved history includes `meta.raw`, `meta.fields`, and `parsed`.

6) Add mock model + test script (Dev Owner: Any backend dev)
   - Input: sample mock server script `server/mock_model.py` (simple Flask) that returns sample JSON.
   - Output: script `server/scripts/test_forwarder.sh` that:
     - starts mock model,
     - calls forwarder with sample image,
     - asserts HTTP 200 and presence of expected keys,
     - exits 0 on success.
   - Steps:
     1. Implement `mock_model.py` with /predict endpoint, accept multipart and base64, return sample JSON.
     2. Implement `test_forwarder.sh` which starts mock (background), starts forwarder, runs curl tests, stops processes.
   - Command mẫu: `bash server/scripts/test_forwarder.sh /tmp/cheque_demo.jpg`
   - Acceptance: script exits 0 and prints success.

7) CI / automation (Optional, Dev Owner: DevOps)
   - Input: test script from #6.
   - Output: CI job that runs `server/scripts/test_forwarder.sh` on PR.
   - Steps:
     1. Add GitHub Actions workflow `ci/forwarder-test.yml` to run on PR with Python and Node.
   - Acceptance: CI passes on PR.

Testing matrix & edge cases
---------------------------
- Happy path: multipart -> model responds 200 JSON -> forwarder returns 200 and UI shows normalized fields.
- Base64 path: client sends base64 -> forwarder converts/sends -> same as above.
- Missing file or image: forwarder returns 400.
- Unparseable image: model returns 422 -> forwarder returns 422.
- Model down / timeout: forwarder returns 500 after timeout (120s configured). Consider setting a shorter timeout if needed.
- Large files: forwarder handles up to configured limit. If model rejects > X MB, test and return 413.

Acceptance criteria (chung)
--------------------------
- POST `/api/scan` with valid image returns HTTP 200 and body JSON that contains at least these keys (after normalize): `bank_name`, `date`, `payer_name`, `amount_numeric`, `routing_number`, `account_number`.
- `main.process_job(image_path, save_to_file=False)` returns a dict containing `parsed` with these fields.
- Error codes: missing payload -> 400; model parse failure -> 422; model server error -> 500.
- Test script `server/scripts/test_forwarder.sh` passes (exit 0).

Các lệnh chuẩn để chạy (copy/paste)
----------------------------------
# Server (forwarder)
cd server
export MODEL_URL=http://localhost:5000/predict
export MODEL_PAYLOAD=multipart
export MODEL_FIELD_NAME=file
export MODEL_AUTH="Bearer <KEY>" # nếu cần
node index.js

# Test forwarder -> model (multipart)
curl -v -F "file=@/path/to/cheque.jpg" http://localhost:4000/api/scan

# Test forwarder -> model (base64)
b64=$(base64 -w0 /path/to/cheque.jpg)
curl -v -H "Content-Type: application/json" -d '{"image":"'$b64'","filename":"cheque.jpg"}' http://localhost:4000/api/scan

# Test save history via API (requires auth token)
export TOKEN=<your_token>
curl -v -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"content":"Demo","meta":{"fields":{},"raw":{}}}' http://localhost:4000/api/history

Giao tiếp & mẫu message gửi cho partner/dev
-----------------------------------------
Sao chép mẫu này khi cần liên hệ fast:

"Hi team, để tích hợp model với app chúng tôi cần một HTTP endpoint `/predict` mà forwarder sẽ gọi. Vui lòng xác nhận: MODEL_URL, supported payload (multipart or base64), any auth header (MODEL_AUTH), and attach 1-3 sample JSON responses. Tôi đã lưu trong repo `README_FORWARDER.md` và `DEV_TODO.md`. Sau khi bạn confirm, chúng tôi sẽ chạy exchange-1 triển khai forwarder và test."

Rollback & an toàn
-------------------
- Nếu cần revert, dùng git để checkout các file đã thay đổi: `git checkout -- server/routes/scan.js server/lib/db.js src/pages/CheckApp.jsx README_FORWARDER.md DEV_TODO.md`.
- Không chạy forwarder public-facing mà không có TLS/auth.

Next steps tôi sẽ làm (chọn 1):
- Tạo `server/mock_model.py` + `server/scripts/test_forwarder.sh` và chạy test end-to-end.
- Hoặc chỉ gửi file này cho dev team để họ tiến hành (bạn sẽ quản lý các trao đổi tiếp theo).



