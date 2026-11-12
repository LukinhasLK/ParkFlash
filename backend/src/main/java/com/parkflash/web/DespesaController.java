package com.parkflash.web;

import com.parkflash.servico.DespesaService;
import com.parkflash.web.dto.DespesaDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/despesas")
@Tag(name = "Despesas fixas")
public class DespesaController {

    private final DespesaService servico;

    public DespesaController(DespesaService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<DespesaDto> listar() {
        return servico.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DespesaDto criar(@Valid @RequestBody DespesaDto dto) {
        return servico.criar(dto);
    }

    @PutMapping("/{id}")
    public DespesaDto atualizar(@PathVariable Long id, @Valid @RequestBody DespesaDto dto) {
        return servico.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
