const navItems = document.querySelectorAll(".nav-item");
const screens = document.querySelectorAll(".screen");
const formSolicitacao = document.querySelector("#form-solicitacao");
const formConsulta = document.querySelector("#form-consulta");
const formStatus = document.querySelector("#form-status");
const protocoloCriado = document.querySelector("#protocolo-criado");
const detalheSolicitacao = document.querySelector("#detalhe-solicitacao");
const listaDemandas = document.querySelector("#lista-demandas");
const listaPrefeitura = document.querySelector("#lista-prefeitura");
const anonimo = document.querySelector("#anonimo");
const dadosPessoais = document.querySelector("#dados-pessoais");
const fotosOcorrencia = document.querySelector("#fotos-ocorrencia");
const previewFotos = document.querySelector("#preview-fotos");
const buscaGlobal = document.querySelector("#busca-global");
const usuarioLogado = document.querySelector("#usuario-logado");
const botaoEntrar = document.querySelector("#botao-entrar");
const botaoSair = document.querySelector("#botao-sair");
const modalDetalhes = document.querySelector("#modal-detalhes");
const conteudoModalDetalhes = document.querySelector("#conteudo-modal-detalhes");
const resultadosBuscaGlobal = document.querySelector("#resultados-busca-global");
const mapaDinamico = document.querySelector("#mapa-dinamico");

let imagensSelecionadas = [];
let demandasCache = [];

const STORAGE = {
    usuarios: "rotalivre_usuarios",
    sessao: "rotalivre_sessao",
    protocolos: "rotalivre_protocolos_cidadao",
    notificacoes: "rotalivre_notificacoes",
    acessibilidade: "rotalivre_acessibilidade"
};

const statusLabels = {
    ABERTO: "Aberto",
    TRIAGEM: "Triagem",
    EM_EXECUCAO: "Em execução",
    RESOLVIDO: "Resolvido",
    ENCERRADO: "Encerrado"
};

const prioridadeLabels = {
    BAIXO: "Baixo",
    MEDIO: "Médio",
    ALTO: "Alto"
};

const perfilLabels = {
    cidadao: "Cidadão",
    servidor: "Servidor"
};

const ordemStatus = ["ABERTO", "TRIAGEM", "EM_EXECUCAO", "RESOLVIDO", "ENCERRADO"];

navItems.forEach((item) => {
    item.addEventListener("click", () => abrirTela(item.dataset.screen));
});

document.querySelectorAll("[data-screen-link]").forEach((link) => {
    link.addEventListener("click", () => abrirTela(link.dataset.screenLink));
});

document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        form.dataset.authMode === "cadastro" ? cadastrarUsuario(form) : autenticarUsuario(form);
    });
});

anonimo.addEventListener("change", () => {
    dadosPessoais.classList.toggle("hidden", anonimo.checked);
});

fotosOcorrencia.addEventListener("change", async () => {
    imagensSelecionadas = await Promise.all(Array.from(fotosOcorrencia.files).map(lerImagem));
    renderPreviewFotos();
});

formSolicitacao.addEventListener("submit", async (event) => {
    event.preventDefault();
    const dados = Object.fromEntries(new FormData(formSolicitacao));
    const sessao = obterSessao();
    dados.anonimo = anonimo.checked;
    dados.imagens = imagensSelecionadas;
    delete dados.fotos;

    if (!dados.anonimo && sessao?.tipo === "cidadao") {
        dados.nome = dados.nome || sessao.nome;
        dados.email = dados.email || sessao.email;
    }

    try {
        const solicitacao = await enviarJson("/api/solicitacoes", "POST", dados);
        registrarProtocoloCidadao(solicitacao);
        adicionarNotificacao({
            tipo: "criacao",
            email: solicitacao.solicitante?.email || sessao?.email || "",
            protocolo: solicitacao.protocolo,
            mensagem: `Solicitação ${solicitacao.protocolo} registrada com sucesso.`
        });
        protocoloCriado.classList.remove("hidden");
        protocoloCriado.innerHTML = `
            <strong>Solicitação registrada com sucesso.</strong>
            <p>Protocolo: <span class="protocol">${solicitacao.protocolo}</span></p>
            <p>Prazo previsto: ${formatarData(solicitacao.dataPrevisao)}</p>
        `;
        formSolicitacao.reset();
        imagensSelecionadas = [];
        renderPreviewFotos();
        dadosPessoais.classList.remove("hidden");
        await carregarDemandas();
        renderNotificacoes();
    } catch (erro) {
        mostrarErro(protocoloCriado, erro.message);
    }
});

