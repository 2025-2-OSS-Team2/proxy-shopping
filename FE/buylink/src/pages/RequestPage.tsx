// src/pages/RequestPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LinkIcon, X } from "lucide-react";
import imgSpinner from "../assets/spinner.gif";
import { normalizeSoldOutFlags } from "../utils/soldOutHelper";

// 🔹 DEV/PROD 공통 API base URL
const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL ?? "" : "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

// --------------------------------------------------------
// 타입 정의
// --------------------------------------------------------
export type Product = {
  productURL: string;
  productName: string;
  productDescription: string;
  priceKRW: number;
  hasShippingFee: boolean;
  category: string;
  imageUrls: string[];
  isSoldOut: boolean;
  quantity: number; // 프론트 전용
};

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export default function RequestPage() {
  const navigate = useNavigate();

  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  // 🔹 선택 상태를 productURL 기반으로 관리
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --------------------------------------------------------
  // 🔗 실제 백엔드 /api/products/fetch
  // --------------------------------------------------------

  type ServerProduct = Omit<Product, "quantity">;

  // 1) 상품 정보 크롤링: POST /api/products/fetch
  // 1) 상품 정보 크롤링: POST /api/products/fetch
  const fetchProductFromServer = async (
    url: string
  ): Promise<ApiResponse<ServerProduct>> => {
    const finalUrl = buildApiUrl("/api/products/fetch");
    console.log("[fetchProductFromServer] DEV:", import.meta.env.DEV);
    console.log("[fetchProductFromServer] Final URL:", finalUrl);

    try {
      const res = await fetch(finalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      // 여기서 더 이상 throw 하지 말고,
      // 항상 ApiResponse 형태로 반환
      if (!res.ok) {
        let message = "상품 정보를 불러오는데 실패했습니다.";

        // 서버가 JSON으로 에러를 내려주는 경우를 최대한 활용
        try {
          const errBody = await res.json();
          if (errBody?.error && typeof errBody.error === "string") {
            message = errBody.error;
          } else if (errBody?.message && typeof errBody.message === "string") {
            message = errBody.message;
          }
        } catch {
          // response가 HTML(낫파운드 페이지)라서 json 파싱 실패해도 무시
        }

        return {
          success: false,
          data: null,
          error: message,
        };
      }

    // 정상 응답인 경우 그대로 JSON 파싱
    const json = (await res.json()) as ApiResponse<ServerProduct>;
    return json;
  } catch (e) {
    console.error("[fetchProductFromServer] network error:", e);
    // 네트워크 에러 등도 전부 success:false로 귀결
    return {
      success: false,
      data: null,
      error: "상품 정보를 불러오는데 실패했습니다.",
    };
  }
};

  // --------------------------------------------------------
  // URL 입력 후 “불러오기”
  // --------------------------------------------------------
  const handleLoadProduct = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);

    try {
      const url = urlInput.trim();

      // 1) 상품 크롤링 API 호출
      const fetchResult = await fetchProductFromServer(url);

      if (!fetchResult.success || !fetchResult.data) {
        // ✅ 어떤 에러든 여기서만 alert로 처리
        alert(fetchResult.error ?? "상품 정보를 불러오는데 실패했습니다.");
        return;
      }

      const newProduct: Product = {
        ...fetchResult.data,
        isSoldOut: fetchResult.data.isSoldOut ?? false,
        quantity: 1,
      };

      // 품절 규칙 재계산
      setProducts((prev) =>
        normalizeSoldOutFlags<Product>([...prev, newProduct])
      );
      setUrlInput("");
    } catch (e) {
      console.error(e);
      // try 블록 바깥에서 진짜 예상 못 한 에러만 잡기
      alert("상품 정보를 불러오는 중 알 수 없는 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------
  // 삭제 / 선택 토글
  // --------------------------------------------------------
  const handleDelete = (index: number) => {
    // 현재 렌더 기준으로 삭제 대상 productURL 구해두기
    const removed = products[index];

    setProducts((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // 🔁 삭제 후 품절 상태 재계산
      return normalizeSoldOutFlags<Product>(filtered);
    });

    if (removed) {
      // 삭제된 상품 URL 선택 해제
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(removed.productURL);
        return newSet;
      });
    }
  };

  const handleToggleSelect = (productURL: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(productURL) ? newSet.delete(productURL) : newSet.add(productURL);
      return newSet;
    });
  };

  // --------------------------------------------------------
  // 장바구니 담기 (localStorage 버전) → 서버 /api/cart 버전
  // --------------------------------------------------------
  const handleAddToCart = async () => {
    // 🔹 productURL 기반 선택 + 품절 제외
    const selectedProducts = products.filter(
      (p) => selectedIds.has(p.productURL) && !p.isSoldOut
    );

    if (selectedProducts.length === 0) {
      alert("장바구니에 담을 상품을 선택하세요!");
      return;
    }

    try {
      const finalUrl = buildApiUrl("/api/cart");
      console.log("[RequestPage] POST /api/cart (selected products):", finalUrl);

      // 선택된 상품들만 순차적으로 장바구니에 추가
      for (const p of selectedProducts) {
        const payload = {
          url: p.productURL,
          productName: p.productName,
          productDescription: p.productDescription,
          priceKRW: p.priceKRW,
          hasShippingFee: p.hasShippingFee,
          category: p.category,
          imageUrl: p.imageUrls[0] ?? "",
          imageUrls: p.imageUrls,
          isSoldOut: p.isSoldOut,
        };

        console.log("[RequestPage] POST /api/cart payload:", payload);

        const res = await fetch(finalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("장바구니 담기 실패");
        }

        const json = await res.json();
        console.log("[RequestPage] /api/cart response:", json);
      }

      // 모두 성공하면 장바구니 페이지로 이동
      navigate("/cart");
    } catch (e) {
      console.error("[RequestPage] handleAddToCart error:", e);
      alert("장바구니에 담는 중 문제가 발생했습니다.");
    }
  };

  // --------------------------------------------------------
  // UI 렌더링
  // --------------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 bg-white">
      <motion.div
        initial={{ y: "30vh", opacity: 0 }}
        animate={{
          y: products.length > 0 ? 0 : "30vh",
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        className="w-full max-w-2xl text-center"
      >
        <h1 className="text-2xl font-bold text-[#111111] mb-6">
          구매대행 요청하기
        </h1>

        {/* URL 입력 박스 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-300 p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold mb-4">상품 추가</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76776  ] w-4 h-4" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="상품 링크(URL)를 입력하세요"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DBDBDB]"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLoadProduct}
              disabled={!urlInput.trim() || isLoading}
              className="px-6 py-2.5 bg-[#ffe788] rounded-xl font-medium disabled:opacity-50"
            >
              {isLoading ? "불러오는 중..." : "불러오기"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 🔹 상품이 아직 없을 때: URL 박스 바로 아래에 스피너 */}
      {isLoading && products.length === 0 && (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center py-16 mt-60">
          <img src={imgSpinner} alt="loading" className="w-20" />
          <p className="mt-4 text-[#505050]">상품을 불러오고 있어요...</p>
        </div>
      )}

      {products.length > 0 && (
        <motion.div className="w-full max-w-2xl space-y-6 mt-4">
          {products.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white rounded-2xl shadow-md border p-5 space-y-4"
            >
              <div className="flex gap-4 items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.productURL)}
                  disabled={p.isSoldOut}
                  onChange={() => handleToggleSelect(p.productURL)}
                  className="w-5 h-5 accent-[#ffcc4c] disabled:opacity-40"
                />

                <div className="relative">
                  <img
                    src={p.imageUrls[0]}
                    alt={p.productName}
                    className={`w-20 h-20 rounded-lg object-cover ${
                      p.isSoldOut ? "grayscale opacity-60" : ""
                    }`}
                  />
                  {p.isSoldOut && (
                    <span className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm bg-black/40 rounded-lg">
                      품절
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium">{p.productName}</p>
                  <p className="text-sm text-[#555] mt-1 line-clamp-2">
                    {p.productDescription}
                  </p>
                  <p className="font-semibold mt-1">
                    {p.priceKRW.toLocaleString()}원
                  </p>
                  <p className="text-sm text-[#76776  ] mt-1">
                    수량: {p.quantity}개
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(i)}
                  className="absolute top-3 right-3 text-[#999] hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* 🔹 상품이 있을 때: 카드들 아래, 버튼 위에 스피너 */}
          {isLoading && (
            <div className="w-full max-w-2xl flex flex-col items-center justify-center py-16">
              <img src={imgSpinner} alt="loading" className="w-20" />
              <p className="mt-4 text-[#505050] text-sm">
                상품을 불러오고 있어요...
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#ffe788] to-[#ffcc4c] text-[#111] font-semibold shadow-md"
          >
            장바구니에 담고 견적 확인하기
          </motion.button>
        </motion.div>
      )}
    </main>
  );
}
