package io.github.hayo02.proxyshopping.api;

import io.github.hayo02.proxyshopping.dto.CartItemResponse;
import io.github.hayo02.proxyshopping.dto.CartResponse;
import io.github.hayo02.proxyshopping.dto.ItemUpsertRequest;
import io.github.hayo02.proxyshopping.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

@Slf4j 
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    // 장바구니 조회 (/api/cart)
    @GetMapping
    public CartResponse getCart(HttpSession session) {
        return cartService.getCart(session.getId());
    }

    // 장바구니에 같은 상품 담기 (/api/cart/items)
    @PostMapping("/items")
    public CartItemResponse upsertItem(HttpSession session, @RequestBody ItemUpsertRequest req) {
        log.info("UPsert request sid={}, pid={}, opt={}", session.getId(), req.getProductId(), req.getOptionText());
        return cartService.upsertItem(session.getId(), req);
    }
}
