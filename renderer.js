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
  };

  let currentDate = '';
  let todayDate = '';
  let configSavedJornada = '';
  let configSavedDataInicio = '';
  let configSavedClose = 'perguntar';
  let configSavedAuto = { entrada: '', saida_almoco: '', volta_almoco: '', saida: '' };
  let autoPadrao = { entrada: '08:00', saida_almoco: '12:00', volta_almoco: '13:00', saida: '17:00' };

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
      const status = await api.cloudStatus();
      if (status && status.configurado) {
        await api.cloudEnviarPonto(ponto);
      }
    } catch (e) {
      logError('cloudEnviarPonto', e);
    }
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
    if (els.screenConfig) els.screenConfig.classList.remove('hidden');
    atualizarStatusNuvem();
  }

  function setCloudStatus(texto, classe) {
    if (!els.cloudStatus) return;
    els.cloudStatus.textContent = texto;
    els.cloudStatus.className = 'text-xs ' + (classe || 'text-slate-500');
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
    const res = await api.cloudSalvar(conn);
    if (res.ok) {
      if (els.configCloudConn) els.configCloudConn.value = '';
      setCloudStatus('Conectado. Tabelas prontas.', 'text-emerald-400');
      const sync = await api.cloudSincronizar();
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
    const res = await api.cloudSincronizar();
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
    els.dayLabel.textContent = getDayOfWeek(currentDate);
    if (currentDate === todayDate) {
      els.dayLabel.textContent += ' (Hoje)';
    }
    updateHolidayBadge();
  }

  async function updateHolidayBadge() {
    try {
      const feriado = await api.getFeriado(currentDate);
      if (feriado) {
        els.holidayBadge.textContent = 'Feriado · ' + feriado.nome;
        els.holidayBadge.classList.remove('hidden');
      } else {
        els.holidayBadge.textContent = '';
        els.holidayBadge.classList.add('hidden');
      }
    } catch (e) {
      logError('updateHolidayBadge', e);
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
      const res = await api.cloudSincronizar();
      if (res && res.ok && res.importados > 0) {
        await loadPonto();
        loadMonthSummary();
        atualizarStatusNuvem();
      }
    } catch (e) {
      logError('syncNuvemSilencioso', e);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
