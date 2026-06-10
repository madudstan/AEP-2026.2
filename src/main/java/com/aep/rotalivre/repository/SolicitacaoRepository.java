package com.aep.rotalivre.repository;

import com.aep.rotalivre.model.Solicitacao;
import java.util.List;
import java.util.Optional;

public interface SolicitacaoRepository {
    void salvar(Solicitacao solicitacao);
    Optional<Solicitacao> buscarPorProtocolo(String protocolo);
    List<Solicitacao> listarTodas();
    List<Solicitacao> buscarPorBairro(String bairro);
    List<Solicitacao> buscarPorCategoria(String categoria);
}
