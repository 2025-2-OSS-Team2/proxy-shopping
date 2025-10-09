package io.github.hayo02.proxyshopping.dto;

import lombok.Data;

@Data
public class ItemUpsertRequest {
    private String productId;
    private String productName;
    private Long unitPrice;
    private Integer quantity;     // null 또는 1 미만이면 1로 보정
    private String optionText;    // 업서트 키 (productId + optionText)
    private String imageUrl;
}
