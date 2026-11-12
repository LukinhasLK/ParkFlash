package com.parkflash.web;

import com.parkflash.servico.ManobristaService;
import com.parkflash.web.dto.ManobristaDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manobristas")
@Tag(name = "Manobristas")
public class ManobristaController {

    private final ManobristaService servico;

    public ManobristaController(ManobristaService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<ManobristaDto> listar() {
        return servico.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManobristaDto criar(@Valid @RequestBody ManobristaDto dto) {
        return servico.criar(dto);
    }

    @PutMapping("/{id}")
    public ManobristaDto atualizar(@PathVariable Long id, @Valid @RequestBody ManobristaDto dto) {
        return servico.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