formConsulta.addEventListener("submit", async (event) => {
    event.preventDefault();
    const protocolo = new FormData(formConsulta).get("protocolo").trim();
    await consultarProtocolo(protocolo, true);
});

formStatus.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!exigirServidor()) return;

    const dados = Object.fromEntries(new FormData(formStatus));
    try {
        const atualizada = await enviarJson(`/api/solicitacoes/${dados.protocolo}/status`, "PATCH", dados, {
            "X-RotaLivre-Perfil": "servidor"
        });
        adicionarNotificacao({
            tipo: "status",
            email: atualizada.solicitante?.email || "",
            protocolo: atualizada.protocolo,
            mensagem: `Status da solicitação ${atualizada.protocolo} alterado para ${statusLabels[atualizada.statusAtual]}.`
        });
        formStatus.reset();
        detalheSolicitacao.innerHTML = renderDetalhe(atualizada);
        abrirTela("prefeitura");
        await carregarDemandas();
        renderRelatorioPublico();
    } catch (erro) {
        alert(erro.message);
    }
});

document.querySelector("#recarregar").addEventListener("click", carregarDemandas);
document.querySelector("#aplicar-filtros").addEventListener("click", () => renderizarDemandas());
["#filtro-categoria", "#filtro-status-visual", "#filtro-periodo"].forEach((seletor) => {
    document.querySelector(seletor)?.addEventListener("change", () => renderizarDemandas());
});
document.querySelector("#fechar-modal").addEventListener("click", fecharModalDetalhes);
modalDetalhes.addEventListener("click", (event) => {
    if (event.target === modalDetalhes) fecharModalDetalhes();
});
botaoSair.addEventListener("click", encerrarSessao);

buscaGlobal.addEventListener("input", () => renderizarDemandas());
document.querySelector("#fonte-menor").addEventListener("click", () => ajustarFonte(-1));
document.querySelector("#fonte-maior").addEventListener("click", () => ajustarFonte(1));
document.querySelector("#contraste").addEventListener("click", alternarContraste);

function cadastrarUsuario(form) {
    const dados = Object.fromEntries(new FormData(form));
    const tipo = form.dataset.authType;
    const resultado = criarResultadoAuth(form);

    if (dados.senha !== dados.confirmarSenha) {
        mostrarErro(resultado, "As senhas informadas não conferem.");
        return;
    }

    const usuarios = obterUsuarios();
    const existe = usuarios.some((usuario) => usuario.email.toLowerCase() === dados.email.toLowerCase() && usuario.tipo === tipo);
    if (existe) {
        mostrarErro(resultado, "Já existe um cadastro com este e-mail para este perfil.");
        return;
    }

    usuarios.push({
        tipo,
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
        cpf: dados.cpf || "",
        matricula: dados.matricula || "",
        secretaria: dados.secretaria || "",
        cargo: dados.cargo || ""
    });
    salvarUsuarios(usuarios);

    resultado.classList.remove("hidden");
    resultado.innerHTML = `<strong>Cadastro realizado com sucesso.</strong><p>Agora você já pode efetuar login.</p>`;
    form.reset();
    abrirTela(tipo === "servidor" ? "login-servidor" : "login-cidadao");
}

function autenticarUsuario(form) {
    const dados = Object.fromEntries(new FormData(form));
    const tipo = form.dataset.authType;
    const resultado = criarResultadoAuth(form);
    const usuario = obterUsuarios().find((item) =>
        item.tipo === tipo &&
        item.email.toLowerCase() === dados.email.toLowerCase() &&
        item.senha === dados.senha
    );

    if (!usuario) {
        mostrarErro(resultado, "E-mail ou senha inválidos para este perfil.");
        return;
    }

    localStorage.setItem(STORAGE.sessao, JSON.stringify({
        tipo: usuario.tipo,
        nome: usuario.nome,
        email: usuario.email
    }));
    form.reset();
    atualizarSessaoVisual();
    abrirTela(usuario.tipo === "servidor" ? "prefeitura" : "minhas-solicitacoes");
}

