// src/main/java/io/github/hayo02/proxyshopping/orders/controller/OrderPaymentController.java
package io.github.hayo02.proxyshopping.orders.controller;

import io.github.hayo02.proxyshopping.common.ApiResponse;
import io.github.hayo02.proxyshopping.orders.dto.TossPayConfirmRequest;
import io.github.hayo02.proxyshopping.orders.dto.TossPayConfirmResponse;
import io.github.hayo02.proxyshopping.orders.service.PaymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderPaymentController {

    private final PaymentService paymentService;

    public OrderPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/pay")
    public ApiResponse<TossPayConfirmResponse> pay(@RequestBody TossPayConfirmRequest req) {
        // 토스 결제 승인 요청
        // 주문 생성 및 견적서 생성은 POST /api/orders 에서 처리됨
        TossPayConfirmResponse resp = paymentService.confirm(req);
        return ApiResponse.ok(resp);
    }
}
