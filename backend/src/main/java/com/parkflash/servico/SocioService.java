package com.parkflash.servico;

import com.parkflash.dominio.ParticipacaoSocio;
import com.parkflash.dominio.Socio;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.erro.RegraInvalidaException;
import com.parkflash.repositorio.SocioRepository;
import com.parkflash.repositorio.UnidadeRepository;
import com.parkflash.web.dto.PercentualUnidadeDto;
import com.parkflash.web.dto.SocioDto;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;

@Service
public class SocioService {

    private final SocioRepository socios;
    private final UnidadeRepository unidades;

    public SocioService(SocioRepository socios, UnidadeRepository unidades) {
        this.socios = socios;
        this.unidades = unidades;
    }

    @Transactional(readOnly = true)
    public List<SocioDto> listar() {
        return socios.findAll(Sort.by("id")).stream().map(SocioDto::de).toList();
    }

    @Transactional
    public SocioDto criar(SocioDto dto) {
        Socio socio = new Socio();
        preencher(socio, dto);
        return SocioDto.de(socios.save(socio));
    }

    @Transactional
    public SocioDto atualizar(Long id, SocioDto dto) {
        Socio socio = buscar(id);
        preencher(socio, dto);
        return SocioDto.de(socio);
    }

    @Transactional
    public void excluir(Long id) {
        socios.delete(buscar(id));
    }

    private Socio buscar(Long id) {
        return socios.findById(id).orElseThrow(() -> new NaoEncontradoException("Sócio não encontrado."));
    }

    /** Percentual zero equivale a não participar da unidade e não é guardado. */
    private void preencher(Socio socio, SocioDto dto) {
        var vistas = new HashSet<Long>();
        List<ParticipacaoSocio> participacoes = dto.percentuais().stream()
                .filter(p -> p.percentual().compareTo(BigDecimal.ZERO) > 0)
                .peek(p -> validar(p, vistas))
                .map(p -> new ParticipacaoSocio(p.unidadeId(), p.percentual()))
                .toList();
        socio.setNome(dto.nome().trim());
        socio.setPercentuais(participacoes);
    }

    private void validar(PercentualUnidadeDto p, HashSet<Long> vistas) {
        if (!vistas.add(p.unidadeId())) {
            throw new RegraInvalidaException("A mesma unidade aparece duas vezes nas participações.");
        }
        if (!unidades.existsById(p.unidadeId())) {
            throw new RegraInvalidaException("Unidade " + p.unidadeId() + " não existe.");
        }
    }
}
