/**
 * Sofit - Exportação de Relatórios (export.js)
 * Suporta: PDF e imagem (PNG).
 * Estrutura preparada para exportação em Excel futuramente.
 */

const Exportar = (() => {

  // ─── Formatar moeda ───────────────────────────────────────────────────────
  const moeda = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // ─── Gera conteúdo HTML do relatório para impressão/PDF ──────────────────
  const gerarHTMLRelatorio = (dados, config) => {
    const { periodo, totalVendas, prolaboreRenan, prolaboreNathalia,
            totalReposicao, totalSangrias, totalEmergencias,
            vendas, renan, nathalia, reposicao, sangrias, emergencias } = dados;

    const totalContas = (config.aluguel || 0) + (config.agua || 0) +
                        (config.luz || 0) + (config.internet || 0) +
                        (config.das || 0) + (config.funcionarios || 0) +
                        (config.prolaboreRenan || 0) + (config.prolaboreNathalia || 0);

    const saldoLivre = totalVendas - totalContas - totalReposicao -
                       totalSangrias - totalEmergencias;

    const formatData = (iso) => {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    };

    const linhasVenda = vendas.map(v => `
      <tr>
        <td>${formatData(v.criadoEm)}</td>
        <td>${v.horario || '--'}</td>
        <td class="valor">${moeda(v.valor)}</td>
      </tr>`).join('');

    const linhaMovimento = (lista, cor) => lista.map(m => `
      <tr>
        <td>${formatData(m.criadoEm)}</td>
        <td>${m.descricao || m.fornecedor || '--'}</td>
        <td class="valor ${cor}">${moeda(m.valor)}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${config.nomeLoja || 'Sofit'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
           color: #1a1a2e; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 700; color: #7c6af7; margin-bottom: 4px; }
    .periodo { color: #666; font-size: 12px; margin-bottom: 24px; }
    .resumo { display: grid; grid-template-columns: repeat(3, 1fr);
              gap: 12px; margin-bottom: 28px; }
    .card { background: #f5f5fa; border-radius: 8px; padding: 14px;
            border-left: 3px solid #7c6af7; }
    .card-label { font-size: 11px; color: #666; text-transform: uppercase;
                  letter-spacing: .5px; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 700; }
    .card-value.positivo { color: #22c55e; }
    .card-value.negativo { color: #ef4444; }
    .card-value.neutro   { color: #7c6af7; }
    h2 { font-size: 14px; font-weight: 700; margin: 20px 0 8px;
         padding-bottom: 6px; border-bottom: 1px solid #e5e5ef; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { text-align: left; font-size: 11px; color: #888; text-transform: uppercase;
         letter-spacing: .5px; padding: 6px 8px; border-bottom: 1px solid #e5e5ef; }
    td { padding: 7px 8px; border-bottom: 1px solid #f0f0f8; font-size: 12px; }
    .valor { text-align: right; font-weight: 600; }
    .positivo { color: #22c55e; }
    .negativo { color: #ef4444; }
    .rodape { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${config.nomeLoja || 'Sofit'} — Relatório Financeiro</h1>
  <p class="periodo">Período: ${formatData(periodo.inicio + 'T12:00:00')} a ${formatData(periodo.fim + 'T12:00:00')}</p>

  <div class="resumo">
    <div class="card">
      <div class="card-label">Total Vendido</div>
      <div class="card-value neutro">${moeda(totalVendas)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Contas</div>
      <div class="card-value negativo">${moeda(totalContas)}</div>
    </div>
    <div class="card">
      <div class="card-label">Saldo Livre</div>
      <div class="card-value ${saldoLivre >= 0 ? 'positivo' : 'negativo'}">${moeda(saldoLivre)}</div>
    </div>
    <div class="card">
      <div class="card-label">Pró-labore Renan</div>
      <div class="card-value negativo">${moeda(prolaboreRenan)}</div>
    </div>
    <div class="card">
      <div class="card-label">Pró-labore Nathalia</div>
      <div class="card-value negativo">${moeda(prolaboreNathalia)}</div>
    </div>
    <div class="card">
      <div class="card-label">Reposição</div>
      <div class="card-value negativo">${moeda(totalReposicao)}</div>
    </div>
    <div class="card">
      <div class="card-label">Sangrias</div>
      <div class="card-value negativo">${moeda(totalSangrias)}</div>
    </div>
    <div class="card">
      <div class="card-label">Emergências</div>
      <div class="card-value negativo">${moeda(totalEmergencias)}</div>
    </div>
  </div>

  ${vendas.length ? `
  <h2>Vendas Diárias</h2>
  <table>
    <thead><tr><th>Data</th><th>Fechamento</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhasVenda}</tbody>
  </table>` : ''}

  ${renan.length ? `
  <h2>Pró-labore Renan</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhaMovimento(renan, 'negativo')}</tbody>
  </table>` : ''}

  ${nathalia.length ? `
  <h2>Pró-labore Nathalia</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhaMovimento(nathalia, 'negativo')}</tbody>
  </table>` : ''}

  ${reposicao.length ? `
  <h2>Reposições</h2>
  <table>
    <thead><tr><th>Data</th><th>Fornecedor / Descrição</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhaMovimento(reposicao, 'negativo')}</tbody>
  </table>` : ''}

  ${sangrias.length ? `
  <h2>Sangrias de Caixa</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhaMovimento(sangrias, 'negativo')}</tbody>
  </table>` : ''}

  ${emergencias.length ? `
  <h2>Gastos Emergenciais</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhaMovimento(emergencias, 'negativo')}</tbody>
  </table>` : ''}

  <div class="rodape">
    Gerado em ${new Date().toLocaleString('pt-BR')} · Painel Financeiro Sofit
  </div>
</body>
</html>`;
  };

  // ─── Exportar PDF via janela de impressão ─────────────────────────────────
  const exportarPDF = (dados, config) => {
    const html    = gerarHTMLRelatorio(dados, config);
    const janela  = window.open('', '_blank');
    if (!janela) {
      UI.toast('Permita pop-ups para exportar PDF', 'erro');
      return;
    }
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
      janela.print();
    }, 500);
  };

  // ─── Exportar imagem via canvas ───────────────────────────────────────────
  const exportarImagem = async (dados, config) => {
    // Cria um iframe oculto para renderizar o HTML
    const html   = gerarHTMLRelatorio(dados, config);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:900px;height:1200px;';
    document.body.appendChild(iframe);

    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    await new Promise(r => setTimeout(r, 600));

    try {
      // Tenta usar html2canvas se disponível
      if (window.html2canvas) {
        const canvas = await html2canvas(iframe.contentDocument.body, { scale: 2 });
        const link   = document.createElement('a');
        link.download = `sofit-relatorio-${Date.now()}.png`;
        link.href     = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Fallback: abre o HTML para o usuário capturar manualmente
        UI.toast('Captura direta não disponível. Use PDF ou print screen.', 'info');
        const janela = window.open('', '_blank');
        janela.document.write(html);
        janela.document.close();
      }
    } finally {
      document.body.removeChild(iframe);
    }
  };

  // ─── Exportar Excel (estrutura preparada) ────────────────────────────────
  // TODO: Implementar com biblioteca SheetJS (xlsx)
  // Para ativar: importar SheetJS e usar XLSX.utils.json_to_sheet()
  const exportarExcel = (dados, config) => {
    UI.toast('Exportação Excel em breve', 'info');
    /*
    // Exemplo de implementação futura com SheetJS:
    const ws = XLSX.utils.json_to_sheet(dados.vendas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
    XLSX.writeFile(wb, 'sofit-relatorio.xlsx');
    */
  };

  // ─── Interface pública ────────────────────────────────────────────────────
  return { exportarPDF, exportarImagem, exportarExcel };
})();

window.Exportar = Exportar;
