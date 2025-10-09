package io.github.hayo02.proxyshopping.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "cart_items",
        indexes = @Index(name = "idx_cart_product_opt", columnList = "cart_id,productId,optionText"),
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_product_opt",
                columnNames = {"cart_id", "productId", "optionText"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="cart_id", nullable=false)
    private Cart cart;

    @Column(nullable=false, length=64)
    private String productId;

    @Column(nullable=false)
    private String productName;

    private String imageUrl;

    @Column(nullable=false)
    private long unitPrice; // KRW(원)

    @Column(nullable=false)
    private int quantity;

    @Column(length=255)
    private String optionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=16)
    private ItemStatus status = ItemStatus.AVAILABLE;

    public long subtotal() { return unitPrice * (long) quantity; }
}
