package io.github.hayo02.proxyshopping.service;

import io.github.hayo02.proxyshopping.dto.CartItemResponse;
import io.github.hayo02.proxyshopping.dto.CartItemResponseView;
import io.github.hayo02.proxyshopping.dto.CartResponse;
import io.github.hayo02.proxyshopping.dto.ItemUpsertRequest;
import io.github.hayo02.proxyshopping.entity.Cart;
import io.github.hayo02.proxyshopping.entity.CartItem;
import io.github.hayo02.proxyshopping.entity.ItemStatus;
import io.github.hayo02.proxyshopping.repository.CartItemRepository;
import io.github.hayo02.proxyshopping.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;

    // 합계 계산 (임시로..!)
    private long ceil10(long v) { return (v % 10 == 0) ? v : v + (10 - v % 10); }
    private long agencyFee(long itemsTotal) { return 3000L; }           // TODO
    private long shippingDomestic() { return 0L; }                      // TODO
    private long shippingInternational(long itemsTotal) { return 9480L; } // TODO
    private long paymentFee(long base) { return ceil10(Math.round(base * 34 / 1000.0f)); } // 3.4%

    private Map<String, Long> calcSummary(Cart cart) {
        long itemsTotal = cart.getItems().stream().mapToLong(CartItem::subtotal).sum();
        long agency = agencyFee(itemsTotal);
        long shipDom = shippingDomestic();
        long shipIntl = shippingInternational(itemsTotal);
        long extras = cart.getExtras().getPackingFee() + cart.getExtras().getInsuranceFee();
        long baseForPay = itemsTotal + agency + shipDom + shipIntl + extras;
        long payFee = paymentFee(baseForPay);
        long grand = ceil10(baseForPay + payFee);

        Map<String, Long> m = new LinkedHashMap<>();
        m.put("itemsTotal", itemsTotal);
        m.put("agencyFee", agency);
        m.put("shippingDomestic", shipDom);
        m.put("shippingInternational", shipIntl);
        m.put("paymentFee", payFee);
        m.put("extrasTotal", extras);
        m.put("grandTotal", grand);
        return m;
    }

    private Cart ensureCart(String sessionId) {
        return cartRepo.findByCartToken(sessionId)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setCartToken(sessionId);
                    return cartRepo.save(c);
                });
    }

    // 장바구니 조회
    @Transactional(readOnly = true)
    public CartResponse getCart(String sessionId) {
        Cart cart = ensureCart(sessionId);

        var extras = new LinkedHashMap<String, Object>();
        extras.put("packing", Map.of("choice", cart.getExtras().getPacking(), "fee", cart.getExtras().getPackingFee()));
        extras.put("insurance", Map.of("choice", cart.getExtras().getInsurance(), "fee", cart.getExtras().getInsuranceFee()));

        List<CartItemResponseView> items = cart.getItems().stream()
                .map(it -> CartItemResponseView.builder()
                        .id(it.getId())
                        .productId(it.getProductId())
                        .productName(it.getProductName())
                        .imageUrl(it.getImageUrl())
                        .unitPrice(it.getUnitPrice())
                        .quantity(it.getQuantity())
                        .optionText(it.getOptionText())
                        .subtotal(it.subtotal())
                        .status(it.getStatus())
                        .build())
                .toList();

        return CartResponse.builder()
                .cartId(cart.getCartToken())
                .items(items)
                .extras(extras)
                .summary(calcSummary(cart))
                .build();
    }

    // 장바구니에 같은상품 담기
    @Transactional
    public CartItemResponse upsertItem(String sessionId, ItemUpsertRequest req) {
        if (req.getProductId() == null || req.getUnitPrice() == null)
            throw new IllegalArgumentException("productId, unitPrice are required");

        int qty = (req.getQuantity() == null || req.getQuantity() < 1) ? 1 : req.getQuantity();
        Cart cart = ensureCart(sessionId);

        String productId = req.getProductId().trim();
        String optionText = (req.getOptionText() == null || req.getOptionText().isBlank())
                ? null : req.getOptionText().trim();

        // 업서트 키: (cart, productId, optionText)
        Optional<CartItem> found = cart.getItems().stream()
                .filter(i -> i.getProductId().equalsIgnoreCase(productId)
                        && Objects.equals(i.getOptionText(), optionText))
                .findFirst();

        CartItem item;
        if (found.isPresent()) {
            item = found.get();
            item.setQuantity(item.getQuantity() + qty);
            item.setUnitPrice(req.getUnitPrice()); // 최근 단가로
        } else {
            item = CartItem.builder()
                    .cart(cart)
                    .productId(productId)
                    .productName(req.getProductName())
                    .imageUrl(req.getImageUrl())
                    .unitPrice(req.getUnitPrice())
                    .quantity(qty)
                    .optionText(optionText)
                    .status(ItemStatus.AVAILABLE)
                    .build();
            cart.addItem(item);
        }

        CartItem saved = itemRepo.save(item);

        return new CartItemResponse(saved.getId(), saved.getQuantity());
    }
}
