const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ICONS = {
  live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10 8 15 10.5 10 13" fill="currentColor" stroke="none"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  endpoints: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  keys: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
};

const NAV = [
  { view: 'live', label: 'Transmissão ao vivo', icon: 'live' },
  { view: 'endpoints', label: 'Endpoints', icon: 'endpoints' },
  { view: 'docs', label: 'Documentação', icon: 'docs' },
  { view: 'keys', label: 'Chaves de API', icon: 'keys' },
  { view: 'settings', label: 'Configurações', icon: 'settings' },
];

const DETAIL_TABS = [
  { id: 'headers', label: 'Headers' },
  { id: 'query', label: 'Parâmetros de query' },
  { id: 'response', label: 'Resposta' },
  { id: 'trace', label: 'Rastreamento' },
];

const state = {
  view: 'live',
  dtab: 'headers',
  vtab: 'explorer',
  config: {},
  csrfToken: null,
  links: [],
  webhooks: [],
  selectedId: null,
  filter: '',
  theme: localStorage.getItem('wr-theme') || 'light',
};

let refreshTimer = null;
let eventSource = null;

/* ---------- helpers ---------- */
function el(tag, props = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null) n.setAttribute(k, v);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
    if (c == null) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 1800);
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();
  if (state.csrfToken && method !== 'GET' && method !== 'HEAD') {
    headers.set('X-CSRF-Token', state.csrfToken);
  }
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      toast('Não foi possível carregar os dados (' + res.status + ')');
      throw new Error('HTTP ' + res.status);
    }
    return res;
  } catch (err) {
    if (err.message && err.message.startsWith('HTTP')) throw err;
    toast('Servidor indisponível');
    throw err;
  }
}

function showLoading(on, message = 'Carregando...') {
  const overlay = $('#loadingOverlay');
  if (!overlay) return;
  const msg = $('#loadingMessage');
  if (msg) msg.textContent = message;
  overlay.classList.toggle('show', on);
  overlay.setAttribute('aria-busy', on ? 'true' : 'false');
  document.documentElement.setAttribute('aria-busy', on ? 'true' : 'false');
  const app = $('.app');
  if (app) app.classList.toggle('app-pending', on);
}

function setButtonsLoading(buttons, on) {
  const list = Array.isArray(buttons) ? buttons : [buttons];
  for (const btn of list) {
    if (!btn) continue;
    btn.classList.toggle('is-loading', on);
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }
}

const NEW_WEBHOOK_BUTTONS = () =>
  $$('#newWebhook, #newWebhook2, #newWebhook3, #newWebhookFoot');
const CLEAR_LOG_BUTTONS = () => $$('#clearLogs, #clearLogsSettings');

const bootStartedAt = performance.now();
const MIN_BOOT_LOADING_MS = 120;

async function finishBootLoading() {
  const elapsed = performance.now() - bootStartedAt;
  if (elapsed < MIN_BOOT_LOADING_MS) {
    await new Promise((r) => setTimeout(r, MIN_BOOT_LOADING_MS - elapsed));
  }
  showLoading(false);
}

async function boot() {
  showLoading(true, 'Carregando sessão...');
  try {
    await loadState();
    showLoading(true, 'Carregando eventos...');
    await loadWebhooks();
    connectSSE();
  } catch {
    setAutoRefresh(true);
  } finally {
    await finishBootLoading();
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado: ' + text);
  } catch {
    toast('Não foi possível copiar');
  }
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour12: false });
}

function statusOf(h) {
  if (h.signatureValid === false) return { cls: 'err', text: String(h.responseStatus || 401) };
  if (h.duplicate) return { cls: 'warn', text: 'duplicado' };
  return { cls: 'ok', text: (h.responseStatus || 200) + ' OK' };
}

function activeLink() {
  return state.links[0] || null;
}

function updateStorageLabels(s) {
  const isRedis = s.storage === 'redis';
  const brandVer = $('#brandVer');
  if (brandVer) {
    brandVer.textContent = 'v1.0.0 · ' + (isRedis ? 'redis' : 'em memória');
  }
  const footStorage = $('#footStorage');
  if (footStorage) {
    footStorage.textContent = isRedis
      ? 'Dados mantidos em Redis — persistem entre reinicializações do servidor.'
      : 'Dados mantidos em memória — reiniciar o servidor limpa os links e o histórico.';
  }
}

