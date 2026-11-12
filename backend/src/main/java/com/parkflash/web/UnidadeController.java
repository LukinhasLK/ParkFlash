package com.parkflash.web;

import com.parkflash.servico.UnidadeService;
import com.parkflash.web.dto.UnidadeDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unidades")
@Tag(name = "Unidades")
public class UnidadeController {

    private final UnidadeService servico;

    public UnidadeController(UnidadeService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<UnidadeDto> listar() {
        return servico.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UnidadeDto criar(@Valid @RequestBody UnidadeDto dto) {
        return servico.criar(dto);
    }

    @PutMapping("/{id}")
    public UnidadeDto atualizar(@PathVariable Long id, @Valid @RequestBody UnidadeDto dto) {
        return servico.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
