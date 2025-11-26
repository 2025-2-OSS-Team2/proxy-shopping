// src/pages/OrderCompletePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import sampleimg from "../assets/cuteeeee.png";

// =============================
// 타입 정의 (백엔드 명세에 맞게)
// =============================
type OrderItem = {
  id: number;
  productName: string;
  price: number; // ✅ 백엔드의 price 필드
  quantity: number;
  imageUrl?: string;
};

type OrderDetail = {
  orderId: string; // ✅ 문자열 orderId
  receiver: string;
  phone?: string; // ✅ GET /api/orders/{orderId} 응답의 phone
  totalAmount: number;
  items: OrderItem[];
  // 아래 필드는 백엔드 명세에는 없지만, 나중에 확장될 가능성 고려해서 optional
  paymentMethod?: string | null;
  address?: string;
  createdAt?: string;
};

// 🔹 GET /api/orders/{orderId} 응답 래퍼 타입
type OrderDetailApiResponse = {
  success: boolean;
  data: {
    orderId: string;
    receiver: string;
    phone?: string;
    totalAmount: number;
    items: {
      id: number;
      productName: string;
      price: number;
      quantity: number;
      imageUrl: string;
    }[];
    // paymentMethod / address / createdAt 등이 있다면 여기에 추가 가능
  } | null;
  error: string | null;
};

// 🔹 DEV/PROD 공통 API base URL
const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL ?? "" : "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

