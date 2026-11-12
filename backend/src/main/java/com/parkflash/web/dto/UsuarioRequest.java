package com.parkflash.web.dto;

import com.parkflash.dominio.NivelAcesso;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** @param senha obrigatória no cadastro; na edição, vazia mantém a senha atual. */
public record UsuarioRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Email @Size(max = 150) String email,
        @NotNull NivelAcesso nivel,
        @Size(min = 6, message = "precisa ter pelo menos 6 caracteres") String senha) {
}
