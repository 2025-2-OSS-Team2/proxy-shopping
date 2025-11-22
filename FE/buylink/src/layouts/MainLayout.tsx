// src/layouts/MainLayout.tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 홈(/)일 때만 상단바에 버튼 보이게
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ 공통 Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* 로고 영역 */}
          <div
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <h1 className="text-base font-semibold text-[#111111]">바이링</h1>
          </div>

          {/* 🔹 홈에서만 보이는 주문내역 버튼 */}
          {isHome && (
            <button
              onClick={() => navigate("/orders")} // 👉 주문내역 페이지로 이동
              className="px-10 py-2 rounded-xl bg-gradient-to-r from-[#ffe788] to-[#ffcc4c] text-[#111111] text-sm font-semibold shadow-sm hover:brightness-95 transition"
            >
              주문내역 확인하기
            </button>
          )}
        </div>
      </header>

      {/* ✅ 페이지 내용 (라우터 children이 여기 렌더링됨) */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
