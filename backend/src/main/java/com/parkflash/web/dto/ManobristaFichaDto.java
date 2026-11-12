package com.parkflash.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ManobristaFichaDto(@NotNull Long manobristaId, @NotNull @PositiveOrZero BigDecimal diaria) {
}
