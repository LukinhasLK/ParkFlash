package com.parkflash.seguranca;

import com.parkflash.config.ParkFlashProperties;
import com.parkflash.dominio.Usuario;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final SecretKey chave;
    private final ParkFlashProperties.Jwt config;

    public JwtService(ParkFlashProperties propriedades) {
        this.config = propriedades.jwt();
        this.chave = Keys.hmacShaKeyFor(config.segredo().getBytes(StandardCharsets.UTF_8));
    }

    public String gerar(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .claim("nivel", usuario.getNivel().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(config.expiracao())))
                .signWith(chave)
                .compact();
    }

    /** ID do usuário do token, se a assinatura e a validade estiverem corretas. */
    public Optional<Long> validar(String token) {
        try {
            String sujeito = Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.valueOf(sujeito));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
