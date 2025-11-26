// src/pages/PaymentsSuccessPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

// -----------------------------
// ✅ 결제 검증 응답 타입 (/api/orders/pay)
//   /api/orders/pay 응답 예시:
//   {
//     "success": true,
//     "data": {
//       "paymentKey": "...",
//       "orderId": "ORDER-...",
//       "status": "DONE",
//       "totalAmount": 127888,
//       "approvedAt": "2025-11-26T19:40:06+09:00"
//     },
//     "error": null
//   }
// -----------------------------
type OrdersPayResponseData = {
  paymentKey: string;
  orderId: string;
  status: "DONE" | "FAIL";
  totalAmount: number;
  approvedAt: string;
};

type OrdersPayResponse = {
  success: boolean;
  data: OrdersPayResponseData | null;
  error: string | null;
};

// -----------------------------
// ✅ 주문 생성 응답 타입 (/api/orders)
//   /api/orders 응답 예시:
//   {
//     "success": true,
//     "data": {
//       "orderId": "202511251202477346",
//       "receiver": "홍길동",
//       "paymentMethod": null,
//       "totalAmount": 130150,
//       "items": [ ... ]
//     },
//     "error": null
//   }
// -----------------------------
type OrderItemResponse = {
  id: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type CreateOrderData = {
  orderId: string;
  receiver: string;
  paymentMethod: string | null;
  totalAmount: number;
  items: OrderItemResponse[];
};

type CreateOrderResponse = {
  success: boolean;
  data: CreateOrderData | null;
  error: string | null;
};

// -----------------------------
// ✅ 공통 API Base URL
// -----------------------------
const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL ?? "" : "";
const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

// -----------------------------
// ✅ 컴포넌트 본문
// -----------------------------
export default function PaymentsSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const paymentKey = qs.get("paymentKey");
    const orderIdFromToss = qs.get("orderId");
    const amountStr = qs.get("amount");

    console.log("[PaymentsSuccessPage] query params:", {
      paymentKey,
      orderIdFromToss,
      amountStr,
    });

    if (!paymentKey || !orderIdFromToss || !amountStr) {
      setErrorMsg("필수 결제 정보가 누락되었습니다.");
      setIsProcessing(false);
      return;
    }

    const amount = Number(amountStr);
    console.log("[PaymentsSuccessPage] parsed amount:", amount);

    const run = async () => {
      try {
        // --------------------------------
        // 1️⃣ 결제 검증 단계 (/api/orders/pay)
        // --------------------------------
        const payUrl = buildApiUrl("/api/orders/pay");
        const payPayload = {
          orderId: orderIdFromToss,
          paymentKey,
          amount,
        };

        console.log("[PaymentsSuccessPage] POST /api/orders/pay URL:", payUrl);
        console.log(
          "[PaymentsSuccessPage] POST /api/orders/pay Payload:",
          payPayload
        );

        const payRes = await fetch(payUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payPayload),
        });

        console.log(
          "[PaymentsSuccessPage] /api/orders/pay status:",
          payRes.status,
          payRes.statusText
        );

        if (!payRes.ok) {
          const errorText = await payRes.text();
          console.log(
            "[PaymentsSuccessPage] /api/orders/pay error body:",
            errorText
          );
          throw new Error(`결제 검증 요청 실패 (status ${payRes.status})`);
        }

        const payJson: OrdersPayResponse = await payRes.json();
        console.log("[PaymentsSuccessPage] /api/orders/pay raw json:", payJson);

        const payData = payJson.data;
        if (!payJson.success || !payData) {
          throw new Error(payJson.error ?? "결제 검증 응답이 올바르지 않습니다.");
        }

        // ✅ 결제 관련 값 로그 출력
        console.log("[PaymentsSuccessPage] Parsed payData:", {
          paymentKey: payData.paymentKey,
          orderId: payData.orderId,
          status: payData.status,
          totalAmount: payData.totalAmount,
          approvedAt: payData.approvedAt,
        });

        if (payData.status !== "DONE") {
          throw new Error("결제 승인에 실패했습니다.");
        }

        // --------------------------------
        // 2️⃣ 주문 생성 단계 (/api/orders)
        //   👉 명세서대로 receiver, totalAmount, items 만 보냄
        // --------------------------------

        // ⚠️ 지금은 예시 데이터로 채워둔 상태
        //    나중에는 CheckoutPage / 장바구니 상태에서 실제 값 가져오기
        const receiver = "홍길동"; // TODO: 실제 배송지 수령인으로 교체
        const totalAmountForOrder = payData.totalAmount;

        const items: OrderItemResponse[] = [
          {
            id: 1,
            productName: "상품명", // TODO: 실제 장바구니 상품명으로 교체
            price: payData.totalAmount,
            quantity: 1,
            imageUrl: "https://example.com/image.jpg", // TODO: 실제 상품 이미지로 교체
          },
        ];

        const orderUrl = buildApiUrl("/api/orders");
        const orderPayload = {
          receiver,
          totalAmount: totalAmountForOrder,
          items,
        };

        console.log("[PaymentsSuccessPage] POST /api/orders URL:", orderUrl);
        console.log(
          "[PaymentsSuccessPage] POST /api/orders Payload:",
          orderPayload
        );

        const orderRes = await fetch(orderUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orderPayload),
        });

        console.log(
          "[PaymentsSuccessPage] /api/orders status:",
          orderRes.status,
          orderRes.statusText
        );

        if (!orderRes.ok) {
          const errorText = await orderRes.text();
          console.log(
            "[PaymentsSuccessPage] /api/orders error body:",
            errorText
          );
          throw new Error(`주문 생성 요청 실패 (status ${orderRes.status})`);
        }

        const orderJson: CreateOrderResponse = await orderRes.json();
        console.log(
          "[PaymentsSuccessPage] /api/orders response json:",
          orderJson
        );

        if (!orderJson.success || !orderJson.data) {
          throw new Error(orderJson.error ?? "주문 생성 응답이 올바르지 않습니다.");
        }

        const finalOrderId = orderJson.data.orderId;
        console.log(
          "[PaymentsSuccessPage] finalOrderId used for navigation:",
          finalOrderId
        );

        if (!finalOrderId) {
          throw new Error("주문 번호를 가져오지 못했습니다.");
        }

        // --------------------------------
        // 3️⃣ 주문 완료 페이지 이동
        // --------------------------------
        navigate("/order-complete", {
          replace: true,
          state: { orderId: finalOrderId },
        });
      } catch (e) {
        console.error("[PaymentsSuccessPage] error in run():", e);
        setErrorMsg(e instanceof Error ? e.message : String(e));
      } finally {
        setIsProcessing(false);
      }
    };

    run();
  }, [location.search, navigate]);

  // -----------------------------
  // ✅ UI
  // -----------------------------
  return (
    <motion.main
      key="payments-success"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[60vh] flex items-center justify-center bg-white px-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold text-[#111111]">
          결제 결과 처리 중입니다
        </h1>

        {isProcessing && (
          <p className="text-sm text-[#767676]">
            잠시만 기다려 주세요. 결제 내역을 확인하고 주문을 생성하고 있어요.
          </p>
        )}

        {!isProcessing && errorMsg && (
          <>
            <p className="text-sm text-[#ff4c4c]">{errorMsg}</p>
            <button
              onClick={() => navigate("/cart")}
              className="mt-3 w-full py-3 rounded-xl bg-[#ffe788] text-sm font-semibold text-[#111111]"
            >
              장바구니로 돌아가기
            </button>
          </>
        )}
      </div>
    </motion.main>
  );
}
