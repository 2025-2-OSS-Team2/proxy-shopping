// src/pages/PaymentsSuccessPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

// 결제 검증 응답 타입 (/api/orders/pay)
type OrdersPayResponse = {
  paymentId: string;
  status: "SUCCESS" | "FAIL";
  paidAt?: string;
};

// 주문 생성 응답 타입 (/api/orders)
// ⚠️ 실제 백엔드 스펙이랑 다를 수 있음 (지금은 일단 그대로 둠)
type CreateOrderResponse = {
  orderId: number;
  totalAmount: number;
  status: "PAID" | "PENDING" | "CANCELLED";
};

// 🔹 DEV/PROD 공통 API base URL
const API_BASE_URL =
  import.meta.env.DEV ? import.meta.env.VITE_API_BASE_URL ?? "" : "";

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function PaymentsSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    const paymentKey = qs.get("paymentKey");
    const orderIdFromToss = qs.get("orderId"); // Checkout에서 넘긴 orderId
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
        // ─────────────────────────────
        // 1) 결제 검증 단계 (/api/orders/pay)
        // ─────────────────────────────
        const payUrl = buildApiUrl("/api/orders/pay");
        const payPayload = {
          orderId: orderIdFromToss,
          paymentKey,
          amount,
        };

        console.log(
          "[PaymentsSuccessPage] POST /api/orders/pay url:",
          payUrl
        );
        console.log(
          "[PaymentsSuccessPage] POST /api/orders/pay payload:",
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
          throw new Error(
            `결제 검증 요청 실패 (status ${payRes.status})`
          );
        }

        const payJson: OrdersPayResponse | any = await payRes.json();
        console.log(
          "[PaymentsSuccessPage] /api/orders/pay response json:",
          payJson
        );

        if (payJson.status !== "SUCCESS") {
          throw new Error("결제 승인에 실패했습니다.");
        }

        // ─────────────────────────────
        // 2) 주문 생성 단계 (/api/orders)
        //    ⚠️ 지금은 아직 백엔드 스펙이랑 맞추는 중
        // ─────────────────────────────
        const cartItems: any[] = []; // TODO
        const addressId = 0; // TODO
        const customsCode = ""; // TODO

        const orderUrl = buildApiUrl("/api/orders");
        const orderPayload = {
          cartItems,
          addressId,
          customsCode,
          paymentInfo: {
            paymentId: payJson.paymentId,
            status: payJson.status,
            paidAt: payJson.paidAt,
            method: "TOSS_PAY",
            amount,
          },
        };

        console.log(
          "[PaymentsSuccessPage] POST /api/orders url:",
          orderUrl
        );
        console.log(
          "[PaymentsSuccessPage] POST /api/orders payload:",
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
          throw new Error(
            `주문 생성 요청 실패 (status ${orderRes.status})`
          );
        }

        const orderJson: CreateOrderResponse | any = await orderRes.json();
        console.log(
          "[PaymentsSuccessPage] /api/orders response json:",
          orderJson
        );

        const finalOrderId =
          (orderJson && (orderJson.orderId ?? orderJson.orderNumber)) ||
          null;

        console.log(
          "[PaymentsSuccessPage] finalOrderId used for navigation:",
          finalOrderId
        );

        if (!finalOrderId) {
          throw new Error("주문 번호를 가져오지 못했습니다.");
        }

        navigate("/order-complete", {
          replace: true,
          state: {
            orderId: finalOrderId,
          },
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
