package io.github.hayo02.proxyshopping.dto;

import io.github.hayo02.proxyshopping.entity.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CartItemResponseView {
    private Long id;
    private String productId;
    private String productName;
    private String imageUrl;
    private Long unitPrice;
    private Integer quantity;
    private String optionText;
    private Long subtotal;
    private ItemStatus status;
}