function abrirTela(id) {
    if (id === "prefeitura" && !exigirServidor()) return;

    navItems.forEach((item) => item.classList.toggle("active", item.dataset.screen === id));
    screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));

    if (["minhas-solicitacoes", "prefeitura", "mapa-problemas", "relatorios"].includes(id)) {
        carregarDemandas();
    }
    if (id === "notificacoes") renderNotificacoes();
    if (id === "relatorios") renderRelatorioPublico();
}

function exigirServidor() {
    const sessao = obterSessao();
    if (sessao?.tipo === "servidor") return true;
    alert("A área da Prefeitura é exclusiva para servidores públicos. Faça login como servidor.");
    abrirTela("login-servidor");
    return false;
}

function encerrarSessao() {
    localStorage.removeItem(STORAGE.sessao);
    atualizarSessaoVisual();
    abrirTela("inicio");
}

function atualizarSessaoVisual() {
    const sessao = obterSessao();
    usuarioLogado.textContent = sessao ? `${sessao.nome} (${perfilLabels[sessao.tipo] || sessao.tipo})` : "Visitante";
    botaoEntrar.classList.toggle("hidden", Boolean(sessao));
    botaoSair.classList.toggle("hidden", !sessao);
    document.querySelector('[data-screen="prefeitura"]').classList.toggle("locked", sessao?.tipo !== "servidor");

    if (sessao?.tipo === "cidadao") {
        const nome = formSolicitacao.elements.nome;
        const email = formSolicitacao.elements.email;
        if (nome && !nome.value) nome.value = sessao.nome;
        if (email && !email.value) email.value = sessao.email;
    }
}

async function consultarProtocolo(protocolo, abrirDetalhes = false) {
    detalheSolicitacao.innerHTML = "";
    try {
        const resposta = await fetch(`/api/solicitacoes/${encodeURIComponent(protocolo)}`);
        if (resposta.status === 404) {
            detalheSolicitacao.innerHTML = `<div class="error">Protocolo não encontrado. Confira o código e tente novamente.</div>`;
            return;
        }
        const solicitacao = await resposta.json();
        detalheSolicitacao.innerHTML = renderDetalhe(solicitacao);
        if (abrirDetalhes) abrirModalDetalhes(solicitacao);
    } catch {
        detalheSolicitacao.innerHTML = `<div class="error">Não foi possível consultar agora.</div>`;
    }
}

async function carregarDemandas() {
    const params = new URLSearchParams();
    const bairro = document.querySelector("#filtro-bairro")?.value;
    const prioridade = document.querySelector("#filtro-prioridade")?.value;
    if (bairro) params.set("bairro", bairro);
    if (prioridade) params.set("prioridade", prioridade);

    const resposta = await fetch(`/api/solicitacoes?${params.toString()}`);
    demandasCache = await resposta.json();
    renderizarDemandas();
    renderRelatorioPublico();
}

function renderizarDemandas() {
    const sessao = obterSessao();
    const termo = normalizar(buscaGlobal.value);
    const demandasFiltradas = demandasCache.filter((solicitacao) => correspondeBusca(solicitacao, termo));
    const demandasMapa = filtrarDemandasDoMapa(demandasFiltradas);
    const demandasCidadao = filtrarDemandasDoCidadao(demandasFiltradas, sessao);
    const resultadosVisiveis = sessao?.tipo === "servidor" ? demandasFiltradas : demandasCidadao;

    renderResultadosBuscaGlobal(resultadosVisiveis, termo);
    atualizarResumo(demandasCidadao);
    listaDemandas.innerHTML = demandasCidadao.length
        ? demandasCidadao.map(renderCard).join("")
        : `<div class="empty">Nenhuma solicitação encontrada.</div>`;

    if (listaPrefeitura) {
        const podeVerTodas = sessao?.tipo === "servidor";
        listaPrefeitura.innerHTML = podeVerTodas
            ? (demandasFiltradas.length ? demandasFiltradas.map(renderCard).join("") : `<div class="empty">Nenhuma denúncia encontrada.</div>`)
            : `<div class="error">Acesso restrito a servidores públicos.</div>`;
    }

    renderMapaInterativo(demandasMapa);

    document.querySelectorAll("[data-detalhes]").forEach((botao) => {
        botao.addEventListener("click", (event) => {
            event.stopPropagation();
            const solicitacao = demandasCache.find((item) => item.protocolo === botao.dataset.detalhes);
            if (solicitacao) abrirModalDetalhes(solicitacao);
        });
    });

    document.querySelectorAll("[data-protocolo]").forEach((botao) => {
        botao.addEventListener("click", () => consultarProtocolo(botao.dataset.protocolo));
    });
}

