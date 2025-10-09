package io.github.hayo02.proxyshopping.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Getter
@Setter
@NoArgsConstructor
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 세션 기반: 세션ID를 저장해 식별자로 사용
    @Column(nullable = false, unique = true, length = 64)
    private String cartToken;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    @Embedded
    private Extras extras = new Extras();

    public void addItem(CartItem item) {
        item.setCart(this);
        items.add(item);
    }
}
