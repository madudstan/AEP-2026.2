package com.aep.rotalivre.model;

public enum Status {
    ABERTO("ABERTO"),
    TRIAGEM("EM TRIAGEM"),
    EM_EXECUCAO("EM EXECUÇÃO"),
    RESOLVIDO("RESOLVIDO"),
    ENCERRADO("ENCERRADO");

    private final String descricao;

    Status(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
