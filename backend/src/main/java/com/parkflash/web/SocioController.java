package com.parkflash.web;

import com.parkflash.servico.SocioService;
import com.parkflash.web.dto.SocioDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/socios")
@Tag(name = "Sócios")
public class SocioController {

    private final SocioService servico;

    public SocioController(SocioService servico) {
        this.servico = servico;
    }

    @GetMapping
    public List<SocioDto> listar() {
        return servico.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SocioDto criar(@Valid @RequestBody SocioDto dto) {
        return servico.criar(dto);
    }

    @PutMapping("/{id}")
    public SocioDto atualizar(@PathVariable Long id, @Valid @RequestBody SocioDto dto) {
        return servico.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
