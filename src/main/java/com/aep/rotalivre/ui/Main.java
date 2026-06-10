package com.aep.rotalivre.ui;

import com.aep.rotalivre.model.Prioridade;
import com.aep.rotalivre.model.Solicitacao;
import com.aep.rotalivre.model.Status;
import com.aep.rotalivre.model.Usuario;
import com.aep.rotalivre.repository.MemoriaSolicitacaoRepository;
import com.aep.rotalivre.service.ServicoSolicitacoes;

import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Scanner;

public class Main {
    private static final Scanner scanner = new Scanner(System.in);
    private static final ServicoSolicitacoes servico = new ServicoSolicitacoes(new MemoriaSolicitacaoRepository());

    public static final String ANSI_RESET = "\u001B[0m";
    public static final String ANSI_BOLD = "\u001B[1m";

    public static void main(String[] args) {
        exibirCabecalho();

        while (true) {
            exibirMenuPrincipal();
            String opcao = scanner.nextLine();

            switch (opcao) {
                case "1": menuCidadao(); break;
                case "2": menuGestor(); break;
                case "0": System.out.println("\nSaindo do RotaLivre. Até mais!"); System.exit(0);
                default: System.out.println("\nOpção inválida. Por favor, escolha uma opção válida.");
            }
        }
    }

    private static void exibirCabecalho() {
        System.out.println(" " + negrito("RotaLivre"));
        System.out.println("- Sistema de Acessibilidade Urbana");
    }

    private static void exibirMenuPrincipal() {
        System.out.println("\n=======================================================");
        System.out.println("                 ESCOLHA SEU PERFIL");
        System.out.println("=======================================================");
        System.out.println(" [1] Cidadão");
        System.out.println(" [2] Gestor público");
        System.out.println(" [0] Sair");
        System.out.println("=======================================================");
        System.out.print("Digite sua opção: ");
    }

    private static void menuCidadao() {
        while (true) {
            System.out.println("\n=======================================================");
            System.out.println("                   MENU CIDADÃO");
            System.out.println("=======================================================");
            System.out.println(" [1] Registrar nova solicitação");
            System.out.println(" [2] Consultar solicitação por protocolo");
            System.out.println(" [0] Voltar ao menu principal");
            System.out.println("=======================================================");
            System.out.print("Digite sua opção: ");

            String opcao = scanner.nextLine();
            switch (opcao) {
                case "1": registrarSolicitacao(); break;
                case "2": consultarProtocolo(); break;
                case "0": return;
                default: System.out.println("\nOpção inválida. Por favor, escolha uma opção válida.");
            }
        }
    }

    private static void registrarSolicitacao() {
        try {
            System.out.println("\n=======================================================");
            System.out.println("          NOVA SOLICITAÇÃO DE ACESSIBILIDADE");
            System.out.println("=======================================================");

            System.out.print("Deseja ser anônimo? (S/N): ");
            boolean anonimo = scanner.nextLine().equalsIgnoreCase("S");

            String nome = "";
            String email = "";
            if (!anonimo) {
                System.out.print("Nome: ");
                nome = scanner.nextLine();
                System.out.print("E-mail: ");
                email = scanner.nextLine();
            }
            Usuario usuario = new Usuario(nome, email, anonimo);

            System.out.println("\n" + negrito("CATEGORIAS DISPONÍVEIS:\n"));
            System.out.println(" [1] Calçada irregular");
            System.out.println(" [2] Falta de rampa");
            System.out.println(" [3] Semáforo sem sinal sonoro");
            System.out.println(" [4] Ônibus sem elevador");
            System.out.println(" [5] Prédio público inacessível");
            System.out.println(" [6] Outros");

            System.out.print("\nEscolha a categoria (1-6): ");
            String optCat = scanner.nextLine();
            String categoria = switch (optCat) {
                case "1" -> "Calçada irregular";
                case "2" -> "Falta de rampa";
                case "3" -> "Semáforo sem sinal sonoro";
                case "4" -> "Ônibus sem elevador";
                case "5" -> "Prédio público inacessível";
                case "6" -> {
                    System.out.print("Digite a nova categoria: ");
                    yield scanner.nextLine();
                }
                default -> {
                    System.out.println("Opção inválida, usando 'Geral'.");
                    yield "Geral";
                }
            };

            System.out.print("Descrição (mín. 10 caracteres): ");
            String descricao = scanner.nextLine();
            System.out.print("Localização (bairro/rua): ");
            String localizacao = scanner.nextLine();

            System.out.println("\nImpacto na mobilidade:");
            System.out.println(" [1] Baixo");
            System.out.println(" [2] Médio");
            System.out.println(" [3] Alto");
            System.out.print("Escolha o nível de impacto: ");
            int imp = Integer.parseInt(scanner.nextLine());
            Prioridade prioridade = (imp == 3) ? Prioridade.ALTO : (imp == 2) ? Prioridade.MEDIO : Prioridade.BAIXO;

            String protocolo = servico.criarSolicitacao(
                    categoria,
                    descricao,
                    localizacao,
                    usuario,
                    prioridade,
                    Collections.emptyList()
            );
            System.out.println("\n=======================================================");
            System.out.println("                  SOLICITAÇÃO REGISTRADA!");
            System.out.println("=======================================================");
            System.out.println(String.format("Protocolo: %s", protocolo));
            System.out.println(String.format("Prazo estimado: %s dias", prioridade.getDiasSla()));
        } catch (Exception e) {
            System.out.println("\nERRO: Não foi possível registrar a solicitação. Detalhes: " + e.getMessage());
        }
    }

