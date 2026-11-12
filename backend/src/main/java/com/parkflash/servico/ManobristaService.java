package com.parkflash.servico;

import com.parkflash.dominio.Manobrista;
import com.parkflash.erro.ConflitoException;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.repositorio.FichaRepository;
import com.parkflash.repositorio.ManobristaRepository;
import com.parkflash.web.dto.ManobristaDto;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ManobristaService {

    private final ManobristaRepository manobristas;
    private final FichaRepository fichas;

    public ManobristaService(ManobristaRepository manobristas, FichaRepository fichas) {
        this.manobristas = manobristas;
        this.fichas = fichas;
    }

    @Transactional(readOnly = true)
    public List<ManobristaDto> listar() {
        return manobristas.findAll(Sort.by("id")).stream().map(ManobristaDto::de).toList();
    }

    @Transactional
    public ManobristaDto criar(ManobristaDto dto) {
        Manobrista manobrista = new Manobrista();
        preencher(manobrista, dto);
        return ManobristaDto.de(manobristas.save(manobrista));
    }

    @Transactional
    public ManobristaDto atualizar(Long id, ManobristaDto dto) {
        Manobrista manobrista = buscar(id);
        preencher(manobrista, dto);
        return ManobristaDto.de(manobrista);
    }

    @Transactional
    public void excluir(Long id) {
        Manobrista manobrista = buscar(id);
        if (fichas.usaManobrista(id)) {
            throw new ConflitoException("Este manobrista aparece em fichas lançadas e não pode ser excluído.");
        }
        manobristas.delete(manobrista);
    }

    private Manobrista buscar(Long id) {
        return manobristas.findById(id).orElseThrow(() -> new NaoEncontradoException("Manobrista não encontrado."));
    }

    private static void preencher(Manobrista manobrista, ManobristaDto dto) {
        manobrista.setNome(dto.nome().trim());
        manobrista.setTelefone(dto.telefone());
        manobrista.setCpf(dto.cpf());
    }
}
