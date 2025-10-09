package io.github.hayo02.proxyshopping.repository;

import io.github.hayo02.proxyshopping.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByCartToken(String cartToken);
}
