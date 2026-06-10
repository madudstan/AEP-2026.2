package com.aep.rotalivre.model;

public class ImagemSolicitacao {
    private final String nome;
    private final String tipo;
    private final long tamanho;
    private final String conteudo;

    public ImagemSolicitacao(String nome, String tipo, long tamanho, String conteudo) {
        this.nome = nome;
        this.tipo = tipo;
        this.tamanho = tamanho;
        this.conteudo = conteudo;
    }

    public String getNome() {
        return nome;
    }

    public String getTipo() {
        return tipo;
    }

    public long getTamanho() {
        return tamanho;
    }

    public String getConteudo() {
        return conteudo;
    }
}