    private static void consultarProtocolo() {
        System.out.println("\n=======================================================");
        System.out.println("          CONSULTAR SOLICITAÇÃO POR PROTOCOLO");
        System.out.println("=======================================================");
        System.out.print("Informe o protocolo: ");
        String protocolo = scanner.nextLine();

        servico.consultarProtocolo(protocolo).ifPresentOrElse(
                Main::exibirDetalhes,
                () -> System.out.println("\nProtocolo não encontrado. Verifique e tente novamente.")
        );
    }

    private static void exibirDetalhes(Solicitacao solicitacao) {
        System.out.println("\n=======================================================");
        System.out.println("             DETALHES DA SOLICITAÇÃO");
        System.out.println("=======================================================");
        System.out.println(String.format("Protocolo: %s", solicitacao.getProtocolo()));
        System.out.println(String.format("Status: %s", solicitacao.getStatusAtual().getDescricao()));
        System.out.println(String.format("Categoria: %s", solicitacao.getCategoria()));
        System.out.println(String.format("Local: %s", solicitacao.getLocalizacao()));
        System.out.println(String.format("Descrição: %s", solicitacao.getDescricao()));
        System.out.println(String.format("Previsão: %s", solicitacao.getDataPrevisao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        System.out.println("=======================================================");
        System.out.println("Histórico de atualizações");
        solicitacao.getHistorico().forEach(h -> System.out.println(h.toString()));
    }

    private static void menuGestor() {
        while (true) {
            System.out.println("\n=======================================================");
            System.out.println("                  PAINEL DO GESTOR");
            System.out.println("=======================================================");
            System.out.println(" [1] Listar todas as demandas");
            System.out.println(" [2] Atualizar status de demanda");
            System.out.println(" [0] Voltar ao menu principal");
            System.out.println("=======================================================");
            System.out.print("Digite sua opção: ");

            String opcao = scanner.nextLine();
            switch (opcao) {
                case "1": listarDemandas(); break;
                case "2": atualizarStatus(); break;
                case "0": return;
                default: System.out.println("\nOpção inválida. Por favor, escolha uma opção válida.");
            }
        }
    }

    private static void listarDemandas() {
        System.out.println("\n=======================================================");
        System.out.println("                  LISTA DE DEMANDAS");
        System.out.println("=======================================================");
        List<Solicitacao> lista = servico.listarTodas();
        if (lista.isEmpty()) {
            System.out.println("\nNenhuma demanda registrada no momento.");
            return;
        }

        lista.forEach(solicitacao -> {
            System.out.println("-------------------------------------------------------");
            System.out.println(String.format("Protocolo: %s", solicitacao.getProtocolo()));
            System.out.println(String.format("Status: %s", solicitacao.getStatusAtual().getDescricao()));
            System.out.println(String.format("Categoria: %s", solicitacao.getCategoria()));
            System.out.println(String.format("Local: %s", solicitacao.getLocalizacao()));
            System.out.println(String.format("Descrição: %s", solicitacao.getDescricao()));
            System.out.println(String.format("Previsão: %s", solicitacao.getDataPrevisao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        });
    }

    private static void atualizarStatus() {
        System.out.println("\n=======================================================");
        System.out.println("             ATUALIZAR STATUS DE DEMANDA");
        System.out.println("=======================================================");
        System.out.print("Informe o protocolo da demanda: ");
        String protocolo = scanner.nextLine();

        System.out.println("\nNovos status disponíveis:");
        System.out.println(" [1] Triagem");
        System.out.println(" [2] Em execução");
        System.out.println(" [3] Resolvido");
        System.out.println(" [4] Encerrado");
        System.out.print("Escolha o novo status: ");
        int opt = Integer.parseInt(scanner.nextLine());
        Status novo = switch (opt) {
            case 1 -> Status.TRIAGEM;
            case 2 -> Status.EM_EXECUCAO;
            case 3 -> Status.RESOLVIDO;
            case 4 -> Status.ENCERRADO;
            default -> Status.ABERTO;
        };

        System.out.print("Comentário: ");
        String comentario = scanner.nextLine();
        System.out.print("Seu nome (responsável): ");
        String responsavel = scanner.nextLine();

        try {
            servico.atualizarStatus(protocolo, novo, comentario, responsavel);
            System.out.println("\nStatus da demanda atualizado com sucesso!");
        } catch (Exception e) {
            System.out.println("\nERRO: Não foi possível atualizar o status. Detalhes: " + e.getMessage());
        }
    }

    private static String negrito(String texto) {
        return ANSI_BOLD + texto + ANSI_RESET;
    }
}
