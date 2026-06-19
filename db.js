/**
 * Sofit - Camada de Dados (db.js)
 * Gerencia persistência com LocalStorage.
 * Preparado para futura integração com Firebase ou Supabase.
 *
 * Para migrar para Firebase:
 *   1. Substitua as funções de get/set por chamadas ao Firestore
 *   2. Mantenha a mesma interface pública
 *
 * Para migrar para Supabase:
 *   1. Substitua as funções de get/set por chamadas à API REST do Supabase
 *   2. Mantenha a mesma interface pública
 */

const DB = (() => {
  // ─── Chaves do LocalStorage ───────────────────────────────────────────────
  const KEYS = {
    CONFIG:      'sofit_config',
    VENDAS:      'sofit_vendas',
    PROLAB:      'sofit_prolabore',
    REPOSICAO:   'sofit_reposicao',
    SANGRIAS:    'sofit_sangrias',
    EMERGENCIA:  'sofit_emergencia',
    SALDO_LIVRE: 'sofit_saldo_livre',
    TEMA:        'sofit_tema',
    MES_ATIVO:   'sofit_mes_ativo',
  };

  // ─── Helpers internos ─────────────────────────────────────────────────────
  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[DB] Erro ao salvar:', key, e);
      return false;
    }
  };

  const getMesAtual = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMesChave = (mes) => mes || getMesAtual();

  // ─── Configurações da Loja ────────────────────────────────────────────────
  const getConfig = () => get(KEYS.CONFIG, {
    nomeLoja: 'Sofit',
    metaMensal: 0,
    aluguel: 0,
    agua: 0,
    luz: 0,
    internet: 0,
    das: 0,
    funcionarios: 0,
    prolaboreRenan: 0,
    prolaboreNathalia: 0,
  });

  const saveConfig = (config) => set(KEYS.CONFIG, config);

  // ─── Tema ─────────────────────────────────────────────────────────────────
  const getTema = () => get(KEYS.TEMA, 'dark');
  const saveTema = (tema) => set(KEYS.TEMA, tema);

  // ─── Vendas ───────────────────────────────────────────────────────────────
  const getVendas = (mes) => {
    const todas = get(KEYS.VENDAS, {});
    return todas[getMesChave(mes)] || [];
  };

  const saveVenda = (venda, mes) => {
    const chave = getMesChave(mes);
    const todas = get(KEYS.VENDAS, {});
    if (!todas[chave]) todas[chave] = [];
    todas[chave].push({
      id: Date.now().toString(),
      ...venda,
      criadoEm: new Date().toISOString(),
    });
    return set(KEYS.VENDAS, todas);
  };

  const getTotalVendas = (mes) => {
    return getVendas(mes).reduce((acc, v) => acc + (v.valor || 0), 0);
  };

  // ─── Pró-labore ───────────────────────────────────────────────────────────
  const getProlabore = (mes) => {
    const todos = get(KEYS.PROLAB, {});
    const chave = getMesChave(mes);
    return todos[chave] || { renan: [], nathalia: [] };
  };

  const saveProlaboreRetirada = (pessoa, retirada, mes) => {
    const chave = getMesChave(mes);
    const todos = get(KEYS.PROLAB, {});
    if (!todos[chave]) todos[chave] = { renan: [], nathalia: [] };
    todos[chave][pessoa].push({
      id: Date.now().toString(),
      ...retirada,
      criadoEm: new Date().toISOString(),
    });
    return set(KEYS.PROLAB, todos);
  };

  const getTotalProlabore = (pessoa, mes) => {
    const pl = getProlabore(mes);
    return (pl[pessoa] || []).reduce((acc, r) => acc + (r.valor || 0), 0);
  };

  // ─── Reposição de Estoque ─────────────────────────────────────────────────
  const getReposicao = (mes) => {
    const todas = get(KEYS.REPOSICAO, {});
    return todas[getMesChave(mes)] || [];
  };

  const saveReposicao = (compra, mes) => {
    const chave = getMesChave(mes);
    const todas = get(KEYS.REPOSICAO, {});
    if (!todas[chave]) todas[chave] = [];
    todas[chave].push({
      id: Date.now().toString(),
      ...compra,
      criadoEm: new Date().toISOString(),
    });
    return set(KEYS.REPOSICAO, todas);
  };

  const getTotalReposicao = (mes) => {
    return getReposicao(mes).reduce((acc, r) => acc + (r.valor || 0), 0);
  };

  // ─── Sangrias ─────────────────────────────────────────────────────────────
  const getSangrias = (mes) => {
    const todas = get(KEYS.SANGRIAS, {});
    return todas[getMesChave(mes)] || [];
  };

  const saveSangria = (sangria, mes) => {
    const chave = getMesChave(mes);
    const todas = get(KEYS.SANGRIAS, {});
    if (!todas[chave]) todas[chave] = [];
    todas[chave].push({
      id: Date.now().toString(),
      ...sangria,
      criadoEm: new Date().toISOString(),
    });
    return set(KEYS.SANGRIAS, todas);
  };

  const getTotalSangrias = (mes) => {
    return getSangrias(mes).reduce((acc, s) => acc + (s.valor || 0), 0);
  };

  // ─── Emergência ───────────────────────────────────────────────────────────
  const getEmergencias = (mes) => {
    const todas = get(KEYS.EMERGENCIA, {});
    return todas[getMesChave(mes)] || [];
  };

  const saveEmergencia = (emergencia, mes) => {
    const chave = getMesChave(mes);
    const todas = get(KEYS.EMERGENCIA, {});
    if (!todas[chave]) todas[chave] = [];
    todas[chave].push({
      id: Date.now().toString(),
      ...emergencia,
      criadoEm: new Date().toISOString(),
    });
    return set(KEYS.EMERGENCIA, todas);
  };

  const getTotalEmergencias = (mes) => {
    return getEmergencias(mes).reduce((acc, e) => acc + (e.valor || 0), 0);
  };

  // ─── Saldo Livre ──────────────────────────────────────────────────────────
  const getSaldoLivre = (mes) => {
    const todos = get(KEYS.SALDO_LIVRE, {});
    return todos[getMesChave(mes)] || 0;
  };

  const setSaldoLivre = (valor, mes) => {
    const chave = getMesChave(mes);
    const todos = get(KEYS.SALDO_LIVRE, {});
    todos[chave] = valor;
    return set(KEYS.SALDO_LIVRE, todos);
  };

  const adicionarSaldoLivre = (valor, mes) => {
    const atual = getSaldoLivre(mes);
    return setSaldoLivre(atual + valor, mes);
  };

  // ─── Cálculo da Meta e Saúde ──────────────────────────────────────────────
  const calcularResumo = (mes) => {
    const config = getConfig();
    const totalVendas = getTotalVendas(mes);
    const meta = config.metaMensal || 0;

    const totalContas = (config.aluguel || 0) +
                        (config.agua || 0) +
                        (config.luz || 0) +
                        (config.internet || 0) +
                        (config.das || 0) +
                        (config.funcionarios || 0) +
                        (config.prolaboreRenan || 0) +
                        (config.prolaboreNathalia || 0);

    const totalProlaboreRenan    = getTotalProlabore('renan', mes);
    const totalProlaboreNathalia = getTotalProlabore('nathalia', mes);
    const totalReposicao         = getTotalReposicao(mes);
    const totalSangrias          = getTotalSangrias(mes);
    const totalEmergencias       = getTotalEmergencias(mes);

    const valorReservado  = Math.min(totalVendas, meta);
    const valorRestante   = Math.max(0, meta - totalVendas);
    const percentual      = meta > 0 ? Math.min((totalVendas / meta) * 100, 100) : 0;
    const metaAtingida    = totalVendas >= meta && meta > 0;

    // Saldo livre: tudo que ultrapassar a meta
    const excedente      = metaAtingida ? totalVendas - meta : 0;
    const saldoLivre     = getSaldoLivre(mes) || excedente;

    // Saúde da loja
    let saude = 'verde';
    if (meta > 0) {
      if (percentual < 50) saude = 'vermelho';
      else if (percentual < 80) saude = 'amarelo';
    }

    return {
      meta,
      totalVendas,
      totalContas,
      valorReservado,
      valorRestante,
      percentual,
      metaAtingida,
      saldoLivre,
      saude,
      totalProlaboreRenan,
      totalProlaboreNathalia,
      totalReposicao,
      totalSangrias,
      totalEmergencias,
      config,
    };
  };

  // ─── Relatório por período ────────────────────────────────────────────────
  const getRelatorio = (dataInicio, dataFim) => {
    const todasVendas    = get(KEYS.VENDAS, {});
    const todosProlabore = get(KEYS.PROLAB, {});
    const todasReposicao = get(KEYS.REPOSICAO, {});
    const todasSangrias  = get(KEYS.SANGRIAS, {});
    const todasEmerg     = get(KEYS.EMERGENCIA, {});

    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim    = new Date(dataFim + 'T23:59:59');

    const filtrar = (lista) => lista.filter((item) => {
      const d = new Date(item.criadoEm);
      return d >= inicio && d <= fim;
    });

    // Agrega todos os meses
    const vendas     = Object.values(todasVendas).flat();
    const renan      = Object.values(todosProlabore).flatMap(m => m.renan || []);
    const nathalia   = Object.values(todosProlabore).flatMap(m => m.nathalia || []);
    const reposicao  = Object.values(todasReposicao).flat();
    const sangrias   = Object.values(todasSangrias).flat();
    const emergencias = Object.values(todasEmerg).flat();

    const vf  = filtrar(vendas);
    const rf  = filtrar(renan);
    const nf  = filtrar(nathalia);
    const rep = filtrar(reposicao);
    const san = filtrar(sangrias);
    const eme = filtrar(emergencias);

    const soma = (arr) => arr.reduce((a, i) => a + (i.valor || 0), 0);

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      totalVendas:        soma(vf),
      prolaboreRenan:     soma(rf),
      prolaboreNathalia:  soma(nf),
      totalReposicao:     soma(rep),
      totalSangrias:      soma(san),
      totalEmergencias:   soma(eme),
      vendas:    vf,
      renan:     rf,
      nathalia:  nf,
      reposicao: rep,
      sangrias:  san,
      emergencias: eme,
    };
  };

  // ─── Interface pública ────────────────────────────────────────────────────
  return {
    // Config
    getConfig,
    saveConfig,
    // Tema
    getTema,
    saveTema,
    // Vendas
    getVendas,
    saveVenda,
    getTotalVendas,
    // Pró-labore
    getProlabore,
    saveProlaboreRetirada,
    getTotalProlabore,
    // Reposição
    getReposicao,
    saveReposicao,
    getTotalReposicao,
    // Sangrias
    getSangrias,
    saveSangria,
    getTotalSangrias,
    // Emergência
    getEmergencias,
    saveEmergencia,
    getTotalEmergencias,
    // Saldo Livre
    getSaldoLivre,
    setSaldoLivre,
    adicionarSaldoLivre,
    // Resumo e relatório
    calcularResumo,
    getRelatorio,
    getMesAtual,
  };
})();

// Exporta para uso nos outros módulos
window.DB = DB;
