package com.aep.rotalivre.model;

public enum Prioridade {
    BAIXO(10, "Baixo Impacto"),
    MEDIO(7, "Médio Impacto"),
    ALTO(3, "Alto Impacto");

    private final int diasSla;
    private final String descricao;

    Prioridade(int diasSla, String descricao) {
        this.diasSla = diasSla;
        this.descricao = descricao;
    }

    public int getDiasSla() {
        return diasSla;
    }

    public String getDescricao() {
        return descricao;
    }
}
