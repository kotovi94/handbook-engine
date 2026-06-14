const STORAGE_KEY = 'd20-travesias-archivo-v2';
const LEGACY_STORAGE_KEY = 'cronicas-experiencia-v1';
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const formatXP = (value) => `${Math.round(Number(value) || 0).toLocaleString('es-CL')} PX`;
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let portfolio = loadPortfolio();
let activeCampaignId = null;
let state = null;
let pendingBanner = '';
let pendingUnlockAction = 'open';
const unlockedCampaigns = new Set();
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function loadPortfolio() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.campaigns)) return saved;
  } catch (error) {
    console.warn('No se pudo leer el guardado local.', error);
  }
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy && Array.isArray(legacy.characters) && Array.isArray(legacy.sessions)) {
      return { campaigns: [{ id: uid(), name: 'Mi primera campaña', dm: '', system: 'D&D 5e', description: 'Campaña recuperada de Crónicas de Experiencia.', color: '#9b4e35', characters: legacy.characters, sessions: legacy.sessions, createdAt: new Date().toISOString() }] };
    }
  } catch (error) {
    console.warn('No se pudo migrar el guardado anterior.', error);
  }
  return { campaigns: [] };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function activeCampaign() {
  return portfolio.campaigns.find(campaign => campaign.id === activeCampaignId);
}

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function requestCampaignUnlock(campaign, action = 'open') {
  pendingUnlockAction = action;
  $('#unlock-campaign-id').value = campaign.id;
  $('#unlock-title').textContent = campaign.name;
  $('#unlock-copy').textContent = action === 'open' ? 'Introduce la contraseña para acceder a sus personajes, sesiones y bitácora.' : 'Introduce la contraseña para administrar esta campaña.';
  $('#unlock-password').value = '';
  $('#unlock-error').classList.add('hidden');
  $('#unlock-modal').classList.remove('hidden');
  $('#unlock-password').focus();
}

function activateCampaign(campaign) {
  const theme = campaign.theme || 'parchment';
  const font = campaign.font || 'classic';
  const appearance = campaign.appearance || 'light';
  const app = $('#campaign-app');
  activeCampaignId = campaign.id;
  state = campaign;
  $('#campaigns-home').classList.add('hidden');
  app.classList.remove('hidden');
  app.dataset.theme = theme;
  app.dataset.font = font;
  app.dataset.appearance = appearance === 'auto' ? (darkModeQuery.matches ? 'dark' : 'light') : appearance;
  app.dataset.appearancePreference = appearance;
  app.style.setProperty('--accent', campaign.color || '#9b4e35');
  const topbar = app.querySelector('.topbar');
  topbar.classList.toggle('has-banner', Boolean(campaign.banner));
  topbar.style.backgroundImage = campaign.banner ? `linear-gradient(90deg, rgba(20,15,11,.86), rgba(20,15,11,.34)), url('${campaign.banner}')` : '';
  $('#sidebar-campaign-name').textContent = campaign.name;
  $('#campaign-context').textContent = campaign.name;
  renderAll();
  renderSessionForm();
  navigate('dashboard');
}

function openCampaign(id) {
  const campaign = portfolio.campaigns.find(entry => entry.id === id);
  if (!campaign) return;
  if (campaign.passwordHash && !unlockedCampaigns.has(id)) return requestCampaignUnlock(campaign);
  activateCampaign(campaign);
}

function deleteCampaign(campaign) {
  if (!confirm(`¿Eliminar la campaña ${campaign.name}? Se borrarán sus personajes, sesiones y experiencia.`)) return;
  portfolio.campaigns = portfolio.campaigns.filter(entry => entry.id !== campaign.id);
  unlockedCampaigns.delete(campaign.id);
  saveState();
  renderCampaigns();
  showToast('Campaña eliminada.');
}

