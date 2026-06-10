package com.aep.rotalivre.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class HistoricoStatus {
    private final Status statusAnterior;
    private final Status statusNovo;
    private final String comentario;
    private final String responsavel;
    private final LocalDateTime dataHora;

    public HistoricoStatus(Status statusAnterior, Status statusNovo, String comentario, String responsavel) {
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.comentario = comentario;
        this.responsavel = responsavel;
        this.dataHora = LocalDateTime.now();
    }

    public Status getStatusAnterior() {
        return statusAnterior;
    }

    public Status getStatusNovo() {
        return statusNovo;
    }

    public String getComentario() {
        return comentario;
    }

    public String getResponsavel() {
        return responsavel;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    @Override
    public String toString() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return String.format("[%s] %s -> %s | Responsável: %s | Comentário: %s",
                dataHora.format(formatter),
                statusAnterior != null ? statusAnterior.getDescricao() : "INÍCIO",
                statusNovo.getDescricao(),
                responsavel,
                comentario);
    }
}
