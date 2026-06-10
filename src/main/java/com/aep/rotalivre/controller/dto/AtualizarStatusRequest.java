package com.aep.rotalivre.controller.dto;

public record AtualizarStatusRequest(
        String status,
        String comentario,
        String responsavel
) {
}
