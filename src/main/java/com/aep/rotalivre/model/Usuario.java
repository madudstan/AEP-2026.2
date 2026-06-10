package com.aep.rotalivre.model;

public class Usuario {
    private final String nome;
    private final String email;
    private final boolean anonimo;

    public Usuario(String nome, String email, boolean anonimo) {
        this.nome = anonimo ? "Anônimo" : nome;
        this.email = anonimo ? "" : email;
        this.anonimo = anonimo;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public boolean isAnonimo() {
        return anonimo;
    }

    @Override
    public String toString() {
        return anonimo ? "Usuário anônimo" : nome + " (" + email + ")";
    }
}