function highlightJSON(value) {
  let str;
  try {
    str = JSON.stringify(value, null, 2);
  } catch {
    str = String(value);
  }
  if (str === undefined) str = 'null';
  const esc = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = esc.replace(
    /("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (m) => {
      let cls = 'tok-num';
      if (/^"/.test(m)) cls = /:\s*$/.test(m) ? 'tok-key' : 'tok-str';
      else if (/true|false/.test(m)) cls = 'tok-bool';
      else if (/null/.test(m)) cls = 'tok-bool';
      return '<span class="' + cls + '">' + m + '</span>';
    }
  );
  return { html, lines: str.split('\n').length };
}

function syncCodeScroll(gutterEl, bodyEl) {
  bodyEl.addEventListener('scroll', () => {
    gutterEl.scrollTop = bodyEl.scrollTop;
  });
}

function codeBlock(value) {
  const { html, lines } = highlightJSON(value);
  const gutter = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  const gutterEl = el('div', { class: 'code-gutter', text: gutter });
  const bodyEl = el('pre', { class: 'code-body', html });
  syncCodeScroll(gutterEl, bodyEl);
  return el('div', { class: 'code' }, [gutterEl, bodyEl]);
}

function wireTabsKeyboard(container) {
  if (!container) return;
  container.setAttribute('role', 'tablist');
  const tabs = $$('.tab', container);
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    const isActive = tab.classList.contains('active');
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
    tab.addEventListener('keydown', (e) => {
      let idx = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        idx = (i + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        idx = (i - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        idx = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        idx = tabs.length - 1;
        e.preventDefault();
      } else {
        return;
      }
      tabs[idx].click();
      tabs[idx].focus();
    });
  });
}

