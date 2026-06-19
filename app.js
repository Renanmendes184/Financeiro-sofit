/**
 * Sofit - Controlador Principal (app.js)
 * Gerencia navegação, renderização de telas e eventos.
 */

// ─── Estado global da aplicação ───────────────────────────────────────────────
const App = (() => {
  let abaAtiva = 'inicio';
  let mesAtivo = DB.getMesAtual();

  // ─── Inicialização ─────────────────────────────────────────────────────────
  const init = () => {
    aplicarTema();
    registrarServiceWorker();
    configurarNavegacao();
    configurarBotaoTema();
    configurarInstallPrompt();
    renderizarAba('inicio');

    // Detecta hash na URL (atalho de venda)
    if (window.location.hash === '#venda') {
      setTimeout(() => renderizarAba('inicio'), 100);
    }
  };

  // ─── Tema claro/escuro ─────────────────────────────────────────────────────
  const aplicarTema = () => {
    const tema = DB.getTema();
    document.documentElement.setAttribute('data-tema', tema);
    const btn = document.getElementById('btn-tema');
    if (btn) btn.textContent = tema === 'dark' ? '☀️' : '🌙';
  };

  const configurarBotaoTema = () => {
    const btn = document.getElementById('btn-tema');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const atual = DB.getTema();
      const novo  = atual === 'dark' ? 'light' : 'dark';
      DB.saveTema(novo);
      aplicarTema();
    });
  };

  // ─── Service Worker ────────────────────────────────────────────────────────
  const registrarServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (e) {
        console.warn('[App] Service Worker não registrado:', e);
      }
    }
  };

  // ─── Prompt de instalação PWA ──────────────────────────────────────────────
  let deferredPrompt = null;
  const configurarInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('btn-instalar');
      if (btn) btn.style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      const btn = document.getElementById('btn-instalar');
      if (btn) btn.style.display = 'none';
      UI.toast('Sofit instalado com sucesso!', 'sucesso');
    });

    const btn = document.getElementById('btn-instalar');
    if (btn) {
      btn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') UI.toast('Instalando...', 'info');
          deferredPrompt = null;
        }
      });
    }
  };

  // ─── Navegação entre abas ──────────────────────────────────────────────────
  const configurarNavegacao = () => {
    document.querySelectorAll('[data-aba]').forEach(btn => {
      btn.addEventListener('click', () => {
        renderizarAba(btn.dataset.aba);
      });
    });
  };

  const renderizarAba = (aba) => {
    abaAtiva = aba;
    document.querySelectorAll('[data-aba]').forEach(btn => {
      btn.classList.toggle('ativo', btn.dataset.aba === aba);
    });

    const main = document.getElementById('conteudo-principal');
    if (!main) return;

    main.innerHTML = '';
    main.classList.remove('fade-in');
    void main.offsetWidth; // reflow para reiniciar animação
    main.classList.add('fade-in');

    switch (aba) {
      case 'inicio':      renderInicio(main); break;
      case 'financeiro':  renderFinanceiro(main); break;
      case 'relatorios':  renderRelatorios(main); break;
      case 'config':      renderConfig(main); break;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ABA: INÍCIO
  // ═══════════════════════════════════════════════════════════════════════════
  const renderInicio = (container) => {
    const resumo = DB.calcularResumo(mesAtivo);
    const config = DB.getConfig();
    const vendas = DB.getVendas(mesAtivo);

    const saudeIcone = { verde: '🟢', amarelo: '🟡', vermelho: '🔴' };
    const saudeTexto = {
      verde:    'Loja saudável',
      amarelo:  'Atenção',
      vermelho: 'Contas em risco',
    };

    container.innerHTML = `
      <!-- Header da tela inicial -->
      <div class="inicio-header">
        <div class="saude-badge saude-${resumo.saude}">
          <span class="saude-emoji">${saudeIcone[resumo.saude]}</span>
          <span class="saude-texto">${saudeTexto[resumo.saude]}</span>
        </div>
        <div class="mes-badge">${UI.mesExtenso(mesAtivo)}</div>
      </div>

      <!-- Card da Meta -->
      <div class="card card-destaque">
        <div class="card-header">
          <span class="card-titulo">Meta do Mês</span>
          ${resumo.metaAtingida ? '<span class="badge badge-sucesso">Concluída ✓</span>' : ''}
        </div>
        ${resumo.meta === 0 ? `
          <p class="alerta-config">Configure a meta nas <a href="#" class="link-config">Configurações</a>.</p>
        ` : `
          <div class="barra-wrap">
            <div class="barra-fundo">
              <div class="barra-progresso ${resumo.metaAtingida ? 'barra-completa' : ''}"
                   id="barra-meta" style="width:0%"></div>
            </div>
            <span class="barra-percent" id="barra-percent">0%</span>
          </div>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Meta</span>
              <span class="meta-valor">${UI.moeda(resumo.meta)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Reservado</span>
              <span class="meta-valor positivo">${UI.moeda(resumo.valorReservado)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Restante</span>
              <span class="meta-valor ${resumo.valorRestante > 0 ? 'negativo' : 'positivo'}">${UI.moeda(resumo.valorRestante)}</span>
            </div>
          </div>
          ${resumo.metaAtingida ? `
            <div class="meta-atingida">✅ Contas do mês garantidas</div>
          ` : ''}
        `}
      </div>

      <!-- Saldo Livre (aparece ao atingir a meta) -->
      ${resumo.metaAtingida ? `
      <div class="card card-saldo-livre">
        <div class="saldo-livre-header">
          <span>💸 Saldo Livre</span>
          <span class="saldo-livre-valor" id="saldo-livre-valor">${UI.moeda(resumo.saldoLivre)}</span>
        </div>
        <p class="saldo-livre-desc">Tudo que entrou além da meta</p>
      </div>
      ` : ''}

      <!-- Registrar Venda -->
      <div class="card">
        <h3 class="card-titulo">Registrar Venda</h3>
        <div class="form-group">
          <label class="label" for="venda-valor">Valor vendido hoje</label>
          <input class="input" id="venda-valor" type="text" inputmode="numeric"
                 placeholder="0,00" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="label" for="venda-horario">Horário do fechamento</label>
          <input class="input" id="venda-horario" type="time">
        </div>
        <button class="btn btn-primario btn-full" id="btn-salvar-venda">Salvar Venda</button>
      </div>

      <!-- Histórico diário -->
      <div class="card">
        <h3 class="card-titulo">Histórico do Mês</h3>
        <div id="historico-lista">
          ${renderHistorico(vendas)}
        </div>
      </div>
    `;

    // Pré-preenche horário atual
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2,'0');
    const m = String(agora.getMinutes()).padStart(2,'0');
    document.getElementById('venda-horario').value = `${h}:${m}`;

    // Máscara no input de valor
    UI.aplicarMascaraMoeda(document.getElementById('venda-valor'));

    // Link para configurações
    const linkConf = container.querySelector('.link-config');
    if (linkConf) linkConf.addEventListener('click', (e) => {
      e.preventDefault(); renderizarAba('config');
    });

    // Anima barra de progresso
    if (resumo.meta > 0) {
      setTimeout(() => {
        const barra   = document.getElementById('barra-meta');
        const percent = document.getElementById('barra-percent');
        if (barra) UI.animarBarra(barra, resumo.percentual);
        if (percent) {
          let p = 0;
          const interval = setInterval(() => {
            p += 2;
            if (p >= resumo.percentual) { p = resumo.percentual; clearInterval(interval); }
            percent.textContent = Math.round(p) + '%';
          }, 14);
        }
      }, 100);
    }

    // Evento salvar venda
    document.getElementById('btn-salvar-venda').addEventListener('click', salvarVenda);
  };

  const renderHistorico = (vendas) => {
    if (!vendas.length) return UI.emptyState('📋', 'Nenhuma venda registrada este mês');
    const sorted = [...vendas].reverse();
    return `<div class="historico-lista">
      ${sorted.map(v => `
        <div class="historico-item">
          <div class="historico-info">
            <span class="historico-data">${UI.data(v.criadoEm)}</span>
            <span class="historico-horario">${v.horario || '--'}</span>
          </div>
          <span class="historico-valor positivo">${UI.moeda(v.valor)}</span>
        </div>
      `).join('')}
    </div>`;
  };

  const salvarVenda = () => {
    const valorInput   = document.getElementById('venda-valor');
    const horarioInput = document.getElementById('venda-horario');
    const valor  = UI.parseMoeda(valorInput.value);
    const horario = horarioInput.value;

    if (!valor || valor <= 0) {
      UI.toast('Informe um valor válido', 'erro');
      valorInput.focus();
      return;
    }

    const ok = DB.saveVenda({ valor, horario }, mesAtivo);
    if (ok) {
      // Recalcula saldo livre se meta já atingida
      const resumo = DB.calcularResumo(mesAtivo);
      if (resumo.metaAtingida) {
        DB.adicionarSaldoLivre(0, mesAtivo); // garante existência
        const excedente = DB.getTotalVendas(mesAtivo) - resumo.meta;
        DB.setSaldoLivre(Math.max(0, excedente), mesAtivo);
      }
      UI.toast('Venda registrada!', 'sucesso');
      valorInput.value = '';
      renderizarAba('inicio');
    } else {
      UI.toast('Erro ao salvar venda', 'erro');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ABA: FINANCEIRO
  // ═══════════════════════════════════════════════════════════════════════════
  const renderFinanceiro = (container) => {
    const resumo = DB.calcularResumo(mesAtivo);
    const config = DB.getConfig();
    const pl     = DB.getProlabore(mesAtivo);

    const renan    = DB.getTotalProlabore('renan', mesAtivo);
    const nathalia = DB.getTotalProlabore('nathalia', mesAtivo);
    const dispRenan    = Math.max(0, (config.prolaboreRenan || 0) - renan);
    const dispNathalia = Math.max(0, (config.prolaboreNathalia || 0) - nathalia);

    const sangrias   = DB.getSangrias(mesAtivo);
    const reposicoes = DB.getReposicao(mesAtivo);
    const emergencias = DB.getEmergencias(mesAtivo);

    container.innerHTML = `
      <!-- PRÓ-LABORE -->
      <h2 class="secao-titulo">Pró-labore</h2>

      <!-- Renan -->
      <div class="card card-pessoa">
        <div class="pessoa-header">
          <div class="pessoa-avatar">R</div>
          <div class="pessoa-info">
            <span class="pessoa-nome">Renan</span>
            <span class="pessoa-limite">Limite: ${UI.moeda(config.prolaboreRenan)}</span>
          </div>
        </div>
        <div class="prolab-grid">
          <div class="prolab-item">
            <span class="prolab-label">Retirado</span>
            <span class="prolab-valor negativo">${UI.moeda(renan)}</span>
          </div>
          <div class="prolab-item">
            <span class="prolab-label">Disponível</span>
            <span class="prolab-valor ${dispRenan > 0 ? 'positivo' : 'negativo'}">${UI.moeda(dispRenan)}</span>
          </div>
        </div>
        <button class="btn btn-secundario btn-full" data-pessoa="renan" data-acao="retirar-prolab">
          + Nova Retirada
        </button>
        ${renderListaProlabore(pl.renan)}
      </div>

      <!-- Nathalia -->
      <div class="card card-pessoa">
        <div class="pessoa-header">
          <div class="pessoa-avatar pessoa-avatar-n">N</div>
          <div class="pessoa-info">
            <span class="pessoa-nome">Nathalia</span>
            <span class="pessoa-limite">Limite: ${UI.moeda(config.prolaboreNathalia)}</span>
          </div>
        </div>
        <div class="prolab-grid">
          <div class="prolab-item">
            <span class="prolab-label">Retirado</span>
            <span class="prolab-valor negativo">${UI.moeda(nathalia)}</span>
          </div>
          <div class="prolab-item">
            <span class="prolab-label">Disponível</span>
            <span class="prolab-valor ${dispNathalia > 0 ? 'positivo' : 'negativo'}">${UI.moeda(dispNathalia)}</span>
          </div>
        </div>
        <button class="btn btn-secundario btn-full" data-pessoa="nathalia" data-acao="retirar-prolab">
          + Nova Retirada
        </button>
        ${renderListaProlabore(pl.nathalia)}
      </div>

      <!-- REPOSIÇÃO -->
      <h2 class="secao-titulo">Reposição de Estoque</h2>
      <div class="card">
        <div class="saldo-row">
          <span>Saldo disponível</span>
          <span class="saldo-valor">${UI.moeda(resumo.saldoLivre)}</span>
        </div>
        <button class="btn btn-secundario btn-full" id="btn-nova-compra">+ Nova Compra</button>
        ${renderListaSimples(reposicoes, '🛍️', 'Nenhuma compra registrada')}
      </div>

      <!-- SANGRIA -->
      <h2 class="secao-titulo">Sangria de Caixa</h2>
      <div class="card">
        <button class="btn btn-secundario btn-full" id="btn-nova-sangria">+ Nova Sangria</button>
        ${renderListaSimples(sangrias, '💵', 'Nenhuma sangria registrada')}
      </div>

      <!-- EMERGÊNCIA -->
      <h2 class="secao-titulo">Fundo de Emergência</h2>
      <div class="card">
        <div class="saldo-row">
          <span>Saldo disponível</span>
          <span class="saldo-valor">${UI.moeda(resumo.saldoLivre)}</span>
        </div>
        <button class="btn btn-secundario btn-full" id="btn-nova-emergencia">+ Registrar Gasto</button>
        ${renderListaSimples(emergencias, '🚨', 'Nenhum gasto emergencial')}
      </div>
    `;

    // ─── Eventos ───────────────────────────────────────────────────────────
    container.querySelectorAll('[data-acao="retirar-prolab"]').forEach(btn => {
      btn.addEventListener('click', () => abrirModalProlabore(btn.dataset.pessoa));
    });

    document.getElementById('btn-nova-compra')?.addEventListener('click', abrirModalReposicao);
    document.getElementById('btn-nova-sangria')?.addEventListener('click', abrirModalSangria);
    document.getElementById('btn-nova-emergencia')?.addEventListener('click', abrirModalEmergencia);
  };

  const renderListaProlabore = (lista) => {
    if (!lista || !lista.length) return UI.emptyState('💼', 'Nenhuma retirada ainda');
    return `<div class="lista-movimentos">
      ${[...lista].reverse().slice(0,5).map(r => `
        <div class="movimento-item">
          <div>
            <span class="mov-desc">${r.descricao || '--'}</span>
            <span class="mov-tipo">${r.tipo || ''}</span>
          </div>
          <span class="mov-valor negativo">${UI.moeda(r.valor)}</span>
        </div>
      `).join('')}
    </div>`;
  };

  const renderListaSimples = (lista, emptyIcon, emptyMsg) => {
    if (!lista || !lista.length) return UI.emptyState(emptyIcon, emptyMsg);
    return `<div class="lista-movimentos">
      ${[...lista].reverse().slice(0,5).map(m => `
        <div class="movimento-item">
          <div>
            <span class="mov-desc">${m.descricao || m.fornecedor || '--'}</span>
            <span class="mov-data">${UI.data(m.criadoEm)}</span>
          </div>
          <span class="mov-valor negativo">${UI.moeda(m.valor)}</span>
        </div>
      `).join('')}
    </div>`;
  };

  // ─── Modal Pró-labore ──────────────────────────────────────────────────────
  const abrirModalProlabore = (pessoa) => {
    const nomeExibido = pessoa === 'renan' ? 'Renan' : 'Nathalia';
    const modal = UI.abrirModal(`Retirada — ${nomeExibido}`, `
      <div class="form-group">
        <label class="label">Valor</label>
        <input class="input" id="pl-valor" type="text" inputmode="numeric" placeholder="0,00">
      </div>
      <div class="form-group">
        <label class="label">Descrição</label>
        <input class="input" id="pl-desc" type="text" placeholder="Ex: Salário quinzenal">
      </div>
      <div class="form-group">
        <label class="label">Tipo</label>
        <select class="input" id="pl-tipo">
          <option value="pix">PIX conta pessoal</option>
          <option value="reinvestimento">Reinvestimento na loja</option>
          <option value="outro">Outro</option>
        </select>
      </div>
    `, (modal) => {
      const valor = UI.parseMoeda(modal.querySelector('#pl-valor').value);
      const desc  = modal.querySelector('#pl-desc').value.trim();
      const tipo  = modal.querySelector('#pl-tipo').value;
      if (!valor || valor <= 0) { UI.toast('Informe um valor', 'erro'); return; }

      DB.saveProlaboreRetirada(pessoa, { valor, descricao: desc, tipo }, mesAtivo);

      // Se reinvestimento, adiciona ao saldo livre
      if (tipo === 'reinvestimento') {
        DB.adicionarSaldoLivre(valor, mesAtivo);
        UI.toast('Valor reinvestido ao Saldo Livre', 'info');
      } else {
        UI.toast('Retirada registrada!', 'sucesso');
      }
      renderizarAba('financeiro');
    });

    UI.aplicarMascaraMoeda(modal.querySelector('#pl-valor'));
  };

  // ─── Modal Reposição ───────────────────────────────────────────────────────
  const abrirModalReposicao = () => {
    const modal = UI.abrirModal('Nova Compra — Reposição', `
      <div class="form-group">
        <label class="label">Valor</label>
        <input class="input" id="rep-valor" type="text" inputmode="numeric" placeholder="0,00">
      </div>
      <div class="form-group">
        <label class="label">Fornecedor</label>
        <input class="input" id="rep-fornecedor" type="text" placeholder="Nome do fornecedor">
      </div>
      <div class="form-group">
        <label class="label">Descrição</label>
        <input class="input" id="rep-desc" type="text" placeholder="O que foi comprado">
      </div>
    `, (modal) => {
      const valor      = UI.parseMoeda(modal.querySelector('#rep-valor').value);
      const fornecedor = modal.querySelector('#rep-fornecedor').value.trim();
      const desc       = modal.querySelector('#rep-desc').value.trim();
      if (!valor || valor <= 0) { UI.toast('Informe um valor', 'erro'); return; }
      DB.saveReposicao({ valor, fornecedor, descricao: desc }, mesAtivo);
      UI.toast('Compra registrada!', 'sucesso');
      renderizarAba('financeiro');
    });
    UI.aplicarMascaraMoeda(modal.querySelector('#rep-valor'));
  };

  // ─── Modal Sangria ─────────────────────────────────────────────────────────
  const abrirModalSangria = () => {
    const modal = UI.abrirModal('Nova Sangria de Caixa', `
      <div class="form-group">
        <label class="label">Valor</label>
        <input class="input" id="san-valor" type="text" inputmode="numeric" placeholder="0,00">
      </div>
      <div class="form-group">
        <label class="label">Categoria</label>
        <select class="input" id="san-cat">
          <option value="cafe">Café</option>
          <option value="agua">Água</option>
          <option value="limpeza">Limpeza</option>
          <option value="troco">Troco</option>
          <option value="gasolina">Gasolina</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Descrição (opcional)</label>
        <input class="input" id="san-desc" type="text" placeholder="Detalhes">
      </div>
    `, (modal) => {
      const valor = UI.parseMoeda(modal.querySelector('#san-valor').value);
      const cat   = modal.querySelector('#san-cat').value;
      const desc  = modal.querySelector('#san-desc').value.trim();
      if (!valor || valor <= 0) { UI.toast('Informe um valor', 'erro'); return; }
      const cats = { cafe:'Café', agua:'Água', limpeza:'Limpeza', troco:'Troco', gasolina:'Gasolina', outro:'Outro' };
      DB.saveSangria({ valor, categoria: cat, descricao: desc || cats[cat] }, mesAtivo);
      UI.toast('Sangria registrada!', 'sucesso');
      renderizarAba('financeiro');
    });
    UI.aplicarMascaraMoeda(modal.querySelector('#san-valor'));
  };

  // ─── Modal Emergência ──────────────────────────────────────────────────────
  const abrirModalEmergencia = () => {
    const modal = UI.abrirModal('Gasto Emergencial', `
      <div class="form-group">
        <label class="label">Valor</label>
        <input class="input" id="eme-valor" type="text" inputmode="numeric" placeholder="0,00">
      </div>
      <div class="form-group">
        <label class="label">Descrição</label>
        <input class="input" id="eme-desc" type="text" placeholder="Descreva o gasto">
      </div>
    `, (modal) => {
      const valor = UI.parseMoeda(modal.querySelector('#eme-valor').value);
      const desc  = modal.querySelector('#eme-desc').value.trim();
      if (!valor || valor <= 0) { UI.toast('Informe um valor', 'erro'); return; }
      DB.saveEmergencia({ valor, descricao: desc }, mesAtivo);
      UI.toast('Gasto emergencial registrado!', 'sucesso');
      renderizarAba('financeiro');
    });
    UI.aplicarMascaraMoeda(modal.querySelector('#eme-valor'));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ABA: RELATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRelatorios = (container) => {
    const hoje  = UI.hojeISO();
    const inicio = UI.primeiroDiaMes();

    container.innerHTML = `
      <h2 class="secao-titulo">Relatórios</h2>
      <div class="card">
        <div class="filtro-grid">
          <div class="form-group">
            <label class="label">Data inicial</label>
            <input class="input" type="date" id="rel-inicio" value="${inicio}" max="${hoje}">
          </div>
          <div class="form-group">
            <label class="label">Data final</label>
            <input class="input" type="date" id="rel-fim" value="${hoje}" max="${hoje}">
          </div>
        </div>
        <button class="btn btn-primario btn-full" id="btn-aplicar-rel">Aplicar Filtro</button>
      </div>

      <div id="resultado-relatorio"></div>
    `;

    document.getElementById('btn-aplicar-rel').addEventListener('click', () => {
      const inicio = document.getElementById('rel-inicio').value;
      const fim    = document.getElementById('rel-fim').value;
      if (!inicio || !fim) { UI.toast('Selecione o período', 'erro'); return; }
      if (inicio > fim)    { UI.toast('Data inicial deve ser anterior à final', 'erro'); return; }
      gerarRelatorio(inicio, fim);
    });

    // Gera relatório do mês automaticamente
    gerarRelatorio(inicio, hoje);
  };

  const gerarRelatorio = (inicio, fim) => {
    const config = DB.getConfig();
    const dados  = DB.getRelatorio(inicio, fim);
    const result = document.getElementById('resultado-relatorio');
    if (!result) return;

    const totalContas = (config.aluguel || 0) + (config.agua || 0) +
                        (config.luz || 0) + (config.internet || 0) +
                        (config.das || 0) + (config.funcionarios || 0) +
                        (config.prolaboreRenan || 0) + (config.prolaboreNathalia || 0);

    const saldoLivre = dados.totalVendas - totalContas - dados.totalReposicao -
                       dados.totalSangrias - dados.totalEmergencias;

    result.innerHTML = `
      <!-- Resumo em cards -->
      <div class="resumo-grid">
        <div class="card card-resumo-item">
          <span class="resumo-label">Total Vendido</span>
          <span class="resumo-valor positivo">${UI.moeda(dados.totalVendas)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Total Contas</span>
          <span class="resumo-valor negativo">${UI.moeda(totalContas)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Pró-labore Renan</span>
          <span class="resumo-valor negativo">${UI.moeda(dados.prolaboreRenan)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Pró-labore Nathalia</span>
          <span class="resumo-valor negativo">${UI.moeda(dados.prolaboreNathalia)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Reposição</span>
          <span class="resumo-valor negativo">${UI.moeda(dados.totalReposicao)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Sangrias</span>
          <span class="resumo-valor negativo">${UI.moeda(dados.totalSangrias)}</span>
        </div>
        <div class="card card-resumo-item">
          <span class="resumo-label">Emergências</span>
          <span class="resumo-valor negativo">${UI.moeda(dados.totalEmergencias)}</span>
        </div>
        <div class="card card-resumo-item destaque">
          <span class="resumo-label">Saldo Livre</span>
          <span class="resumo-valor ${saldoLivre >= 0 ? 'positivo' : 'negativo'}">${UI.moeda(saldoLivre)}</span>
        </div>
      </div>

      <!-- Histórico completo -->
      ${dados.vendas.length ? `
      <div class="card">
        <h3 class="card-titulo">Vendas</h3>
        <div class="lista-movimentos">
          ${[...dados.vendas].reverse().map(v => `
            <div class="movimento-item">
              <div>
                <span class="mov-desc">Venda do dia</span>
                <span class="mov-data">${UI.data(v.criadoEm)} ${v.horario ? '· ' + v.horario : ''}</span>
              </div>
              <span class="mov-valor positivo">${UI.moeda(v.valor)}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      ${[...dados.renan, ...dados.nathalia].length ? `
      <div class="card">
        <h3 class="card-titulo">Pró-labores</h3>
        <div class="lista-movimentos">
          ${[...dados.renan.map(r => ({...r, _nome: 'Renan'})),
             ...dados.nathalia.map(n => ({...n, _nome: 'Nathalia'}))]
            .sort((a,b) => new Date(b.criadoEm) - new Date(a.criadoEm))
            .map(r => `
            <div class="movimento-item">
              <div>
                <span class="mov-desc">${r._nome} · ${r.descricao || '--'}</span>
                <span class="mov-data">${UI.data(r.criadoEm)}</span>
              </div>
              <span class="mov-valor negativo">${UI.moeda(r.valor)}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Botões de exportação -->
      <div class="export-btns">
        <button class="btn btn-ghost" id="btn-export-pdf">📄 Exportar PDF</button>
        <button class="btn btn-ghost" id="btn-export-img">🖼️ Exportar Imagem</button>
        <button class="btn btn-ghost" id="btn-export-xls" disabled title="Em breve">📊 Excel (em breve)</button>
      </div>
    `;

    // Guarda dados para exportar
    result.dataset.inicio = inicio;
    result.dataset.fim    = fim;

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
      Exportar.exportarPDF(dados, config);
    });
    document.getElementById('btn-export-img')?.addEventListener('click', () => {
      Exportar.exportarImagem(dados, config);
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ABA: CONFIGURAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════
  const renderConfig = (container) => {
    const config = DB.getConfig();

    const campo = (id, label, valor, tipo = 'text', placeholder = '') => `
      <div class="form-group">
        <label class="label" for="${id}">${label}</label>
        <input class="input ${tipo === 'moeda' ? 'input-moeda' : ''}"
               id="${id}" type="${tipo === 'moeda' ? 'text' : tipo}"
               ${tipo === 'moeda' ? 'inputmode="numeric"' : ''}
               value="${valor || ''}" placeholder="${placeholder}">
      </div>`;

    const fmtConf = (v) => v ? (v/1).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '';

    container.innerHTML = `
      <h2 class="secao-titulo">Configurações</h2>

      <div class="card">
        <h3 class="card-titulo">Loja</h3>
        ${campo('cfg-nome', 'Nome da loja', config.nomeLoja, 'text', 'Ex: Sofit')}
        ${campo('cfg-meta', 'Meta mensal (R$)', fmtConf(config.metaMensal), 'moeda')}
      </div>

      <div class="card">
        <h3 class="card-titulo">Contas Fixas</h3>
        ${campo('cfg-aluguel',     'Aluguel (R$)',      fmtConf(config.aluguel),      'moeda')}
        ${campo('cfg-agua',        'Água (R$)',          fmtConf(config.agua),          'moeda')}
        ${campo('cfg-luz',         'Luz (R$)',           fmtConf(config.luz),           'moeda')}
        ${campo('cfg-internet',    'Internet (R$)',      fmtConf(config.internet),      'moeda')}
        ${campo('cfg-das',         'DAS (R$)',           fmtConf(config.das),           'moeda')}
        ${campo('cfg-funcionarios','Funcionários (R$)',  fmtConf(config.funcionarios),  'moeda')}
      </div>

      <div class="card">
        <h3 class="card-titulo">Pró-labore</h3>
        ${campo('cfg-prolab-renan',    'Limite Renan (R$)',    fmtConf(config.prolaboreRenan),    'moeda')}
        ${campo('cfg-prolab-nathalia', 'Limite Nathalia (R$)', fmtConf(config.prolaboreNathalia), 'moeda')}
      </div>

      <button class="btn btn-primario btn-full" id="btn-salvar-config">Salvar Configurações</button>

      <div class="card card-versao">
        <span class="versao-texto">Painel Financeiro Sofit v1.0.0</span>
        <span class="versao-sub">Armazenamento local · Preparado para nuvem</span>
        <button class="btn btn-ghost btn-sm" id="btn-instalar-cfg">📱 Instalar app</button>
      </div>
    `;

    // Máscaras em todos os campos de moeda
    container.querySelectorAll('.input-moeda').forEach(UI.aplicarMascaraMoeda);

    document.getElementById('btn-salvar-config').addEventListener('click', () => {
      const novaConfig = {
        nomeLoja:           document.getElementById('cfg-nome').value.trim(),
        metaMensal:         UI.parseMoeda(document.getElementById('cfg-meta').value),
        aluguel:            UI.parseMoeda(document.getElementById('cfg-aluguel').value),
        agua:               UI.parseMoeda(document.getElementById('cfg-agua').value),
        luz:                UI.parseMoeda(document.getElementById('cfg-luz').value),
        internet:           UI.parseMoeda(document.getElementById('cfg-internet').value),
        das:                UI.parseMoeda(document.getElementById('cfg-das').value),
        funcionarios:       UI.parseMoeda(document.getElementById('cfg-funcionarios').value),
        prolaboreRenan:     UI.parseMoeda(document.getElementById('cfg-prolab-renan').value),
        prolaboreNathalia:  UI.parseMoeda(document.getElementById('cfg-prolab-nathalia').value),
      };

      if (!novaConfig.nomeLoja) { UI.toast('Informe o nome da loja', 'erro'); return; }

      DB.saveConfig(novaConfig);

      // Atualiza nome na header
      const nomeEl = document.getElementById('nome-loja-header');
      if (nomeEl) nomeEl.textContent = novaConfig.nomeLoja;

      UI.toast('Configurações salvas!', 'sucesso');
    });

    // Botão instalar em configurações
    document.getElementById('btn-instalar-cfg')?.addEventListener('click', () => {
      document.getElementById('btn-instalar')?.click();
    });
  };

  // ─── Expõe o método de navegação globalmente ───────────────────────────────
  return { init, renderizarAba };
})();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', App.init);
window.App = App;
