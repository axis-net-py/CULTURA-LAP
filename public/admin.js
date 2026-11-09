const $ = (selector) => document.querySelector(selector);
let page = 1;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.message || 'Falha na solicitação.'), { status: response.status });
  }
  return data;
}

function showDashboard() {
  $('#login-panel').hidden = true;
  $('#dashboard').hidden = false;
  $('#logout').hidden = false;
  loadResults();
}

function showLogin() {
  $('#login-panel').hidden = false;
  $('#dashboard').hidden = true;
  $('#logout').hidden = true;
}

function query() {
  const data = new FormData($('#filters'));
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  for (const [key, value] of data) {
    if (value) params.set(key, value);
  }
  return params;
}

function escapeHtml(value) {
  const node = document.createElement('span');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}

function badgeClass(band) {
  if (band === 'SOLID') return 'badge-solid';
  if (band === 'BUILDING') return 'badge-building';
  return 'badge-risk';
}

function renderOverview(overview, companies) {
  const card = $('#company-overview-card');
  if (!card) return;

  // Datalist and quick pills
  const datalist = $('#company-list');
  if (datalist && Array.isArray(companies)) {
    datalist.innerHTML = companies.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
  }

  const pillsWrap = $('#company-quick-filters');
  if (pillsWrap && Array.isArray(companies)) {
    const currentCompany = ($('#company-filter')?.value || '').trim();
    const allCompanies = ['Todas', ...companies];
    pillsWrap.innerHTML = allCompanies.map((c) => {
      const isAll = c === 'Todas';
      const isActive = isAll ? !currentCompany : currentCompany.toLowerCase() === c.toLowerCase();
      return `<button type="button" class="company-pill ${isActive ? 'active' : ''}" data-company="${isAll ? '' : escapeHtml(c)}">${escapeHtml(c)}</button>`;
    }).join('');
    pillsWrap.hidden = companies.length === 0;

    pillsWrap.querySelectorAll('.company-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const comp = btn.dataset.company || '';
        const compInput = $('#company-filter');
        if (compInput) compInput.value = comp;
        page = 1;
        loadResults();
      });
    });
  }

  if (!overview || overview.count === 0) {
    card.hidden = true;
    return;
  }

  card.hidden = false;
  const compTitle = overview.company || 'Todas as Empresas';
  $('#overview-company-title').textContent = compTitle;
  $('#overview-meta').textContent = `${overview.count} colaborador${overview.count === 1 ? '' : 'es'} avaliado${overview.count === 1 ? '' : 's'} · Diagnóstico Consolidado`;

  const m = overview.maturity || {};
  const badge = $('#overview-maturity-badge');
  if (badge) {
    badge.textContent = m.name || 'Diagnóstico Concluído';
    badge.className = `maturity-badge ${badgeClass(m.band)}`;
    if (m.color) {
      badge.style.color = '#ffffff';
      badge.style.backgroundColor = m.color;
    }
  }

  $('#overview-avg-index').textContent = Number(overview.avgCulturalIndex).toFixed(2);
  $('#overview-avg-score').textContent = `Média: ${overview.avgTotalScore.toFixed(1)} / 100 pontos`;
  $('#overview-maturity-desc').textContent = m.description || '';

  // Dimensions
  const dimsList = $('#overview-dims-list');
  if (dimsList && Array.isArray(overview.dimensions)) {
    dimsList.innerHTML = overview.dimensions.map((d) => `
      <div class="dim-item-row">
        <span class="dim-item-title">${escapeHtml(d.title)}</span>
        <span class="dim-item-val">${d.average.toFixed(2)} / 5.0 (${d.percentage}%)</span>
        <div class="dim-item-bar-bg">
          <div class="dim-item-bar-fill" style="width: ${d.percentage}%;"></div>
        </div>
      </div>
    `).join('');
  }

  // Strengths
  const strList = $('#overview-strengths-list');
  if (strList && Array.isArray(overview.strengths)) {
    strList.innerHTML = overview.strengths.length
      ? overview.strengths.map((s) => `
          <li class="insight-item">
            <span class="insight-text"><strong>Q${s.id}.</strong> ${escapeHtml(s.text)}</span>
            <span class="insight-score-pill">Média ${s.average.toFixed(2)} (${s.percentage}%)</span>
          </li>
        `).join('')
      : '<li class="insight-item">Dados insuficientes.</li>';
  }

  // Gaps
  const gapsList = $('#overview-gaps-list');
  if (gapsList && Array.isArray(overview.gaps)) {
    gapsList.innerHTML = overview.gaps.length
      ? overview.gaps.map((g) => `
          <li class="insight-item">
            <span class="insight-text"><strong>Q${g.id}.</strong> ${escapeHtml(g.text)}</span>
            <span class="insight-score-pill">Média ${g.average.toFixed(2)} (${g.percentage}%)</span>
          </li>
        `).join('')
      : '<li class="insight-item">Nenhum gargalo expressivo detectado.</li>';
  }
}

