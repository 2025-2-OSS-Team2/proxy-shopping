package io.github.hayo02.proxyshopping.entity;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Embeddable
@Getter
@Setter
public class Extras {
    private String packing = "none";   // none|extra
    private long   packingFee = 0L;

    private String insurance = "none"; // none|add
    private long   insuranceFee = 0L;
}
