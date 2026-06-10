package com.aep.rotalivre.controller.dto;

import java.util.List;

public record CriarSolicitacaoRequest(
        String categoria,
        String descricao,
        String localizacao,
        boolean anonimo,
        String nome,
        String email,
        String prioridade,
        List<ImagemSolicitacaoRequest> imagens
) {
}
