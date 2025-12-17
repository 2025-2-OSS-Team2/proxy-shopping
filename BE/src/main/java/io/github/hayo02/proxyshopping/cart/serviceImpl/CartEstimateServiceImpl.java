// src/main/java/io/github/hayo02/proxyshopping/cart/serviceImpl/CartEstimateServiceImpl.java
package io.github.hayo02.proxyshopping.cart.serviceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.hayo02.proxyshopping.cart.dto.CartEstimateRequest;
import io.github.hayo02.proxyshopping.cart.dto.CartEstimateResponse;
import io.github.hayo02.proxyshopping.cart.entity.CartEstimate;
import io.github.hayo02.proxyshopping.cart.entity.CartItem;
import io.github.hayo02.proxyshopping.cart.repository.CartEstimateRepository;
import io.github.hayo02.proxyshopping.cart.repository.CartItemRepository;
import io.github.hayo02.proxyshopping.cart.service.CartEstimateService;
import io.github.hayo02.proxyshopping.cart.support.EmsShippingCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartEstimateServiceImpl implements CartEstimateService {

    // AI 값이 없을 때 사용할 기본값들 (단위: g, cm^3)
    private static final double DEFAULT_WEIGHT_G = 26.0;    // g
    private static final double DEFAULT_VOLUME_CM3 = 40.3;  // cm^3

    // 부피 → 부피무게 환산 계수 (단위: 1 cm^3 당 ? g)
    private static final double DENSITY_COEFF_G_PER_CM3 = 0.2;

    // 대행 수수료 비율 5%
    private static final double SERVICE_FEE_RATE = 0.05;

    // 결제 수수료 비율 3.4%
    private static final double PAYMENT_FEE_RATE = 0.034;

    // 국내 배송비 고정 3,000원
    private static final long DOMESTIC_SHIPPING_FEE_KRW = 3000L;

    private final CartItemRepository cartItemRepository;
    private final CartEstimateRepository cartEstimateRepository;
    private final EmsShippingCalculator emsShippingCalculator;
    private final ObjectMapper objectMapper;

    public CartEstimateServiceImpl(CartItemRepository cartItemRepository,
                                   CartEstimateRepository cartEstimateRepository,
                                   EmsShippingCalculator emsShippingCalculator,
                                   ObjectMapper objectMapper) {
        this.cartItemRepository = cartItemRepository;
        this.cartEstimateRepository = cartEstimateRepository;
        this.emsShippingCalculator = emsShippingCalculator;
        this.objectMapper = objectMapper;
    }

    @Override
    public CartEstimateResponse estimate(String proxySid, CartEstimateRequest request) {
        // 0) 선택된 itemIds 기준으로 장바구니 아이템 조회
        List<Long> itemIds = request.getItemIds();
        List<CartItem> items;

        if (itemIds != null && !itemIds.isEmpty()) {
            items = cartItemRepository.findByProxySidAndIdIn(proxySid, itemIds);
            if (items == null || items.isEmpty()) {
                throw new IllegalArgumentException("선택한 상품이 장바구니에 없습니다.");
            }
        } else {
            items = cartItemRepository.findByProxySidOrderByCreatedAtDesc(proxySid);
            if (items == null || items.isEmpty()) {
                throw new IllegalArgumentException("장바구니가 비어 있습니다.");
            }
        }

        // 1) 상품 금액 합계
        long productTotalKRW = items.stream()
                .mapToLong(item -> item.getPriceKRW() != null ? item.getPriceKRW() : 0L)
                .sum();

        // 2) 대행 수수료 (5%, 10원 단위 올림)
        long serviceFeeKRW = roundUpTo10Won(productTotalKRW * SERVICE_FEE_RATE);

        // 3) 실무게/부피 합산 (단위: g, cm^3)
        double totalActualWeightG = items.stream()
                .mapToDouble(item -> item.getAiWeightG() != null ? item.getAiWeightG() : DEFAULT_WEIGHT_G)
                .sum();

        double totalVolumeCm3 = items.stream()
                .mapToDouble(item -> item.getAiVolumeCm3() != null ? item.getAiVolumeCm3() : DEFAULT_VOLUME_CM3)
                .sum();

        double volumetricWeightG = totalVolumeCm3 * DENSITY_COEFF_G_PER_CM3;
        double chargeableWeightG = Math.max(totalActualWeightG, volumetricWeightG);

        // EMS 국제배송비 계산을 위해 kg 단위로만 변환 (응답은 계속 g 유지)
        double chargeableWeightKg = chargeableWeightG / 1000.0;
        long emsYen = emsShippingCalculator.calculateEmsYen(chargeableWeightKg);
        long internationalShippingKRW = emsShippingCalculator.convertYenToWon(emsYen);

        // 5) 국내 배송비 = 3,000원 고정
        long domesticShippingKRW = DOMESTIC_SHIPPING_FEE_KRW;
        long totalShippingFeeKRW = internationalShippingKRW + domesticShippingKRW;

        // 6) 결제 수수료 (3.4%, 10원 단위 올림)
        long paymentBase = productTotalKRW + serviceFeeKRW + totalShippingFeeKRW;
        long paymentFeeKRW = roundUpTo10Won(paymentBase * PAYMENT_FEE_RATE);

        // 7) 옵션 비용
        long extraPackagingFeeKRW = request.isExtraPackaging() ? 2000L : 0L;
        long insuranceFeeKRW = request.isInsurance() ? 5000L : 0L;

        // 8) 최종 금액
        long grandTotalKRW = productTotalKRW
                + serviceFeeKRW
                + totalShippingFeeKRW
                + paymentFeeKRW
                + extraPackagingFeeKRW
                + insuranceFeeKRW;

        // 9) 견적 결과를 DB에 저장 (Upsert: proxySid 기준 1개만 유지)
        saveEstimate(proxySid, items, request, productTotalKRW, serviceFeeKRW,
                totalActualWeightG, totalVolumeCm3, volumetricWeightG, chargeableWeightG,
                emsYen, internationalShippingKRW, domesticShippingKRW, totalShippingFeeKRW,
                paymentFeeKRW, extraPackagingFeeKRW, insuranceFeeKRW, grandTotalKRW);

        // 10) 응답 생성 (단위: kg, m³ - 프론트엔드 호환)
        return CartEstimateResponse.of(
                productTotalKRW,
                serviceFeeKRW,
                totalActualWeightG / 1000.0,        // g → kg
                totalVolumeCm3 / 1_000_000.0,       // cm³ → m³
                volumetricWeightG / 1000.0,         // g → kg
                chargeableWeightG / 1000.0,         // g → kg
                emsYen,
                internationalShippingKRW,
                domesticShippingKRW,
                totalShippingFeeKRW,
                paymentFeeKRW,
                extraPackagingFeeKRW,
                insuranceFeeKRW,
                grandTotalKRW
        );
    }

    /**
     * 견적 결과를 DB에 저장 (Upsert)
     */
    private void saveEstimate(String proxySid, List<CartItem> items, CartEstimateRequest request,
                              long productTotalKRW, long serviceFeeKRW,
                              double totalActualWeightG, double totalVolumeCm3,
                              double volumetricWeightG, double chargeableWeightG,
                              long emsYen, long internationalShippingKRW,
                              long domesticShippingKRW, long totalShippingFeeKRW,
                              long paymentFeeKRW, long extraPackagingFeeKRW,
                              long insuranceFeeKRW, long grandTotalKRW) {

        String itemIdsJson;
        try {
            List<Long> ids = items.stream().map(CartItem::getId).collect(Collectors.toList());
            itemIdsJson = objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException e) {
            itemIdsJson = "[]";
        }

        CartEstimate estimate = cartEstimateRepository.findByProxySid(proxySid)
                .orElse(CartEstimate.builder().proxySid(proxySid).build());

        estimate.setItemIds(itemIdsJson);
        estimate.setProductTotalKRW(productTotalKRW);
        estimate.setServiceFeeKRW(serviceFeeKRW);
        estimate.setTotalActualWeightG(totalActualWeightG);
        estimate.setTotalVolumeCm3(totalVolumeCm3);
        estimate.setVolumetricWeightG(volumetricWeightG);
        estimate.setChargeableWeightG(chargeableWeightG);
        estimate.setEmsYen(emsYen);
        estimate.setInternationalShippingKRW(internationalShippingKRW);
        estimate.setDomesticShippingKRW(domesticShippingKRW);
        estimate.setTotalShippingFeeKRW(totalShippingFeeKRW);
        estimate.setPaymentFeeKRW(paymentFeeKRW);
        estimate.setExtraPackagingFeeKRW(extraPackagingFeeKRW);
        estimate.setInsuranceFeeKRW(insuranceFeeKRW);
        estimate.setGrandTotalKRW(grandTotalKRW);
        estimate.setExtraPackaging(request.isExtraPackaging());
        estimate.setInsurance(request.isInsurance());

        cartEstimateRepository.save(estimate);
    }

    private long roundUpTo10Won(double value) {
        return (long) (Math.ceil(value / 10.0) * 10);
    }
}
