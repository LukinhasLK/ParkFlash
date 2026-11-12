package com.parkflash.servico;

import com.parkflash.dominio.DespesaAdicional;
import com.parkflash.dominio.Ficha;
import com.parkflash.dominio.FichaManobrista;
import com.parkflash.erro.ConflitoException;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.erro.RegraInvalidaException;
import com.parkflash.repositorio.FichaRepository;
import com.parkflash.repositorio.ManobristaRepository;
import com.parkflash.repositorio.UnidadeRepository;
import com.parkflash.web.dto.DespesaAdicionalDto;
import com.parkflash.web.dto.FichaRequest;
import com.parkflash.web.dto.FichaResponse;
import com.parkflash.web.dto.ManobristaFichaDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;

@Service
public class FichaService {

    private final FichaRepository fichas;
    private final UnidadeRepository unidades;
    private final ManobristaRepository manobristas;

    public FichaService(FichaRepository fichas, UnidadeRepository unidades, ManobristaRepository manobristas) {
        this.fichas = fichas;
        this.unidades = unidades;
        this.manobristas = manobristas;
    }

    @Transactional(readOnly = true)
    public List<FichaResponse> listar() {
        return fichas.findAllByOrderByDataDescIdDesc().stream().map(FichaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public FichaResponse detalhar(Long id) {
        return FichaResponse.de(buscar(id));
    }

    @Transactional
    public FichaResponse criar(FichaRequest pedido) {
        if (fichas.existsByDataAndUnidadeIdAndTurno(pedido.data(), pedido.unidadeId(), pedido.turno())) {
            throw duplicada();
        }
        Ficha ficha = new Ficha();
        preencher(ficha, pedido);
        return FichaResponse.de(fichas.save(ficha));
    }

    @Transactional
    public FichaResponse atualizar(Long id, FichaRequest pedido) {
        Ficha ficha = buscar(id);
        if (fichas.existsByDataAndUnidadeIdAndTurnoAndIdNot(pedido.data(), pedido.unidadeId(), pedido.turno(), id)) {
            throw duplicada();
        }
        preencher(ficha, pedido);
        return FichaResponse.de(ficha);
    }

    @Transactional
    public void excluir(Long id) {
        fichas.delete(buscar(id));
    }

    private Ficha buscar(Long id) {
        return fichas.findById(id).orElseThrow(() -> new NaoEncontradoException("Ficha não encontrada."));
    }

    private static ConflitoException duplicada() {
        return new ConflitoException("Já existe uma ficha para esta unidade, data e turno.");
    }

    /** Valida a ficha e recalcula os totais — o servidor não confia nos totais do cliente. */
    private void preencher(Ficha ficha, FichaRequest pedido) {
        if (!unidades.existsById(pedido.unidadeId())) {
            throw new RegraInvalidaException("Unidade não encontrada.");
        }

        int canceladas = Objects.requireNonNullElse(pedido.fichasCanceladas(), 0);
        if (pedido.fichaFim() - pedido.fichaInicio() - canceladas < 0) {
            throw new RegraInvalidaException("A ficha final precisa ser maior que a inicial mais as canceladas.");
        }

        List<FichaManobrista> equipe = Objects.requireNonNullElse(pedido.manobristas(), List.<ManobristaFichaDto>of())
                .stream()
                .map(m -> new FichaManobrista(m.manobristaId(), CalculoFicha.arredondar(m.diaria())))
                .toList();
        var ids = new HashSet<Long>();
        for (FichaManobrista m : equipe) {
            if (!ids.add(m.getManobristaId())) {
                throw new RegraInvalidaException("O mesmo manobrista aparece duas vezes na ficha.");
            }
        }
        if (manobristas.countByIdIn(ids) != ids.size()) {
            throw new RegraInvalidaException("Manobrista não encontrado.");
        }

        List<DespesaAdicional> despesas = Objects.requireNonNullElse(pedido.despesasAdicionais(), List.<DespesaAdicionalDto>of())
                .stream()
                .map(d -> new DespesaAdicional(d.descricao().trim(), CalculoFicha.arredondar(d.valor())))
                .toList();

        BigDecimal dinheiro = CalculoFicha.arredondar(Objects.requireNonNullElse(pedido.valorDinheiro(), BigDecimal.ZERO));
        BigDecimal cartao = CalculoFicha.arredondar(Objects.requireNonNullElse(pedido.valorCartao(), BigDecimal.ZERO));
        BigDecimal taxa = CalculoFicha.arredondar(pedido.taxaMaquininha());

        ficha.setData(pedido.data());
        ficha.setUnidadeId(pedido.unidadeId());
        ficha.setTurno(pedido.turno());
        ficha.setFichaInicio(pedido.fichaInicio());
        ficha.setFichaFim(pedido.fichaFim());
        ficha.setFichasCanceladas(canceladas);
        ficha.setTotalCarros(CalculoFicha.totalCarros(pedido.fichaInicio(), pedido.fichaFim(), canceladas));
        ficha.setValorDinheiro(dinheiro);
        ficha.setValorCartao(cartao);
        ficha.setTaxaMaquininha(taxa);
        ficha.setManobristas(equipe);
        ficha.setDespesasAdicionais(despesas);
        ficha.setTotalBruto(CalculoFicha.totalBruto(dinheiro, cartao));
        ficha.setTotalLiquido(CalculoFicha.saldoFinal(dinheiro, cartao, taxa, equipe, despesas));
    }
}
