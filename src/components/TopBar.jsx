import { useState } from "react";
import { Kebab } from "./ui/Kebab.jsx";

export function TopBar({ auth, onSignIn, onProfile, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-16 border-b bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Professional Bank Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight">
                SecureBank
              </div>
              <div className="text-amber-400 text-xs font-medium tracking-wider">
                CHECK VERIFICATION
              </div>
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {auth && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                {auth.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-medium">{auth.username}</div>
                <div className="text-amber-400 text-xs capitalize">{auth.role || 'User'}</div>
              </div>
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={() => setOpen((s) => !s)}
              className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
            {open && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50">
                  {!auth && (
                    <button 
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-center gap-3" 
                      onClick={() => { setOpen(false); onSignIn(); }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                      </svg>
                      <span className="font-medium text-slate-700">Đăng nhập</span>
                    </button>
                  )}
                  {auth && (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-amber-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                            {auth.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{auth.username}</div>
                            <div className="text-xs text-amber-600 capitalize font-medium">{auth.role || 'User'}</div>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3" 
                        onClick={() => { setOpen(false); onProfile(); }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="text-slate-700">Thông tin tài khoản</span>
                      </button>
                      <button 
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 border-t" 
                        onClick={() => { setOpen(false); onSignOut(); }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                        <span className="text-red-600 font-medium">Đăng xuất</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
