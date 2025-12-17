// src/main/java/io/github/hayo02/proxyshopping/cart/dto/CartItemDto.java
package io.github.hayo02.proxyshopping.cart.dto;

public class CartItemDto {
    private Long id;
    private String productName;
    private Integer priceKRW;
    private String imageUrl;

    // AI 예측 값 (단위 변경: g, cm^3)
    private Double aiWeightG;   // g
    private Double aiVolumeCm3; // cm^3

    public CartItemDto() {
    }

    public CartItemDto(Long id,
                       String productName,
                       Integer priceKRW,
                       String imageUrl,
                       Double aiWeightG,
                       Double aiVolumeCm3) {
        this.id = id;
        this.productName = productName;
        this.priceKRW = priceKRW;
        this.imageUrl = imageUrl;
        this.aiWeightG = aiWeightG;
        this.aiVolumeCm3 = aiVolumeCm3;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getPriceKRW() { return priceKRW; }
    public void setPriceKRW(Integer priceKRW) { this.priceKRW = priceKRW; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Double getAiWeightG() { return aiWeightG; }
    public void setAiWeightG(Double aiWeightG) { this.aiWeightG = aiWeightG; }

    public Double getAiVolumeCm3() { return aiVolumeCm3; }
    public void setAiVolumeCm3(Double aiVolumeCm3) { this.aiVolumeCm3 = aiVolumeCm3; }
}
