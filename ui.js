/**
 * Sofit - Utilitários de Interface (ui.js)
 * Funções auxiliares: toasts, modais, formatação, máscaras.
 */

const UI = (() => {

  // ─── Formatação ───────────────────────────────────────────────────────────
  const moeda = (v) =>
    `R$ ${(Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const data = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch { return '--'; }
  };

  const dataHora = (iso) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch { return '--'; }
  };

  const mesExtenso = (mesStr) => {
    if (!mesStr) return '';
    const [ano, mes] = mesStr.split('-');
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${meses[parseInt(mes, 10) - 1]} de ${ano}`;
  };

  // ─── Máscara de moeda em input ────────────────────────────────────────────
  const aplicarMascaraMoeda = (input) => {
    input.addEventListener('input', () => {
      let raw = input.value.replace(/\D/g, '');
      if (!raw) { input.value = ''; return; }
      const num = (parseInt(raw, 10) / 100).toFixed(2);
      input.value = parseFloat(num).toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
    });
  };

  // Converte valor mascarado para número
  const parseMoeda = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // ─── Toast Notifications ──────────────────────────────────────────────────
  const toast = (mensagem, tipo = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;

    const icones = { sucesso: '✓', erro: '✕', info: 'ℹ', aviso: '⚠' };
    t.innerHTML = `<span class="toast-icon">${icones[tipo] || 'ℹ'}</span>
                   <span class="toast-msg">${mensagem}</span>`;

    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-show'));

    setTimeout(() => {
      t.classList.remove('toast-show');
      setTimeout(() => t.remove(), 300);
    }, 3200);
  };

  // ─── Modal genérico ───────────────────────────────────────────────────────
  const abrirModal = (titulo, conteudoHTML, onConfirmar) => {
    let modal = document.getElementById('modal-global');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-global';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-titulo">${titulo}</h3>
          <button class="modal-fechar" id="modal-fechar-btn">✕</button>
        </div>
        <div class="modal-corpo">${conteudoHTML}</div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancelar">Cancelar</button>
          <button class="btn btn-primario" id="modal-confirmar">Confirmar</button>
        </div>
      </div>`;

    modal.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';

    const fechar = () => {
      modal.classList.remove('modal-aberto');
      document.body.style.overflow = '';
    };

    modal.querySelector('#modal-fechar-btn').onclick  = fechar;
    modal.querySelector('#modal-cancelar').onclick    = fechar;
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

    modal.querySelector('#modal-confirmar').onclick = () => {
      if (onConfirmar) onConfirmar(modal);
      fechar();
    };

    return modal;
  };

  // ─── Confirmar ação destrutiva ────────────────────────────────────────────
  const confirmar = (mensagem, onSim) => {
    let modal = document.getElementById('modal-confirmar');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-confirmar';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box modal-pequeno">
        <p class="modal-msg">${mensagem}</p>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="conf-nao">Cancelar</button>
          <button class="btn btn-perigo" id="conf-sim">Confirmar</button>
        </div>
      </div>`;

    modal.classList.add('modal-aberto');
    document.body.style.overflow = 'hidden';

    const fechar = () => {
      modal.classList.remove('modal-aberto');
      document.body.style.overflow = '';
    };

    modal.querySelector('#conf-nao').onclick = fechar;
    modal.querySelector('#conf-sim').onclick = () => { fechar(); if (onSim) onSim(); };
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
  };

  // ─── Loader/Spinner ───────────────────────────────────────────────────────
  const mostrarLoader = () => {
    const l = document.getElementById('loader-global');
    if (l) l.style.display = 'flex';
  };

  const ocultarLoader = () => {
    const l = document.getElementById('loader-global');
    if (l) l.style.display = 'none';
  };

  // ─── Número animado ───────────────────────────────────────────────────────
  const animarNumero = (elemento, valorFinal, duracao = 600, prefixo = 'R$ ') => {
    const inicio = 0;
    const t0 = performance.now();
    const animar = (t) => {
      const progresso = Math.min((t - t0) / duracao, 1);
      const eased = 1 - Math.pow(1 - progresso, 3);
      const atual = inicio + (valorFinal - inicio) * eased;
      elemento.textContent = prefixo + atual.toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
      if (progresso < 1) requestAnimationFrame(animar);
    };
    requestAnimationFrame(animar);
  };

  // ─── Barra de progresso animada ───────────────────────────────────────────
  const animarBarra = (barra, percentual, duracao = 700) => {
    const t0 = performance.now();
    const animar = (t) => {
      const progresso = Math.min((t - t0) / duracao, 1);
      const eased = 1 - Math.pow(1 - progresso, 3);
      barra.style.width = `${percentual * eased}%`;
      if (progresso < 1) requestAnimationFrame(animar);
    };
    requestAnimationFrame(animar);
  };

  // ─── Vazio / empty state ──────────────────────────────────────────────────
  const emptyState = (icone, texto) =>
    `<div class="empty-state"><span class="empty-icon">${icone}</span><p>${texto}</p></div>`;

  // ─── Formata data no padrão YYYY-MM-DD para input date ────────────────────
  const hojeISO = () => new Date().toISOString().split('T')[0];

  const primeiroDiaMes = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // ─── Interface pública ────────────────────────────────────────────────────
  return {
    moeda,
    data,
    dataHora,
    mesExtenso,
    aplicarMascaraMoeda,
    parseMoeda,
    toast,
    abrirModal,
    confirmar,
    mostrarLoader,
    ocultarLoader,
    animarNumero,
    animarBarra,
    emptyState,
    hojeISO,
    primeiroDiaMes,
  };
})();

window.UI = UI;
