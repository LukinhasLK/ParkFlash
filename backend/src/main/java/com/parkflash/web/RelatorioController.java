package com.parkflash.web;

import com.parkflash.servico.RelatorioService;
import com.parkflash.web.dto.DivisaoLucro;
import com.parkflash.web.dto.ResumoPeriodo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/relatorios")
@Tag(name = "Relatórios")
public class RelatorioController {

    private final RelatorioService servico;

    public RelatorioController(RelatorioService servico) {
        this.servico = servico;
    }

    @GetMapping("/resumo")
    @Operation(summary = "Lucro das fichas, despesas fixas e resultado (sem mês = ano inteiro; sem unidade = todas)")
    public ResumoPeriodo resumo(@RequestParam(required = false) Integer mes, @RequestParam int ano,
                                @RequestParam(required = false) Long unidadeId) {
        return servico.resumo(mes, ano, unidadeId);
    }

    @GetMapping("/divisao-lucro")
    @Operation(summary = "Rateio do resultado da unidade entre os sócios (somente Proprietário)")
    public DivisaoLucro divisao(@RequestParam(required = false) Integer mes, @RequestParam int ano,
                                @RequestParam Long unidadeId) {
        return servico.divisao(mes, ano, unidadeId);
    }
}
