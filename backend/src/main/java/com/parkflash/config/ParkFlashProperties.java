package com.parkflash.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/** Configurações em `parkflash.*` (application.yml ou variáveis de ambiente). */
@ConfigurationProperties(prefix = "parkflash")
public record ParkFlashProperties(Jwt jwt, List<String> corsOrigens) {

    /** @param segredo chave HMAC com pelo menos 32 caracteres. */
    public record Jwt(String segredo, Duration expiracao) {
    }
}
