package com.parkflash.web;

import com.parkflash.servico.FichaService;
import com.parkflash.web.dto.FichaRequest;
import com.parkflash.web.dto.FichaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fichas")
@Tag(name = "Fichas")
public class FichaController {

    private final FichaService servico;

    public FichaController(FichaService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<FichaResponse> listar() {
        return servico.listar();
    }

    @GetMapping("/{id}")
    public FichaResponse detalhar(@PathVariable Long id) {
        return servico.detalhar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Lança uma ficha; totais são calculados pelo servidor")
    public FichaResponse criar(@Valid @RequestBody FichaRequest pedido) {
        return servico.criar(pedido);
    }

    @PutMapping("/{id}")
    public FichaResponse atualizar(@PathVariable Long id, @Valid @RequestBody FichaRequest pedido) {
        return servico.atualizar(id, pedido);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
