import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "../components/ui/Card.jsx";
import { Label, Input } from "../components/ui/Inputs.jsx";
import { Button, GhostButton } from "../components/ui/Buttons.jsx";
import { Toggle } from "../components/ui/Toggle.jsx";
import { fmtDate } from "../lib/format.js";
import { emptyFields } from "../lib/constants.js";
import { getHistory, addHistory, updateHistory, deleteHistory, scanImage } from "../lib/api.js";

// Fallback nếu môi trường không có crypto.randomUUID
const uid =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? () => crypto.randomUUID()
    : () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function CheckApp({ history, setHistory, user }) {
  // Load history from API on mount
  useEffect(() => {
    if (user) {
      console.log('Loading history for user:', user.username);
      getHistory()
        .then(data => {
          console.log('Loaded history:', data);
          setHistory(data);
        })
        .catch(err => {
          console.error('Failed to load history:', err);
        });
    }
  }, [user]);
  const fileInputRef = useRef(null);
  const [stage, setStage] = useState("idle"); // idle | review
  const [dragOver, setDragOver] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [fields, setFields] = useState(emptyFields);
  const [rawModel, setRawModel] = useState(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  
  // Thêm state cho tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all"); // all | payer | payee | check_number | bank | account | routing | amount
  const [dateFilter, setDateFilter] = useState("all"); // all | 1h | 6h | 12h | today | week | month

  // Sắp xếp và lọc lịch sử
  const visibleHistory = useMemo(() => {
    let filtered = [...history];
    
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h => {
        const fields = h.ocr_content?.fields || {};
        const payerName = fields.payer_name?.toLowerCase() || "";
        const payee = fields.payee?.toLowerCase() || "";
        const checkNumber = String(fields.check_number || "").toLowerCase();
        const bankName = fields.bank_name?.toLowerCase() || "";
        const accountNumber = String(fields.account_number || "").toLowerCase();
        const routingNumber = String(fields.routing_number || "").toLowerCase();
        const amountNumeric = String(fields.amount_numeric || "").toLowerCase();
        const amountWords = fields.amount_words?.toLowerCase() || "";
        const content = h.content?.toLowerCase() || "";
        
        // Tìm kiếm theo trường cụ thể hoặc tất cả
        if (searchField === "all") {
          return payerName.includes(query) || 
                 payee.includes(query) || 
                 checkNumber.includes(query) ||
                 bankName.includes(query) ||
                 accountNumber.includes(query) ||
                 routingNumber.includes(query) ||
                 amountNumeric.includes(query) ||
                 amountWords.includes(query) ||
                 content.includes(query);
        } else if (searchField === "payer") {
          return payerName.includes(query);
        } else if (searchField === "payee") {
          return payee.includes(query);
        } else if (searchField === "check_number") {
          return checkNumber.includes(query);
        } else if (searchField === "bank") {
          return bankName.includes(query);
        } else if (searchField === "account") {
          return accountNumber.includes(query);
        } else if (searchField === "routing") {
          return routingNumber.includes(query);
        } else if (searchField === "amount") {
          return amountNumeric.includes(query) || amountWords.includes(query);
        }
        
        return true;
      });
    }
    
    // Lọc theo thời gian
    if (dateFilter !== "all") {
      const now = new Date();
      
      filtered = filtered.filter(h => {
        const itemDate = new Date(h.created_at);
        const diffMs = now - itemDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        if (dateFilter === "1h") {
          return diffHours <= 1;
        } else if (dateFilter === "6h") {
          return diffHours <= 6;
        } else if (dateFilter === "12h") {
          return diffHours <= 12;
        } else if (dateFilter === "today") {
          return diffDays < 1;
        } else if (dateFilter === "week") {
          return diffDays <= 7;
        } else if (dateFilter === "month") {
          return diffDays <= 30;
        }
        return true;
      });
    }
    
    // Sắp xếp theo thời gian mới nhất
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [history, searchQuery, searchField, dateFilter]);

  async function handleFiles(fileList) {
    if (!user) {
      alert('Please sign in to process checks');
      return;
    }

    const file = fileList?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target.result;
      setImageSrc(imageSrc);
      setStage("review");

      // Call backend to scan image and return extracted JSON from model
      setLoadingExtract(true);
      (async () => {
        try {
          const modelResult = await scanImage(file);
          // Save raw model output for later (persist raw alongside normalized)
          setRawModel(modelResult);
          // Normalize model output into frontend's expected field names
          const normalized = normalizeModelOutput(modelResult);
          setFields(normalized);
        } catch (err) {
          console.error('Scan failed:', err);
          alert('Không thể nhận dạng ảnh: ' + (err.message || err));
        } finally {
          setLoadingExtract(false);
        }
      })();
    };
    reader.onerror = () => {
      alert('Error reading file');
      setLoadingExtract(false);
    };
    reader.readAsDataURL(file);

    // ❌ Không thêm mục “nháp” vào lịch sử tại đây
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer?.files);
  }
  function onSelectFile(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  async function saveToHistory() {
    if (!user) {
      alert('Please sign in to save history');
      return;
    }

    // Tạo nội dung hiển thị từ tên người rút hoặc người nhận
    const content = (fields?.payer_name && fields.payer_name.trim()) || 
                   (fields?.payee && fields.payee.trim()) ||
                   "Chưa có tên người rút";
    
    try {
      // Lưu vào API với đầy đủ thông tin: gửi cả normalized fields và raw model output
      const meta = {
        fields: fields,
        raw: rawModel,
        image: imageSrc,
      };
      const historyItem = await addHistory(content, meta);
      
      // Cập nhật state với dữ liệu mới
      setHistory((prev) => [historyItem, ...prev]);
      
      // Thông báo thành công
      alert("✅ Đã lưu thành công");
    } catch (err) {
      console.error('Failed to save history:', err);
      alert('Không thể lưu. Vui lòng thử lại.');
    }
  }

  // Normalize various model outputs into the app's field names
  function normalizeModelOutput(raw = {}) {
    // Start from empty template to ensure keys exist
    const out = { ...emptyFields };
    // Map common variants
    out.bank_name = raw.bank_name || raw.bank || out.bank_name;
    out.date = raw.cheque_date || raw.chequeDate || raw.date || out.date;
    out.payer_name = raw.payer_name || raw.payer || out.payer_name;
    out.address = raw.address || out.address;
    out.payee = raw.payee_name || raw.payee || out.payee;
    out.memo = raw.memo || out.memo;
    out.amount_numeric = raw.amt_in_figures || raw.amount_numeric || raw.amount || out.amount_numeric;
    out.amount_words = raw.amt_in_words || raw.amount_words || out.amount_words;
    out.routing_number = raw.routing_number || (raw.routing && String(raw.routing).replace(/[^\d]/g, '')) || out.routing_number;
    out.account_number = raw.account_number ? String(raw.account_number) : out.account_number;
    out.check_number = raw.cheque_number || raw.chequeNo || raw.check_number || out.check_number;
    // signature_present left as-is if provided
    if (typeof raw.signature_present !== 'undefined') out.signature_present = raw.signature_present;
    return out;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-8">
      {/* Left Sidebar: Upload History */}
      <aside className="w-80 shrink-0">
        <Card className="shadow-xl border-slate-200">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span className="text-slate-800 font-bold">Lịch sử tra cứu</span>
              </div>
            }
            right={
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                {visibleHistory.length}/{history.length}
              </span>
            }
          />
          <CardBody className="p-0">
            {/* Thanh tìm kiếm và lọc */}
            <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 space-y-3">
              {/* Ô tìm kiếm */}
              <div className="relative">
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder={
                    searchField === "all" ? "Tìm kiếm séc..." :
                    searchField === "payer" ? "Tìm người rút..." :
                    searchField === "payee" ? "Tìm người nhận..." :
                    searchField === "check_number" ? "Tìm số séc..." :
                    searchField === "bank" ? "Tìm ngân hàng..." :
                    searchField === "account" ? "Tìm số TK..." :
                    searchField === "routing" ? "Tìm routing..." :
                    "Tìm số tiền..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Bộ lọc nhỏ gọn */}
              <div className="flex gap-2">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-medium border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                >
                  <option value="all">📋 Tất cả</option>
                  <option value="payer">👤 Người rút</option>
                  <option value="payee">🏢 Người nhận</option>
                  <option value="check_number">🔢 Số séc</option>
                  <option value="bank">🏦 Ngân hàng</option>
                  <option value="account">💳 Số TK</option>
                  <option value="routing">🔐 Routing</option>
                  <option value="amount">💰 Số tiền</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-medium border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                >
                  <option value="all">⏰ Tất cả</option>
                  <option value="1h">1 giờ</option>
                  <option value="6h">6 giờ</option>
                  <option value="12h">12 giờ</option>
                  <option value="today">24 giờ</option>
                  <option value="week">7 ngày</option>
                  <option value="month">30 ngày</option>
                </select>
              </div>
            </div>
            
            {visibleHistory.length === 0 ? (
              <div className="p-6 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-300 mb-3">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p className="text-sm font-medium text-slate-400">
                  {searchQuery || dateFilter !== "all" 
                    ? "Không tìm thấy kết quả" 
                    : "Chưa có lịch sử"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visibleHistory.map((h) => (
                  <li
                    key={h.id}
                    className="p-4 hover:bg-gradient-to-r hover:from-amber-50 hover:to-blue-50 cursor-pointer transition-all border-l-4 border-transparent hover:border-amber-500"
                    onClick={() => {
                      setStage("review");
                      // Sử dụng fields từ ocr_content
                      setFields(h.ocr_content?.fields || emptyFields);
                      // Sử dụng ảnh từ ocr_content
                      setImageSrc(h.ocr_content?.image || null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-sm ring-1 ring-slate-200">
                        {h.ocr_content?.image ? (
                          <img
                            src={h.ocr_content.image}
                            className="object-cover h-full w-full"
                            alt="Check thumbnail"
                          />
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-slate-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {(h.ocr_content?.fields?.payer_name &&
                            h.ocr_content.fields.payer_name.trim()) ||
                            h.content ||
                            "Chưa có tên người rút"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {fmtDate(h.created_at)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newContent = prompt("Nhập nội dung mới:", h.content);
                            if (newContent != null) {
                              updateHistory(h.id, newContent, h.ocr_content)
                                .then(() => {
                                  setHistory(prev => prev.map(item => 
                                    item.id === h.id 
                                      ? { ...item, content: newContent }
                                      : item
                                  ));
                                })
                                .catch(err => {
                                  console.error('Failed to update history:', err);
                                  alert('Không thể cập nhật. Vui lòng thử lại.');
                                });
                            }
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sửa"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Bạn có chắc muốn xóa séc này không?")) {
                              deleteHistory(h.id)
                                .then(() => {
                                  setHistory(prev => prev.filter(item => item.id !== h.id));
                                })
                                .catch(err => {
                                  console.error('Failed to delete history:', err);
                                  alert('Không thể xóa. Vui lòng thử lại.');
                                });
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </aside>

      {/* Main Area */}
      <main className="flex-1">
        {stage === "idle" ? (
          <Card className="h-[70vh] flex items-center justify-center shadow-xl border-slate-200 bg-gradient-to-br from-white to-blue-50">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={
                "border-3 border-dashed rounded-2xl p-12 text-center max-w-2xl w-full transition-all " +
                (dragOver
                  ? "border-amber-400 bg-amber-50 shadow-2xl scale-105"
                  : "border-slate-300 bg-white shadow-lg hover:shadow-xl hover:border-amber-300")
              }
            >
              <div className="flex flex-col items-center gap-6">
                {/* Icon */}
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-slate-800 mb-2">
                    Tải lên séc ngân hàng
                  </div>
                  <div className="text-slate-500">
                    Kéo thả file vào đây hoặc click để chọn
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full max-w-xs">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs text-slate-400 font-medium">HOẶC</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Chọn file từ máy tính
                </Button>
                
                <div className="text-xs text-slate-400 mt-2">
                  Hỗ trợ: JPG, PNG, PDF • Tối đa 10MB
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={onSelectFile}
                />
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original image */}
            <Card className="h-[70vh] flex flex-col shadow-xl border-slate-200">
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="text-slate-800 font-bold">Ảnh séc gốc</span>
                  </div>
                }
                right={
                  <GhostButton 
                    onClick={() => setStage("idle")}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Tải ảnh khác
                  </GhostButton>
                }
              />
              <CardBody className="flex-1 overflow-auto flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-slate-300 mb-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <div className="text-sm text-slate-400">Chưa có ảnh</div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Right: Fields */}
            <Card className="h-[70vh] flex flex-col shadow-xl border-slate-200">
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span className="text-slate-800 font-bold">Thông tin trích xuất</span>
                  </div>
                }
                right={
                  loadingExtract ? (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-xs font-semibold">
                        Đang nhận dạng AI...
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      ✅ Hoàn tất
                    </span>
                  )
                }
              />
              <CardBody className="flex-1 overflow-auto space-y-4">
                {/* Bank + Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ngân hàng phát hành</Label>
                    <Input
                      value={fields.bank_name}
                      onChange={(e) =>
                        setFields({ ...fields, bank_name: e.target.value })
                      }
                      placeholder="ACME Bank"
                    />
                  </div>
                  <div>
                    <Label>Ngày séc / Cheque date</Label>
                    <Input
                      type="date"
                      value={fields.date}
                      onChange={(e) =>
                        setFields({ ...fields, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Payer + Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Payer name</Label>
                    <Input
                      value={fields.payer_name}
                      onChange={(e) =>
                        setFields({ ...fields, payer_name: e.target.value })
                      }
                      placeholder="Joseph Cooper"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={fields.address}
                      onChange={(e) =>
                        setFields({ ...fields, address: e.target.value })
                      }
                      placeholder="3714 Darlene Ports, Port Davidton, CT 31205"
                    />
                  </div>
                </div>

                {/* Payee + Memo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Payee name</Label>
                    <Input
                      value={fields.payee}
                      onChange={(e) =>
                        setFields({ ...fields, payee: e.target.value })
                      }
                      placeholder="Cortez Inc"
                    />
                  </div>
                  <div>
                    <Label>Ghi chú (Memo)</Label>
                    <Input
                      value={fields.memo}
                      onChange={(e) =>
                        setFields({ ...fields, memo: e.target.value })
                      }
                      placeholder="Front-line 5thgeneration hierarchy"
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Số tiền (số) / Amount in figures</Label>
                    <Input
                      inputMode="decimal"
                      value={fields.amount_numeric}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          amount_numeric: e.target.value,
                        })
                      }
                      placeholder="5992.90"
                    />
                  </div>
                  <div>
                    <Label>Số tiền (chữ) / Amount in words</Label>
                    <Input
                      value={fields.amount_words}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          amount_words: e.target.value,
                        })
                      }
                      placeholder="Five Thousand, Nine Hundred And Ninety-Two Dollars and 90/100"
                    />
                  </div>
                </div>

                {/* MICR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Routing number (ABA)</Label>
                    <Input
                      value={fields.routing_number}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          routing_number: e.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, 9),
                        })
                      }
                      placeholder="9 digits"
                    />
                  </div>
                  <div>
                    <Label>Account number</Label>
                    <Input
                      value={fields.account_number}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          account_number: e.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, 17),
                        })
                      }
                      placeholder="7741488526"
                    />
                  </div>
                  <div>
                    <Label>Check #</Label>
                    <Input
                      value={fields.check_number}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          check_number: e.target.value
                            .replace(/[^\d]/g, "")
                            .slice(0, 8),
                        })
                      }
                      placeholder="5688562"
                    />
                  </div>
                </div>

                {/* Signature */}
                <div className="flex items-center gap-3 pt-2">
                  <Toggle
                    checked={fields.signature_present}
                    onChange={(v) =>
                      setFields({ ...fields, signature_present: v })
                    }
                  />
                  <span className="text-sm">Chữ ký hiện diện</span>
                </div>
              </CardBody>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gradient-to-r from-slate-50 to-blue-50 rounded-b-2xl flex items-center justify-between">
                <div className="text-sm">
                  {loadingExtract ? (
                    <span className="text-blue-600 font-semibold flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Đang nhận diện bằng AI... (~20-30s)
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 text-amber-600">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Xác nhận thông tin và nhấn lưu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <GhostButton 
                    onClick={() => setFields(emptyFields)}
                    disabled={loadingExtract}
                    className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Xóa tất cả
                  </GhostButton>
                  <Button
                    onClick={saveToHistory}
                    disabled={loadingExtract}
                    aria-label="Lưu vào lịch sử"
                    title="Lưu vào lịch sử"
                    className="px-6 py-2.5 font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline mr-1.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Lưu séc
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom uploader (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onSelectFile}
      />
      </div>
    </div>
  );
}
