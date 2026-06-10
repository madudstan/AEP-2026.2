package com.aep.rotalivre;

import com.aep.rotalivre.model.Prioridade;
import com.aep.rotalivre.model.Status;
import com.aep.rotalivre.model.Usuario;
import com.aep.rotalivre.repository.MemoriaSolicitacaoRepository;
import com.aep.rotalivre.repository.SolicitacaoRepository;
import com.aep.rotalivre.service.ServicoSolicitacoes;
import java.util.Collections;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class RotalivreApplication {

    public static void main(String[] args) {
        SpringApplication.run(RotalivreApplication.class, args);
    }

    @Bean
    SolicitacaoRepository solicitacaoRepository() {
        return new MemoriaSolicitacaoRepository();
    }

    @Bean
    ServicoSolicitacoes servicoSolicitacoes(SolicitacaoRepository repository) {
        return new ServicoSolicitacoes(repository);
    }

    @Bean
    CommandLineRunner carregarDadosExemplo(ServicoSolicitacoes servico) {
        return args -> {
            String primeiro = servico.criarSolicitacao(
                    "Calçada irregular",
                    "Calçada quebrada impede a passagem de cadeira de rodas perto da escola.",
                    "Jardim América - Rua das Flores",
                    new Usuario("Heloisa Saito", "heloisa@email.com", false),
                    Prioridade.ALTO,
                    Collections.emptyList()
            );

            servico.atualizarStatus(primeiro, Status.TRIAGEM,
                    "Demanda recebida e encaminhada para avaliação da equipe de obras.",
                    "Atendente Paula");

            servico.criarSolicitacao(
                    "Falta de rampa",
                    "Entrada da unidade de saúde não possui rampa acessível.",
                    "Centro - Avenida Brasil",
                    new Usuario("", "", true),
                    Prioridade.MEDIO,
                    Collections.emptyList()
            );
        };
    }
}