function updateTabAria(container) {
  if (!container) return;
  $$('.tab', container).forEach((tab) => {
    const isActive = tab.classList.contains('active');
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

/* ---------- theme ---------- */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const icon = state.theme === 'light' ? ICONS.moon : ICONS.sun;
  $$('#themeBtn, #themeBtn2, #themeBtn3').forEach((b) => {
    b.innerHTML = icon;
    b.setAttribute('aria-label', state.theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro');
  });
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('wr-theme', state.theme);
  applyTheme();
}

/* ---------- sidebar drawer (mobile/tablet) ---------- */
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function openSidebar() {
  $('.sidebar').classList.add('open');
  $('#backdrop').classList.add('show');
}

function closeSidebar() {
  $('.sidebar').classList.remove('open');
  $('#backdrop').classList.remove('show');
}

function toggleSidebar() {
  $('.sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
}

function showDetailPane() {
  if (isMobile()) $('#liveView').classList.add('detail-open');
}

function showListPane() {
  $('#liveView').classList.remove('detail-open');
}

/* ---------- nav ---------- */
function renderNav() {
  const nav = $('#nav');
  nav.innerHTML = '';
  NAV.forEach((item) => {
    nav.append(
      el('button', {
        class: 'nav-item' + (state.view === item.view ? ' active' : ''),
        html: ICONS[item.icon] + '<span>' + item.label + '</span>',
        onclick: () => setView(item.view),
      })
    );
  });
}

function setView(view) {
  state.view = view;
  renderNav();
  closeSidebar();
  showListPane();
  const isLive = view === 'live';
  $('#liveView').style.display = isLive ? 'flex' : 'none';
  $('#panelView').style.display = isLive ? 'none' : 'flex';
  if (isLive) {
    renderEvents();
    renderDetail();
  } else {
    renderPanel(view);
  }
}

/* ---------- data ---------- */
async function loadState() {
  const res = await apiFetch('/api/state');
  const s = await res.json();
  state.config = s;
  state.csrfToken = s.csrfToken || state.csrfToken;
  state.links = s.links || [];
  updateStorageLabels(s);
  renderChip();
  if (state.view !== 'live') renderPanel(state.view);
}

async function loadWebhooks() {
  const res = await apiFetch('/api/webhooks');
  state.webhooks = await res.json();
  if (!state.webhooks.find((w) => w.id === state.selectedId)) {
    state.selectedId = state.webhooks[0]?.id || null;
  }
  if (state.view === 'live') {
    renderEvents();
    renderDetail();
  }
}

function connectSSE() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  try {
    eventSource = new EventSource('/api/events/stream');
    eventSource.onopen = () => setAutoRefresh(false);
    eventSource.onmessage = () => loadWebhooks();
    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setAutoRefresh(true);
    };
  } catch {
    setAutoRefresh(true);
  }
}

function renderChip() {
  const link = activeLink();
  const text = link ? (link.publicUrl || link.localUrl).replace(/^https?:\/\//, '') : 'nenhum link';
  $('#chipText').textContent = text;
}

/* ---------- events list ---------- */
function filteredWebhooks() {
  const q = state.filter.trim().toLowerCase();
  if (!q) return state.webhooks;
  return state.webhooks.filter((w) =>
    (w.path + ' ' + w.method + ' ' + statusOf(w).text).toLowerCase().includes(q)
  );
}

function orderedWebhooks() {
  const hooks = filteredWebhooks();
  if (state.vtab === 'history') return [...hooks].reverse();
  return hooks;
}

function renderAnalytics() {
  const list = $('#eventsList');
  list.innerHTML = '';
  const hooks = state.webhooks;
  const total = hooks.length;

  if (!total) {
    list.append(
      el('div', {
        class: 'empty',
        html: ICONS.inbox + '<div>Nenhum evento para analisar.<br>Envie um POST para o link do webhook.</div>',
      })
    );
    return;
  }

  const okCount = hooks.filter((h) => statusOf(h).cls === 'ok').length;
  const errCount = total - okCount;
  const okPct = Math.round((okCount / total) * 100);
  const errPct = Math.round((errCount / total) * 100);

  const methods = {};
  hooks.forEach((h) => {
    methods[h.method] = (methods[h.method] || 0) + 1;
  });

  const paths = {};
  hooks.forEach((h) => {
    paths[h.path] = (paths[h.path] || 0) + 1;
  });
  const topPaths = Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const grid = el('div', { class: 'analytics-grid' }, [
    el('div', { class: 'analytics-card' }, [
      el('div', { class: 'analytics-label', text: 'Total de eventos' }),
      el('div', { class: 'analytics-value', text: String(total) }),
    ]),
    el('div', { class: 'analytics-card' }, [
      el('div', { class: 'analytics-label', text: 'Sucesso' }),
      el('div', { class: 'analytics-value', text: String(okCount) }),
      el('div', { class: 'analytics-sub', text: okPct + '%' }),
    ]),
    el('div', { class: 'analytics-card' }, [
      el('div', { class: 'analytics-label', text: 'Erros' }),
      el('div', { class: 'analytics-value', text: String(errCount) }),
      el('div', { class: 'analytics-sub', text: errPct + '%' }),
    ]),
  ]);
  list.append(grid);

  const methodsSection = el('div', { class: 'analytics-section' }, [
    el('h4', { text: 'Métodos HTTP' }),
  ]);
  Object.entries(methods)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      methodsSection.append(
        el('div', { class: 'analytics-row' }, [
          el('span', { text: method }),
          el('span', { class: 'analytics-count', text: count + ' (' + Math.round((count / total) * 100) + '%)' }),
        ])
      );
    });
  list.append(methodsSection);

  const pathsSection = el('div', { class: 'analytics-section' }, [
    el('h4', { text: 'Rotas mais acessadas' }),
  ]);
  topPaths.forEach(([path, count]) => {
    pathsSection.append(
      el('div', { class: 'analytics-row' }, [
        el('span', { text: path }),
        el('span', { class: 'analytics-count', text: String(count) }),
      ])
    );
  });
  list.append(pathsSection);
}

function renderEvents() {
  if (state.vtab === 'analytics') {
    renderAnalytics();
    return;
  }

  const list = $('#eventsList');
  list.innerHTML = '';
  const hooks = orderedWebhooks();
  if (!hooks.length) {
    list.append(
      el('div', {
        class: 'empty',
        html: ICONS.inbox + '<div>Nenhum evento recebido ainda.<br>Envie um POST para o link do webhook.</div>',
      })
    );
    return;
  }
  hooks.forEach((h) => {
    const st = statusOf(h);
    list.append(
      el('div', {
        class: 'event' + (h.id === state.selectedId ? ' active' : ''),
        onclick: () => {
          state.selectedId = h.id;
          renderEvents();
          renderDetail();
          showDetailPane();
        },
      }, [
        el('div', { class: 'event-row1' }, [
          el('span', { class: 'method', text: h.method }),
          el('span', { class: 'time', text: fmtTime(h.receivedAt) }),
        ]),
        el('div', { class: 'event-row2' }, [
          el('span', { class: 'status ' + st.cls, text: st.text }),
          el('span', { class: 'path', text: h.path }),
        ]),
      ])
    );
  });
}

/* ---------- detail ---------- */
function selectedHook() {
  return state.webhooks.find((w) => w.id === state.selectedId) || null;
}

function renderDetail() {
  const body = $('#detailBody');
  body.innerHTML = '';
  const h = selectedHook();
  if (!h) {
    body.append(
      el('div', {
        class: 'empty',
        html: ICONS.inbox + '<div>Selecione um evento para ver os detalhes.</div>',
      })
    );
    return;
  }
  if (state.dtab === 'headers') renderHeadersTab(body, h);
  else if (state.dtab === 'query') renderQueryTab(body, h);
  else if (state.dtab === 'response') renderResponseTab(body, h);
  else renderTraceTab(body, h);
}

function kv(pairs) {
  const grid = el('div', { class: 'kv' });
  pairs.forEach(([k, v, isLink]) => {
    grid.append(
      el('div', { class: 'k', text: k }),
      el('div', { class: 'v' + (isLink ? ' link' : ''), text: v == null ? '—' : String(v) })
    );
  });
  return grid;
}

function renderHeadersTab(body, h) {
  body.append(el('h3', { class: 'detail-title', html: ICONS.info + '<span>Detalhes da requisição</span>' }));
  const hd = h.headers || {};
  const primary = [
    ['Host:', hd.host],
    ['User-Agent:', hd['user-agent']],
    ['Content-Type:', h.contentType || hd['content-type'], true],
    ['X-Request-Id:', hd['x-request-id'] || h.id],
  ];
  body.append(kv(primary));
  const rest = Object.entries(hd).filter(
    ([k]) => !['host', 'user-agent', 'content-type', 'x-request-id'].includes(k)
  );
  if (rest.length) {
    body.append(el('div', { class: 'section-label' }, [el('span', { text: 'Todos os headers' })]));
    body.append(kv(rest.map(([k, v]) => [k + ':', Array.isArray(v) ? v.join(', ') : v])));
  }
  body.append(
    el('div', { class: 'section-label' }, [
      el('span', { text: 'Corpo do payload' }),
      el('button', {
        class: 'link-btn',
        text: '⧉ Copiar JSON',
        onclick: () => copy(h.rawBody || JSON.stringify(h.body, null, 2)),
      }),
    ])
  );
  body.append(bodyBlock(h));
}

function bodyBlock(h) {
  if (h.body != null) return codeBlock(h.body);
  if (h.rawBody) {
    const gutterEl = el('div', {
      class: 'code-gutter',
      text: h.rawBody.split('\n').map((_, i) => i + 1).join('\n'),
    });
    const bodyEl = el('pre', { class: 'code-body', text: h.rawBody });
    syncCodeScroll(gutterEl, bodyEl);
    return el('div', { class: 'code' }, [gutterEl, bodyEl]);
  }
  return el('div', { class: 'empty', text: '(corpo vazio)' });
}

function renderQueryTab(body, h) {
  body.append(el('h3', { class: 'detail-title', html: ICONS.info + '<span>Parâmetros de query</span>' }));
  const q = h.query || {};
  const entries = Object.entries(q);
  if (!entries.length) {
    body.append(el('div', { class: 'empty', text: 'Nenhum parâmetro de query nesta requisição.' }));
    return;
  }
  body.append(kv(entries.map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])));
}

