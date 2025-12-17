// src/main/java/io/github/hayo02/proxyshopping/orders/dto/OrderCreateResponse.java
package io.github.hayo02.proxyshopping.orders.dto;

import io.github.hayo02.proxyshopping.orders.entity.Order;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderCreateResponse {
    private String orderNumber;
    private Long totalAmount;
    private String status; // PENDING / PAID 등

    // ===== 견적/비용 관련 필드들 =====
    private Long productTotalKRW;
    private Long serviceFeeKRW;

    // 단위: g
    private Double volumetricWeightG;
    private Double chargeableWeightG;

    private Long emsYen;
    private Long internationalShippingKRW;
    private Long domesticShippingKRW;
    private Long totalShippingFeeKRW;
    private Long paymentFeeKRW;
    private Long extraPackagingFeeKRW;
    private Long insuranceFeeKRW;
    private Long grandTotalKRW;

    public static OrderCreateResponse from(Order order) {
        return OrderCreateResponse.builder()
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .productTotalKRW(order.getProductTotalKRW())
                .serviceFeeKRW(order.getServiceFeeKRW())
                .volumetricWeightG(order.getVolumetricWeightG())
                .chargeableWeightG(order.getChargeableWeightG())
                .emsYen(order.getEmsYen())
                .internationalShippingKRW(order.getInternationalShippingKRW())
                .domesticShippingKRW(order.getDomesticShippingKRW())
                .totalShippingFeeKRW(order.getTotalShippingFeeKRW())
                .paymentFeeKRW(order.getPaymentFeeKRW())
                .extraPackagingFeeKRW(order.getExtraPackagingFeeKRW())
                .insuranceFeeKRW(order.getInsuranceFeeKRW())
                .grandTotalKRW(order.getGrandTotalKRW())
                .build();
    }
}
