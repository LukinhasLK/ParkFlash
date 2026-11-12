package com.parkflash.dominio;

import jakarta.persistence.*;

@Entity
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NivelAcesso nivel;

    /** Hash BCrypt — a senha em texto nunca é guardada nem devolvida pela API. */
    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public NivelAcesso getNivel() { return nivel; }
    public void setNivel(NivelAcesso nivel) { this.nivel = nivel; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
}
