package com.parkflash.web;

import com.parkflash.seguranca.UsuarioLogado;
import com.parkflash.servico.UsuarioService;
import com.parkflash.web.dto.UsuarioRequest;
import com.parkflash.web.dto.UsuarioResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuários")
public class UsuarioController {

    private final UsuarioService servico;

    public UsuarioController(UsuarioService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return servico.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse criar(@Valid @RequestBody UsuarioRequest pedido) {
        return servico.criar(pedido);
    }

    @PutMapping("/{id}")
    public UsuarioResponse atualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequest pedido,
                                     @AuthenticationPrincipal UsuarioLogado logado) {
        return servico.atualizar(id, pedido, logado.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id, @AuthenticationPrincipal UsuarioLogado logado) {
        servico.excluir(id, logado.id());
    }
}
