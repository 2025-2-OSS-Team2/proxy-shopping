// src/main/java/io/github/hayo02/proxyshopping/cart/entity/CartItem.java
package io.github.hayo02.proxyshopping.cart.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_item", indexes = {
        @Index(name = "idx_cart_sid", columnList = "proxy_sid")
})
public class CartItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="proxy_sid", nullable = false, length = 80)
    private String proxySid;

    @Column(nullable = false, length = 200)
    private String productName;

    @Column(name = "price_krw")
    private Integer priceKRW;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "url", length = 300)
    private String url;

    // AI 결과 필드 (단위 변경: g, cm^3)
    @Column(name = "ai_weight_g")
    private Double aiWeightG;   // g

    @Column(name = "ai_volume_cm3")
    private Double aiVolumeCm3; // cm^3

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // getters/setters
    public Long getId() { return id; }

    public String getProxySid() { return proxySid; }
    public void setProxySid(String proxySid) { this.proxySid = proxySid; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getPriceKRW() { return priceKRW; }
    public void setPriceKRW(Integer priceKRW) { this.priceKRW = priceKRW; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Double getAiWeightG() { return aiWeightG; }
    public void setAiWeightG(Double aiWeightG) { this.aiWeightG = aiWeightG; }

    public Double getAiVolumeCm3() { return aiVolumeCm3; }
    public void setAiVolumeCm3(Double aiVolumeCm3) { this.aiVolumeCm3 = aiVolumeCm3; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