function renderResponseTab(body, h) {
  const st = statusOf(h);
  body.append(el('h3', { class: 'detail-title', html: ICONS.info + '<span>Resposta</span>' }));
  body.append(
    kv([
      ['Status:', st.text],
      [
        'Assinatura:',
        h.signatureValid === true ? 'válida' : h.signatureValid === false ? 'inválida' : 'não verificada',
      ],
    ])
  );
  body.append(el('div', { class: 'section-label' }, [el('span', { text: 'Corpo da resposta' })]));
  body.append(codeBlock(h.responseBody ?? { received: h.signatureValid !== false }));
}

function renderTraceTab(body, h) {
  body.append(el('h3', { class: 'detail-title', html: ICONS.info + '<span>Rastreamento</span>' }));
  body.append(
    kv([
      ['ID interno:', h.id],
      ['ID do evento (payload):', h.eventId || '(sem id no payload)'],
      ['Duplicata:', h.duplicate ? 'sim' : 'não'],
      ['Recebido em:', new Date(h.receivedAt).toLocaleString('pt-BR')],
      ['Método:', h.method],
      ['Rota:', h.path],
      ['URL original:', h.originalUrl],
      ['IP de origem:', h.ip],
      ['Content-Type:', h.contentType],
      ['Tamanho do corpo:', (h.rawBody ? h.rawBody.length : 0) + ' bytes'],
    ])
  );
}

