// src/main/java/io/github/hayo02/proxyshopping/orders/dto/OrderCreateRequest.java
package io.github.hayo02.proxyshopping.orders.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrderCreateRequest {

    // 배송지 id (ShippingAddress id)
    @NotNull
    private Long addressId;

    // 개인통관고유부호 (없으면 null 가능)
    @Size(max = 20)
    private String customsCode;

    // 최종 결제 금액 (토스 amount 와 동일해야 함)
    @NotNull
    private Long totalAmount;

    // ===== 견적/비용 관련 필드들 =====
    private Long productTotalKRW;
    private Long serviceFeeKRW;

    // totalActualWeight / totalVolume 은 사용 안 함 (견적에서 자동 채움)
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
}
