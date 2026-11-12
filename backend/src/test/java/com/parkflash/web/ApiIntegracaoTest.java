package com.parkflash.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:parkflash-teste;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH")
class ApiIntegracaoTest {

    private static final String PROPRIETARIO = "lucasrodrigues.10@icloud.com";
    private static final String GERENTE = "pedro@email.com";
    private static final String OPERADOR = "dario@email.com";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    private String token(String email, String senha) throws Exception {
        String corpo = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identificador\":\"" + email + "\",\"senha\":\"" + senha + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("token").asText();
    }

    private String token(String email) throws Exception {
        return token(email, "123456");
    }

    private static MockHttpServletRequestBuilder comToken(MockHttpServletRequestBuilder req, String token) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    private static String ficha(String data, String turno, String manobristas) {
        return """
                {"data":"%s","unidadeId":1,"turno":"%s","fichaInicio":100,"fichaFim":150,"fichasCanceladas":2,
                 "valorDinheiro":500,"valorCartao":1000,"taxaMaquininha":2,
                 "manobristas":[%s],
                 "despesasAdicionais":[{"descricao":"Lanche","valor":30}],
                 "totalBruto":999999,"totalLiquido":999999,"totalCarros":999}
                """.formatted(data, turno, manobristas);
    }

    @Test
    void loginDevolveTokenEUsuarioSemSenha() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identificador\":\"Lucas\",\"senha\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyString())))
                .andExpect(jsonPath("$.usuario.nivel").value("Proprietário"))
                .andExpect(jsonPath("$.usuario.senha").doesNotExist())
                .andExpect(jsonPath("$.usuario.senhaHash").doesNotExist());
    }

    @Test
    void senhaErradaETokenAusenteOuAdulteradoSao401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identificador\":\"" + OPERADOR + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("E-mail/usuário ou senha incorretos."));
        mvc.perform(get("/api/fichas")).andExpect(status().isUnauthorized());

        String adulterado = token(OPERADOR).replaceAll(".$", "x");
        mvc.perform(comToken(get("/api/fichas"), adulterado)).andExpect(status().isUnauthorized());
    }

    @Test
    void permissoesPorNivelNoServidor() throws Exception {
        String operador = token(OPERADOR);
        String gerente = token(GERENTE);
        String proprietario = token(PROPRIETARIO);

        mvc.perform(comToken(get("/api/fichas"), operador)).andExpect(status().isOk());
        mvc.perform(comToken(get("/api/despesas"), operador)).andExpect(status().isForbidden());
        mvc.perform(comToken(get("/api/relatorios/resumo?ano=2026"), operador)).andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/fichas/1"), operador)).andExpect(status().isForbidden());
        mvc.perform(comToken(post("/api/unidades").content("{\"nome\":\"X\",\"endereco\":\"Y\"}"), operador))
                .andExpect(status().isForbidden());

        mvc.perform(comToken(get("/api/despesas"), gerente)).andExpect(status().isOk());
        mvc.perform(comToken(get("/api/usuarios"), gerente)).andExpect(status().isForbidden());
        mvc.perform(comToken(get("/api/relatorios/divisao-lucro?ano=2026&unidadeId=1"), gerente)).andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/socios/1"), gerente)).andExpect(status().isForbidden());

        mvc.perform(comToken(get("/api/usuarios"), proprietario))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].senhaHash").doesNotExist());
    }

    @Test
    void servidorCalculaTotaisEBloqueiaDuplicadaEManobristaRepetido() throws Exception {
        String operador = token(OPERADOR);
        String equipe = "{\"manobristaId\":1,\"diaria\":80},{\"manobristaId\":2,\"diaria\":90}";

        // 500 + (1000 − 2%) − 170 − 30 = 1280
        mvc.perform(comToken(post("/api/fichas"), operador).content(ficha("2030-01-10", "noite", equipe)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalCarros").value(48))
                .andExpect(jsonPath("$.totalBruto").value(1500.0))
                .andExpect(jsonPath("$.totalLiquido").value(1280.0))
                .andExpect(jsonPath("$.turno").value("noite"));

        mvc.perform(comToken(post("/api/fichas"), operador).content(ficha("2030-01-10", "noite", equipe)))
                .andExpect(status().isConflict());

        String repetido = "{\"manobristaId\":1,\"diaria\":80},{\"manobristaId\":1,\"diaria\":80}";
        mvc.perform(comToken(post("/api/fichas"), operador).content(ficha("2030-01-11", "dia", repetido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem", containsString("duas vezes")));
    }

    @Test
    void naoExcluiUnidadeOuManobristaComHistorico() throws Exception {
        String gerente = token(GERENTE);
        mvc.perform(comToken(delete("/api/unidades/1"), gerente)).andExpect(status().isConflict());
        mvc.perform(comToken(delete("/api/manobristas/1"), gerente)).andExpect(status().isConflict());
    }

    @Test
    void resumoDescontaDespesasFixasComoOFront() throws Exception {
        mvc.perform(comToken(get("/api/relatorios/resumo?mes=6&ano=2026"), token(GERENTE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lucroFichas").value(5377.25))
                .andExpect(jsonPath("$.despesasFixas").value(8420.0))
                .andExpect(jsonPath("$.resultado").value(-3042.75));
    }

    @Test
    void novoUsuarioEntraComSenhaGuardadaComoHashETrocaASenha() throws Exception {
        String proprietario = token(PROPRIETARIO);
        mvc.perform(comToken(post("/api/usuarios"), proprietario)
                        .content("{\"nome\":\"Ana\",\"email\":\"Ana@Email.com\",\"nivel\":\"Gerente\",\"senha\":\"segredo1\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ana@email.com"))
                .andExpect(jsonPath("$.senha").doesNotExist());

        mvc.perform(comToken(post("/api/usuarios"), proprietario)
                        .content("{\"nome\":\"Ana 2\",\"email\":\"ana@email.com\",\"nivel\":\"Operador\",\"senha\":\"segredo1\"}"))
                .andExpect(status().isConflict());

        String ana = token("ana@email.com", "segredo1");
        mvc.perform(comToken(put("/api/auth/senha"), ana).content("{\"senhaAtual\":\"errada\",\"novaSenha\":\"nova1234\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(put("/api/auth/senha"), ana).content("{\"senhaAtual\":\"segredo1\",\"novaSenha\":\"nova1234\"}"))
                .andExpect(status().isNoContent());
        token("ana@email.com", "nova1234");
    }

    @Test
    void usuarioExcluidoPerdeOAcessoMesmoComTokenValido() throws Exception {
        String operador = token(OPERADOR);
        mvc.perform(comToken(delete("/api/usuarios/3"), token(PROPRIETARIO))).andExpect(status().isNoContent());
        mvc.perform(comToken(get("/api/fichas"), operador)).andExpect(status().isUnauthorized());
    }

    @Test
    void validacaoDevolveMensagemDoCampo() throws Exception {
        JsonNode erro = json.readTree(mvc.perform(comToken(post("/api/despesas"), token(GERENTE))
                        .content("{\"data\":\"2026-06-01\",\"unidadeId\":1,\"categoria\":\"Aluguel\",\"descricao\":\"\",\"valor\":0}"))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString());
        org.assertj.core.api.Assertions.assertThat(erro.get("campos").has("descricao")).isTrue();
        org.assertj.core.api.Assertions.assertThat(erro.get("campos").has("valor")).isTrue();
    }
}