function renderDetailTabs() {
  const container = $('#detailTabs');
  container.innerHTML = '';
  DETAIL_TABS.forEach((tab) => {
    container.append(
      el('button', {
        class: 'tab' + (state.dtab === tab.id ? ' active' : ''),
        'data-dtab': tab.id,
        text: tab.label,
        onclick: () => {
          state.dtab = tab.id;
          $$('#detailTabs .tab').forEach((x) => x.classList.toggle('active', x.dataset.dtab === tab.id));
          updateTabAria(container);
          renderDetail();
        },
      })
    );
  });
  wireTabsKeyboard(container);
  updateTabAria(container);
}

/* ---------- panel views ---------- */
function renderPanel(view) {
  const b = $('#panelBody');
  b.innerHTML = '';
  $('#panelTitleTab').textContent = NAV.find((n) => n.view === view)?.label || 'Painel';
  if (view === 'endpoints') return renderEndpoints(b);
  if (view === 'docs') return renderDocs(b);
  if (view === 'keys') return renderKeys(b);
  if (view === 'settings') return renderSettings(b);
}

function renderEndpoints(b) {
  b.append(el('h1', { text: 'Endpoints' }));
  b.append(
    el('p', {
      class: 'sub',
      text: 'Rotas ativas para receber webhooks. Cada uma é difícil de adivinhar.',
    })
  );
  b.append(
    el('button', {
      class: 'btn-primary',
      html: '＋ Gerar novo link',
      style: 'margin-bottom:16px',
      onclick: newWebhook,
    })
  );
  if (!state.links.length) {
    b.append(el('div', { class: 'empty', text: 'Nenhum link ativo.' }));
    return;
  }
  state.links.forEach((link) => {
    const primary = link.publicUrl || link.localUrl;
    b.append(
      el('div', { class: 'card link-card' }, [
        el('div', { class: 'url' }, [
          document.createTextNode(primary),
          link.publicUrl ? el('span', { class: 'local', text: 'local: ' + link.localUrl }) : null,
        ]),
        el('button', { class: 'mini-btn', html: ICONS.copy + 'Copiar', onclick: () => copy(primary) }),
        el('button', {
          class: 'mini-btn danger',
          html: ICONS.trash,
          title: 'Remover',
          'aria-label': 'Remover link',
          onclick: () => removeLink(link.path),
        }),
      ])
    );
  });
}

