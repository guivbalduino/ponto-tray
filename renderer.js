(() => {
  const $ = (sel) => document.querySelector(sel);
  const api = window.api;

  const els = {
    datePicker: $('#datePicker'),
    dayLabel: $('#dayLabel'),
    holidayBadge: $('#holidayBadge'),
    btnPrevDay: $('#btnPrevDay'),
    btnNextDay: $('#btnNextDay'),
    btnToday: $('#btnToday'),
    timeEntrada: $('#timeEntrada'),
    timeSaidaAlmoco: $('#timeSaidaAlmoco'),
    timeVoltaAlmoco: $('#timeVoltaAlmoco'),
    timeSaida: $('#timeSaida'),
    sugEntrada: $('#sugEntrada'),
    sugSaidaAlmoco: $('#sugSaidaAlmoco'),
    sugVoltaAlmoco: $('#sugVoltaAlmoco'),
    sugSaida: $('#sugSaida'),
    btnEntrada: $('#btnEntrada'),
    btnSaidaAlmoco: $('#btnSaidaAlmoco'),
    btnVoltaAlmoco: $('#btnVoltaAlmoco'),
    btnSaida: $('#btnSaida'),
    statusEntrada: $('#statusEntrada'),
    statusSaidaAlmoco: $('#statusSaidaAlmoco'),
    statusVoltaAlmoco: $('#statusVoltaAlmoco'),
    statusSaida: $('#statusSaida'),
    totalTrabalhadas: $('#totalTrabalhadas'),
    saldoExcedente: $('#saldoExcedente'),
    totalAlmoco: $('#totalAlmoco'),
    periodoManha: $('#periodoManha'),
    periodoTarde: $('#periodoTarde'),
    saldoAcumulado: $('#saldoAcumulado'),
    saldoAcumuladoLabel: $('#saldoAcumuladoLabel'),
    saldoAcumuladoDias: $('#saldoAcumuladoDias'),
    jornadaDiaria: $('#jornadaDiaria'),
    observacao: $('#observacao'),
    mesSelect: $('#mesSelect'),
    mesHoras: $('#mesHoras'),
    mesAlmoco: $('#mesAlmoco'),
    mesSaldo: $('#mesSaldo'),
    mesTabela: $('#mesTabela'),
    mesTituloStrip: $('#mesTituloStrip'),
    mesHorasStrip: $('#mesHorasStrip'),
    mesSaldoStrip: $('#mesSaldoStrip'),
    btnOpenMes: $('#btnOpenMes'),
    btnCloseMes: $('#btnCloseMes'),
    screenMes: $('#screenMes'),
    btnConfig: $('#btnConfig'),
    syncIndicator: $('#syncIndicator'),
    screenConfig: $('#screenConfig'),
    btnCloseConfig: $('#btnCloseConfig'),
    btnSalvarConfig: $('#btnSalvarConfig'),
    configJornada: $('#configJornada'),
    configDataInicio: $('#configDataInicio'),
    configCloseBehavior: $('#configCloseBehavior'),
    configAutoEntrada: $('#configAutoEntrada'),
    configAutoSaidaAlmoco: $('#configAutoSaidaAlmoco'),
    configAutoVoltaAlmoco: $('#configAutoVoltaAlmoco'),
    configAutoSaida: $('#configAutoSaida'),
    btnAutoPreenche: $('#btnAutoPreenche'),
    btnAutoPreencheMes: $('#btnAutoPreencheMes'),
    btnMinimize: $('#btnMinimize'),
    btnMaximize: $('#btnMaximize'),
    iconMaximize: $('#iconMaximize'),
    btnClose: $('#btnClose'),
    btnExportBackup: $('#btnExportBackup'),
    btnImportBackup: $('#btnImportBackup'),
    configCloudConn: $('#configCloudConn'),
    cloudStatus: $('#cloudStatus'),
    btnCloudSalvar: $('#btnCloudSalvar'),
    btnCloudSync: $('#btnCloudSync'),
    btnCloudRemover: $('#btnCloudRemover'),
    btnFeriadoDia: $('#btnFeriadoDia'),
    feriadoForm: $('#feriadoForm'),
    feriadoDiaData: $('#feriadoDiaData'),
    feriadoNome: $('#feriadoNome'),
    feriadoRecorrente: $('#feriadoRecorrente'),
    feriadoAviso: $('#feriadoAviso'),
    btnFeriadoAplicar: $('#btnFeriadoAplicar'),
    btnFeriadoRemover: $('#btnFeriadoRemover'),
    btnFeriadoCancelar: $('#btnFeriadoCancelar'),
    feriadoConfigNome: $('#feriadoConfigNome'),
    feriadoConfigData: $('#feriadoConfigData'),
    feriadoConfigRecorrente: $('#feriadoConfigRecorrente'),
    feriadoConfigAviso: $('#feriadoConfigAviso'),
    btnFeriadoConfigAdd: $('#btnFeriadoConfigAdd'),
    listaFeriadosRecorrentes: $('#listaFeriadosRecorrentes'),
    listaFeriadosUnicos: $('#listaFeriadosUnicos'),
    countFeriadosRecorrentes: $('#countFeriadosRecorrentes'),
    countFeriadosUnicos: $('#countFeriadosUnicos'),
  };

  let currentDate = '';
  let todayDate = '';
  let currentFeriado = null;
  let configSavedJornada = '';
  let configSavedDataInicio = '';
  let configSavedClose = 'perguntar';
  let configSavedAuto = { entrada: '', saida_almoco: '', volta_almoco: '', saida: '' };
  let autoPadrao = { entrada: '08:00', saida_almoco: '12:00', volta_almoco: '13:00', saida: '17:00' };

  const slotsSugestao = [
    { campo: 'entrada', input: els.timeEntrada, box: els.sugEntrada },
    { campo: 'saida_almoco', input: els.timeSaidaAlmoco, box: els.sugSaidaAlmoco },
    { campo: 'volta_almoco', input: els.timeVoltaAlmoco, box: els.sugVoltaAlmoco },
    { campo: 'saida', input: els.timeSaida, box: els.sugSaida },
  ];
  let sugestoesHorarios = { entrada: [], saida_almoco: [], volta_almoco: [], saida: [] };
  let sugestoesTimer = null;

  const DIAS_SEMANA = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  function nowHHMM() {
    const n = new Date();
    return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  }

  function updateMaximizeIcon(maximized) {
    if (!els.iconMaximize) return;
    if (maximized) {
      els.iconMaximize.innerHTML =
        '<rect x="5" y="5" width="14" height="14" rx="1"/><line x1="5" y1="11" x2="19" y2="11"/><line x1="11" y1="5" x2="11" y2="19"/>';
      els.btnMaximize.title = 'Restaurar';
    } else {
      els.iconMaximize.innerHTML = '<rect x="5" y="5" width="14" height="14" rx="1"/>';
      els.btnMaximize.title = 'Maximizar';
    }
  }

  function getDayOfWeek(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return DIAS_SEMANA[d.getDay()];
  }

  function parseTimeToMinutes(t) {
    if (!t || t.trim() === '') return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToPlainHM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatSaldo(min) {
    if (min === 0) return '00:00';
    const sign = min < 0 ? '-' : '+';
    return sign + minutesToPlainHM(Math.abs(min));
  }

  function calcularPeriodos(p) {
    const entrada = parseTimeToMinutes(p.entrada);
    const saidaAlmoco = parseTimeToMinutes(p.saida_almoco);
    const voltaAlmoco = parseTimeToMinutes(p.volta_almoco);
    const saida = parseTimeToMinutes(p.saida);
    let manha = 0;
    let tarde = 0;
    let almoco = 0;
    if (entrada !== null && saidaAlmoco !== null) manha = Math.max(0, saidaAlmoco - entrada);
    if (voltaAlmoco !== null && saida !== null) tarde = Math.max(0, saida - voltaAlmoco);
    if (saidaAlmoco !== null && voltaAlmoco !== null) almoco = Math.max(0, voltaAlmoco - saidaAlmoco);
    return { manha, tarde, almoco, work: manha + tarde };
  }

  function parseJornada() {
    const [jh, jm] = (els.jornadaDiaria.value || '08:00').split(':').map(Number);
    return jh * 60 + (jm || 0);
  }

  function logError(contexto, e) {
    console.error(`[${contexto}]`, e);
  }

  function setStatus(el, filled) {
    el.className = filled ? 'status-dot is-on' : 'status-dot';
  }

  function setButtonState(btn, timeInput, filled) {
    if (filled) {
      btn.disabled = true;
      btn.textContent = 'Registrado';
    } else {
      btn.disabled = false;
      const labels = {
        btnEntrada: 'Bater Entrada',
        btnSaidaAlmoco: 'Bater Saída Almoço',
        btnVoltaAlmoco: 'Bater Volta Almoço',
        btnSaida: 'Bater Saída',
      };
      btn.textContent = labels[btn.id] || btn.textContent;
    }
  }

  async function loadPonto() {
    try {
      const ponto = await api.getPonto(currentDate);

      const fields = [
        { input: els.timeEntrada, btn: els.btnEntrada, status: els.statusEntrada, key: 'entrada' },
        { input: els.timeSaidaAlmoco, btn: els.btnSaidaAlmoco, status: els.statusSaidaAlmoco, key: 'saida_almoco' },
        { input: els.timeVoltaAlmoco, btn: els.btnVoltaAlmoco, status: els.statusVoltaAlmoco, key: 'volta_almoco' },
        { input: els.timeSaida, btn: els.btnSaida, status: els.statusSaida, key: 'saida' },
      ];

      for (const f of fields) {
        const val = ponto ? ponto[f.key] : null;
        f.input.value = val || '';
        setButtonState(f.btn, f.input, !!val);
        setStatus(f.status, !!val);
      }

      els.observacao.value = ponto ? ponto.observacao || '' : '';

      calculateSummary();
      loadMonthSummary();
      renderSugestoesHorarios();
    } catch (e) {
      logError('loadPonto', e);
    }
  }

  async function saveCurrentPonto() {
    const ponto = {
      data: currentDate,
      entrada: els.timeEntrada.value || null,
      saida_almoco: els.timeSaidaAlmoco.value || null,
      volta_almoco: els.timeVoltaAlmoco.value || null,
      saida: els.timeSaida.value || null,
      observacao: els.observacao.value || '',
    };
    try {
      await api.savePonto(ponto);
    } catch (e) {
      logError('saveCurrentPonto', e);
    }
    try {
      await comIndicadorSync(async () => {
        const status = await api.cloudStatus();
        if (status && status.configurado) {
          await api.cloudEnviarPonto(ponto);
        }
      });
    } catch (e) {
      logError('cloudEnviarPonto', e);
    }
    agendarRefreshSugestoes();
  }

  function renderSugestoesHorarios() {
    for (const slot of slotsSugestao) {
      if (!slot.box || !slot.input) continue;
      const atual = slot.input.value;
      const padrao = autoPadrao[slot.campo];
      const itens = (sugestoesHorarios[slot.campo] || []).filter((item) => item.hora !== atual && item.hora !== padrao);
      slot.box.textContent = '';
      if (!itens.length) {
        slot.box.hidden = true;
        continue;
      }
      for (const item of itens) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'sug-chip';
        chip.dataset.slot = slot.campo;
        chip.dataset.hora = item.hora;
        chip.title = 'Usado ' + item.vezes + 'x nos últimos 30 dias';
        chip.textContent = item.hora;
        const vezes = document.createElement('span');
        vezes.className = 'sug-vezes';
        vezes.textContent = item.vezes + 'x';
        chip.appendChild(vezes);
        slot.box.appendChild(chip);
      }
      slot.box.hidden = false;
    }
  }

  async function loadSugestoesHorarios() {
    if (!api || !api.getSugestoesHorarios) return;
    try {
      sugestoesHorarios = await api.getSugestoesHorarios(autoPadrao);
      renderSugestoesHorarios();
    } catch (e) {
      logError('loadSugestoesHorarios', e);
    }
  }

  function agendarRefreshSugestoes() {
    clearTimeout(sugestoesTimer);
    sugestoesTimer = setTimeout(() => {
      sugestoesTimer = null;
      loadSugestoesHorarios();
    }, 1500);
  }

  function calculateSummary() {
    const p = {
      entrada: els.timeEntrada.value,
      saida_almoco: els.timeSaidaAlmoco.value,
      volta_almoco: els.timeVoltaAlmoco.value,
      saida: els.timeSaida.value,
    };
    const { almoco, work: totalWork } = calcularPeriodos(p);
    const jornada = parseJornada();
    const saldo = totalWork - jornada;

    els.totalTrabalhadas.textContent = minutesToPlainHM(totalWork);
    els.totalAlmoco.textContent = almoco > 0 ? minutesToPlainHM(almoco) : '00:00';

    if (saldo >= 0) {
      els.saldoExcedente.textContent = formatSaldo(saldo);
      els.saldoExcedente.className = 'tnum text-xl font-bold text-emerald-400';
    } else {
      els.saldoExcedente.textContent = formatSaldo(saldo);
      els.saldoExcedente.className = 'tnum text-xl font-bold text-rose-400';
    }

    if (els.timeEntrada.value && els.timeSaidaAlmoco.value) {
      els.periodoManha.textContent = els.timeEntrada.value + ' a ' + els.timeSaidaAlmoco.value;
    } else if (els.timeEntrada.value) {
      els.periodoManha.textContent = els.timeEntrada.value + ' a --:--';
    } else {
      els.periodoManha.textContent = '--:-- a --:--';
    }

    if (els.timeVoltaAlmoco.value && els.timeSaida.value) {
      els.periodoTarde.textContent = els.timeVoltaAlmoco.value + ' a ' + els.timeSaida.value;
    } else if (els.timeVoltaAlmoco.value) {
      els.periodoTarde.textContent = els.timeVoltaAlmoco.value + ' a --:--';
    } else {
      els.periodoTarde.textContent = '--:-- a --:--';
    }

    loadSaldoAcumulado();
  }

  function populateMonthSelect(selected) {
    if (!els.mesSelect) return;
    const opts = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
      opts.push({ ym, label });
    }
    els.mesSelect.innerHTML = '';
    for (const o of opts) {
      const opt = document.createElement('option');
      opt.value = o.ym;
      opt.textContent = o.label;
      els.mesSelect.appendChild(opt);
    }
    if (selected) els.mesSelect.value = selected;
  }

  function dateIsWeekday(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    return day >= 1 && day <= 5;
  }

  async function feriadosDoMes(ym) {
    if (!api || !api.listFeriadosMes) return new Set();
    try {
      const lista = await api.listFeriadosMes(ym);
      return new Set(lista.map((f) => f.data));
    } catch (e) {
      logError('feriadosDoMes', e);
      return new Set();
    }
  }

  function isCurrentMonthYM(ym) {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return ym === cur;
  }

  async function loadMonthSummary() {
    if (!api || !api.getAllPontosMes || !els.mesSelect) return;
    const ym = els.mesSelect.value;
    if (!ym) return;
    try {
      const pontos = await api.getAllPontosMes(ym);
      const jornada = parseJornada();

      const dataInicio = els.configDataInicio ? els.configDataInicio.value : '';
      const hojeStr = await api.getToday();
      const hoje = new Date(hojeStr + 'T12:00:00');

      const porData = {};
      for (const p of pontos) porData[p.data] = p;
      const feriados = await feriadosDoMes(ym);

      let totalWork = 0;
      let totalAlmoco = 0;
      let totalSaldo = 0;
      const rows = [];

      const [y, mo] = ym.split('-').map(Number);
      const primeiro = new Date(y, mo - 1, 1, 12, 0, 0);
      const ultimoDt = isCurrentMonthYM(ym) ? hoje : new Date(y, mo, 0, 12, 0, 0);

      if (dataInicio) {
        const ini = new Date(dataInicio + 'T12:00:00');
        if (ini > primeiro) {
          primeiro.setTime(ini.getTime());
        }
      }

      for (let d = new Date(primeiro.getTime()); d <= ultimoDt; d.setDate(d.getDate() + 1)) {
        const ds = toLocalDateStr(d);
        if (!dateIsWeekday(ds) || feriados.has(ds)) continue;
        const p = porData[ds];

        if (p) {
          const periodos = calcularPeriodos(p);
          const work = periodos.work;
          const almoco = periodos.almoco;
          totalWork += work;
          totalAlmoco += almoco;
          totalSaldo += work - jornada;
          rows.push({
            data: ds,
            work,
            almoco,
            saldo: work - jornada,
            tipo: 'registrado',
            h: {
              entrada: p.entrada || '',
              saida_almoco: p.saida_almoco || '',
              volta_almoco: p.volta_almoco || '',
              saida: p.saida || '',
            },
          });
        } else {
          totalWork += 0;
          totalSaldo += -jornada;
          rows.push({
            data: ds,
            work: 0,
            almoco: 0,
            saldo: -jornada,
            tipo: 'pendente',
            h: { entrada: '', saida_almoco: '', volta_almoco: '', saida: '' },
          });
        }
      }

      const horasLabel = minutesToPlainHM(totalWork);
      const saldoSigned = formatSaldo(totalSaldo);
      const saldoClass = totalSaldo > 0 ? 'text-emerald-400' : totalSaldo < 0 ? 'text-rose-400' : 'text-slate-300';

      if (els.mesHoras) els.mesHoras.textContent = horasLabel;
      if (els.mesAlmoco) els.mesAlmoco.textContent = minutesToPlainHM(totalAlmoco);
      if (els.mesSaldo) {
        els.mesSaldo.textContent = saldoSigned;
        els.mesSaldo.className = 'tnum text-2xl font-bold ' + saldoClass;
      }

      if (els.mesHorasStrip) els.mesHorasStrip.textContent = horasLabel;
      if (els.mesSaldoStrip) {
        els.mesSaldoStrip.textContent = saldoSigned;
        els.mesSaldoStrip.className = 'tnum text-sm font-bold ' + saldoClass;
      }
      if (els.mesTituloStrip && els.mesSelect) {
        const opt = els.mesSelect.selectedOptions[0];
        els.mesTituloStrip.textContent = opt ? 'Mês · ' + opt.textContent : 'Mês';
      }

      if (els.mesTabela) {
        if (rows.length === 0) {
          els.mesTabela.innerHTML =
            '<div class="text-xs text-slate-500 text-center py-4">Nenhum dia para calcular neste mês.</div>';
        } else {
          els.mesTabela.innerHTML = rows
            .map((r) => {
              const color = r.saldo > 0 ? 'text-emerald-400' : r.saldo < 0 ? 'text-rose-400' : 'text-slate-300';
              const sLabel = formatSaldo(r.saldo);
              const parts = r.data.split('-');
              const short = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.data;
              const marca =
                r.tipo === 'pendente' ? '<span class="text-[9px] text-slate-600 uppercase">pendente</span>' : '';
              const botao =
                r.tipo === 'pendente'
                  ? `<button class="btnAutoDia justify-self-end text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 text-white" data-dia="${r.data}" title="Preencher este dia">Auto</button>`
                  : '';
              const h = r.h;
              const apont = `${h.entrada || '--'} · ${h.saida_almoco || '--'} · ${h.volta_almoco || '--'} · ${h.saida || '--'}`;
              return `<div class="mes-row text-sm ${r.tipo === 'pendente' ? 'opacity-60' : ''}">
                <span class="text-slate-300 truncate">${short} ${marca}</span>
                <span class="text-slate-500 text-xs text-center tabular-nums truncate" title="${apont}">${apont}</span>
                <span class="text-slate-400 text-right tabular-nums">${minutesToPlainHM(r.work)}</span>
                <span class="text-slate-500 text-right tabular-nums">${minutesToPlainHM(r.almoco)}</span>
                <span class="${color} text-right font-semibold tabular-nums">${sLabel}</span>
                ${botao}
              </div>`;
            })
            .join('');
        }
      }
    } catch (e) {
      const errDiv = els.mesTabela;
      if (errDiv)
        errDiv.innerHTML =
          '<div class="text-xs text-rose-400 text-center py-4">Erro ao carregar o mês: ' +
          (e && e.message ? e.message : String(e)) +
          '</div>';
      console.error('loadMonthSummary error:', e);
    }
  }

  async function loadSaldoAcumulado() {
    if (!api || !api.getAllPontosMes || !api.listFeriadosMes) return;
    try {
      const alvo = new Date(currentDate + 'T12:00:00');
      const ym = currentDate.slice(0, 7);
      const [y, mo] = ym.split('-').map(Number);

      let inicio = new Date(y, mo - 1, 1, 12, 0, 0);
      const dataInicio = els.configDataInicio ? els.configDataInicio.value : '';
      if (dataInicio) {
        const ini = new Date(dataInicio + 'T12:00:00');
        if (ini > inicio) inicio.setTime(ini.getTime());
      }

      const datas = [];
      for (let d = new Date(inicio.getTime()); d <= alvo; d.setDate(d.getDate() + 1)) {
        const ds = toLocalDateStr(d);
        if (!dateIsWeekday(ds)) continue;
        datas.push(ds);
      }

      const feriadoSet = await feriadosDoMes(ym);

      const porData = {};
      if (datas.length > 0) {
        const meses = new Set(datas.map((ds) => ds.slice(0, 7)));
        for (const m of meses) {
          const pts = await api.getAllPontosMes(m);
          for (const p of pts) porData[p.data] = p;
        }
      }

      const jornada = parseJornada();
      let saldo = 0;
      let diasUteis = 0;
      for (const ds of datas) {
        if (feriadoSet.has(ds)) continue;
        const p = porData[ds];
        if (p) {
          saldo += calcularPeriodos(p).work - jornada;
        } else {
          saldo -= jornada;
        }
        diasUteis++;
      }

      const cls = saldo > 0 ? 'text-emerald-400' : saldo < 0 ? 'text-rose-400' : 'text-slate-300';
      if (els.saldoAcumulado) {
        els.saldoAcumulado.textContent = formatSaldo(saldo);
        els.saldoAcumulado.className = 'tnum text-xl font-bold ' + cls;
      }
      if (els.saldoAcumuladoLabel) {
        const p = currentDate.split('-');
        els.saldoAcumuladoLabel.textContent = `Acumulado até ${p[2]}/${p[1]}`;
      }
      if (els.saldoAcumuladoDias) {
        els.saldoAcumuladoDias.textContent =
          diasUteis === 0 ? 'sem dias úteis' : `${diasUteis} dia${diasUteis === 1 ? ' útil' : 's úteis'}`;
      }
    } catch (e) {
      logError('loadSaldoAcumulado', e);
    }
  }

  function openMonthScreen() {
    if (els.screenMes) els.screenMes.classList.remove('hidden');
    loadMonthSummary();
  }

  function closeMonthScreen() {
    if (els.screenMes) els.screenMes.classList.add('hidden');
  }

  function openConfigScreen() {
    if (!els.configJornada) {
      return;
    }
    configSavedJornada = els.configJornada.value;
    if (els.configDataInicio) configSavedDataInicio = els.configDataInicio.value;
    if (els.configCloseBehavior) els.configCloseBehavior.value = configSavedClose;
    configSavedAuto = readAutoFields();
    if (els.feriadoConfigData && !els.feriadoConfigData.value) {
      els.feriadoConfigData.value = currentDate || todayDate;
    }
    if (els.screenConfig) els.screenConfig.classList.remove('hidden');
    atualizarStatusNuvem();
    renderFeriadosConfig();
  }

  let sincronizacoesAtivas = 0;

  function iniciarSincronizacao() {
    sincronizacoesAtivas++;
    if (els.syncIndicator) {
      els.syncIndicator.classList.remove('hidden', 'text-blue-400', 'text-red-400', 'text-brand-300');
      els.syncIndicator.classList.add('text-brand-300');
    }
  }

  function finalizarSincronizacao() {
    sincronizacoesAtivas = Math.max(0, sincronizacoesAtivas - 1);
    if (sincronizacoesAtivas === 0 && els.syncIndicator) {
      setTimeout(() => {
        if (sincronizacoesAtivas === 0) {
          els.syncIndicator.classList.add('hidden');
          els.syncIndicator.classList.remove('text-blue-400', 'text-red-400', 'text-brand-300');
          els.syncIndicator.classList.add('text-brand-300');
        }
      }, 600);
    }
  }

  async function comIndicadorSync(fn) {
    iniciarSincronizacao();
    try {
      return await fn();
    } finally {
      finalizarSincronizacao();
    }
  }

  function setCloudStatus(texto, classe) {
    if (!els.cloudStatus) return;
    els.cloudStatus.textContent = texto;
    els.cloudStatus.className = 'text-xs ' + (classe || 'text-slate-500');
  }

  if (api && api.onSyncPhase) {
    api.onSyncPhase((phase) => {
      if (!els.syncIndicator) return;
      els.syncIndicator.classList.remove('text-blue-400', 'text-red-400', 'text-brand-300');
      if (phase === 'upload') {
        els.syncIndicator.classList.add('text-blue-400');
      } else if (phase === 'download') {
        els.syncIndicator.classList.add('text-red-400');
      } else {
        els.syncIndicator.classList.add('text-brand-300');
      }
    });
  }
  async function atualizarStatusNuvem() {
    if (!api || !api.cloudStatus) return;
    try {
      const s = await api.cloudStatus();
      if (!s.configurado) {
        setCloudStatus('Nao configurado', 'text-slate-500');
      } else if (s.conectado) {
        setCloudStatus('Conectado. Sincronizando automaticamente.', 'text-emerald-400');
      } else {
        setCloudStatus('Configurado, mas sem conexao: ' + (s.erro || 'erro desconhecido'), 'text-rose-400');
      }
    } catch {
      setCloudStatus('Erro ao consultar o status', 'text-rose-400');
    }
  }

  async function cloudSalvar() {
    const conn = els.configCloudConn ? els.configCloudConn.value.trim() : '';
    if (!conn) {
      setCloudStatus('Cole a string de conexao primeiro.', 'text-amber-400');
      return;
    }
    setCloudStatus('Conectando...', 'text-slate-400');
    const res = await comIndicadorSync(() => api.cloudSalvar(conn));
    if (res.ok) {
      if (els.configCloudConn) els.configCloudConn.value = '';
      setCloudStatus('Conectado. Tabelas prontas.', 'text-emerald-400');
      const sync = await comIndicadorSync(() => api.cloudSincronizar());
      if (sync.ok) {
        setCloudStatus(
          'Conectado. ' + sync.enviados + ' enviados, ' + sync.importados + ' importados.',
          'text-emerald-400',
        );
        await loadPonto();
        loadMonthSummary();
      }
    } else {
      setCloudStatus('Falha: ' + res.erro, 'text-rose-400');
    }
  }

  async function cloudSincronizar() {
    setCloudStatus('Sincronizando...', 'text-slate-400');
    const res = await comIndicadorSync(() => api.cloudSincronizar());
    if (res.ok) {
      setCloudStatus(
        'Sincronizado. ' + res.enviados + ' enviados, ' + res.importados + ' importados.',
        'text-emerald-400',
      );
      await loadPonto();
      loadMonthSummary();
    } else {
      setCloudStatus('Falha: ' + res.erro, 'text-rose-400');
    }
  }

  async function cloudRemover() {
    await api.cloudRemover();
    if (els.configCloudConn) els.configCloudConn.value = '';
    setCloudStatus('Nao configurado', 'text-slate-500');
  }

  function readAutoFields() {
    return {
      entrada: els.configAutoEntrada ? els.configAutoEntrada.value : autoPadrao.entrada,
      saida_almoco: els.configAutoSaidaAlmoco ? els.configAutoSaidaAlmoco.value : autoPadrao.saida_almoco,
      volta_almoco: els.configAutoVoltaAlmoco ? els.configAutoVoltaAlmoco.value : autoPadrao.volta_almoco,
      saida: els.configAutoSaida ? els.configAutoSaida.value : autoPadrao.saida,
    };
  }

  function applyAutoFields(v) {
    if (els.configAutoEntrada) els.configAutoEntrada.value = v.entrada;
    if (els.configAutoSaidaAlmoco) els.configAutoSaidaAlmoco.value = v.saida_almoco;
    if (els.configAutoVoltaAlmoco) els.configAutoVoltaAlmoco.value = v.volta_almoco;
    if (els.configAutoSaida) els.configAutoSaida.value = v.saida;
  }

  function closeConfigScreen() {
    if (els.configJornada) els.configJornada.value = configSavedJornada;
    if (els.configDataInicio) els.configDataInicio.value = configSavedDataInicio;
    if (els.configCloseBehavior) els.configCloseBehavior.value = configSavedClose;
    applyAutoFields(configSavedAuto);
    if (els.screenConfig) els.screenConfig.classList.add('hidden');
  }

  async function saveConfigScreen() {
    try {
      if (els.configJornada) {
        await api.setConfig('jornada_diaria', els.configJornada.value);
        els.jornadaDiaria.value = els.configJornada.value;
        configSavedJornada = els.configJornada.value;
        calculateSummary();
      }
      if (els.configDataInicio) {
        await api.setConfig('data_inicio', els.configDataInicio.value);
        configSavedDataInicio = els.configDataInicio.value;
      }
      if (els.configCloseBehavior) {
        await api.setConfig('fechar_comportamento', els.configCloseBehavior.value);
        configSavedClose = els.configCloseBehavior.value;
      }
      const auto = readAutoFields();
      await api.setConfig('auto_entrada', auto.entrada);
      await api.setConfig('auto_saida_almoco', auto.saida_almoco);
      await api.setConfig('auto_volta_almoco', auto.volta_almoco);
      await api.setConfig('auto_saida', auto.saida);
      autoPadrao = Object.assign({}, auto);
      configSavedAuto = auto;
      loadSugestoesHorarios();
      if (els.screenConfig) els.screenConfig.classList.add('hidden');
      loadMonthSummary();
    } catch (e) {
      logError('saveConfigScreen', e);
    }
  }

  async function backupExportar() {
    try {
      const res = await api.exportBackup();
      if (res.ok) {
        alert('Backup exportado com sucesso.');
      }
    } catch (e) {
      logError('backupExportar', e);
      alert('Erro ao exportar o backup.');
    }
  }

  async function backupImportar() {
    try {
      const res = await api.importBackup();
      if (res.ok) {
        alert('Backup importado com sucesso (' + res.quantidade + ' registros).');
        loadPonto();
        loadMonthSummary();
        loadSugestoesHorarios();
      } else if (res.erro) {
        alert(res.erro);
      }
    } catch (e) {
      logError('backupImportar', e);
      alert('Erro ao importar o backup.');
    }
  }

  async function autoPreencherDia() {
    try {
      const targets = [
        { key: 'entrada', input: els.timeEntrada },
        { key: 'saida_almoco', input: els.timeSaidaAlmoco },
        { key: 'volta_almoco', input: els.timeVoltaAlmoco },
        { key: 'saida', input: els.timeSaida },
      ];
      let preencheu = false;
      for (const t of targets) {
        if (t.input && !t.input.value) {
          t.input.value = autoPadrao[t.key] || '';
          preencheu = true;
        }
      }
      if (preencheu) {
        await saveCurrentPonto();
        loadPonto();
      }
    } catch (e) {
      logError('autoPreencherDia', e);
    }
  }

  async function autoPreencherMes() {
    if (!api || !api.getAllPontosMes || !els.mesSelect) return;
    const ym = els.mesSelect.value;
    if (!ym) return;
    try {
      const pontos = await api.getAllPontosMes(ym);
      const porData = {};
      for (const p of pontos) porData[p.data] = p;

      const hojeStr = await api.getToday();
      const hoje = new Date(hojeStr + 'T12:00:00');
      const dataInicio = els.configDataInicio ? els.configDataInicio.value : '';
      const [y, mo] = ym.split('-').map(Number);
      const primeiro = new Date(y, mo - 1, 1, 12, 0, 0);
      const ultimoDt = isCurrentMonthYM(ym) ? hoje : new Date(y, mo, 0, 12, 0, 0);
      if (dataInicio) {
        const ini = new Date(dataInicio + 'T12:00:00');
        if (ini > primeiro) primeiro.setTime(ini.getTime());
      }

      const aEnviar = [];
      const feriados = await feriadosDoMes(ym);
      for (let d = new Date(primeiro.getTime()); d <= ultimoDt; d.setDate(d.getDate() + 1)) {
        const ds = toLocalDateStr(d);
        if (!dateIsWeekday(ds) || feriados.has(ds)) continue;
        const p = porData[ds];
        const entrada = p ? p.entrada : '';
        const saidaA = p ? p.saida_almoco : '';
        const voltaA = p ? p.volta_almoco : '';
        const saida = p ? p.saida : '';
        const faltante = !entrada || !saidaA || !voltaA || !saida;
        if (faltante) {
          aEnviar.push({
            data: ds,
            entrada: entrada || autoPadrao.entrada || null,
            saida_almoco: saidaA || autoPadrao.saida_almoco || null,
            volta_almoco: voltaA || autoPadrao.volta_almoco || null,
            saida: saida || autoPadrao.saida || null,
            observacao: p ? p.observacao || '' : '',
          });
        }
      }

      if (aEnviar.length > 0) {
        await api.savePontosBulk(aEnviar);
        loadMonthSummary();
        if (els.mesTabela) {
          els.mesTabela.innerHTML =
            '<div class="text-xs text-slate-400 text-center py-4">Autocomplete aplicado a ' +
            aEnviar.length +
            ' dia(s).</div>';
        }
      } else {
        if (els.mesTabela) {
          els.mesTabela.innerHTML =
            '<div class="text-xs text-slate-400 text-center py-4">Todos os dias já estão preenchidos.</div>';
        }
      }
    } catch (e) {
      const errDiv = els.mesTabela;
      if (errDiv)
        errDiv.innerHTML = '<div class="text-xs text-rose-400 text-center py-4">Erro no autocomplete do mês.</div>';
      console.error('autoPreencherMes error:', e);
    }
  }

  async function autoPreencherDiaEspecifico(data) {
    try {
      const p = await api.getPonto(data);
      const entrada = p ? p.entrada || '' : '';
      const saidaA = p ? p.saida_almoco || '' : '';
      const voltaA = p ? p.volta_almoco || '' : '';
      const saida = p ? p.saida || '' : '';
      await api.savePonto({
        data: data,
        entrada: entrada || autoPadrao.entrada || null,
        saida_almoco: saidaA || autoPadrao.saida_almoco || null,
        volta_almoco: voltaA || autoPadrao.volta_almoco || null,
        saida: saida || autoPadrao.saida || null,
        observacao: p ? p.observacao || '' : '',
      });
      loadMonthSummary();
    } catch (e) {
      logError('autoPreencherDiaEspecifico', e);
    }
  }

  function setToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    currentDate = `${y}-${m}-${d}`;
    todayDate = currentDate;
    els.datePicker.value = currentDate;
    updateDayLabel();
  }

  function updateDayLabel() {
    fecharFeriadoForm();
    els.dayLabel.textContent = getDayOfWeek(currentDate);
    if (currentDate === todayDate) {
      els.dayLabel.textContent += ' (Hoje)';
    }
    updateHolidayBadge();
  }

  async function updateHolidayBadge() {
    try {
      const feriado = await api.getFeriado(currentDate);
      currentFeriado = feriado || null;
      if (feriado) {
        els.holidayBadge.textContent = 'Feriado · ' + feriado.nome;
        els.holidayBadge.title = feriado.nome;
        els.holidayBadge.classList.remove('hidden');
      } else {
        els.holidayBadge.textContent = '';
        els.holidayBadge.title = '';
        els.holidayBadge.classList.add('hidden');
      }
      updateBtnFeriado();
    } catch (e) {
      logError('updateHolidayBadge', e);
    }
  }

  function updateBtnFeriado() {
    if (!els.btnFeriadoDia) return;
    if (currentFeriado) {
      els.btnFeriadoDia.title = 'Editar feriado: ' + currentFeriado.nome;
      els.btnFeriadoDia.classList.add('text-amber-300', 'border-amber-500/50');
      els.btnFeriadoDia.classList.remove('text-slate-300');
    } else {
      els.btnFeriadoDia.title = 'Marcar este dia como feriado';
      els.btnFeriadoDia.classList.remove('text-amber-300', 'border-amber-500/50');
      els.btnFeriadoDia.classList.add('text-slate-300');
    }
  }

  function avisarFeriado(el, texto) {
    if (!el) return;
    if (texto) {
      el.textContent = texto;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  }

  function formatDiaMes(dataStr) {
    const [y, m, d] = (dataStr || '').split('-');
    return `${d}/${m}/${y}`;
  }

  async function abrirFeriadoForm() {
    if (!els.feriadoForm) return;
    let nome = '';
    let recorrente = false;
    let podeRemover = false;
    let aviso = '';

    if (currentFeriado && currentFeriado.tipo === 'nacional') {
      nome = currentFeriado.nome;
      aviso = 'Feriado nacional — calculado automaticamente e não pode ser alterado.';
    } else if (currentFeriado) {
      nome = currentFeriado.nome;
      recorrente = currentFeriado.tipo === 'recorrente';
      podeRemover = true;
    }

    els.feriadoForm.classList.remove('hidden');
    if (els.feriadoDiaData) els.feriadoDiaData.textContent = formatDiaMes(currentDate);
    if (els.feriadoNome) els.feriadoNome.value = nome;
    if (els.feriadoRecorrente) els.feriadoRecorrente.checked = recorrente;
    if (els.btnFeriadoRemover) els.btnFeriadoRemover.classList.toggle('hidden', !podeRemover);
    if (els.btnFeriadoAplicar) {
      els.btnFeriadoAplicar.disabled = currentFeriado && currentFeriado.tipo === 'nacional';
      els.btnFeriadoAplicar.textContent = currentFeriado && currentFeriado.tipo !== 'nacional' ? 'Salvar' : 'Adicionar';
    }
    avisarFeriado(els.feriadoAviso, aviso);
    if (els.feriadoNome && !aviso) els.feriadoNome.focus();
  }

  function fecharFeriadoForm() {
    if (els.feriadoForm) els.feriadoForm.classList.add('hidden');
    avisarFeriado(els.feriadoAviso, '');
  }

  async function salvarFeriadoDia() {
    if (currentFeriado && currentFeriado.tipo === 'nacional') {
      avisarFeriado(els.feriadoAviso, 'Feriado nacional — não pode ser alterado.');
      return;
    }
    const nome = (els.feriadoNome ? els.feriadoNome.value : '').trim();
    if (!nome) {
      avisarFeriado(els.feriadoAviso, 'Informe um nome para o feriado.');
      return;
    }
    const [, m, d] = currentDate.split('-');
    try {
      if (els.feriadoRecorrente && els.feriadoRecorrente.checked) {
        await api.addFeriadoRecorrente({ mes: m, dia: d, nome });
        if (currentFeriado && currentFeriado.tipo === 'unico') {
          await api.removeFeriado(currentDate);
        }
      } else {
        await api.addFeriado(currentDate, nome);
        if (currentFeriado && currentFeriado.tipo === 'recorrente') {
          await api.removeFeriadoRecorrente({ mes: m, dia: d });
        }
      }
      fecharFeriadoForm();
      await refreshFeriados();
    } catch (e) {
      logError('salvarFeriadoDia', e);
      avisarFeriado(els.feriadoAviso, 'Erro ao salvar o feriado.');
    }
  }

  async function removerFeriadoDia() {
    if (!currentFeriado) return;
    const [, m, d] = currentDate.split('-');
    try {
      if (currentFeriado.tipo === 'recorrente') {
        await api.removeFeriadoRecorrente({ mes: m, dia: d });
      } else if (currentFeriado.tipo === 'unico') {
        await api.removeFeriado(currentDate);
      }
      fecharFeriadoForm();
      await refreshFeriados();
    } catch (e) {
      logError('removerFeriadoDia', e);
      avisarFeriado(els.feriadoAviso, 'Erro ao remover o feriado.');
    }
  }

  async function refreshFeriados() {
    await updateHolidayBadge();
    await loadPonto();
    if (els.screenConfig && !els.screenConfig.classList.contains('hidden')) {
      await renderFeriadosConfig();
    }
  }

  function criarLinhaFeriado(nome, sub) {
    const row = document.createElement('div');
    row.className =
      'flex items-center justify-between gap-2 bg-slate-800/40 border border-slate-700/60 rounded-lg px-2.5 py-1.5';
    const info = document.createElement('div');
    info.className = 'min-w-0';
    const nomeEl = document.createElement('div');
    nomeEl.className = 'text-xs text-slate-200 truncate';
    nomeEl.textContent = nome;
    nomeEl.title = nome;
    const subEl = document.createElement('div');
    subEl.className = 'tnum text-[10px] text-slate-500';
    subEl.textContent = sub;
    info.appendChild(nomeEl);
    info.appendChild(subEl);
    const btn = document.createElement('button');
    btn.className =
      'w-6 h-6 flex-none flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-rose-600/80 transition';
    btn.title = 'Remover feriado';
    btn.innerHTML =
      '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    row.appendChild(info);
    row.appendChild(btn);
    return { row, btn };
  }

  async function renderFeriadosConfig() {
    if (!api || !api.listFeriados) return;
    try {
      const { unicos, recorrentes } = await api.listFeriados();
      if (els.countFeriadosRecorrentes) els.countFeriadosRecorrentes.textContent = String(recorrentes.length);
      if (els.countFeriadosUnicos) els.countFeriadosUnicos.textContent = String(unicos.length);

      if (els.listaFeriadosRecorrentes) {
        els.listaFeriadosRecorrentes.innerHTML = '';
        if (!recorrentes.length) {
          els.listaFeriadosRecorrentes.innerHTML =
            '<div class="text-[11px] text-slate-600 py-1">Nenhum feriado recorrente.</div>';
        }
        for (const f of recorrentes) {
          const { row, btn } = criarLinhaFeriado(f.nome, `${f.dia}/${f.mes} · todo ano`);
          btn.addEventListener('click', async () => {
            await api.removeFeriadoRecorrente({ mes: f.mes, dia: f.dia });
            await refreshFeriados();
          });
          els.listaFeriadosRecorrentes.appendChild(row);
        }
      }

      if (els.listaFeriadosUnicos) {
        els.listaFeriadosUnicos.innerHTML = '';
        if (!unicos.length) {
          els.listaFeriadosUnicos.innerHTML =
            '<div class="text-[11px] text-slate-600 py-1">Nenhuma data única cadastrada.</div>';
        }
        for (const f of unicos) {
          const { row, btn } = criarLinhaFeriado(f.nome, formatDiaMes(f.data));
          btn.addEventListener('click', async () => {
            await api.removeFeriado(f.data);
            await refreshFeriados();
          });
          els.listaFeriadosUnicos.appendChild(row);
        }
      }
    } catch (e) {
      logError('renderFeriadosConfig', e);
    }
  }

  async function addFeriadoConfig() {
    const nome = (els.feriadoConfigNome ? els.feriadoConfigNome.value : '').trim();
    const data = els.feriadoConfigData ? els.feriadoConfigData.value : '';
    if (!nome) {
      avisarFeriado(els.feriadoConfigAviso, 'Informe um nome para o feriado.');
      return;
    }
    if (!data) {
      avisarFeriado(els.feriadoConfigAviso, 'Escolha uma data.');
      return;
    }
    const [, m, d] = data.split('-');
    try {
      const existente = await api.getFeriado(data);
      if (existente && existente.tipo === 'nacional') {
        avisarFeriado(els.feriadoConfigAviso, 'Essa data já é um feriado nacional automático.');
        return;
      }
      if (els.feriadoConfigRecorrente && els.feriadoConfigRecorrente.checked) {
        await api.addFeriadoRecorrente({ mes: m, dia: d, nome });
      } else {
        await api.addFeriado(data, nome);
      }
      if (els.feriadoConfigNome) els.feriadoConfigNome.value = '';
      if (els.feriadoConfigRecorrente) els.feriadoConfigRecorrente.checked = false;
      avisarFeriado(els.feriadoConfigAviso, '');
      await refreshFeriados();
    } catch (e) {
      logError('addFeriadoConfig', e);
      avisarFeriado(els.feriadoConfigAviso, 'Erro ao adicionar o feriado.');
    }
  }

  function navigateDay(delta) {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    currentDate = `${y}-${m}-${day}`;
    els.datePicker.value = currentDate;
    updateDayLabel();
    loadPonto();
  }

  function bindAction(btn, inputEl, statusEl) {
    btn.addEventListener('click', async () => {
      inputEl.value = nowHHMM();
      setButtonState(btn, inputEl, true);
      setStatus(statusEl, true);
      await saveCurrentPonto();
      calculateSummary();
    });
  }

  function bindAll() {
    bindAction(els.btnEntrada, els.timeEntrada, els.statusEntrada);
    bindAction(els.btnSaidaAlmoco, els.timeSaidaAlmoco, els.statusSaidaAlmoco);
    bindAction(els.btnVoltaAlmoco, els.timeVoltaAlmoco, els.statusVoltaAlmoco);
    bindAction(els.btnSaida, els.timeSaida, els.statusSaida);

    els.timeEntrada.addEventListener('change', async () => {
      setStatus(els.statusEntrada, !!els.timeEntrada.value);
      setButtonState(els.btnEntrada, els.timeEntrada, !!els.timeEntrada.value);
      await saveCurrentPonto();
      calculateSummary();
    });
    els.timeSaidaAlmoco.addEventListener('change', async () => {
      setStatus(els.statusSaidaAlmoco, !!els.timeSaidaAlmoco.value);
      setButtonState(els.btnSaidaAlmoco, els.timeSaidaAlmoco, !!els.timeSaidaAlmoco.value);
      await saveCurrentPonto();
      calculateSummary();
    });
    els.timeVoltaAlmoco.addEventListener('change', async () => {
      setStatus(els.statusVoltaAlmoco, !!els.timeVoltaAlmoco.value);
      setButtonState(els.btnVoltaAlmoco, els.timeVoltaAlmoco, !!els.timeVoltaAlmoco.value);
      await saveCurrentPonto();
      calculateSummary();
    });
    els.timeSaida.addEventListener('change', async () => {
      setStatus(els.statusSaida, !!els.timeSaida.value);
      setButtonState(els.btnSaida, els.timeSaida, !!els.timeSaida.value);
      await saveCurrentPonto();
      calculateSummary();
    });

    for (const slot of slotsSugestao) {
      if (!slot.box) continue;
      slot.box.addEventListener('click', (ev) => {
        const chip = ev.target.closest('.sug-chip');
        if (!chip || !slot.input) return;
        slot.input.value = chip.dataset.hora;
        slot.input.dispatchEvent(new Event('change', { bubbles: true }));
        renderSugestoesHorarios();
      });
    }

    let obsTimer = null;
    els.observacao.addEventListener('input', () => {
      clearTimeout(obsTimer);
      obsTimer = setTimeout(() => saveCurrentPonto(), 500);
    });

    els.jornadaDiaria.addEventListener('change', async () => {
      await api.setConfig('jornada_diaria', els.jornadaDiaria.value);
      calculateSummary();
      loadMonthSummary();
    });

    els.datePicker.addEventListener('change', () => {
      currentDate = els.datePicker.value;
      updateDayLabel();
      loadPonto();
    });

    els.btnPrevDay.addEventListener('click', () => navigateDay(-1));
    els.btnNextDay.addEventListener('click', () => navigateDay(1));
    els.btnToday.addEventListener('click', () => {
      setToday();
      loadPonto();
    });

    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft') {
        navigateDay(-1);
      } else if (e.key === 'ArrowRight') {
        navigateDay(1);
      }
    });

    els.btnMinimize.addEventListener('click', () => api.minimizeWindow());
    els.btnClose.addEventListener('click', () => api.closeWindow());

    if (els.mesSelect) {
      els.mesSelect.addEventListener('change', loadMonthSummary);
    }
    if (els.btnOpenMes) els.btnOpenMes.addEventListener('click', openMonthScreen);
    if (els.btnCloseMes) els.btnCloseMes.addEventListener('click', closeMonthScreen);
    if (els.mesTabela) {
      els.mesTabela.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btnAutoDia');
        if (btn) autoPreencherDiaEspecifico(btn.dataset.dia);
      });
    }

    if (els.btnConfig) els.btnConfig.addEventListener('click', openConfigScreen);
    if (els.btnCloseConfig) els.btnCloseConfig.addEventListener('click', closeConfigScreen);
    if (els.btnSalvarConfig) els.btnSalvarConfig.addEventListener('click', saveConfigScreen);

    if (els.btnFeriadoDia) {
      els.btnFeriadoDia.addEventListener('click', () => {
        if (!els.feriadoForm) return;
        if (els.feriadoForm.classList.contains('hidden')) abrirFeriadoForm();
        else fecharFeriadoForm();
      });
    }
    if (els.btnFeriadoAplicar) els.btnFeriadoAplicar.addEventListener('click', salvarFeriadoDia);
    if (els.btnFeriadoRemover) els.btnFeriadoRemover.addEventListener('click', removerFeriadoDia);
    if (els.btnFeriadoCancelar) els.btnFeriadoCancelar.addEventListener('click', fecharFeriadoForm);
    if (els.feriadoNome) {
      els.feriadoNome.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          salvarFeriadoDia();
        }
      });
    }

    if (els.btnFeriadoConfigAdd) els.btnFeriadoConfigAdd.addEventListener('click', addFeriadoConfig);
    if (els.feriadoConfigNome) {
      els.feriadoConfigNome.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          addFeriadoConfig();
        }
      });
    }

    if (els.btnAutoPreenche) els.btnAutoPreenche.addEventListener('click', autoPreencherDia);
    if (els.btnAutoPreencheMes) els.btnAutoPreencheMes.addEventListener('click', autoPreencherMes);

    if (els.btnExportBackup) els.btnExportBackup.addEventListener('click', backupExportar);
    if (els.btnImportBackup) els.btnImportBackup.addEventListener('click', backupImportar);
    if (els.btnCloudSalvar) els.btnCloudSalvar.addEventListener('click', cloudSalvar);
    if (els.btnCloudSync) els.btnCloudSync.addEventListener('click', cloudSincronizar);
    if (els.btnCloudRemover) els.btnCloudRemover.addEventListener('click', cloudRemover);

    els.btnMaximize.addEventListener('click', () => api.maximizeWindow());
    const initMaximizeIcon = async () => {
      updateMaximizeIcon(await api.isMaximized());
    };
    api.onMaximizeChange(updateMaximizeIcon);
    initMaximizeIcon();
  }

  async function init() {
    bindAll();

    try {
      todayDate = await api.getToday();
      setToday();

      const savedJornada = await api.getConfig('jornada_diaria');
      if (savedJornada) {
        els.jornadaDiaria.value = savedJornada;
        if (els.configJornada) els.configJornada.value = savedJornada;
      }

      const savedInicio = await api.getConfig('data_inicio');
      if (savedInicio && els.configDataInicio) {
        els.configDataInicio.value = savedInicio;
      }

      const savedClose = await api.getConfig('fechar_comportamento');
      if (savedClose && ['perguntar', 'fechar', 'minimizar'].includes(savedClose)) {
        configSavedClose = savedClose;
      }

      const autoKeys = [
        ['auto_entrada', 'entrada'],
        ['auto_saida_almoco', 'saida_almoco'],
        ['auto_volta_almoco', 'volta_almoco'],
        ['auto_saida', 'saida'],
      ];
      for (const [chave, campo] of autoKeys) {
        const v = await api.getConfig(chave);
        if (v) autoPadrao[campo] = v;
      }
      applyAutoFields({
        entrada: autoPadrao.entrada,
        saida_almoco: autoPadrao.saida_almoco,
        volta_almoco: autoPadrao.volta_almoco,
        saida: autoPadrao.saida,
      });

      const todayYM = todayDate.slice(0, 7);
      populateMonthSelect(todayYM);

      await loadPonto();
      await loadMonthSummary();
      await loadSugestoesHorarios();
    } catch (e) {
      logError('init', e);
    }

    window.addEventListener('focus', () => {
      syncNuvemSilencioso();
    });
    syncNuvemSilencioso();
  }

  let ultimaSyncNuvem = 0;

  async function syncNuvemSilencioso(forcar) {
    if (!api || !api.cloudStatus) return;
    const agora = Date.now();
    if (!forcar && agora - ultimaSyncNuvem < 60000) return;
    ultimaSyncNuvem = agora;
    try {
      const st = await api.cloudStatus();
      if (!st || !st.configurado) return;
      const res = await comIndicadorSync(() => api.cloudSincronizar());
      if (res && res.ok && res.importados > 0) {
        await loadPonto();
        loadMonthSummary();
        loadSugestoesHorarios();
        atualizarStatusNuvem();
      }
    } catch (e) {
      logError('syncNuvemSilencioso', e);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
