package com.aep.rotalivre.controller;

import com.aep.rotalivre.controller.dto.AtualizarStatusRequest;
import com.aep.rotalivre.controller.dto.CriarSolicitacaoRequest;
import com.aep.rotalivre.controller.dto.ImagemSolicitacaoRequest;
import com.aep.rotalivre.model.ImagemSolicitacao;
import com.aep.rotalivre.model.Prioridade;
import com.aep.rotalivre.model.Solicitacao;
import com.aep.rotalivre.model.Status;
import com.aep.rotalivre.model.Usuario;
import com.aep.rotalivre.service.ServicoSolicitacoes;
import java.util.Collections;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {

    private final ServicoSolicitacoes servico;

    public SolicitacaoController(ServicoSolicitacoes servico) {
        this.servico = servico;
    }

    @PostMapping
    public Solicitacao criar(@RequestBody CriarSolicitacaoRequest request) {
        Usuario solicitante = new Usuario(request.nome(), request.email(), request.anonimo());
        String protocolo = servico.criarSolicitacao(
                request.categoria(),
                request.descricao(),
                request.localizacao(),
                solicitante,
                Prioridade.valueOf(request.prioridade()),
                mapearImagens(request.imagens())
        );

        return servico.consultarProtocolo(protocolo).orElseThrow();
    }

    @GetMapping
    public List<Solicitacao> listar(
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String prioridade
    ) {
        return servico.listar(bairro, categoria, prioridade);
    }

    @GetMapping("/{protocolo}")
    public ResponseEntity<Solicitacao> consultar(@PathVariable String protocolo) {
        return servico.consultarProtocolo(protocolo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{protocolo}/status")
    public ResponseEntity<Solicitacao> atualizarStatus(
            @PathVariable String protocolo,
            @RequestBody AtualizarStatusRequest request,
            @RequestHeader(value = "X-RotaLivre-Perfil", required = false) String perfil
    ) {
        if (!servico.podeAtualizarStatus(perfil)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        servico.atualizarStatus(
                protocolo,
                Status.valueOf(request.status()),
                request.comentario(),
                request.responsavel()
        );
        return ResponseEntity.ok(servico.consultarProtocolo(protocolo).orElseThrow());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> tratarErroDeValidacao(IllegalArgumentException erro) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(erro.getMessage());
    }

    private List<ImagemSolicitacao> mapearImagens(List<ImagemSolicitacaoRequest> imagens) {
        if (imagens == null) {
            return Collections.emptyList();
        }

        return imagens.stream()
                .filter(imagem -> imagem.conteudo() != null && !imagem.conteudo().isBlank())
                .map(imagem -> new ImagemSolicitacao(
                        imagem.nome(),
                        imagem.tipo(),
                        imagem.tamanho(),
                        imagem.conteudo()
                ))
                .toList();
    }
}
