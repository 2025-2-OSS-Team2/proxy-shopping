package io.github.hayo02.proxyshopping.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class CartResponse {
    private String cartId; // == cartToken
    private List<CartItemResponseView> items;
    // packing/insurance(choice, fee)
    private Map<String, Object> extras;
    // itemsTotal, agencyFee, shippingDomestic, shippingInternational, paymentFee, extrasTotal, grandTotal
    private Map<String, Long> summary;
}