function renderResultadosBuscaGlobal(demandas, termo) {
    if (!resultadosBuscaGlobal) return;
    if (!termo) {
        resultadosBuscaGlobal.classList.add("hidden");
        resultadosBuscaGlobal.innerHTML = "";
        return;
    }

    const resultados = demandas.slice(0, 8);
    resultadosBuscaGlobal.classList.remove("hidden");
    resultadosBuscaGlobal.innerHTML = resultados.length
        ? `
            <strong>Resultados da busca</strong>
            <div class="global-result-list">
                ${resultados.map((solicitacao) => `
                    <button type="button" class="global-result-item" data-busca-detalhes="${solicitacao.protocolo}">
                        <span class="protocol">#${solicitacao.protocolo}</span>
                        <span>${solicitacao.categoria}</span>
                        <small>${solicitacao.localizacao}</small>
                    </button>
                `).join("")}
            </div>
        `
        : `<div class="empty">Nenhum resultado encontrado para a busca.</div>`;

    resultadosBuscaGlobal.querySelectorAll("[data-busca-detalhes]").forEach((botao) => {
        botao.addEventListener("click", () => {
            const solicitacao = demandasCache.find((item) => item.protocolo === botao.dataset.buscaDetalhes);
            if (solicitacao) abrirModalDetalhes(solicitacao);
        });
    });
}

function filtrarDemandasDoMapa(demandas) {
    const categoria = document.querySelector("#filtro-categoria")?.value || "";
    const status = document.querySelector("#filtro-status-visual")?.value || "";
    const periodo = document.querySelector("#filtro-periodo")?.value || "30";

    return demandas.filter((solicitacao) => {
        const categoriaOk = !categoria || normalizar(solicitacao.categoria) === normalizar(categoria);
        const statusOk = !status || solicitacao.statusAtual === status;
        const periodoOk = correspondePeriodoMapa(solicitacao.dataCriacao, periodo);
        return categoriaOk && statusOk && periodoOk && solicitacao.localizacao;
    });
}

function correspondePeriodoMapa(dataCriacao, periodo) {
    if (!dataCriacao) return true;
    const data = new Date(dataCriacao);
    if (Number.isNaN(data.getTime())) return true;

    const hoje = new Date();
    if (periodo === "ano") {
        return data.getFullYear() === hoje.getFullYear();
    }

    const dias = Number(periodo);
    if (!dias) return true;
    const limite = new Date();
    limite.setDate(hoje.getDate() - dias);
    return data >= limite;
}

function renderMapaInterativo(demandas) {
    if (!mapaDinamico) return;
    mapaDinamico.innerHTML = `
        <div class="map-illustration" aria-hidden="true">
            <div class="map-district district-one"></div>
            <div class="map-district district-two"></div>
            <div class="map-district district-three"></div>
            <div class="map-district district-four"></div>
            <div class="map-road road-main"></div>
            <div class="map-road road-cross"></div>
            <div class="map-road road-diagonal"></div>
            <div class="map-park"></div>
            <div class="map-label">Centro</div>
        </div>
    `;

    if (!demandas.length) {
        mapaDinamico.insertAdjacentHTML("beforeend", `<div class="map-empty">Nenhuma solicitação encontrada para os filtros atuais.</div>`);
        return;
    }

    demandas.forEach((solicitacao, index) => {
        const posicao = obterPosicaoMarcador(solicitacao.protocolo, index);
        const marcador = document.createElement("button");
        marcador.type = "button";
        marcador.className = `map-marker ${classeStatusMapa(solicitacao.statusAtual)}`;
        marcador.style.left = `${posicao.x}%`;
        marcador.style.top = `${posicao.y}%`;
        marcador.setAttribute("aria-label", `Abrir detalhes da solicitação ${solicitacao.protocolo}`);
        marcador.innerHTML = `
            <span>${index + 1}</span>
            <div class="map-popover">
                <strong>#${solicitacao.protocolo}</strong>
                <small>${solicitacao.categoria}</small>
                <small>${solicitacao.localizacao}</small>
                <small>${statusLabels[solicitacao.statusAtual]}</small>
            </div>
        `;
        marcador.addEventListener("click", () => abrirModalDetalhes(solicitacao));
        mapaDinamico.appendChild(marcador);
    });
}

