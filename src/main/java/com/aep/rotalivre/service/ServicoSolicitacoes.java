package com.aep.rotalivre.service;

import com.aep.rotalivre.model.ImagemSolicitacao;
import com.aep.rotalivre.model.Prioridade;
import com.aep.rotalivre.model.Solicitacao;
import com.aep.rotalivre.model.Status;
import com.aep.rotalivre.model.Usuario;
import com.aep.rotalivre.repository.SolicitacaoRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public class ServicoSolicitacoes {
    private final SolicitacaoRepository repository;

    public ServicoSolicitacoes(SolicitacaoRepository repository) {
        this.repository = repository;
    }

    public String criarSolicitacao(
            String categoria,
            String descricao,
            String localizacao,
            Usuario solicitante,
            Prioridade prioridade,
            List<ImagemSolicitacao> imagens
    ) {
        validarCamposObrigatorios(categoria, descricao, localizacao, prioridade);
        Solicitacao nova = new Solicitacao(categoria, descricao, localizacao, solicitante, prioridade, imagens);
        repository.salvar(nova);
        return nova.getProtocolo();
    }

    public Optional<Solicitacao> consultarProtocolo(String protocolo) {
        return repository.buscarPorProtocolo(protocolo);
    }

    public void atualizarStatus(String protocolo, Status novoStatus, String comentario, String responsavel) {
        validarAtualizacaoStatus(novoStatus, comentario, responsavel);

        Solicitacao solicitacao = repository.buscarPorProtocolo(protocolo)
                .orElseThrow(() -> new IllegalArgumentException("Solicitação não encontrada: " + protocolo));

        solicitacao.atualizarStatus(novoStatus, comentario, responsavel);
    }

    public boolean podeAtualizarStatus(String perfil) {
        return "servidor".equalsIgnoreCase(perfil);
    }

    public List<Solicitacao> listar(String bairro, String categoria, String prioridade) {
        return repository.listarTodas().stream()
                .filter(solicitacao -> textoVazio(bairro)
                        || solicitacao.getLocalizacao().toLowerCase().contains(bairro.toLowerCase()))
                .filter(solicitacao -> textoVazio(categoria)
                        || solicitacao.getCategoria().equalsIgnoreCase(categoria))
                .filter(solicitacao -> textoVazio(prioridade)
                        || solicitacao.getPrioridade().name().equalsIgnoreCase(prioridade))
                .sorted(Comparator.comparing(Solicitacao::getDataCriacao).reversed())
                .toList();
    }

    public List<Solicitacao> listarTodas() {
        return repository.listarTodas();
    }

    public List<Solicitacao> filtrarPorBairro(String bairro) {
        return repository.buscarPorBairro(bairro);
    }

    public List<Solicitacao> filtrarPorCategoria(String categoria) {
        return repository.buscarPorCategoria(categoria);
    }

    private boolean textoVazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private void validarCamposObrigatorios(
            String categoria,
            String descricao,
            String localizacao,
            Prioridade prioridade
    ) {
        if (categoria == null || categoria.isBlank()) {
            throw new IllegalArgumentException("Categoria obrigatória.");
        }
        if (descricao == null || descricao.length() < 10) {
            throw new IllegalArgumentException("Descrição deve ter no mínimo 10 caracteres.");
        }
        if (localizacao == null || localizacao.isBlank()) {
            throw new IllegalArgumentException("Localização obrigatória.");
        }
        if (prioridade == null) {
            throw new IllegalArgumentException("Prioridade obrigatória.");
        }
    }

    private void validarAtualizacaoStatus(Status novoStatus, String comentario, String responsavel) {
        if (novoStatus == null) {
            throw new IllegalArgumentException("Status obrigatório.");
        }
        if (comentario == null || comentario.isBlank()) {
            throw new IllegalArgumentException("Comentário obrigatório para atualizar o status.");
        }
        if (responsavel == null || responsavel.isBlank()) {
            throw new IllegalArgumentException("Responsável obrigatório para atualizar o status.");
        }
    }
}
