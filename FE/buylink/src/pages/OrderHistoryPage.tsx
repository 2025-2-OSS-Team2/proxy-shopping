// src/pages/OrderHistoryPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import sampleimg from "../assets/cuteeeee.png";
import {
  validateOrderHistory,
  hasAnyError,
  type OrderHistoryFormValues,
} from "../utils/validation";

// 🔹 DEV/PROD 공통 API base URL
const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL ?? "" : "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

// =============================
// 실제 백엔드 응답에 정확히 맞춘 타입
// =============================
type OrderItem = {
  id: number;
  productName: string;
  price: number; // ← priceKRW 아님
  quantity: number;
  imageUrl?: string;
};

type ShippingInfo = {
  domestic: number;
  international: number;
};

type OrderDetail = {
  orderId: string; // ← 문자열
  receiver: string;
  phone: string;

  postalCode: string;
  roadAddress: string;
  detailAddress: string;
  deliveryRequest?: string;

  paymentMethod: string;
  totalAmount: number;

  items: OrderItem[];
  shipping: ShippingInfo;

  createdAt?: string;
};

// =============================
// 유틸
// =============================
const formatKRW = (v?: number) =>
  typeof v === "number" ? `${v.toLocaleString()}원` : "0원";

const formatOrderDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

// =============================
// 메인 컴포넌트
// =============================
export default function OrderHistoryPage() {
  const navigate = useNavigate();

  // 🔹 검색 폼 상태
  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderIdInput, setOrderIdInput] = useState("");

  // 🔹 조회 결과 상태
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // =============================
  // 주문내역 조회
  // =============================
  const handleSearch = async () => {
    const values: OrderHistoryFormValues = {
      receiverName: receiverName.trim(),
      phone: phone.trim(),
      orderId: orderIdInput.trim(),
    };

    const errors = validateOrderHistory(values);
    if (hasAnyError(errors)) {
      alert(Object.values(errors).find((msg) => !!msg));
      return;
    }

    const trimmedName = values.receiverName;
    const trimmedPhone = values.phone;
    const trimmedOrderId = values.orderId;

    try {
      setIsLoading(true);
      setOrder(null);

      const params = new URLSearchParams({
        receiver: trimmedName,
        phone: trimmedPhone,
      });

      const url = buildApiUrl(
        `/api/orders/${encodeURIComponent(trimmedOrderId)}?${params.toString()}`
      );

      console.log("[OrderHistoryPage] GET:", url);

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("주문 정보를 찾을 수 없습니다.");

      const json = (await res.json()) as {
        success: boolean;
        data: OrderDetail | null;
        error: string | null;
      };

      console.log("🔥 백엔드 응답:", json);

      if (!json.success || !json.data) {
        throw new Error(json.error ?? "주문 정보를 찾을 수 없습니다.");
      }

      setOrder(json.data);
    } catch (e) {
      console.error("[OrderHistoryPage] handleSearch error:", e);
      alert("주문 정보를 찾을 수 없어요. 입력한 정보를 다시 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => navigate("/");
  const handleRequestMore = () => navigate("/request");

  // =============================
  // 금액 계산
  // =============================
  const productTotal =
    order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
    0;

  const shippingTotal =
    (order?.shipping.domestic ?? 0) +
    (order?.shipping.international ?? 0);

  const discount =
    order ? productTotal + shippingTotal - order.totalAmount : 0;

  const orderDateLabel = formatOrderDate(order?.createdAt);

  // =============================
  // UI
  // =============================
  return (
    <motion.main
      key="order-history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-1 bg-white"
    >
      {/* 검색 박스 */}
      <motion.div
        initial={{ y: "30vh", opacity: 0 }}
        animate={{
          y: order ? 0 : "30vh",
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        className="w-full max-w-2xl mx-auto text-center mb-10"
      >
        <h1 className="text-2xl font-bold mb-6">주문내역 조회하기</h1>

        <div className="bg-white rounded-2xl shadow-lg border p-6 text-left">
          <h3 className="text-lg font-semibold mb-4">주문내역 확인</h3>

          <div className="space-y-3">
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="이름"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="전화번호 (예: 010-1234-5678)"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
            />
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="주문번호"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              disabled={isLoading}
              className="mt-2 w-full px-6 py-2.5 bg-[#ffe788] rounded-xl font-medium disabled:opacity-50"
            >
              {isLoading ? "조회 중..." : "주문내역 확인하기"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {order && (
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 lg:gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            {/* 주문정보 */}
            <section className="bg-white rounded-2xl shadow p-6 border text-sm space-y-2">
              <p className="text-gray-500">
                주문 상세 내역 {orderDateLabel && `- ${orderDateLabel}`}
              </p>
              <p className="text-lg font-semibold">
                주문 번호 {order.orderId}
              </p>
            </section>

            {/* 배송지 */}
            <section className="bg-white rounded-2xl shadow p-6 border text-sm space-y-1">
              <h2 className="mb-3 text-lg font-semibold">배송지</h2>

              <p>받는 분: {order.receiver}</p>
              <p>연락처: {order.phone}</p>
              <p>
                주소: [{order.postalCode}] {order.roadAddress}{" "}
                {order.detailAddress}
              </p>

              {order.deliveryRequest && (
                <p>요청사항: {order.deliveryRequest}</p>
              )}
            </section>

            {/* 상품 리스트 */}
            <section className="bg-white rounded-2xl shadow p-6 border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">구매대행 상품</h2>
                <span className="text-xs text-gray-500">
                  {order.items.length}건
                </span>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border rounded-xl p-3"
                  >
                    <img
                      src={item.imageUrl ?? sampleimg}
                      alt={item.productName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium line-clamp-2">
                        {item.productName}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatKRW(item.price)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        수량: {item.quantity}개
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 결제 수단 */}
            <section className="bg-white rounded-2xl shadow p-6 border text-sm">
              <h2 className="text-lg font-semibold mb-2">결제 수단</h2>
              <p>{order.paymentMethod}</p>
            </section>
          </div>

          {/* RIGHT 결제 요약 */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-6 border text-sm space-y-3">
              <h2 className="text-lg font-semibold mb-2">결제 금액</h2>

              <div className="flex justify-between">
                <span className="text-gray-600">상품 금액</span>
                <span className="font-medium">{formatKRW(productTotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">할인 금액</span>
                <span className="font-medium text-red-500">
                  {discount > 0
                    ? `-${Math.abs(discount).toLocaleString()}원`
                    : "0원"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">배송비</span>
                <span className="font-medium">{formatKRW(shippingTotal)}</span>
              </div>

              <div className="h-px bg-gray-200 my-2" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 결제 금액</span>
                <span className="text-xl font-bold">
                  {formatKRW(order.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRequestMore}
                className="w-full py-5 rounded-xl bg-[#ffe788] text-sm font-semibold hover:brightness-95"
              >
                추가로 구매대행 요청
              </button>

              <button
                onClick={handleGoHome}
                className="w-full py-5 rounded-xl border bg-white text-sm font-medium hover:bg-gray-50"
              >
                홈으로 가기
              </button>
            </div>
          </aside>
        </div>
      )}
    </motion.main>
  );
}