function showCampaignsHome() {
  activeCampaignId = null;
  state = null;
  $('#campaign-app').classList.add('hidden');
  $('#campaigns-home').classList.remove('hidden');
  renderCampaigns();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCampaigns() {
  $('#campaign-count').textContent = `${portfolio.campaigns.length} campaña${portfolio.campaigns.length === 1 ? '' : 's'}`;
  $('#campaign-grid').innerHTML = portfolio.campaigns.length ? portfolio.campaigns.map(campaign => {
    const totalXP = campaign.sessions.reduce((sum, session) => sum + (session.totalAwarded || 0), 0);
    const bannerStyle = campaign.banner ? `background-image:url('${campaign.banner}')` : '';
    const fontFamilies = { classic: 'Cinzel,serif', medieval: 'MedievalSharp,cursive', chronicle: 'IM Fell English,serif', arcane: 'Uncial Antiqua,serif', modern: 'Inter,sans-serif' };
    return `<article class="campaign-card" style="--campaign-color:${campaign.color || '#9b4e35'};--card-display-font:${fontFamilies[campaign.font || 'classic']}">
      <div class="campaign-card-banner" style="${bannerStyle}"></div>
      <div class="campaign-card-content">
        <p class="eyebrow">${escapeHTML(campaign.system || 'D&D')}</p>
        <h3>${escapeHTML(campaign.name)}</h3>
        <p>${escapeHTML(campaign.description || 'Una nueva travesía está a punto de comenzar.')}</p>
        <div class="campaign-meta"><span>${campaign.characters.length} personajes</span><span>${campaign.sessions.length} sesiones</span><span>${formatXP(totalXP)}</span>${campaign.dm ? `<span>DM: ${escapeHTML(campaign.dm)}</span>` : ''}${campaign.passwordHash ? '<span class="lock-label">Protegida</span>' : ''}</div>
      </div>
      <div class="campaign-card-actions">
        <button class="primary-button open-campaign" data-id="${campaign.id}">Entrar a la campaña</button>
        <div class="campaign-card-tools"><button class="text-button edit-campaign" data-id="${campaign.id}">Editar</button><button class="text-button danger-button delete-campaign" data-id="${campaign.id}">Eliminar</button></div>
      </div>
    </article>`;
  }).join('') : `<div class="empty-state" style="grid-column:1/-1"><h3>Tu primera travesía te espera</h3><p>Crea una campaña para comenzar a reunir personajes, sesiones y experiencia.</p><button class="primary-button" id="empty-new-campaign">Crear primera campaña</button></div>`;
}

function openCampaignModal(campaign = null) {
  $('#campaign-form').reset();
  $('#campaign-id').value = campaign?.id || '';
  $('#campaign-name').value = campaign?.name || '';
  $('#campaign-dm').value = campaign?.dm || '';
  $('#campaign-system').value = campaign?.system || 'D&D 5e';
  $('#campaign-description').value = campaign?.description || '';
  $('#campaign-theme').value = campaign?.theme || 'parchment';
  $('#campaign-font').value = campaign?.font || 'classic';
  $('#font-preview').dataset.font = campaign?.font || 'classic';
  $('#campaign-appearance').value = campaign?.appearance || 'light';
  $('#campaign-color').value = campaign?.color || '#9b4e35';
  $('#campaign-protected').checked = Boolean(campaign?.passwordHash);
  $('#campaign-password').value = '';
  $('#campaign-password-fields').classList.toggle('hidden', !campaign?.passwordHash);
  pendingBanner = campaign?.banner || '';
  updateBannerPreview();
  $('#campaign-form-title').textContent = campaign ? 'Editar campaña' : 'Crear campaña';
  $('#campaign-modal').classList.remove('hidden');
  $('#campaign-name').focus();
}

function updateBannerPreview() {
  const preview = $('#campaign-banner-preview');
  preview.style.backgroundImage = pendingBanner ? `url('${pendingBanner}')` : '';
  preview.innerHTML = pendingBanner ? '' : '<span>Sin imagen seleccionada</span>';
  $('#remove-campaign-banner').classList.toggle('hidden', !pendingBanner);
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function closeCampaignModal() {
  $('#campaign-modal').classList.add('hidden');
}

function getLevel(xp) {
  let level = 1;
  XP_THRESHOLDS.forEach((threshold, index) => { if (xp >= threshold) level = index + 1; });
  return Math.min(level, 20);
}

function getProgress(xp) {
  const level = getLevel(xp);
  if (level === 20) return { level, percent: 100, current: xp, next: null, remaining: 0 };
  const current = XP_THRESHOLDS[level - 1];
  const next = XP_THRESHOLDS[level];
  return { level, current, next, remaining: next - xp, percent: Math.max(0, Math.min(100, ((xp - current) / (next - current)) * 100)) };
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function navigate(view) {
  if (!state) return;
  $$('.view').forEach(section => section.classList.toggle('active', section.id === `${view}-view`));
  $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  const titles = { dashboard: 'Resumen de campaña', characters: 'Personajes', 'new-session': 'Registrar nueva sesión', log: 'Bitácora de campaña' };
  $('#page-title').textContent = titles[view];
  if (view === 'new-session') renderSessionForm();
  if (view === 'log') renderLog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function characterCard(character) {
  const progress = getProgress(character.xp);
  const subtitle = [character.className, character.player ? `Jugador: ${character.player}` : ''].filter(Boolean).join(' · ') || 'Aventurero';
  return `
    <article class="character-card">
      <div class="character-top">
        <div class="avatar" style="background:${character.color}">${escapeHTML(character.name.charAt(0).toUpperCase())}</div>
        <div class="character-meta"><h3>${escapeHTML(character.name)}</h3><p>${escapeHTML(subtitle)}</p></div>
        <div class="level-badge">NIVEL<b>${progress.level}</b></div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
      <div class="progress-caption"><span>${formatXP(character.xp)}</span><span>${progress.next ? `${formatXP(progress.remaining)} para nivel ${progress.level + 1}` : 'Nivel máximo'}</span></div>
    </article>`;
}

function renderDashboard() {
  const totalAwarded = state.sessions.reduce((sum, session) => sum + session.totalAwarded, 0);
  const attendance = state.sessions.reduce((sum, session) => sum + session.allocations.length, 0);
  const averageLevel = state.characters.length ? (state.characters.reduce((sum, character) => sum + getLevel(character.xp), 0) / state.characters.length).toFixed(1) : '—';
  $('#stats-grid').innerHTML = [
    ['Personajes', state.characters.length],
    ['Sesiones', state.sessions.length],
    ['PX otorgados', Math.round(totalAwarded).toLocaleString('es-CL')],
    ['Nivel promedio', averageLevel]
  ].map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('');

  $('#dashboard-characters').innerHTML = state.characters.length
    ? state.characters.map(characterCard).join('')
    : emptyState('Aún no hay personajes', 'Añade a los aventureros de la campaña para comenzar a registrar experiencia.', 'characters', 'Crear primer personaje');

  const recent = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  $('#recent-sessions').innerHTML = recent.length ? recent.map(session => `
    <article class="timeline-item">
      <div class="timeline-number">SESIÓN ${session.number}</div>
      <div><h3>${escapeHTML(session.name)}</h3><p>${formatDate(session.date)} · ${session.allocations.length} participante${session.allocations.length === 1 ? '' : 's'}</p></div>
      <div class="timeline-xp">${formatXP(session.totalAwarded)}</div>
    </article>`).join('') : emptyState('La historia comienza aquí', 'Cuando registres una sesión, aparecerá en esta línea de tiempo.', 'new-session', 'Registrar sesión');
}

function emptyState(title, copy, view, action) {
  const button = view && action ? `<button class="secondary-button" data-go="${view}">${action}</button>` : '';
  return `<div class="empty-state"><h3>${title}</h3><p>${copy}</p>${button}</div>`;
}

function renderCharacters() {
  $('#character-list').innerHTML = state.characters.length ? state.characters.map(character => {
    const progress = getProgress(character.xp);
    return `<article class="character-row">
      <div class="avatar" style="background:${character.color}">${escapeHTML(character.name.charAt(0).toUpperCase())}</div>
      <div class="character-meta"><h3>${escapeHTML(character.name)}</h3><p>${escapeHTML(character.className || 'Sin clase')} · Nivel ${progress.level}${character.player ? ` · ${escapeHTML(character.player)}` : ''}</p></div>
      <div class="xp-amount">${formatXP(character.xp)}<small>${progress.next ? `${formatXP(progress.remaining)} para subir` : 'Nivel máximo'}</small></div>
      <div class="row-actions"><button class="text-button edit-character" data-id="${character.id}">Editar</button><button class="text-button danger-button delete-character" data-id="${character.id}">Eliminar</button></div>
    </article>`;
  }).join('') : emptyState('Sin aventureros', 'Usa el formulario para añadir el primer personaje de la campaña.', '', '');
}

function resetCharacterForm() {
  $('#character-form').reset();
  $('#character-id').value = '';
  $('#character-color').value = '#b97a45';
  $('#character-xp').value = 0;
  $('#character-form-title').textContent = 'Añadir personaje';
  $('#cancel-character').classList.add('hidden');
}

function renderSessionForm() {
  $('#session-number').value = state.sessions.length ? Math.max(...state.sessions.map(session => Number(session.number) || 0)) + 1 : 1;
  if (!$('#session-date').value) $('#session-date').value = new Date().toISOString().slice(0, 10);
  const attendance = $('#attendance-list');
  if (!state.characters.length) {
    attendance.innerHTML = emptyState('Primero necesitas personajes', 'Añade los integrantes de la campaña antes de repartir experiencia.', 'characters', 'Añadir personajes');
    $('#individual-bonuses').innerHTML = '';
    updateDistribution();
    return;
  }
  attendance.innerHTML = state.characters.map(character => `
    <label class="attendance-item"><input class="attendance-check" type="checkbox" value="${character.id}" checked><span class="avatar" style="width:30px;height:30px;font-size:12px;background:${character.color}">${escapeHTML(character.name.charAt(0))}</span><b>${escapeHTML(character.name)}</b><small>Nivel ${getLevel(character.xp)}</small></label>`).join('');
  $('#individual-bonuses').innerHTML = state.characters.map(character => `
    <div class="bonus-item" data-character="${character.id}">
      <div class="bonus-head"><span class="avatar" style="width:27px;height:27px;font-size:11px;background:${character.color}">${escapeHTML(character.name.charAt(0))}</span><strong>${escapeHTML(character.name)}</strong></div>
      <div class="bonus-inputs">
        <label>Combate<input class="bonus-combat" type="number" min="0" step="1" value="0"></label>
        <label>Roleo<input class="bonus-roleplay" type="number" min="0" step="1" value="0"></label>
        <label>Manual<input class="bonus-manual" type="number" min="0" step="1" value="0"></label>
      </div>
    </div>`).join('');
  updateDistribution();
}

function getDistribution() {
  const attendees = $$('.attendance-check:checked').map(input => input.value);
  const pools = {
    combat: Number($('#combat-pool').value) || 0,
    roleplay: Number($('#roleplay-pool').value) || 0,
    manual: Number($('#manual-pool').value) || 0
  };
  const count = attendees.length;
  return attendees.map(characterId => {
    const bonus = $(`.bonus-item[data-character="${characterId}"]`);
    const individual = {
      combat: Number(bonus?.querySelector('.bonus-combat').value) || 0,
      roleplay: Number(bonus?.querySelector('.bonus-roleplay').value) || 0,
      manual: Number(bonus?.querySelector('.bonus-manual').value) || 0
    };
    const group = {
      combat: count ? pools.combat / count : 0,
      roleplay: count ? pools.roleplay / count : 0,
      manual: count ? pools.manual / count : 0
    };
    const character = state.characters.find(entry => entry.id === characterId);
    return { characterId, characterName: character?.name || 'Personaje', group, individual, total: group.combat + group.roleplay + group.manual + individual.combat + individual.roleplay + individual.manual };
  });
}

function updateDistribution() {
  const attending = new Set($$('.attendance-check:checked').map(input => input.value));
  $$('.bonus-item').forEach(item => {
    const enabled = attending.has(item.dataset.character);
    item.classList.toggle('disabled', !enabled);
    item.querySelectorAll('input').forEach(input => input.disabled = !enabled);
  });
  const distribution = getDistribution();
  const total = distribution.reduce((sum, item) => sum + item.total, 0);
  $('#session-total').textContent = formatXP(total);
  $('#distribution-preview').innerHTML = distribution.length ? distribution.map(item => {
    const character = state.characters.find(entry => entry.id === item.characterId);
    return `<div class="preview-row"><span>${escapeHTML(character?.name || 'Personaje')}</span><b>+${formatXP(item.total)}</b></div>`;
  }).join('') : '<p class="helper">Marca al menos un personaje como asistente.</p>';
}

function saveSession(event) {
  event.preventDefault();
  const distribution = getDistribution();
  if (!state.characters.length) return showToast('Añade personajes antes de crear una sesión.');
  if (!distribution.length) return showToast('Marca al menos un personaje presente.');

  const session = {
    id: uid(),
    number: Number($('#session-number').value),
    date: $('#session-date').value,
    name: $('#session-name').value.trim(),
    pools: { combat: Number($('#combat-pool').value) || 0, roleplay: Number($('#roleplay-pool').value) || 0, manual: Number($('#manual-pool').value) || 0 },
    notes: { combat: $('#combat-notes').value.trim(), roleplay: $('#roleplay-notes').value.trim() },
    historical: $('#historical-session').checked,
    allocations: distribution,
    totalAwarded: distribution.reduce((sum, item) => sum + item.total, 0),
    createdAt: new Date().toISOString()
  };

  session.allocations.forEach(allocation => {
    const character = state.characters.find(entry => entry.id === allocation.characterId);
    if (character) character.xp = Math.round((character.xp + allocation.total) * 100) / 100;
  });
  state.sessions.push(session);
  saveState();
  $('#session-form').reset();
  $('#session-date').value = new Date().toISOString().slice(0, 10);
  renderAll();
  navigate('log');
  showToast('Sesión guardada y experiencia aplicada.');
}

function renderLog(query = '') {
  const normalized = query.trim().toLowerCase();
  const sessions = [...state.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).filter(session => {
    const participantNames = session.allocations.map(item => item.characterName || state.characters.find(character => character.id === item.characterId)?.name || '').join(' ');
    return `${session.name} ${session.number} ${session.notes.combat} ${session.notes.roleplay} ${participantNames}`.toLowerCase().includes(normalized);
  });
  $('#session-log').innerHTML = sessions.length ? sessions.map(session => `
    <article class="log-card">
      <header class="log-card-header">
        <div class="session-seal">${session.number}</div>
        <div><h3>${escapeHTML(session.name)}${session.historical ? '<span class="history-badge">Sesión anterior</span>' : ''}</h3><p>${formatDate(session.date)} · ${session.allocations.length} participante${session.allocations.length === 1 ? '' : 's'}</p></div>
        <div class="log-card-total">${formatXP(session.totalAwarded)}<small>Total otorgado</small></div>
      </header>
      <div class="log-body">
        ${(session.notes.combat || session.notes.roleplay) ? `<div class="log-notes">
          <div class="log-note"><b>Combate</b><p>${escapeHTML(session.notes.combat || 'Sin notas de combate.')}</p></div>
          <div class="log-note"><b>Roleo y aventura</b><p>${escapeHTML(session.notes.roleplay || 'Sin notas de roleo.')}</p></div>
        </div>` : ''}
        <table class="allocation-table">
          <thead><tr><th>Personaje</th><th>Combate</th><th>Roleo</th><th>Otros</th><th>Total</th></tr></thead>
          <tbody>${session.allocations.map(item => {
            const character = state.characters.find(entry => entry.id === item.characterId);
            const combat = item.group.combat + item.individual.combat;
            const roleplay = item.group.roleplay + item.individual.roleplay;
            const manual = item.group.manual + item.individual.manual;
            return `<tr><td>${escapeHTML(item.characterName || character?.name || 'Personaje eliminado')}</td><td>${formatXP(combat)}</td><td>${formatXP(roleplay)}</td><td>${formatXP(manual)}</td><td><b>${formatXP(item.total)}</b></td></tr>`;
          }).join('')}</tbody>
        </table>
        <footer class="log-footer"><button class="text-button danger-button delete-session" data-id="${session.id}">Eliminar sesión y revertir PX</button></footer>
      </div>
    </article>`).join('') : emptyState(normalized ? 'Sin resultados' : 'Bitácora vacía', normalized ? 'No encontramos sesiones que coincidan con la búsqueda.' : 'Registra la primera sesión para comenzar el historial.', 'new-session', 'Registrar sesión');
}

function formatDate(date) {
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function renderAll() {
  if (!state) return;
  renderDashboard();
  renderCharacters();
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-action="campaigns-home"]')) showCampaignsHome();
  const openCampaignButton = event.target.closest('.open-campaign');
  if (openCampaignButton) openCampaign(openCampaignButton.dataset.id);
  const editCampaignButton = event.target.closest('.edit-campaign');
  if (editCampaignButton) {
    const campaign = portfolio.campaigns.find(entry => entry.id === editCampaignButton.dataset.id);
    if (campaign?.passwordHash && !unlockedCampaigns.has(campaign.id)) requestCampaignUnlock(campaign, 'edit');
    else if (campaign) openCampaignModal(campaign);
  }
  if (event.target.closest('#empty-new-campaign')) openCampaignModal();
  const deleteCampaignButton = event.target.closest('.delete-campaign');
  if (deleteCampaignButton) {
    const campaign = portfolio.campaigns.find(entry => entry.id === deleteCampaignButton.dataset.id);
    if (campaign?.passwordHash && !unlockedCampaigns.has(campaign.id)) requestCampaignUnlock(campaign, 'delete');
    else if (campaign) deleteCampaign(campaign);
  }
  const goButton = event.target.closest('[data-go]');
  if (goButton && goButton.dataset.go) navigate(goButton.dataset.go);
  const navButton = event.target.closest('.nav-item');
  if (navButton) navigate(navButton.dataset.view);

  const editButton = event.target.closest('.edit-character');
  if (editButton) {
    const character = state.characters.find(entry => entry.id === editButton.dataset.id);
    if (!character) return;
    $('#character-id').value = character.id;
    $('#character-name').value = character.name;
    $('#player-name').value = character.player;
    $('#character-class').value = character.className;
    $('#character-xp').value = character.xp;
    $('#character-color').value = character.color;
    $('#character-form-title').textContent = 'Editar personaje';
    $('#cancel-character').classList.remove('hidden');
    $('#character-name').focus();
  }

  const deleteCharacter = event.target.closest('.delete-character');
  if (deleteCharacter) {
    const character = state.characters.find(entry => entry.id === deleteCharacter.dataset.id);
    if (character && confirm(`¿Eliminar a ${character.name}? Las sesiones guardadas permanecerán en la bitácora.`)) {
      state.characters = state.characters.filter(entry => entry.id !== character.id);
      saveState();
      renderAll();
      showToast('Personaje eliminado.');
    }
  }

  const deleteSession = event.target.closest('.delete-session');
  if (deleteSession) {
    const session = state.sessions.find(entry => entry.id === deleteSession.dataset.id);
    if (session && confirm(`¿Eliminar la sesión ${session.number}? La experiencia otorgada se descontará de los personajes.`)) {
      session.allocations.forEach(allocation => {
        const character = state.characters.find(entry => entry.id === allocation.characterId);
        if (character) character.xp = Math.max(0, Math.round((character.xp - allocation.total) * 100) / 100);
      });
      state.sessions = state.sessions.filter(entry => entry.id !== session.id);
      saveState();
      renderAll();
      renderLog($('#log-search').value);
      showToast('Sesión eliminada y experiencia revertida.');
    }
  }
});

$('#character-form').addEventListener('submit', event => {
  event.preventDefault();
  const id = $('#character-id').value;
  const data = {
    id: id || uid(),
    name: $('#character-name').value.trim(),
    player: $('#player-name').value.trim(),
    className: $('#character-class').value.trim(),
    xp: Number($('#character-xp').value) || 0,
    color: $('#character-color').value
  };
  if (id) state.characters = state.characters.map(character => character.id === id ? data : character);
  else state.characters.push(data);
  saveState();
  resetCharacterForm();
  renderAll();
  showToast(id ? 'Personaje actualizado.' : 'Personaje añadido.');
});

$('#cancel-character').addEventListener('click', resetCharacterForm);
$('#session-form').addEventListener('submit', saveSession);
$('#session-form').addEventListener('input', updateDistribution);
$('#session-form').addEventListener('change', updateDistribution);
$('#select-all').addEventListener('click', () => {
  const checks = $$('.attendance-check');
  const shouldCheck = checks.some(check => !check.checked);
  checks.forEach(check => check.checked = shouldCheck);
  updateDistribution();
});
$('#log-search').addEventListener('input', event => renderLog(event.target.value));

$('#open-campaign-form').addEventListener('click', () => openCampaignModal());
$('#close-campaign-form').addEventListener('click', closeCampaignModal);
$('#campaign-modal').addEventListener('click', event => { if (event.target.id === 'campaign-modal') closeCampaignModal(); });
$('#campaign-protected').addEventListener('change', event => {
  $('#campaign-password-fields').classList.toggle('hidden', !event.target.checked);
  if (event.target.checked) $('#campaign-password').focus();
});
$('#campaign-font').addEventListener('change', event => {
  $('#font-preview').dataset.font = event.target.value;
});
$('#campaign-banner').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    event.target.value = '';
    return showToast('La imagen debe pesar menos de 8 MB.');
  }
  try {
    pendingBanner = await resizeImage(file);
    updateBannerPreview();
  } catch (error) {
    showToast('No se pudo leer esa imagen.');
  }
});
$('#remove-campaign-banner').addEventListener('click', () => {
  pendingBanner = '';
  $('#campaign-banner').value = '';
  updateBannerPreview();
});
$('#close-unlock-form').addEventListener('click', () => $('#unlock-modal').classList.add('hidden'));
$('#unlock-modal').addEventListener('click', event => { if (event.target.id === 'unlock-modal') $('#unlock-modal').classList.add('hidden'); });
$('#unlock-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#unlock-campaign-id').value;
  const campaign = portfolio.campaigns.find(entry => entry.id === id);
  if (!campaign) return;
  const passwordHash = await hashPassword($('#unlock-password').value);
  if (passwordHash !== campaign.passwordHash) {
    $('#unlock-error').classList.remove('hidden');
    $('#unlock-password').select();
    return;
  }
  unlockedCampaigns.add(id);
  $('#unlock-modal').classList.add('hidden');
  if (pendingUnlockAction === 'edit') openCampaignModal(campaign);
  else if (pendingUnlockAction === 'delete') deleteCampaign(campaign);
  else activateCampaign(campaign);
});
$('#campaign-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#campaign-id').value;
  const existing = portfolio.campaigns.find(campaign => campaign.id === id);
  const wantsProtection = $('#campaign-protected').checked;
  const password = $('#campaign-password').value;
  if (wantsProtection && !existing?.passwordHash && password.length < 4) {
    $('#campaign-password').focus();
    return showToast('La contraseña debe tener al menos 4 caracteres.');
  }
  const passwordHash = wantsProtection ? (password ? await hashPassword(password) : existing?.passwordHash) : '';
  const campaign = {
    id: id || uid(),
    name: $('#campaign-name').value.trim(),
    dm: $('#campaign-dm').value.trim(),
    system: $('#campaign-system').value.trim() || 'D&D 5e',
    description: $('#campaign-description').value.trim(),
    theme: $('#campaign-theme').value,
    font: $('#campaign-font').value,
    appearance: $('#campaign-appearance').value,
    color: $('#campaign-color').value,
    banner: pendingBanner,
    passwordHash,
    characters: existing?.characters || [],
    sessions: existing?.sessions || [],
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  if (existing) portfolio.campaigns = portfolio.campaigns.map(entry => entry.id === id ? campaign : entry);
  else portfolio.campaigns.push(campaign);
  if (passwordHash) unlockedCampaigns.add(campaign.id);
  else unlockedCampaigns.delete(campaign.id);
  saveState();
  closeCampaignModal();
  renderCampaigns();
  showToast(existing ? 'Campaña actualizada.' : 'Campaña creada.');
});

$('#export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `d20-travesias-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

$('#import-data').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const normalized = Array.isArray(imported.campaigns) ? imported : (Array.isArray(imported.characters) && Array.isArray(imported.sessions) ? { campaigns: [{ id: uid(), name: 'Campaña importada', dm: '', system: 'D&D 5e', description: '', color: '#9b4e35', characters: imported.characters, sessions: imported.sessions, createdAt: new Date().toISOString() }] } : null);
      if (!normalized) throw new Error('Formato inválido');
      if (!confirm('Esto reemplazará los datos actuales. ¿Continuar?')) return;
      portfolio = normalized;
      saveState();
      showCampaignsHome();
      showToast('Respaldo importado correctamente.');
    } catch (error) {
      showToast('El archivo no es un respaldo válido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
});

renderCampaigns();

darkModeQuery.addEventListener('change', event => {
  const app = $('#campaign-app');
  if (app.dataset.appearancePreference === 'auto') app.dataset.appearance = event.matches ? 'dark' : 'light';
});
