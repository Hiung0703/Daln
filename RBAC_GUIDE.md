# 🔐 Hệ thống Phân quyền (RBAC)

## Tổng quan

Hệ thống Check OCR Web đã được tích hợp phân quyền với 3 roles:

| Role | Mô tả | Quyền hạn |
|------|-------|-----------|
| **admin** | Quản trị viên hệ thống | Toàn quyền quản lý users, checks, cài đặt hệ thống |
| **bank_staff** | Nhân viên ngân hàng | Xem & xử lý tất cả checks, xem danh sách users |
| **user** | Người dùng thông thường | Chỉ xem & quản lý checks của chính mình |

## Cài đặt

### 1. Chạy Migration

```bash
cd server
chmod +x run-migration.sh
./run-migration.sh
```

Migration sẽ:
- ✅ Thêm cột `role`, `email`, `full_name`, `is_active`, `last_login` vào bảng `users`
- ✅ Tạo bảng `permissions`
- ✅ Insert default permissions
- ✅ Tạo admin account mặc định
- ✅ Update existing users thành role 'user'

### 2. Restart Server

```bash
cd ..
./manage.sh restart
```

## Tài khoản mặc định

Sau khi chạy migration, sẽ có tài khoản admin:

```
Username: admin
Password: admin123
Role: admin
```

**⚠️ LƯU Ý:** Đổi password ngay sau lần đăng nhập đầu tiên!

## Chi tiết phân quyền

### Admin

**Quản lý Users:**
- ✅ Xem danh sách tất cả users
- ✅ Tạo user mới với bất kỳ role nào
- ✅ Cập nhật thông tin user (role, email, full_name, is_active)
- ✅ Kích hoạt/vô hiệu hóa tài khoản
- ✅ Xóa user
- ✅ Xem thống kê users

**Quản lý Checks:**
- ✅ Xem tất cả checks của mọi users
- ✅ Cập nhật/xóa bất kỳ check nào
- ✅ Xem history đầy đủ

**System:**
- ✅ Quản lý cài đặt hệ thống
- ✅ Xem logs
- ✅ Backup/restore

### Bank Staff

**Quản lý Checks:**
- ✅ Xem tất cả checks của mọi users
- ✅ Cập nhật checks (verify, approve)
- ✅ Xem history đầy đủ

**Users:**
- ✅ Xem danh sách users
- ✅ Xem thông tin chi tiết user
- ❌ Không thể tạo/xóa/thay đổi role

### User

**Quản lý Checks:**
- ✅ Upload & scan checks của mình
- ✅ Xem checks của mình
- ✅ Cập nhật/xóa checks của mình
- ❌ Không xem được checks của users khác

**Profile:**
- ✅ Xem thông tin cá nhân
- ✅ Cập nhật thông tin cá nhân (email, full_name)
- ✅ Đổi password
- ❌ Không thể thay đổi role

## API Endpoints

### Authentication

#### POST /api/auth/register
Đăng ký user mới (mặc định role = 'user')

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com"
  }'
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "newuser",
    "role": "user",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com"
  },
  "token": "eyJhbGci..."
}
```

#### POST /api/auth/login
Đăng nhập

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "fullName": "System Administrator",
    "email": "admin@checkocr.com"
  },
  "token": "eyJhbGci..."
}
```

### User Management (Admin only)

#### GET /api/users
Lấy danh sách tất cả users

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### POST /api/users
Tạo user mới (admin only)

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff01",
    "password": "staff123",
    "role": "bank_staff",
    "fullName": "Nhân viên A",
    "email": "staff01@bank.com"
  }'
```

#### PUT /api/users/:id
Cập nhật user

```bash
curl -X PUT http://localhost:4000/api/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "bank_staff",
    "isActive": true
  }'
```

#### DELETE /api/users/:id
Xóa user (admin only)

```bash
curl -X DELETE http://localhost:4000/api/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### History Management

#### GET /api/history
Lấy histories
- User: chỉ xem của mình
- Admin/Bank Staff: xem tất cả

```bash
curl http://localhost:4000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### 1. Lưu token với role

```javascript
// src/lib/api.js
export async function login(username, password) {
  const data = await callApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  // Lưu user info kèm role
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

### 2. Check role trong component

```javascript
// src/App.jsx
const user = getCurrentUser();
const isAdmin = user?.role === 'admin';
const isBankStaff = user?.role === 'bank_staff';
const isUser = user?.role === 'user';

// Hiển thị menu theo role
{isAdmin && (
  <Link to="/admin/users">Quản lý Users</Link>
)}

{(isAdmin || isBankStaff) && (
  <Link to="/all-checks">Tất cả Checks</Link>
)}
```

### 3. Protected Route

```javascript
// src/components/ProtectedRoute.jsx
export function ProtectedRoute({ children, allowedRoles }) {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/signin" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div>Bạn không có quyền truy cập trang này</div>;
  }
  
  return children;
}

// Usage:
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>
```

## Testing

### 1. Test với curl

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Create bank staff
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff01",
    "password": "staff123",
    "role": "bank_staff",
    "fullName": "Nhân viên ngân hàng A"
  }'

# List all users
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Test permission

```bash
# Login as regular user
USER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  | jq -r '.token')

# Try to access admin endpoint (should fail)
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $USER_TOKEN"
# Expected: {"error":"Forbidden","message":"Access denied..."}
```

## Security Best Practices

1. **Đổi password admin mặc định ngay**
2. **Sử dụng JWT_SECRET mạnh trong production**
3. **Token expiry:** Hiện tại là 7 days, có thể giảm xuống
4. **HTTPS:** Bắt buộc trong production
5. **Rate limiting:** Thêm để chống brute force
6. **Audit logs:** Log mọi thao tác của admin/staff

## Migration Rollback

Nếu cần rollback:

```bash
cd server
node -e "
const { removeRoleSystem } = require('./migrations/add_roles');
removeRoleSystem().then(() => {
  console.log('Rollback completed');
  process.exit(0);
}).catch(err => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
"
```

## Troubleshooting

### Lỗi "column role does not exist"
→ Chưa chạy migration. Run: `./run-migration.sh`

### Admin không login được
→ Check password: `admin123` (mặc định)
→ Check database: `SELECT * FROM users WHERE username='admin'`

### Permission denied
→ Check token có chứa role: `jwt.verify(token, JWT_SECRET)`
→ Check middleware order trong routes

### User không có role
→ Update: `UPDATE users SET role='user' WHERE role IS NULL`

---

**Created:** November 12, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
