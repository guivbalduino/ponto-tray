const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow = null;
let tray = null;
let db = null;

const TRAY_ICON_PATH = path.join(__dirname, 'assets', 'icon.png');
const DB_PATH = path.join(app.getPath('userData'), 'pontos.db');

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  StartApp();
}

function StartApp() {
  const FERIADOS_FIXOS = [
    { mes: 1, dia: 1, nome: 'Confraternização Universal' },
    { mes: 4, dia: 21, nome: 'Tiradentes' },
    { mes: 5, dia: 1, nome: 'Dia do Trabalho' },
    { mes: 9, dia: 7, nome: 'Independência do Brasil' },
    { mes: 10, dia: 12, nome: 'Nossa Senhora Aparecida' },
    { mes: 11, dia: 2, nome: 'Finados' },
    { mes: 11, dia: 15, nome: 'Proclamação da República' },
    { mes: 12, dia: 25, nome: 'Natal' },
  ];

  function isUtil(dataStr) {
    const d = new Date(dataStr + 'T12:00:00');
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    const mes = d.getMonth() + 1;
    const dia = d.getDate();
    for (const f of FERIADOS_FIXOS) {
      if (f.mes === mes && f.dia === dia) return false;
    }

    return true;
  }

  function getFeriado(dataStr) {
    const d = new Date(dataStr + 'T12:00:00');
    const mes = d.getMonth() + 1;
    const dia = d.getDate();
    for (const f of FERIADOS_FIXOS) {
      if (f.mes === mes && f.dia === dia) return f;
    }
    if (db) {
      const row = db.prepare('SELECT nome FROM feriados WHERE data = ?').get(dataStr);
      if (row) return { mes, dia, nome: row.nome };
    }
    return null;
  }

  function openDatabase() {
    if (db) return;
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
    CREATE TABLE IF NOT EXISTS pontos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT UNIQUE NOT NULL,
      entrada TEXT,
      saida_almoco TEXT,
      volta_almoco TEXT,
      saida TEXT,
      observacao TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feriados (
      data TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL
    );
  `);

    const existing = db.prepare('SELECT valor FROM config WHERE chave = ?').get('jornada_diaria');
    if (!existing) {
      db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?)').run('jornada_diaria', '08:00');
    }

    const anoAtual = new Date().getFullYear();
    const insertF = db.prepare('INSERT OR IGNORE INTO feriados (data, nome) VALUES (?, ?)');
    const ano = String(anoAtual);
    for (const f of FERIADOS_FIXOS) {
      const mes = String(f.mes).padStart(2, '0');
      const dia = String(f.dia).padStart(2, '0');
      insertF.run(`${ano}-${mes}-${dia}`, f.nome);
    }
  }

  function closeDatabase() {
    if (db) {
      try {
        db.close();
      } catch (e) {
        console.warn('Erro ao fechar o banco de dados:', e);
      }
      db = null;
    }
  }

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 520,
      height: 680,
      minWidth: 480,
      minHeight: 600,
      frame: false,
      resizable: true,
      show: false,
      backgroundColor: '#0f172a',
      icon: path.join(__dirname, 'assets', 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      closeDatabase();
    });

    mainWindow.on('close', async (e) => {
      if (app.isQuitting) return;

      e.preventDefault();

      let preferencia = null;
      try {
        if (db) {
          const row = db.prepare('SELECT valor FROM config WHERE chave = ?').get('fechar_comportamento');
          preferencia = row ? row.valor : null;
        }
      } catch (err) {
        preferencia = null;
      }

      if (preferencia === 'fechar') {
        app.isQuitting = true;
        app.quit();
        return;
      }
      if (preferencia === 'minimizar') {
        mainWindow.hide();
        return;
      }

      const resultado = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Encerrar', 'Minimizar para bandeja'],
        defaultId: 1,
        cancelId: 1,
        title: 'Sair do VenceHoje Ponto?',
        message: 'O que deseja fazer ao fechar?',
        detail: 'Encerrar sai completamente do app. Minimizar mantém o app rodando na bandeja do sistema.',
        checkboxLabel: 'Lembrar minha escolha e não perguntar de novo',
        noLink: true,
      });

      if (resultado.checkboxChecked) {
        const valor = resultado.response === 0 ? 'fechar' : 'minimizar';
        openDatabase();
        db.prepare('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)').run('fechar_comportamento', valor);
      }

      if (resultado.response === 0) {
        app.isQuitting = true;
        app.quit();
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide();
        }
      }
    });

    mainWindow.webContents.on('render-process-gone', (_e, details) => {
      if (mainWindow && (details.reason === 'crashed' || details.reason === 'oom')) {
        mainWindow.reload();
      }
    });

    const broadcastMaximize = () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:maximize-changed', mainWindow.isMaximized());
      }
    };
    mainWindow.on('maximize', broadcastMaximize);
    mainWindow.on('unmaximize', broadcastMaximize);
  }

  function destroyWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  }

  function showWindow() {
    openDatabase();
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      return;
    }
    createWindow();
  }

  function createTray() {
    let icon;
    try {
      icon = nativeImage.createFromPath(TRAY_ICON_PATH);
      if (icon.isEmpty()) throw new Error('icone vazio');
    } catch (e) {
      console.warn('Tray: ícone ausente ou inválido, usando fallback. ', e.message);
      const size = 16;
      const buf = Buffer.alloc(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        buf[i * 4] = 14;
        buf[i * 4 + 1] = 165;
        buf[i * 4 + 2] = 233;
        buf[i * 4 + 3] = 255;
      }
      icon = nativeImage.createFromBitmap(buf, { width: size, height: size });
    }

    tray = new Tray(icon);
    tray.setToolTip('VenceHoje Ponto');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir',
        click: () => {
          showWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      showWindow();
    });
  }

  function setupIPC() {
    ipcMain.handle('db:getPonto', (_, data) => {
      openDatabase();
      const row = db.prepare('SELECT * FROM pontos WHERE data = ?').get(data);
      return row || null;
    });

    ipcMain.handle('db:savePonto', (_, { data, entrada, saida_almoco, volta_almoco, saida, observacao }) => {
      openDatabase();
      const existing = db.prepare('SELECT id FROM pontos WHERE data = ?').get(data);
      if (existing) {
        db.prepare(
          `
        UPDATE pontos SET entrada = ?, saida_almoco = ?, volta_almoco = ?, saida = ?, observacao = ?
        WHERE data = ?
      `,
        ).run(entrada || null, saida_almoco || null, volta_almoco || null, saida || null, observacao || '', data);
      } else {
        db.prepare(
          `
        INSERT INTO pontos (data, entrada, saida_almoco, volta_almoco, saida, observacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        ).run(data, entrada || null, saida_almoco || null, volta_almoco || null, saida || null, observacao || '');
      }
      return { ok: true };
    });

    ipcMain.handle('db:savePontosBulk', (_, pontos) => {
      openDatabase();
      const upsert = db.prepare(`
      INSERT INTO pontos (data, entrada, saida_almoco, volta_almoco, saida, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(data) DO UPDATE SET
        entrada = excluded.entrada,
        saida_almoco = excluded.saida_almoco,
        volta_almoco = excluded.volta_almoco,
        saida = excluded.saida,
        observacao = excluded.observacao
    `);
      db.transaction((list) => {
        for (const p of list) {
          upsert.run(
            p.data,
            p.entrada || null,
            p.saida_almoco || null,
            p.volta_almoco || null,
            p.saida || null,
            p.observacao || '',
          );
        }
      })(pontos);
      return { ok: true, salvos: pontos.length };
    });

    ipcMain.handle('db:getConfig', (_, chave) => {
      openDatabase();
      const row = db.prepare('SELECT valor FROM config WHERE chave = ?').get(chave);
      return row ? row.valor : null;
    });

    ipcMain.handle('db:setConfig', (_, { chave, valor }) => {
      openDatabase();
      db.prepare('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)').run(chave, valor);
      return { ok: true };
    });

    ipcMain.handle('db:getAllPontosMes', (_, anoMes) => {
      openDatabase();
      const rows = db.prepare('SELECT * FROM pontos WHERE data LIKE ? ORDER BY data ASC').all(`${anoMes}%`);
      return rows;
    });

    ipcMain.handle('app:hide', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
    });

    ipcMain.handle('app:minimize', () => {
      if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('app:maximize', () => {
      if (!mainWindow) return;
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    });

    ipcMain.handle('app:isMaximized', () => {
      return mainWindow ? mainWindow.isMaximized() : false;
    });

    ipcMain.handle('app:close', () => {
      destroyWindow();
    });

    ipcMain.handle('app:getToday', () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    });

    ipcMain.handle('app:isUtil', (_, dataStr) => {
      openDatabase();
      return isUtil(dataStr);
    });

    ipcMain.handle('app:getFeriado', (_, dataStr) => {
      openDatabase();
      return getFeriado(dataStr);
    });

    ipcMain.handle('feriados:add', (_, { data, nome }) => {
      openDatabase();
      db.prepare('INSERT OR REPLACE INTO feriados (data, nome) VALUES (?, ?)').run(data, nome);
      return { ok: true };
    });

    ipcMain.handle('feriados:remove', (_, data) => {
      openDatabase();
      db.prepare('DELETE FROM feriados WHERE data = ?').run(data);
      return { ok: true };
    });

    ipcMain.handle('feriados:list', () => {
      openDatabase();
      return db.prepare('SELECT data, nome FROM feriados ORDER BY data ASC').all();
    });

    ipcMain.handle('db:exportBackup', async () => {
      openDatabase();
      const backup = {
        app: app.getName(),
        versao: app.getVersion(),
        exportadoEm: new Date().toISOString(),
        pontos: db.prepare('SELECT * FROM pontos ORDER BY data ASC').all(),
        config: db.prepare('SELECT * FROM config').all(),
      };
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar backup',
        defaultPath: `backup-ponto-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (canceled || !filePath) return { ok: false, cancelado: true };
      fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8');
      return { ok: true, caminho: filePath };
    });

    ipcMain.handle('db:importBackup', async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Importar backup',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (canceled || !filePaths.length) return { ok: false, cancelado: true };

      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
      } catch (e) {
        return { ok: false, erro: 'Arquivo inválido: ' + e.message };
      }

      openDatabase();
      const upsert = db.prepare(`
      INSERT INTO pontos (data, entrada, saida_almoco, volta_almoco, saida, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(data) DO UPDATE SET
        entrada = excluded.entrada,
        saida_almoco = excluded.saida_almoco,
        volta_almoco = excluded.volta_almoco,
        saida = excluded.saida,
        observacao = excluded.observacao
    `);
      db.transaction(() => {
        for (const p of data.pontos || []) {
          upsert.run(
            p.data,
            p.entrada || null,
            p.saida_almoco || null,
            p.volta_almoco || null,
            p.saida || null,
            p.observacao || '',
          );
        }
        for (const c of data.config || []) {
          db.prepare('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)').run(c.chave, c.valor);
        }
      })();
      return { ok: true, quantidade: (data.pontos || []).length };
    });
  }

  app.disableHardwareAcceleration();

  app.on('second-instance', () => {
    showWindow();
  });

  app.whenReady().then(() => {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    const hojeStr = `${y}-${m}-${d}`;

    if (!isUtil(hojeStr)) {
      app.quit();
      return;
    }

    setupIPC();
    showWindow();
    createTray();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // no-op: mantém vivo na tray
    }
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
    closeDatabase();
  });
}
