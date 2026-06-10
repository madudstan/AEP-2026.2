package com.aep.rotalivre.repository;

import com.aep.rotalivre.model.Solicitacao;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class MemoriaSolicitacaoRepository implements com.aep.rotalivre.repository.SolicitacaoRepository {
    private final List<Solicitacao> solicitacoes = new ArrayList<>();

    @Override
    public void salvar(Solicitacao solicitacao) {
        solicitacoes.add(solicitacao);
    }

    @Override
    public Optional<Solicitacao> buscarPorProtocolo(String protocolo) {
        return solicitacoes.stream()
                .filter(s -> s.getProtocolo().equalsIgnoreCase(protocolo))
                .findFirst();
    }

    @Override
    public List<Solicitacao> listarTodas() {
        return new ArrayList<>(solicitacoes);
    }

    @Override
    public List<Solicitacao> buscarPorBairro(String bairro) {
        return solicitacoes.stream()
                .filter(s -> s.getLocalizacao().toLowerCase().contains(bairro.toLowerCase()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Solicitacao> buscarPorCategoria(String categoria) {
        return solicitacoes.stream()
                .filter(s -> s.getCategoria().equalsIgnoreCase(categoria))
                .collect(Collectors.toList());
    }
}
