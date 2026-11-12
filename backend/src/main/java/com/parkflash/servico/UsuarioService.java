package com.parkflash.servico;

import com.parkflash.dominio.NivelAcesso;
import com.parkflash.dominio.Usuario;
import com.parkflash.erro.ConflitoException;
import com.parkflash.erro.NaoEncontradoException;
import com.parkflash.erro.RegraInvalidaException;
import com.parkflash.repositorio.UsuarioRepository;
import com.parkflash.web.dto.UsuarioRequest;
import com.parkflash.web.dto.UsuarioResponse;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository usuarios, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarios.findAll(Sort.by("id")).stream().map(UsuarioResponse::de).toList();
    }

    @Transactional
    public UsuarioResponse criar(UsuarioRequest pedido) {
        String email = pedido.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um usuário com esse e-mail.");
        }
        if (vazia(pedido.senha())) {
            throw new RegraInvalidaException("Informe uma senha para o novo usuário.");
        }
        Usuario usuario = new Usuario();
        preencher(usuario, pedido, email);
        return UsuarioResponse.de(usuarios.save(usuario));
    }

    /** Senha vazia na edição mantém a senha atual. */
    @Transactional
    public UsuarioResponse atualizar(Long id, UsuarioRequest pedido, Long usuarioLogadoId) {
        Usuario usuario = buscar(id);
        String email = pedido.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ConflitoException("Já existe um usuário com esse e-mail.");
        }
        if (id.equals(usuarioLogadoId) && pedido.nivel() != NivelAcesso.PROPRIETARIO) {
            throw new RegraInvalidaException("Você não pode remover o seu próprio nível de Proprietário.");
        }
        preencher(usuario, pedido, email);
        return UsuarioResponse.de(usuario);
    }

    @Transactional
    public void excluir(Long id, Long usuarioLogadoId) {
        if (id.equals(usuarioLogadoId)) {
            throw new RegraInvalidaException("Você não pode excluir o próprio usuário.");
        }
        usuarios.delete(buscar(id));
    }

    private Usuario buscar(Long id) {
        return usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
    }

    private void preencher(Usuario usuario, UsuarioRequest pedido, String email) {
        usuario.setNome(pedido.nome().trim());
        usuario.setEmail(email);
        usuario.setNivel(pedido.nivel());
        if (!vazia(pedido.senha())) {
            usuario.setSenhaHash(encoder.encode(pedido.senha()));
        }
    }

    private static boolean vazia(String senha) {
        return senha == null || senha.isBlank();
    }
}