function renderDocs(b) {
  const link = activeLink();
  const url = link ? link.publicUrl || link.localUrl : 'http://localhost:3000/<rota>';
  b.append(el('h1', { text: 'Documentação' }));
  b.append(
    el('p', {
      class: 'sub',
      text: 'Servidor leve para receber e inspecionar webhooks com verificação de assinatura HMAC-SHA256.',
    })
  );
  b.append(el('h2', { text: 'Como usar' }));
  b.append(
    el('p', {
      text: '1. Copie a URL do webhook (Endpoints ou o chip no topo). 2. Configure-a no serviço de origem. 3. Acompanhe as requisições em Transmissão ao vivo.',
    })
  );
  b.append(el('h2', { text: 'Teste rápido (curl)' }));
  b.append(
    el('div', {
      class: 'cmd',
      text:
        'curl -X POST ' +
        url +
        ' \\\n  -H "Content-Type: application/json" \\\n  -d \'{"evento":"teste","id":1}\'',
    })
  );
  b.append(el('h2', { text: 'Verificação de assinatura' }));
  b.append(
    el('p', {
      text:
        'O servidor de origem calcula HMAC-SHA256(corpo, WEBHOOK_SECRET) e envia no header "' +
        (state.config.signatureHeader || 'x-signature') +
        '". O receptor recalcula e compara em tempo constante.',
    })
  );
  b.append(el('p', { text: 'Documentação completa em DOCUMENTACAO.md na raiz do projeto.' }));
}

function renderKeys(b) {
  const c = state.config;
  b.append(el('h1', { text: 'Chaves de API' }));
  b.append(
    el('p', {
      class: 'sub',
      text: 'Configuração de assinatura e segredo (definidos no arquivo .env).',
    })
  );
  b.append(
    el('div', { class: 'card' }, [
      kv([
        ['Verificação de assinatura:', c.verifySignature ? 'ativada' : 'desativada'],
        ['Header de assinatura:', c.signatureHeader],
        ['Segredo (WEBHOOK_SECRET):', c.secretConfigured ? '•••••••••• configurado' : 'não configurado'],
      ]),
    ])
  );
  b.append(
    el('p', {
      text: 'O segredo nunca é exposto pelo painel. Para gerar um novo, atualize WEBHOOK_SECRET no .env e reinicie o servidor.',
    })
  );
}

function renderSettings(b) {
  const c = state.config;
  b.append(el('h1', { text: 'Configurações' }));
  b.append(el('p', { class: 'sub', text: 'Configuração do servidor e preferências do painel.' }));
  b.append(
    el('div', { class: 'card' }, [
      kv([
        ['Sessão:', c.session],
        ['Porta:', c.port],
        ['URL pública:', c.publicUrl || 'não definida'],
        ['Verificação de assinatura:', c.verifySignature ? 'ON (' + c.signatureHeader + ')' : 'OFF'],
        ['Armazenamento:', c.storage === 'redis' ? 'Redis' : 'Memória'],
        ['Links ativos:', state.links.length],
        ['Eventos em memória:', state.webhooks.length],
      ]),
    ])
  );
  b.append(
    el('p', {
      text: 'Cada sessão (navegador) é isolada: você só vê os próprios links e webhooks. Abrir em outro navegador ou aba anônima cria uma nova sessão.',
    })
  );
  b.append(el('h2', { text: 'Tema' }));
  const seg = el('div', { class: 'seg' }, [
    el('button', {
      class: state.theme === 'light' ? 'active' : '',
      text: 'Claro',
      onclick: () => {
        if (state.theme !== 'light') toggleTheme();
        renderSettings(b);
      },
    }),
    el('button', {
      class: state.theme === 'dark' ? 'active' : '',
      text: 'Escuro',
      onclick: () => {
        if (state.theme !== 'dark') toggleTheme();
        renderSettings(b);
      },
    }),
  ]);
  b.append(seg);
  b.append(el('h2', { text: 'Histórico' }));
  b.append(
    el('button', {
      class: 'mini-btn danger',
      id: 'clearLogsSettings',
      html: ICONS.trash + 'Limpar histórico',
      onclick: clearLogs,
    })
  );
}

/* ---------- actions ---------- */
async function newWebhook() {
  const buttons = NEW_WEBHOOK_BUTTONS();
  setButtonsLoading(buttons, true);
  try {
    const res = await apiFetch('/api/links', { method: 'POST' });
    const link = await res.json();
    await loadState();
    state.links = [link, ...state.links.filter((l) => l.path !== link.path)];
    renderChip();
    if (state.view === 'endpoints') renderPanel('endpoints');
    toast('Novo link gerado');
    copy(link.publicUrl || link.localUrl);
  } finally {
    setButtonsLoading(buttons, false);
  }
}