function obterPosicaoMarcador(protocolo, index) {
    const hash = Array.from(protocolo).reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 37;
    return {
        x: 12 + (hash * 17) % 74,
        y: 16 + (hash * 29) % 68
    };
}

function classeStatusMapa(status) {
    return {
        ABERTO: "open",
        TRIAGEM: "triage",
        EM_EXECUCAO: "running",
        RESOLVIDO: "resolved",
        ENCERRADO: "closed"
    }[status] || "open";
}

function filtrarDemandasDoCidadao(demandas, sessao) {
    if (sessao?.tipo === "servidor") return demandas;
    const protocolos = obterProtocolosCidadao();
    if (sessao?.tipo === "cidadao") {
        return demandas.filter((item) => item.solicitante?.email === sessao.email || protocolos.includes(item.protocolo));
    }
    return protocolos.length
        ? demandas.filter((item) => protocolos.includes(item.protocolo))
        : demandas;
}

function correspondeBusca(solicitacao, termo) {
    if (!termo) return true;
    return [
        solicitacao.protocolo,
        `Solicitação ${solicitacao.protocolo}`,
        solicitacao.categoria,
        solicitacao.localizacao,
        solicitacao.descricao,
        statusLabels[solicitacao.statusAtual]
    ].some((valor) => normalizar(valor).includes(termo));
}

function renderCard(solicitacao) {
    const prioridadeClasse = solicitacao.prioridade === "ALTO" ? "high" : solicitacao.prioridade === "MEDIO" ? "medium" : "";

    return `
        <article class="request-card">
            <div class="card-button" data-protocolo="${solicitacao.protocolo}" role="button" tabindex="0">
                <div class="card-top">
                    <span class="protocol">ID #${solicitacao.protocolo}</span>
                    <span class="badge status">${statusLabels[solicitacao.statusAtual]}</span>
                </div>
                <div class="status-line">
                    <span class="badge ${prioridadeClasse}">${prioridadeLabels[solicitacao.prioridade]}</span>
                    <strong>${solicitacao.categoria}</strong>
                </div>
                <p class="description">${solicitacao.descricao}</p>
                ${renderResumoImagens(solicitacao.imagens)}
                <div class="meta-grid">
                    <span>${solicitacao.localizacao}</span>
                    <span>Data: ${formatarDataHora(solicitacao.dataCriacao)}</span>
                    <span>Prazo: ${formatarData(solicitacao.dataPrevisao)}</span>
                </div>
                <div class="card-actions">
                    <button class="secondary" type="button" data-detalhes="${solicitacao.protocolo}">Ver detalhes</button>
                </div>
            </div>
        </article>
    `;
}

function abrirModalDetalhes(solicitacao) {
    conteudoModalDetalhes.innerHTML = renderDetalheCompleto(solicitacao);
    modalDetalhes.classList.remove("hidden");
}

function fecharModalDetalhes() {
    modalDetalhes.classList.add("hidden");
}

function renderDetalheCompleto(solicitacao) {
    return `
        <div class="detail-grid">
            <span><strong>Protocolo:</strong> ${solicitacao.protocolo}</span>
            <span><strong>Categoria:</strong> ${solicitacao.categoria}</span>
            <span><strong>Localização:</strong> ${solicitacao.localizacao}</span>
            <span><strong>Data:</strong> ${formatarDataHora(solicitacao.dataCriacao)}</span>
            <span><strong>Status atual:</strong> ${statusLabels[solicitacao.statusAtual]}</span>
            <span><strong>Prioridade:</strong> ${prioridadeLabels[solicitacao.prioridade]}</span>
        </div>
        <h3>Acompanhamento da solicitação</h3>
        ${renderTimeline(solicitacao)}
        <h3>Descrição completa</h3>
        <p>${solicitacao.descricao}</p>
        <h3>Fotos anexadas</h3>
        ${renderGaleriaImagens(solicitacao.imagens) || "<p>Nenhuma foto anexada.</p>"}
        <h3>Histórico de atualizações</h3>
        <div class="history">
            ${solicitacao.historico?.length ? solicitacao.historico.map(renderHistorico).join("") : "<p>Nenhum histórico registrado.</p>"}
        </div>
    `;
}

