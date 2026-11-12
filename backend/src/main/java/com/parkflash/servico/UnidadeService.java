package com.parkflash.servico;

import com.parkflash.dominio.Unidade;
import com.parkflash.erro.ConflitoException;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.repositorio.DespesaRepository;
import com.parkflash.repositorio.FichaRepository;
import com.parkflash.repositorio.SocioRepository;
import com.parkflash.repositorio.UnidadeRepository;
import com.parkflash.web.dto.UnidadeDto;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UnidadeService {

    private final UnidadeRepository unidades;
    private final FichaRepository fichas;
    private final DespesaRepository despesas;
    private final SocioRepository socios;

    public UnidadeService(UnidadeRepository unidades, FichaRepository fichas, DespesaRepository despesas, SocioRepository socios) {
        this.unidades = unidades;
        this.fichas = fichas;
        this.despesas = despesas;
        this.socios = socios;
    }

    @Transactional(readOnly = true)
    public List<UnidadeDto> listar() {
        return unidades.findAll(Sort.by("id")).stream().map(UnidadeDto::de).toList();
    }

    @Transactional
    public UnidadeDto criar(UnidadeDto dto) {
        if (unidades.existsByNomeIgnoreCase(dto.nome().trim())) {
            throw new ConflitoException("Já existe uma unidade com esse nome.");
        }
        Unidade unidade = new Unidade();
        preencher(unidade, dto);
        return UnidadeDto.de(unidades.save(unidade));
    }

    @Transactional
    public UnidadeDto atualizar(Long id, UnidadeDto dto) {
        Unidade unidade = buscar(id);
        if (unidades.existsByNomeIgnoreCaseAndIdNot(dto.nome().trim(), id)) {
            throw new ConflitoException("Já existe uma unidade com esse nome.");
        }
        preencher(unidade, dto);
        return UnidadeDto.de(unidade);
    }

    /** Unidade com fichas ou despesas faz parte do histórico e não pode sair; a participação dos sócios sai junto. */
    @Transactional
    public void excluir(Long id) {
        Unidade unidade = buscar(id);
        if (fichas.existsByUnidadeId(id) || despesas.existsByUnidadeId(id)) {
            throw new ConflitoException("Esta unidade tem fichas ou despesas lançadas e não pode ser excluída.");
        }
        socios.findAll().forEach(socio -> {
            var restantes = new ArrayList<>(socio.getPercentuais());
            if (restantes.removeIf(p -> p.getUnidadeId().equals(id))) {
                socio.setPercentuais(restantes);
            }
        });
        socios.flush();
        unidades.delete(unidade);
    }

    public Unidade buscar(Long id) {
        return unidades.findById(id).orElseThrow(() -> new NaoEncontradoException("Unidade não encontrada."));
    }

    private static void preencher(Unidade unidade, UnidadeDto dto) {
        unidade.setNome(dto.nome().trim());
        unidade.setEndereco(dto.endereco().trim());
        unidade.setTelefone(dto.telefone());
    }
}