// =============================
// 유틸 함수
// =============================
const formatKRW = (v: number) => `${v.toLocaleString()}원`;

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
export default function OrderCompletePage() {
  const navigate = useNavigate();
  const params = useParams<{ orderId?: string }>();
  const location = useLocation();

  // ✅ PaymentsSuccessPage에서 넘겨준 orderId (state 기반)
  const orderIdFromState =
    (location.state as { orderId?: string } | undefined)?.orderId;

  // ✅ URL 파라미터로 /order-complete/:orderId 형태도 나중에 쓸 수 있게 여유 있게 처리
  const orderIdFromParams = params.orderId;

  const effectiveOrderId = orderIdFromState ?? orderIdFromParams ?? null;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // 주문번호가 아예 없으면 바로 에러 처리
    if (!effectiveOrderId) {
      setLoadError("주문 번호가 전달되지 않았습니다.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // ✅ GET /api/orders/{orderId}
        // 명세: GET /api/orders/{orderId}??receiver={이름}&phone={전화번호}
        // 일단 orderId만으로 호출하고, receiver/phone 쿼리는 선택적으로 나중에 붙여도 됨
        const url = buildApiUrl(`/api/orders/${effectiveOrderId}`);
        console.log("[OrderCompletePage] GET /api/orders URL:", url);

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        console.log(
          "[OrderCompletePage] /api/orders status:",
          res.status,
          res.statusText
        );

        if (!res.ok) {
          const text = await res.text();
          console.log("[OrderCompletePage] /api/orders error body:", text);
          throw new Error(`주문 상세 조회 실패 (status ${res.status})`);
        }

        const json = (await res.json()) as OrderDetailApiResponse;
        console.log("[OrderCompletePage] /api/orders response json:", json);

        if (!json.success || !json.data) {
          throw new Error(json.error ?? "주문 상세 데이터가 없습니다.");
        }

        const data = json.data;

        // ✅ 백엔드 응답 -> 화면에서 쓰는 타입으로 매핑
        const mapped: OrderDetail = {
          orderId: data.orderId,
          receiver: data.receiver,
          phone: data.phone,
          totalAmount: data.totalAmount,
          items: data.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          // paymentMethod / address / createdAt은 명세에 없으니 일단 비워둠
        };

        setOrder(mapped);
      } catch (e) {
        console.error("[OrderCompletePage] fetchOrder error:", e);
        setLoadError(
          e instanceof Error
            ? e.message
            : "주문 정보를 불러오는 중 문제가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [effectiveOrderId]);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(String(order.orderId));
    alert("주문번호가 복사되었어요!");
  };

  const handleGoHome = () => navigate("/");

  const handleRequestMore = () => {
    navigate("/request");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <p className="text-sm text-[#505050]">불러오는 중...</p>
      </main>
    );
  }

  if (!order || loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="bg-white rounded-2xl shadow p-6 max-w-md w-full text-center border border-gray-200">
          <p className="text-sm text-[#505050] mb-4">
            {loadError ?? "주문 정보를 찾을 수 없습니다."}
          </p>
          <button
            onClick={handleGoHome}
            className="w-full py-3 rounded-xl bg-[#ffe788] text-[#111111] text-sm font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </main>
    );
  }

  // ✅ 합계/할인 계산 (shipping은 명세에 없으니 0 처리)
  const productTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = 0;
  const discount = productTotal + shippingFee - order.totalAmount;
  const orderDateLabel = formatOrderDate(order.createdAt) || "";

  return (
    <motion.main
      key="order-complete"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 bg-white"
    >
      {/* 타이틀 (주문내역이라고 크게) */}
      <h2 className="text-2xl lg:text-3xl font-bold text-[#111111] mb-2">
        주문내역
      </h2>

      {/* 주문 완료 문구 */}
      <h1 className="text-center text-2xl lg:text-3xl font-bold text-[#111111] mb-2">
        주문 완료!
      </h1>
      <p className="text-center text-sm text-[#767676] mb-6">
        주문내역을 확인하려면 주문번호를 복사해두세요.
      </p>

      {/* 상단 주문 완료 박스 */}
      <section className="bg-white rounded-2xl shadow p-6 border border-gray-200 mb-6 text-center">
        <button
          onClick={handleRequestMore}
          className="w-full py-4 rounded-xl bg-[#ffe788] text-[#111111] text-sm font-semibold hover:brightness-95"
        >
          추가로 구매대행 요청
        </button>
      </section>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-6 lg:gap-8">
        {/* LEFT */}
        <div className="space-y-6">
          {/* 주문정보 */}
          <section className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-sm space-y-2">
            <p className="text-[#767676]">
              주문 상세 내역 {orderDateLabel && `- ${orderDateLabel}`}
            </p>

            <p className="text-lg font-semibold text-[#111111]">
              주문 번호{" "}
              <button
                onClick={handleCopyOrderId}
                className="text-[#111111] font-medium underline underline-offset-2"
              >
                {order.orderId}
              </button>
            </p>
          </section>

          {/* 배송지 (receiver + phone만 표시) */}
          <section className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-sm space-y-1">
            <h2 className="mb-3 text-lg font-semibold text-[#111111]">
              배송지
            </h2>
            <p>받는 분: {order.receiver}</p>
            {order.phone && <p>연락처: {order.phone}</p>}
            {order.address && <p>주소: {order.address}</p>}
          </section>

          {/* 구매대행 상품 */}
          <section className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#111111]">
                구매대행 상품
              </h2>
              <span className="text-xs text-[#767676]">
                {order.items.length}건
              </span>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border border-[#f1f1f5] rounded-xl p-3"
                >
                  <img
                    src={item.imageUrl ?? sampleimg}
                    alt={item.productName}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-[#111111] line-clamp-2">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-[#111111] font-semibold">
                      {formatKRW(item.price)}
                    </p>
                    <p className="mt-1 text-xs text-[#767676]">
                      수량: {item.quantity}개
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 결제 수단 (명세에 paymentMethod 없어서 있으면만 노출) */}
          {order.paymentMethod && (
            <section className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-sm">
              <h2 className="text-lg font-semibold text-[#111111] mb-2">
                결제 수단
              </h2>
              <p className="text-[#111111]">{order.paymentMethod}</p>
            </section>
          )}
        </div>

        {/* RIGHT Summary */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-sm space-y-3">
            <h2 className="text-lg font-semibold text-[#111111] mb-2">
              결제 금액
            </h2>
            <div className="flex justify-between">
              <span className="text-[#505050]">상품 금액</span>
              <span className="text-[#111111] font-medium">
                {formatKRW(productTotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#505050]">할인 금액</span>
              <span className="text-[#ff4c4c] font-medium">
                {discount > 0
                  ? `-${Math.abs(discount).toLocaleString()}원`
                  : "0원"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#505050]">배송비</span>
              <span className="text-[#111111] font-medium">
                {formatKRW(shippingFee)}
              </span>
            </div>

            <div className="h-px bg-[#e5e5ec] my-2" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-[#505050]">총 결제 금액</span>
              <span className="text-xl font-bold text-[#111111]">
                {formatKRW(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRequestMore}
              className="w-full py-5 rounded-xl bg-[#ffe788] text-[#111111] text-sm font-semibold hover:brightness-95"
            >
              추가로 구매대행 요청
            </button>

            <button
              onClick={handleGoHome}
              className="w-full py-5 rounded-xl border border-[#e5e5ec] bg-white text-[#505050] text-sm font-medium hover:bg-[#f9f9fb]"
            >
              홈으로 가기
            </button>
          </div>
        </aside>
      </div>
    </motion.main>
  );
}