function renderTimeline(solicitacao) {
    return `
        <div class="timeline">
            ${ordemStatus.map((status) => `
                <div class="timeline-step ${status === solicitacao.statusAtual ? "current" : ""}">
                    <strong>${statusLabels[status]}</strong>
                    <p>${textoStatus(status)}</p>
                </div>
            `).join("")}
        </div>
    `;
}

function renderDetalhe(solicitacao) {
    return `
        <article class="panel detail">
            <p class="breadcrumb">Início &gt; Minhas solicitações &gt; Solicitação #${solicitacao.protocolo}</p>
            <div class="card-top">
                <div>
                    <h2>${solicitacao.categoria}</h2>
                    <p>ID #${solicitacao.protocolo} - Criada em ${formatarDataHora(solicitacao.dataCriacao)}</p>
                </div>
                <span class="badge status">${statusLabels[solicitacao.statusAtual]}</span>
            </div>
            <h2>Detalhes da sua solicitação</h2>
            <p class="description">${solicitacao.descricao}</p>
            ${renderGaleriaImagens(solicitacao.imagens)}
        </article>
    `;
}

function renderRelatorioPublico() {
    const relatorio = document.querySelector("#relatorio-publico");
    if (!relatorio) return;
    const total = demandasCache.length;
    const contagem = demandasCache.reduce((acc, item) => {
        acc[item.statusAtual] = (acc[item.statusAtual] || 0) + 1;
        return acc;
    }, {});
    relatorio.innerHTML = `
        <article><strong>${total}</strong><span>Total de denúncias</span></article>
        <article><strong>${contagem.ABERTO || 0}</strong><span>Abertas</span></article>
        <article><strong>${contagem.TRIAGEM || 0}</strong><span>Em triagem</span></article>
        <article><strong>${contagem.EM_EXECUCAO || 0}</strong><span>Em execução</span></article>
        <article><strong>${contagem.RESOLVIDO || 0}</strong><span>Resolvidas</span></article>
        <article><strong>${contagem.ENCERRADO || 0}</strong><span>Encerradas</span></article>
    `;
}

function renderNotificacoes() {
    const lista = document.querySelector("#lista-notificacoes");
    if (!lista) return;
    const sessao = obterSessao();
    const protocolos = obterProtocolosCidadao();
    const notificacoes = obterNotificacoes().filter((item) => {
        if (sessao?.tipo === "servidor") return true;
        return item.email === sessao?.email || protocolos.includes(item.protocolo);
    });

    lista.innerHTML = notificacoes.length
        ? notificacoes.map((item) => `
            <article class="notification-item">
                <strong>${item.mensagem}</strong>
                <small>${formatarDataHora(item.dataHora)}</small>
            </article>
        `).join("")
        : `<div class="empty">Nenhuma notificação no momento.</div>`;
}

function atualizarResumo(demandas) {
    const contagem = demandas.reduce((acc, item) => {
        acc[item.statusAtual] = (acc[item.statusAtual] || 0) + 1;
        return acc;
    }, {});
    document.querySelector("#total-aberto").textContent = `${contagem.ABERTO || 0} aberto(s)`;
    document.querySelector("#total-triagem").textContent = `${contagem.TRIAGEM || 0} em triagem`;
    document.querySelector("#total-execucao").textContent = `${contagem.EM_EXECUCAO || 0} em execução`;
    document.querySelector("#total-resolvido").textContent = `${contagem.RESOLVIDO || 0} resolvido(s)`;
}

async function enviarJson(url, metodo, dados, headersExtras = {}) {
    const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json", ...headersExtras },
        body: JSON.stringify(dados)
    });

    if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(mensagem || "Não foi possível concluir a operação.");
    }

    return resposta.json();
}

function lerImagem(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve({
            nome: arquivo.name,
            tipo: arquivo.type,
            tamanho: arquivo.size,
            conteudo: leitor.result
        });
        leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        leitor.readAsDataURL(arquivo);
    });
}

function renderPreviewFotos() {
    previewFotos.innerHTML = imagensSelecionadas.length
        ? imagensSelecionadas.map((imagem) => `
            <figure>
                <img src="${imagem.conteudo}" alt="Foto anexada: ${imagem.nome}">
                <figcaption>${imagem.nome}</figcaption>
            </figure>
        `).join("")
        : "";
}

