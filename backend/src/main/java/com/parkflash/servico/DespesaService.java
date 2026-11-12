package com.parkflash.servico;

import com.parkflash.dominio.Despesa;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.erro.RegraInvalidaException;
import com.parkflash.repositorio.DespesaRepository;
import com.parkflash.repositorio.UnidadeRepository;
import com.parkflash.web.dto.DespesaDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DespesaService {

    private final DespesaRepository despesas;
    private final UnidadeRepository unidades;

    public DespesaService(DespesaRepository despesas, UnidadeRepository unidades) {
        this.despesas = despesas;
        this.unidades = unidades;
    }

    @Transactional(readOnly = true)
    public List<DespesaDto> listar() {
        return despesas.findAllByOrderByDataDescIdDesc().stream().map(DespesaDto::de).toList();
    }

    @Transactional
    public DespesaDto criar(DespesaDto dto) {
        Despesa despesa = new Despesa();
        preencher(despesa, dto);
        return DespesaDto.de(despesas.save(despesa));
    }

    @Transactional
    public DespesaDto atualizar(Long id, DespesaDto dto) {
        Despesa despesa = buscar(id);
        preencher(despesa, dto);
        return DespesaDto.de(despesa);
    }

    @Transactional
    public void excluir(Long id) {
        despesas.delete(buscar(id));
    }

    private Despesa buscar(Long id) {
        return despesas.findById(id).orElseThrow(() -> new NaoEncontradoException("Despesa não encontrada."));
    }

    private void preencher(Despesa despesa, DespesaDto dto) {
        if (!unidades.existsById(dto.unidadeId())) {
            throw new RegraInvalidaException("Unidade não encontrada.");
        }
        despesa.setData(dto.data());
        despesa.setUnidadeId(dto.unidadeId());
        despesa.setCategoria(dto.categoria());
        despesa.setDescricao(dto.descricao().trim());
        despesa.setValor(CalculoFicha.arredondar(dto.valor()));
    }
}