async function removeLink(path) {
  if (!confirm('Remover este link? POSTs para ele deixarão de ser aceitos.')) return;
  await apiFetch('/api/links' + path, { method: 'DELETE' });
  await loadState();
  if (state.view === 'endpoints') renderPanel('endpoints');
  toast('Link removido');
}

async function clearLogs() {
  if (!confirm('Limpar todo o histórico de eventos?')) return;
  const buttons = CLEAR_LOG_BUTTONS();
  setButtonsLoading(buttons, true);
  try {
    await apiFetch('/api/webhooks', { method: 'DELETE' });
    state.selectedId = null;
    await loadWebhooks();
    if (state.view !== 'live') renderPanel(state.view);
    toast('Histórico limpo');
  } finally {
    setButtonsLoading(buttons, false);
  }
}

function pingStatus() {
  fetch('/health')
    .then((r) => r.json())
    .then((s) => toast('Sistema ' + s.status + ' · uptime ' + Math.round(s.uptime) + 's'))
    .catch(() => toast('Servidor indisponível'));
}

function setAutoRefresh(on) {
  clearInterval(refreshTimer);
  if (on) refreshTimer = setInterval(() => { if (state.view === 'live') loadWebhooks(); }, 2000);
}

function applyPtBrLabels() {
  const statusBtn = $('#statusBtn');
  if (statusBtn) {
    statusBtn.innerHTML = '<span class="status-dot"></span> Status do sistema';
  }

  const clearBtn = $('#clearLogs');
  if (clearBtn) clearBtn.textContent = 'Limpar histórico';

  const eventsLabel = $('.events-sub .label');
  if (eventsLabel) eventsLabel.textContent = 'Eventos recebidos';

  $$('.btn-label').forEach((el) => {
    el.textContent = 'Novo webhook';
  });

  const newWebhook3 = $('#newWebhook3');
  if (newWebhook3) newWebhook3.setAttribute('aria-label', 'Novo webhook');

  const bellBtn = $('#bellBtn');
  if (bellBtn) bellBtn.setAttribute('aria-label', 'Notificações');

  const endpointChip = $('#endpointChip');
  if (endpointChip) endpointChip.setAttribute('aria-label', 'Copiar URL do webhook');
}

/* ---------- wire up ---------- */
renderDetailTabs();

$$('#viewTabs .tab').forEach((t) =>
  t.addEventListener('click', () => {
    state.vtab = t.dataset.vtab;
    $$('#viewTabs .tab').forEach((x) => x.classList.toggle('active', x === t));
    updateTabAria($('#viewTabs'));
    renderEvents();
  })
);
wireTabsKeyboard($('#viewTabs'));
updateTabAria($('#viewTabs'));

$('#filter').addEventListener('input', (e) => {
  state.filter = e.target.value;
  renderEvents();
});
$('#newWebhook').addEventListener('click', newWebhook);
$('#newWebhook').setAttribute('aria-label', 'Novo webhook');
$('#newWebhook2').addEventListener('click', newWebhook);
$('#newWebhook2').setAttribute('aria-label', 'Novo webhook');
$('#newWebhookFoot').addEventListener('click', newWebhook);
$('#clearLogs').addEventListener('click', clearLogs);
$('#endpointChip').addEventListener('click', () => {
  const l = activeLink();
  if (l) copy(l.publicUrl || l.localUrl);
});
$('#themeBtn').addEventListener('click', toggleTheme);
$('#themeBtn2').addEventListener('click', toggleTheme);
$('#themeBtn3').addEventListener('click', toggleTheme);
$('#newWebhook3').addEventListener('click', newWebhook);
$('#menuBtn').addEventListener('click', toggleSidebar);
$('#backdrop').addEventListener('click', closeSidebar);
$('#backBtn').addEventListener('click', showListPane);
window.addEventListener('resize', () => {
  if (!isMobile()) {
    closeSidebar();
    showListPane();
  }
});
$('#statusBtn').addEventListener('click', pingStatus);
$('#bellBtn').addEventListener('click', () =>
  toast('Notificações: ' + state.webhooks.length + ' evento(s) em memória')
);
$('#footDocs').addEventListener('click', (e) => {
  e.preventDefault();
  setView('docs');
});

/* ---------- boot ---------- */
applyTheme();
applyPtBrLabels();
renderNav();
boot();