function renderResumoImagens(imagens = []) {
    return imagens.length ? `<p class="attachment-count">${imagens.length} foto(s) anexada(s)</p>` : "";
}

function renderGaleriaImagens(imagens = []) {
    if (!imagens.length) return "";
    return `
        <div class="photo-gallery">
            ${imagens.map((imagem) => `
                <figure>
                    <img src="${imagem.conteudo}" alt="Foto anexada: ${imagem.nome}">
                    <figcaption>${imagem.nome}</figcaption>
                </figure>
            `).join("")}
        </div>
    `;
}

function renderHistorico(item) {
    return `
        <div class="history-item">
            <strong>${statusLabels[item.statusAnterior] || "Início"} -> ${statusLabels[item.statusNovo]}</strong>
            <p>${item.comentario || "Sem comentário informado."}</p>
            <small>${item.responsavel} - ${formatarDataHora(item.dataHora)}</small>
        </div>
    `;
}

function textoStatus(status) {
    return {
        ABERTO: "Sua solicitação foi registrada com sucesso.",
        TRIAGEM: "A solicitação foi encaminhada para o setor responsável.",
        EM_EXECUCAO: "O setor responsável está trabalhando na resolução.",
        RESOLVIDO: "O problema foi solucionado.",
        ENCERRADO: "A solicitação foi encerrada."
    }[status];
}

function criarResultadoAuth(form) {
    const existente = form.nextElementSibling;
    if (existente?.classList.contains("result")) return existente;
    const resultado = document.createElement("article");
    resultado.className = "result hidden";
    resultado.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("afterend", resultado);
    return resultado;
}

function mostrarErro(elemento, mensagem) {
    elemento.classList.remove("hidden");
    elemento.innerHTML = `<div class="error">${mensagem}</div>`;
}

function obterUsuarios() {
    return JSON.parse(localStorage.getItem(STORAGE.usuarios) || "[]");
}

function salvarUsuarios(usuarios) {
    localStorage.setItem(STORAGE.usuarios, JSON.stringify(usuarios));
}

function obterSessao() {
    return JSON.parse(localStorage.getItem(STORAGE.sessao) || "null");
}

function obterProtocolosCidadao() {
    return JSON.parse(localStorage.getItem(STORAGE.protocolos) || "[]");
}

function registrarProtocoloCidadao(solicitacao) {
    const protocolos = new Set(obterProtocolosCidadao());
    protocolos.add(solicitacao.protocolo);
    localStorage.setItem(STORAGE.protocolos, JSON.stringify([...protocolos]));
}

function obterNotificacoes() {
    return JSON.parse(localStorage.getItem(STORAGE.notificacoes) || "[]");
}

function adicionarNotificacao(dados) {
    const notificacoes = obterNotificacoes();
    notificacoes.unshift({
        ...dados,
        dataHora: new Date().toISOString()
    });
    localStorage.setItem(STORAGE.notificacoes, JSON.stringify(notificacoes.slice(0, 80)));
}

function aplicarAcessibilidade() {
    const config = JSON.parse(localStorage.getItem(STORAGE.acessibilidade) || '{"fonte":0,"contraste":false}');
    document.documentElement.style.fontSize = `${100 + config.fonte * 8}%`;
    document.body.classList.toggle("high-contrast", config.contraste);
}

function ajustarFonte(delta) {
    const config = JSON.parse(localStorage.getItem(STORAGE.acessibilidade) || '{"fonte":0,"contraste":false}');
    config.fonte = Math.max(-2, Math.min(3, config.fonte + delta));
    localStorage.setItem(STORAGE.acessibilidade, JSON.stringify(config));
    aplicarAcessibilidade();
}

function alternarContraste() {
    const config = JSON.parse(localStorage.getItem(STORAGE.acessibilidade) || '{"fonte":0,"contraste":false}');
    config.contraste = !config.contraste;
    localStorage.setItem(STORAGE.acessibilidade, JSON.stringify(config));
    aplicarAcessibilidade();
}

function normalizar(valor = "") {
    return String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatarData(valor) {
    return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarDataHora(valor) {
    return new Date(valor).toLocaleString("pt-BR");
}

aplicarAcessibilidade();
atualizarSessaoVisual();
carregarDemandas();
