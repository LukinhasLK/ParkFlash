package com.parkflash.servico;

import com.parkflash.dominio.Despesa;
import com.parkflash.dominio.Ficha;
import com.parkflash.erro.RegraInvalidaException;
import com.parkflash.repositorio.DespesaRepository;
import com.parkflash.repositorio.FichaRepository;
import com.parkflash.repositorio.SocioRepository;
import com.parkflash.web.dto.DivisaoLucro;
import com.parkflash.web.dto.ResumoPeriodo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class RelatorioService {

    private final FichaRepository fichas;
    private final DespesaRepository despesas;
    private final SocioRepository socios;

    public RelatorioService(FichaRepository fichas, DespesaRepository despesas, SocioRepository socios) {
        this.fichas = fichas;
        this.despesas = despesas;
        this.socios = socios;
    }

    @Transactional(readOnly = true)
    public ResumoPeriodo resumo(Integer mes, int ano, Long unidadeId) {
        LocalDate inicio = inicio(mes, ano);
        LocalDate fim = fim(mes, ano);

        List<Ficha> doPeriodo = fichas.findByDataBetweenOrderByDataDescIdDesc(inicio, fim).stream()
                .filter(f -> unidadeId == null || f.getUnidadeId().equals(unidadeId))
                .toList();
        List<Despesa> despesasDoPeriodo = despesas.findByDataBetweenOrderByDataDescIdDesc(inicio, fim).stream()
                .filter(d -> unidadeId == null || d.getUnidadeId().equals(unidadeId))
                .toList();

        BigDecimal bruto = soma(doPeriodo.stream().map(Ficha::getTotalBruto).toList());
        BigDecimal lucro = soma(doPeriodo.stream().map(Ficha::getTotalLiquido).toList());
        BigDecimal fixas = soma(despesasDoPeriodo.stream().map(Despesa::getValor).toList());
        int carros = doPeriodo.stream().mapToInt(Ficha::getTotalCarros).sum();

        return new ResumoPeriodo(mes, ano, unidadeId, doPeriodo.size(), carros, bruto, lucro, fixas,
                CalculoFicha.resultado(lucro, fixas));
    }

    /** Rateio do resultado da unidade conforme o percentual de cada sócio nela. */
    @Transactional(readOnly = true)
    public DivisaoLucro divisao(Integer mes, int ano, Long unidadeId) {
        BigDecimal resultado = resumo(mes, ano, unidadeId).resultado();
        List<DivisaoLucro.Parte> partes = socios.findAll().stream()
                .flatMap(socio -> socio.getPercentuais().stream()
                        .filter(p -> p.getUnidadeId().equals(unidadeId))
                        .map(p -> new DivisaoLucro.Parte(socio.getId(), socio.getNome(), p.getPercentual(),
                                CalculoFicha.parteDoSocio(resultado, p.getPercentual()))))
                .toList();
        return new DivisaoLucro(mes, ano, unidadeId, resultado, partes);
    }

    private static LocalDate inicio(Integer mes, int ano) {
        validarMes(mes);
        return mes == null ? LocalDate.of(ano, 1, 1) : LocalDate.of(ano, mes, 1);
    }

    private static LocalDate fim(Integer mes, int ano) {
        return mes == null ? LocalDate.of(ano, 12, 31) : YearMonth.of(ano, mes).atEndOfMonth();
    }

    private static void validarMes(Integer mes) {
        if (mes != null && (mes < 1 || mes > 12)) {
            throw new RegraInvalidaException("Mês deve estar entre 1 e 12.");
        }
    }

    private static BigDecimal soma(List<BigDecimal> valores) {
        return CalculoFicha.arredondar(valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add));
    }
}
