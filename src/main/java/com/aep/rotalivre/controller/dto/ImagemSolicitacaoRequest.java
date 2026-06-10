package com.aep.rotalivre.controller.dto;

public record ImagemSolicitacaoRequest(
        String nome,
        String tipo,
        long tamanho,
        String conteudo
) {
}