async function loadResults() {
  try {
    const qStr = query().toString();
    const [data, overviewData] = await Promise.all([
      api(`/api/admin/assessments?${qStr}`),
      api(`/api/admin/overview?${qStr}`).catch(() => ({ overview: null, companies: [] }))
    ]);

    $('#summary').textContent = `${data.total} diagnóstico${data.total === 1 ? '' : 's'} encontrado${data.total === 1 ? '' : 's'}`;
    $('#results').innerHTML = data.items.map((item) => {
      const bClass = badgeClass(item.maturity?.band);
      return `
        <tr>
          <td>${new Date(item.completedAt).toLocaleDateString('pt-BR')}</td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${escapeHtml(item.company || '—')}</td>
          <td><a href="https://wa.me/${escapeHtml((item.phone || '').replace(/\D/g, ''))}" target="_blank" rel="noopener">${escapeHtml(item.phone)}</a></td>
          <td>${item.country === 'BR' ? '🇧🇷 Brasil' : '🇵🇾 Paraguay'}</td>
          <td><strong>${item.culturalIndex ? Number(item.culturalIndex).toFixed(2) : '—'}</strong> / 5.0</td>
          <td><span class="maturity-badge ${bClass}">${escapeHtml(item.maturity?.name || '—')}</span></td>
          <td>
            <button class="table-action" data-view="${item.id}">Ver</button>
            <button class="table-action danger" data-delete="${item.id}">Excluir</button>
          </td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="8">Nenhum diagnóstico encontrado.</td></tr>';

    renderPages(data.total, data.pageSize);
    renderOverview(overviewData.overview, overviewData.companies);
    bindActions();
  } catch (error) {
    if (error.status === 401) return showLogin();
    alert(error.message);
  }
}

function renderPages(total, size) {
  const pages = Math.ceil(total / size);
  $('#pagination').innerHTML = pages > 1
    ? Array.from({ length: pages }, (_, index) => `
        <button data-page="${index + 1}" class="${page === index + 1 ? 'active' : ''}">${index + 1}</button>
      `).join('')
    : '';

  $('#pagination').querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      page = Number(button.dataset.page);
      loadResults();
    });
  });
}

function bindActions() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const item = await api(`/api/admin/assessments/${button.dataset.view}`);
        const dims = item.dimensions || [];
        const strengths = item.maturity?.strengths || [];
        const gaps = item.maturity?.gaps || [];

        $('#detail-content').innerHTML = `
          <div class="detail-header">
            <p class="eyebrow">DIAGNÓSTICO CULTURAL INDIVIDUAL</p>
            <h2>${escapeHtml(item.name)}</h2>
            <p class="detail-meta">${escapeHtml(item.company)} · ${escapeHtml(item.phone)} · ${item.country === 'BR' ? 'Brasil' : 'Paraguay'}</p>
          </div>

          <div class="detail-index-box">
            <div class="detail-index-num">${Number(item.culturalIndex).toFixed(2)}</div>
            <div>
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700;">Índice de Aderência Cultural</p>
              <h3 style="margin: 2px 0 0; font-size: 18px; color: ${item.maturity?.color || 'var(--ink)'};">${escapeHtml(item.maturity?.name || '')}</h3>
              <p style="margin: 4px 0 0; font-size: 13px; color: var(--muted);">${escapeHtml(item.maturity?.description || '')}</p>
            </div>
          </div>

          <h4 style="margin: 16px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--navy);">Dimensões da Cultura LAP</h4>
          <div class="detail-dims">
            ${dims.map((d) => `
              <div class="dim-row">
                <span><strong>${escapeHtml(d.name)}</strong></span>
                <span>${d.average.toFixed(2)} / 5.0 (${d.score}/${d.maxScore})</span>
                <div class="dim-bar-wrap">
                  <div class="dim-bar-fill" style="width: ${(d.average / 5) * 100}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>

          ${strengths.length ? `
            <h4 style="margin: 16px 0 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #047857;">Fortalezas Consolidadas</h4>
            <ul class="detail-list">${strengths.map((s) => `<li>${escapeHtml(s.text)} (Nota: ${s.rating}/5)</li>`).join('')}</ul>
          ` : ''}

          ${gaps.length ? `
            <h4 style="margin: 16px 0 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #c2410c;">Gargalos Prioritários</h4>
            <ul class="detail-list">${gaps.map((g) => `<li>${escapeHtml(g.text)} (Nota: ${g.rating}/5)</li>`).join('')}</ul>
          ` : ''}

          <div class="detail-actions">
            <a class="primary compact" href="https://wa.me/${escapeHtml((item.phone || '').replace(/\D/g, ''))}" target="_blank" rel="noopener">Conversar no WhatsApp <b>→</b></a>
            <button class="secondary compact" onclick="document.querySelector('#detail').close()">Fechar</button>
          </div>
        `;
        $('#detail').showModal();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja excluir este diagnóstico?')) {
        try {
          await api(`/api/admin/assessments/${button.dataset.delete}`, { method: 'DELETE' });
          loadResults();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/admin/session', {
      method: 'POST',
      body: JSON.stringify({ password: $('#password').value })
    });
    $('#login-error').hidden = true;
    showDashboard();
  } catch {
    $('#login-error').textContent = 'Credenciais inválidas.';
    $('#login-error').hidden = false;
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/admin/session', { method: 'DELETE' });
  showLogin();
});

$('#filters').addEventListener('submit', (event) => {
  event.preventDefault();
  page = 1;
  loadResults();
});

$('#export').addEventListener('click', (event) => {
  event.preventDefault();
  location.href = `/api/admin/export?${query()}`;
});

$('#close-detail').addEventListener('click', () => $('#detail').close());

// Initial session check
api('/api/admin/session').then(showDashboard).catch(showLogin);
