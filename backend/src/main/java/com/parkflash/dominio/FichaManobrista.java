package com.parkflash.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

@Embeddable
public class FichaManobrista {

    @Column(name = "manobrista_id", nullable = false)
    private Long manobristaId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal diaria;

    protected FichaManobrista() {
    }

    public FichaManobrista(Long manobristaId, BigDecimal diaria) {
        this.manobristaId = manobristaId;
        this.diaria = diaria;
    }

    public Long getManobristaId() { return manobristaId; }
    public BigDecimal getDiaria() { return diaria; }
}
