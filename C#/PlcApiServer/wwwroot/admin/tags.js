// ============================================================================
// tags.js — "PLC 태그 관리" 화면 로직
// ============================================================================
// 서버(같은 오리진, 5050)의 /api/admin/* CRUD + 엑셀 API만 호출한다. 값 읽기/쓰기(/api/foldertag/*)는
// 이 화면의 책임이 아니다 — 여기는 태그 "정의"(이름/주소/PLC)만 관리한다.
// ============================================================================

// ── 공용: fetch 래퍼(JSON) + 업로드 래퍼(FormData) + 토스트 ────────────────────
async function api(method, url, body) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const res = await fetch(url, opt);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '알 수 없는 오류');
  return json;
}

// FormData는 브라우저가 boundary를 직접 채워야 하므로 Content-Type을 절대 수동 지정하지 않는다.
async function uploadFile(url, formData) {
  const res = await fetch(url, { method: 'POST', body: formData });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '업로드 실패');
  return json;
}

let toastTimer = null;
function showToast(message, type) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast' + (type ? ' is-' + type : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }
document.querySelectorAll('[data-close-modal]').forEach(btn =>
  btn.addEventListener('click', () => closeModal(btn.dataset.closeModal)));

function showImportResult({ inserted, updated, errors }) {
  const box = document.getElementById('importResultBody');
  box.innerHTML = `
    <div class="ir-summary">
      <div class="ir-stat"><b>${inserted}</b>신규 등록</div>
      <div class="ir-stat"><b>${updated}</b>수정됨</div>
      <div class="ir-stat"><b>${errors.length}</b>실패</div>
    </div>
    ${errors.length ? `<div class="ir-errors">${errors.map(e => `<div>${escapeHtml(e)}</div>`).join('')}</div>` : ''}`;
  openModal('importResultBackdrop');
}

// 복제 시 이름/주소 끝 숫자를 +1 한다. 문자열 어디에 있든 "마지막 숫자 덩어리"를 찾아 늘리고
// 자리수(0채움)는 유지한다 — 예: "name_241"→"name_242", "No.1 Zone"→"No.2 Zone", "D340"→"D341".
// 숫자가 아예 없으면 "_2"를 붙인다. 결과는 항상 저장 전에 사용자가 폼에서 확인/수정할 수 있으므로,
// X04A 같은 16진수 표기 주소처럼 완벽하지 않을 수 있는 경우도 실제 저장 전에 걸러진다.
function incrementTrailingNumber(str) {
  const m = String(str).match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return str + '_2';
  const [, prefix, digits, suffix] = m;
  const next = (BigInt(digits) + 1n).toString().padStart(digits.length, '0');
  return prefix + next + suffix;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function badge(enabled) {
  return `<span class="badge ${enabled ? 'badge-on' : 'badge-off'}">${enabled ? '사용' : '중지'}</span>`;
}

// ── 검색 + 정렬 공용 헬퍼 ───────────────────────────────────────────────────
// searchKeys에 있는 필드들을 한꺼번에 대소문자 무시 부분일치로 검색하고, sort가 있으면 그다음 정렬한다.
function filterAndSort(list, searchTerm, searchKeys, sort) {
  let out = list;
  if (searchTerm) {
    const q = searchTerm.trim().toLowerCase();
    if (q) out = out.filter(item => searchKeys.some(k => String(item[k] ?? '').toLowerCase().includes(q)));
  }
  if (sort && sort.key) {
    out = [...out].sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'string' || typeof bv === 'string') { av = String(av ?? '').toLowerCase(); bv = String(bv ?? '').toLowerCase(); }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  return out;
}

// 클릭 한 번으로 정렬 상태 토글 + 화살표 표시. 헤더는 고정(재렌더 안 됨)이라 리스너는 한 번만 붙인다.
function setupSortableHeaders(tableId, sortState, onChange) {
  document.querySelectorAll(`#${tableId} th.sortable`).forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortState.key === key) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      else { sortState.key = key; sortState.dir = 'asc'; }
      document.querySelectorAll(`#${tableId} th.sortable`).forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
      onChange();
    });
  });
}

// 검색창은 입력할 때마다(버튼 없이) 바로 반영 — 타이핑 중 매번 재계산해도 데이터가 로컬 배열이라 부담 없다.
function bindLiveSearch(inputId, onChange) {
  document.getElementById(inputId).addEventListener('input', onChange);
}

// ── 탭 전환 ───────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('is-active');
    // "실시간 모니터링" 탭에 처음 들어오거나 다시 들어올 때마다, 다음 주기적 갱신을 기다리지 않고
    // 바로 한 번 최신값을 가져온다(탭을 오래 떠나있었으면 그만큼 화면이 낡아있으므로).
    if (btn.dataset.tab === 'monitor') refreshAllMonitor();
  });
});

// ── 실시간 모니터링 안의 하위 탭(모니터링/알람/온도) 전환 ───────────────────────
document.querySelectorAll('.subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.getElementById('sub' + btn.dataset.subtab).classList.add('is-active');
  });
});

// ── PLC 드롭다운(3개 폼 공용) 채우기 ───────────────────────────────────────
async function loadPlcOptions() {
  const { plcs } = await api('GET', '/api/admin/plcs');
  const selects = [document.getElementById('ftPlcSelect'), document.getElementById('ttPlcSelect'), document.getElementById('atPlcSelect')];
  const optionsHtml = '<option value="">PLC 선택...</option>' + plcs.map(p =>
    `<option value="${escapeHtml(p.plcId)}">${escapeHtml(p.plcId)} — ${escapeHtml(p.label)}${p.enabled ? '' : ' (비활성)'}</option>`
  ).join('');
  selects.forEach(sel => { sel.innerHTML = optionsHtml; });
}

// ============================================================================
// 0) PLC 관리 (tb_plc)
// ============================================================================
let plcs = [];
let plcEditId = null; // null=새로 만들기, 문자열이면 그 plcId를 수정 중
let plcSearch = '';
const plcSort = { key: null, dir: 'asc' };
const PLC_DEFAULT_PORT = { LS: 2004, MITSUBISHI: 6004, MODBUS_TCP: 502 };

async function loadPlcs() {
  const { plcs: list } = await api('GET', '/api/admin/plcs');
  plcs = list;
  renderPlcTable();
}

function renderPlcTable() {
  const body = document.getElementById('plcBody');
  const empty = document.getElementById('plcEmpty');
  const view = filterAndSort(plcs, plcSearch, ['plcId', 'label', 'ip'], plcSort);
  document.getElementById('plcCount').textContent = `총 ${view.length}건` + (view.length !== plcs.length ? ` (전체 ${plcs.length}건 중)` : '');
  if (view.length === 0) {
    body.innerHTML = '';
    empty.hidden = false;
    empty.textContent = plcs.length === 0 ? 'PLC가 없습니다. "+ 새 PLC"로 추가하세요.' : '검색 결과가 없습니다.';
    return;
  }
  empty.hidden = true;
  body.innerHTML = view.map(p => `
    <tr>
      <td class="name-col">${escapeHtml(p.plcId)}</td>
      <td>${escapeHtml(p.label)}</td>
      <td><span class="addr">${escapeHtml(p.ip)}</span></td>
      <td>${p.port}</td>
      <td>${escapeHtml(p.plcType)}</td>
      <td>${badge(p.enabled)}</td>
      <td class="row-actions">
        <button class="row-icon-btn" data-act="edit" title="수정">✎</button>
        <button class="row-icon-btn is-danger" data-act="del" title="삭제">✕</button>
      </td>
    </tr>`).join('');
  [...body.children].forEach((tr, i) => {
    const p = view[i];
    tr.querySelector('[data-act=edit]').addEventListener('click', () => openPlcModal(p));
    tr.querySelector('[data-act=del]').addEventListener('click', () => deletePlc(p));
  });
}

function openPlcModal(editing) {
  plcEditId = editing ? editing.plcId : null;
  document.getElementById('plcModalTitle').textContent = editing ? 'PLC 수정' : '새 PLC';
  const idInput = document.getElementById('plcIdInput');
  idInput.value = editing ? editing.plcId : '';
  idInput.disabled = !!editing;
  document.getElementById('plcIdHint').hidden = !!editing;
  document.getElementById('plcLabelInput').value = editing ? editing.label : '';
  document.getElementById('plcIpInput').value = editing ? editing.ip : '';
  document.getElementById('plcTypeSelect').value = editing ? editing.plcType : 'LS';
  document.getElementById('plcPortInput').value = editing ? editing.port : 2004;
  document.getElementById('plcEnabledInput').checked = editing ? !!editing.enabled : true;
  openModal('plcModalBackdrop');
}
document.getElementById('plcAddBtn').addEventListener('click', () => openPlcModal(null));

// 타입을 바꾸면 관례적인 기본 포트로 자동 채워준다 — 수정 모드에서는 기존 포트를 건드리지 않는다.
document.getElementById('plcTypeSelect').addEventListener('change', e => {
  if (plcEditId) return;
  const def = PLC_DEFAULT_PORT[e.target.value];
  if (def) document.getElementById('plcPortInput').value = def;
});

document.getElementById('plcForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    plcId: document.getElementById('plcIdInput').value,
    ip: document.getElementById('plcIpInput').value,
    port: Number(document.getElementById('plcPortInput').value) || 0,
    plcType: document.getElementById('plcTypeSelect').value,
    label: document.getElementById('plcLabelInput').value,
    enabled: document.getElementById('plcEnabledInput').checked
  };
  try {
    if (plcEditId) await api('PUT', `/api/admin/plcs/${encodeURIComponent(plcEditId)}`, body);
    else await api('POST', '/api/admin/plcs', body);
    closeModal('plcModalBackdrop');
    await loadPlcs();
    await loadPlcOptions();
    showToast('저장했습니다', 'success');
  } catch (e) { showToast(e.message, 'error'); }
});

// 삭제 전에 이 PLC를 참조하는 태그가 몇 개인지 미리 조회해서 확인창에 보여준다 — folders_tags/tb_temp_tag는
// FK가 없어 삭제해도 조용히 고아 참조로 남고, tb_alarm_tag만 FK(SET NULL)라 자동으로 연결만 끊어진다.
async function deletePlc(p) {
  let warn = `"${p.plcId}" PLC를 삭제할까요?`;
  try {
    const u = await api('GET', `/api/admin/plcs/${encodeURIComponent(p.plcId)}/usage`);
    const total = u.folderTags + u.tempTags + u.alarmTags;
    if (total > 0) {
      warn = `"${p.plcId}"를 쓰는 태그가 모니터링 ${u.folderTags}개 · 온도 ${u.tempTags}개 · 알람 ${u.alarmTags}개 있습니다. ` +
        `삭제하면 이 태그들은 더 이상 값을 읽지 못하게 됩니다(알람 태그는 PLC 연결만 자동으로 비워지고 태그 자체는 남습니다). 정말 삭제할까요?`;
    }
  } catch (e) { /* 사용량 확인 실패해도 삭제 자체는 진행 가능하게 둔다 */ }
  if (!confirm(warn)) return;
  try {
    await api('DELETE', `/api/admin/plcs/${encodeURIComponent(p.plcId)}`);
    await loadPlcs();
    await loadPlcOptions();
    showToast('PLC를 삭제했습니다', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

bindLiveSearch('plcSearch', () => { plcSearch = document.getElementById('plcSearch').value; renderPlcTable(); });

// 폴더 트리(부모/자식) 렌더링 — folders(모니터링 태그)와 tb_alarm_folder(알람) 양쪽에서 공용으로 쓴다.
// items: [{id, name, parentId}], depth 2단계까지만 들여쓰기(그 이상은 같은 폭 유지).
function renderFolderTree(listEl, items, selectedId, handlers, allLabel) {
  listEl.innerHTML = '';
  if (allLabel) {
    const allLi = document.createElement('li');
    allLi.className = 'folder-row is-all' + (selectedId === 'ALL' ? ' is-selected' : '');
    allLi.innerHTML = `<span class="fr-name">${escapeHtml(allLabel)}</span>`;
    allLi.addEventListener('click', () => handlers.onSelect({ id: 'ALL' }));
    listEl.appendChild(allLi);
  }
  const byParent = new Map();
  items.forEach(it => {
    const pid = it.parentId ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(it);
  });
  const seen = new Set(); // 순환 참조 방어(자기참조 등 이상 데이터로 인한 무한루프 방지)
  function renderLevel(parentId, depth) {
    const children = byParent.get(parentId) || [];
    children.forEach(it => {
      if (seen.has(it.id)) return;
      seen.add(it.id);
      const li = document.createElement('li');
      li.className = 'folder-row depth-' + Math.min(depth, 2) + (it.id === selectedId ? ' is-selected' : '');
      li.innerHTML = `<span class="fr-name">${escapeHtml(it.name)}</span>
        <span class="fr-actions">
          <button data-act="rename" title="이름 변경">✎</button>
          <button data-act="delete" title="삭제">✕</button>
        </span>`;
      li.querySelector('.fr-name').addEventListener('click', () => handlers.onSelect(it));
      li.querySelector('[data-act=rename]').addEventListener('click', e => { e.stopPropagation(); handlers.onRename(it); });
      li.querySelector('[data-act=delete]').addEventListener('click', e => { e.stopPropagation(); handlers.onDelete(it); });
      listEl.appendChild(li);
      renderLevel(it.id, depth + 1);
    });
  }
  renderLevel(null, 0);
  if (items.length === 0 && !allLabel) listEl.innerHTML = '<li style="padding:14px;color:var(--text-faint);font-size:12.5px;">폴더가 없습니다</li>';
}

function fillFolderSelect(selectEl, folders, idKey, nameKey, selectedValue) {
  selectEl.innerHTML = '<option value="">폴더 선택...</option>' +
    folders.map(f => `<option value="${f[idKey]}">${escapeHtml(f[nameKey])}</option>`).join('');
  if (selectedValue != null && selectedValue !== 'ALL') selectEl.value = String(selectedValue);
}

// ============================================================================
// 1) 모니터링 태그 (folders / folders_tags)
// ============================================================================
let folders = [];
let selectedFolderId = 'ALL';
let folderTags = [];               // 서버에서 받은 원본
let folderTagEditId = null;        // null=새로 만들기, 숫자면 그 id를 수정 중
let folderTagSearch = '';
const folderTagSort = { key: null, dir: 'asc' };

async function loadFolders() {
  const { folders: list } = await api('GET', '/api/admin/folders');
  folders = list;
  renderFolderTree(document.getElementById('folderList'), folders, selectedFolderId, folderTreeHandlers());
  const sel = document.getElementById('folderParentSelect');
  sel.innerHTML = '<option value="">(최상위)</option>' + folders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
}

async function selectFolder(id) {
  selectedFolderId = id;
  const f = id === 'ALL' ? null : folders.find(x => x.id === id);
  document.getElementById('folderTagsTitle').innerHTML =
    (id === 'ALL' ? '📡 전체 모니터링 태그' : `📁 ${escapeHtml(f ? f.name : '')}`) + ' <span class="table-tag">folders_tags</span>';
  document.getElementById('docFolderId').textContent = id === 'ALL' ? '4' : id;
  updateFolderTagExportLink();
  renderFolderTree(document.getElementById('folderList'), folders, selectedFolderId, folderTreeHandlers());
  await loadFolderTags();
}
// 폴더 삭제는 DB가 ON DELETE CASCADE라 안의 태그(+하위 폴더)까지 조용히 같이 지워진다(막아주지 않음) —
// 그래서 지우기 전에 반드시 실제 태그 개수를 확인해서 확인창에 숫자로 보여준다.
function folderTreeHandlers() {
  return {
    onSelect: f => selectFolder(f.id),
    onRename: async f => {
      const name = prompt('새 폴더 이름', f.name);
      if (!name || name.trim() === f.name) return;
      try { await api('PUT', `/api/admin/folders/${f.id}`, { name: name.trim(), parentId: f.parentId }); await loadFolders(); showToast('폴더 이름을 변경했습니다', 'success'); }
      catch (e) { showToast(e.message, 'error'); }
    },
    onDelete: async f => {
      let warn = `"${f.name}" 폴더를 삭제할까요?`;
      try {
        const { tags } = await api('GET', `/api/admin/foldertags?folderId=${f.id}`);
        if (tags.length > 0) warn = `"${f.name}" 폴더를 삭제하면 안에 있는 태그 ${tags.length}개도 함께 삭제됩니다(복구 불가). 정말 삭제할까요?`;
      } catch (e) { /* 개수 확인 실패해도 삭제 자체는 계속 진행 가능하게 둔다 */ }
      if (!confirm(warn)) return;
      try {
        await api('DELETE', `/api/admin/folders/${f.id}`);
        if (selectedFolderId === f.id) { selectedFolderId = 'ALL'; }
        await loadFolders();
        await loadFolderTags();
        showToast('폴더를 삭제했습니다', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    }
  };
}

function updateFolderTagExportLink() {
  const qs = selectedFolderId === 'ALL' ? '' : `?folderId=${selectedFolderId}`;
  document.getElementById('folderTagExportBtn').href = '/api/admin/foldertags/export' + qs;
}

async function loadFolderTags() {
  const qs = selectedFolderId === 'ALL' ? '' : `?folderId=${selectedFolderId}`;
  const { tags } = await api('GET', '/api/admin/foldertags' + qs);
  folderTags = tags;
  renderFolderTagTable();
}

function renderFolderTagTable() {
  const body = document.getElementById('folderTagBody');
  const empty = document.getElementById('folderTagEmpty');
  const view = filterAndSort(folderTags, folderTagSearch, ['name', 'address'], folderTagSort);
  document.getElementById('folderTagCount').textContent = `총 ${view.length}건` + (view.length !== folderTags.length ? ` (전체 ${folderTags.length}건 중)` : '');
  if (view.length === 0) {
    body.innerHTML = '';
    empty.hidden = false;
    empty.textContent = folderTags.length === 0 ? '태그가 없습니다. "+ 새 태그"로 추가하세요.' : '검색 결과가 없습니다.';
    return;
  }
  empty.hidden = true;
  body.innerHTML = view.map(t => `
    <tr>
      <td class="id-col">${t.id}</td>
      <td class="name-col">${escapeHtml(t.name)}</td>
      <td><span class="addr">${escapeHtml(t.address)}</span></td>
      <td class="truncate-col" title="${escapeHtml(t.folderName)}">${escapeHtml(t.folderName)}</td>
      <td class="truncate-col" title="${escapeHtml(t.plcId)}">${escapeHtml(t.plcId)}</td>
      <td>${escapeHtml(t.type)}</td>
      <td>${badge(t.enabled)}</td>
      <td class="row-actions">
        <button class="row-icon-btn" data-act="edit" title="수정">✎</button>
        <button class="row-icon-btn" data-act="dup" title="복제">⧉</button>
        <button class="row-icon-btn is-danger" data-act="del" title="삭제">✕</button>
      </td>
    </tr>`).join('');
  [...body.children].forEach((tr, i) => {
    const t = view[i];
    tr.querySelector('[data-act=edit]').addEventListener('click', () => openFolderTagModal(t));
    tr.querySelector('[data-act=dup]').addEventListener('click', () => openFolderTagModal(null, t));
    tr.querySelector('[data-act=del]').addEventListener('click', async () => {
      if (!confirm(`"${t.name}" 태그를 삭제할까요?`)) return;
      try { await api('DELETE', `/api/admin/foldertags/${t.id}`); await loadFolderTags(); showToast('태그를 삭제했습니다', 'success'); }
      catch (e) { showToast(e.message, 'error'); }
    });
  });
}

// editing: 수정 대상 태그(있으면 수정 모드) / dupFrom: 복제 원본(있으면 이름·주소 +1 해서 새로 만들기)
function openFolderTagModal(editing, dupFrom) {
  folderTagEditId = editing ? editing.id : null;
  const src = editing || dupFrom;
  document.getElementById('folderTagModalTitle').textContent = editing ? '모니터링 태그 수정' : (dupFrom ? '태그 복제 (내용 확인 후 저장)' : '새 모니터링 태그');
  const defaultFolder = src ? src.folderId : (selectedFolderId === 'ALL' ? null : selectedFolderId);
  fillFolderSelect(document.getElementById('ftFolderSelect'), folders, 'id', 'name', defaultFolder);
  document.getElementById('ftNameInput').value = editing ? src.name : (dupFrom ? incrementTrailingNumber(src.name) : '');
  document.getElementById('ftAddressInput').value = editing ? src.address : (dupFrom ? incrementTrailingNumber(src.address) : '');
  document.getElementById('ftPlcSelect').value = src ? src.plcId : '';
  document.getElementById('ftTypeSelect').value = src ? src.type : 'WORD';
  document.getElementById('ftEnabledInput').checked = src ? !!src.enabled : true;
  openModal('folderTagModalBackdrop');
}
document.getElementById('folderTagAddBtn').addEventListener('click', () => openFolderTagModal(null, null));
document.getElementById('folderTagForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    folderId: Number(document.getElementById('ftFolderSelect').value),
    name: document.getElementById('ftNameInput').value,
    address: document.getElementById('ftAddressInput').value,
    plcId: document.getElementById('ftPlcSelect').value,
    type: document.getElementById('ftTypeSelect').value,
    enabled: document.getElementById('ftEnabledInput').checked
  };
  if (!body.folderId) { showToast('폴더를 선택하세요', 'error'); return; }
  try {
    if (folderTagEditId) await api('PUT', `/api/admin/foldertags/${folderTagEditId}`, body);
    else await api('POST', '/api/admin/foldertags', body);
    closeModal('folderTagModalBackdrop');
    await loadFolderTags();
    showToast('저장했습니다', 'success');
  } catch (e) { showToast(e.message, 'error'); }
});

document.getElementById('folderAddBtn').addEventListener('click', () => {
  document.getElementById('folderModalTitle').textContent = '새 폴더';
  document.getElementById('folderForm').dataset.target = 'foldertag';
  document.getElementById('folderNameInput').value = '';
  document.getElementById('folderParentSelect').innerHTML = '<option value="">(최상위)</option>' +
    folders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  openModal('folderModalBackdrop');
});
// 이 모달은 "새 폴더 만들기" 전용이다 — 이름 변경은 트리에서 ✎ 버튼(prompt)으로 바로 처리한다.
document.getElementById('folderForm').addEventListener('submit', async e => {
  e.preventDefault();
  const target = e.target.dataset.target; // 'foldertag' | 'alarmfolder'
  const name = document.getElementById('folderNameInput').value;
  const parentId = document.getElementById('folderParentSelect').value || null;
  try {
    if (target === 'alarmfolder') {
      await api('POST', '/api/admin/alarmfolders', { folderName: name, parentId });
      await loadAlarmFolders();
    } else {
      await api('POST', '/api/admin/folders', { name, parentId });
      await loadFolders();
    }
    closeModal('folderModalBackdrop');
    showToast('저장했습니다', 'success');
  } catch (e) { showToast(e.message, 'error'); }
});

bindLiveSearch('folderTagSearch', () => { folderTagSearch = document.getElementById('folderTagSearch').value; renderFolderTagTable(); });

document.getElementById('folderTagImportBtn').addEventListener('click', () => document.getElementById('folderTagImportFile').click());
document.getElementById('folderTagImportFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  const qs = selectedFolderId === 'ALL' ? '' : `?folderId=${selectedFolderId}`;
  try {
    const result = await uploadFile('/api/admin/foldertags/import' + qs, fd);
    await loadFolderTags();
    showImportResult(result);
  } catch (e) { showToast(e.message, 'error'); }
  e.target.value = '';
});

// ============================================================================
// 2) 온도 태그 (tb_temp_tag)
// ============================================================================
let tempTags = [];
let selectedEquipId = null; // null = 전체
let tempTagEditId = null;
let tempTagSearch = '';
const tempTagSort = { key: null, dir: 'asc' };

async function loadEquipIds() {
  const { equipIds } = await api('GET', '/api/admin/temptags/equipids');
  const listEl = document.getElementById('equipList');
  listEl.innerHTML = '';
  const allLi = document.createElement('li');
  allLi.className = 'folder-row is-all' + (selectedEquipId === null ? ' is-selected' : '');
  allLi.innerHTML = '<span class="fr-name">(전체)</span>';
  allLi.addEventListener('click', () => selectEquip(null));
  listEl.appendChild(allLi);
  equipIds.forEach(eq => {
    const li = document.createElement('li');
    li.className = 'folder-row depth-0' + (selectedEquipId === eq ? ' is-selected' : '');
    li.innerHTML = `<span class="fr-name">${escapeHtml(eq)}</span>`;
    li.addEventListener('click', () => selectEquip(eq));
    listEl.appendChild(li);
  });
  // 태그 등록 폼의 datalist도 같이 채워둔다
  document.getElementById('equipIdList').innerHTML = equipIds.map(eq => `<option value="${escapeHtml(eq)}">`).join('');
}
async function selectEquip(eq) {
  selectedEquipId = eq;
  document.getElementById('tempTagsTitle').innerHTML = (eq ? `🌡 ${escapeHtml(eq)}` : '🌡 전체 온도 태그') + ' <span class="table-tag">tb_temp_tag</span>';
  updateTempTagExportLink();
  await loadEquipIds();
  await loadTempTags();
}
function updateTempTagExportLink() {
  document.getElementById('tempTagExportBtn').href = '/api/admin/temptags/export' + (selectedEquipId ? `?equipId=${encodeURIComponent(selectedEquipId)}` : '');
}

async function loadTempTags() {
  const qs = selectedEquipId ? `?equipId=${encodeURIComponent(selectedEquipId)}` : '';
  const { tags } = await api('GET', '/api/admin/temptags' + qs);
  tempTags = tags;
  renderTempTagTable();
}

function renderTempTagTable() {
  const body = document.getElementById('tempTagBody');
  const view = filterAndSort(tempTags, tempTagSearch, ['tagName', 'address'], tempTagSort);
  document.getElementById('tempTagCount').textContent = `총 ${view.length}건` + (view.length !== tempTags.length ? ` (전체 ${tempTags.length}건 중)` : '');
  body.innerHTML = view.map(t => `
    <tr>
      <td class="id-col">${t.tempId}</td>
      <td class="name-col">${escapeHtml(t.tagName)}</td>
      <td><span class="addr">${escapeHtml(t.address)}</span></td>
      <td class="truncate-col" title="${escapeHtml(t.plcId)}">${escapeHtml(t.plcId)}</td>
      <td><span class="col">${escapeHtml(t.colName)}</span></td>
      <td>${escapeHtml(t.trendName)}</td>
      <td class="mono">${escapeHtml(t.scale || '—')}</td>
      <td>${escapeHtml(t.equipId || '—')}</td>
      <td>${badge(t.enabled)}</td>
      <td class="row-actions">
        <button class="row-icon-btn" data-act="edit" title="수정">✎</button>
        <button class="row-icon-btn" data-act="dup" title="복제">⧉</button>
        <button class="row-icon-btn is-danger" data-act="del" title="삭제">✕</button>
      </td>
    </tr>`).join('');
  [...body.children].forEach((tr, i) => {
    const t = view[i];
    tr.querySelector('[data-act=edit]').addEventListener('click', () => openTempTagModal(t));
    tr.querySelector('[data-act=dup]').addEventListener('click', () => openTempTagModal(null, t));
    tr.querySelector('[data-act=del]').addEventListener('click', async () => {
      if (!confirm(`"${t.tagName}" 태그를 삭제할까요? (tb_temp_snapshot의 "${t.colName}" 컬럼과 과거 데이터는 보존됩니다)`)) return;
      try { await api('DELETE', `/api/admin/temptags/${t.tempId}`); await loadTempTags(); showToast('태그를 삭제했습니다', 'success'); }
      catch (e) { showToast(e.message, 'error'); }
    });
  });
}

function openTempTagModal(editing, dupFrom) {
  tempTagEditId = editing ? editing.tempId : null;
  const src = editing || dupFrom;
  document.getElementById('tempTagModalTitle').textContent = editing ? '온도 태그 수정' : (dupFrom ? '태그 복제 (내용 확인 후 저장)' : '새 온도 태그');
  document.getElementById('ttNameInput').value = editing ? src.tagName : (dupFrom ? incrementTrailingNumber(src.tagName) : '');
  document.getElementById('ttAddressInput').value = editing ? src.address : (dupFrom ? incrementTrailingNumber(src.address) : '');
  document.getElementById('ttPlcSelect').value = src ? src.plcId : '';
  document.getElementById('ttColNameInput').value = editing ? src.colName : (dupFrom ? incrementTrailingNumber(src.colName) : '');
  document.getElementById('ttTrendNameInput').value = editing ? src.trendName : (dupFrom ? incrementTrailingNumber(src.trendName) : '');
  document.getElementById('ttScaleInput').value = src ? (src.scale || '') : '';
  document.getElementById('ttEquipIdInput').value = src ? (src.equipId || (selectedEquipId || '')) : (selectedEquipId || '');
  document.getElementById('ttEnabledInput').checked = src ? !!src.enabled : true;
  openModal('tempTagModalBackdrop');
}
document.getElementById('tempTagAddBtn').addEventListener('click', () => openTempTagModal(null, null));
document.getElementById('tempTagForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    tagName: document.getElementById('ttNameInput').value,
    address: document.getElementById('ttAddressInput').value,
    plcId: document.getElementById('ttPlcSelect').value,
    colName: document.getElementById('ttColNameInput').value,
    trendName: document.getElementById('ttTrendNameInput').value,
    scale: document.getElementById('ttScaleInput').value || null,
    equipId: document.getElementById('ttEquipIdInput').value || null,
    enabled: document.getElementById('ttEnabledInput').checked
  };
  try {
    const result = tempTagEditId
      ? await api('PUT', `/api/admin/temptags/${tempTagEditId}`, body)
      : await api('POST', '/api/admin/temptags', body);
    closeModal('tempTagModalBackdrop');
    await loadEquipIds();
    await loadTempTags();
    await loadSnapshotColumns();
    // 컬럼명 변경이 충돌해서 과거 데이터를 못 옮긴 경우(드묾) — 서버가 warning으로 알려준다.
    if (result && result.warning) showToast(result.warning, 'error');
    else showToast('저장했습니다 — tb_temp_snapshot 컬럼도 확인해보세요', 'success');
  } catch (e) { showToast(e.message, 'error'); }
});

async function loadSnapshotColumns() {
  try {
    const { columns } = await api('GET', '/api/admin/tempsnapshot/columns');
    document.getElementById('snapshotColumnsBox').textContent = columns.length ? columns.join(', ') : '(아직 없음)';
  } catch (e) { document.getElementById('snapshotColumnsBox').textContent = '조회 실패: ' + e.message; }
}

bindLiveSearch('tempTagSearch', () => { tempTagSearch = document.getElementById('tempTagSearch').value; renderTempTagTable(); });

document.getElementById('tempTagImportBtn').addEventListener('click', () => document.getElementById('tempTagImportFile').click());
document.getElementById('tempTagImportFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const result = await uploadFile('/api/admin/temptags/import', fd);
    await loadEquipIds();
    await loadTempTags();
    await loadSnapshotColumns();
    showImportResult(result);
  } catch (e) { showToast(e.message, 'error'); }
  e.target.value = '';
});

// ============================================================================
// 3) 알람 태그 (tb_alarm_folder / tb_alarm_tag)
// ============================================================================
let alarmFolders = [];
let selectedAlarmFolderId = 'ALL';
let alarmTags = [];
let alarmTagEditId = null;
let alarmTagSearch = '';
const alarmTagSort = { key: null, dir: 'asc' };

async function loadAlarmFolders() {
  const { folders: list } = await api('GET', '/api/admin/alarmfolders');
  // 백엔드는 DB 컬럼명 그대로(folderId/folderName)를 주므로, 폴더/알람폴더 공용인
  // renderFolderTree가 기대하는 {id,name,parentId} 모양으로 여기서 한 번 정규화한다.
  alarmFolders = list.map(f => ({ id: f.folderId, name: f.folderName, parentId: f.parentId }));
  renderFolderTree(document.getElementById('alarmFolderList'), alarmFolders, selectedAlarmFolderId, alarmFolderTreeHandlers(), '(전체)');
}
function alarmFolderTreeHandlers() {
  return {
    onSelect: f => selectAlarmFolder(f.id),
    onRename: async f => {
      const name = prompt('새 폴더 이름', f.name);
      if (!name || name.trim() === f.name) return;
      try { await api('PUT', `/api/admin/alarmfolders/${f.id}`, { folderName: name.trim(), parentId: f.parentId }); await loadAlarmFolders(); }
      catch (e) { showToast(e.message, 'error'); }
    },
    onDelete: async f => {
      let warn = `"${f.name}" 알람 폴더를 삭제할까요?`;
      try {
        const { tags } = await api('GET', `/api/admin/alarmtags?folderId=${f.id}`);
        if (tags.length > 0) warn = `"${f.name}" 폴더를 삭제하면 안에 있는 알람 태그 ${tags.length}개도 함께 삭제됩니다(복구 불가). 정말 삭제할까요?`;
      } catch (e) { /* 개수 확인 실패해도 삭제 자체는 계속 진행 가능하게 둔다 */ }
      if (!confirm(warn)) return;
      try {
        await api('DELETE', `/api/admin/alarmfolders/${f.id}`);
        if (selectedAlarmFolderId === f.id) { selectedAlarmFolderId = 'ALL'; }
        await loadAlarmFolders();
        await loadAlarmTags();
        showToast('폴더를 삭제했습니다', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    }
  };
}
async function selectAlarmFolder(id) {
  selectedAlarmFolderId = id;
  const f = id === 'ALL' ? null : alarmFolders.find(x => x.id === id);
  document.getElementById('alarmTagsTitle').innerHTML =
    (id === 'ALL' ? '🔔 전체 알람 태그' : `🔔 ${escapeHtml(f ? f.name : '')}`) + ' <span class="table-tag">tb_alarm_tag</span>';
  updateAlarmTagExportLink();
  renderFolderTree(document.getElementById('alarmFolderList'), alarmFolders, selectedAlarmFolderId, alarmFolderTreeHandlers(), '(전체)');
  await loadAlarmTags();
}
function updateAlarmTagExportLink() {
  const qs = selectedAlarmFolderId === 'ALL' ? '' : `?folderId=${selectedAlarmFolderId}`;
  document.getElementById('alarmTagExportBtn').href = '/api/admin/alarmtags/export' + qs;
}

async function loadAlarmTags() {
  const qs = selectedAlarmFolderId === 'ALL' ? '' : `?folderId=${selectedAlarmFolderId}`;
  const { tags } = await api('GET', '/api/admin/alarmtags' + qs);
  alarmTags = tags;
  renderAlarmTagTable();
}

function renderAlarmTagTable() {
  const body = document.getElementById('alarmTagBody');
  const empty = document.getElementById('alarmTagEmpty');
  const view = filterAndSort(alarmTags, alarmTagSearch, ['tagName', 'address', 'alarmMsg'], alarmTagSort);
  document.getElementById('alarmTagCount').textContent = `총 ${view.length}건` + (view.length !== alarmTags.length ? ` (전체 ${alarmTags.length}건 중)` : '');
  if (view.length === 0) {
    body.innerHTML = '';
    empty.hidden = false;
    empty.textContent = alarmTags.length === 0 ? '알람 태그가 없습니다. "+ 새 태그"로 추가하세요.' : '검색 결과가 없습니다.';
    return;
  }
  empty.hidden = true;
  body.innerHTML = view.map(t => `
    <tr>
      <td class="id-col">${t.tagId}</td>
      <td class="name-col">${escapeHtml(t.tagName)}</td>
      <td><span class="addr">${escapeHtml(t.address)}</span></td>
      <td class="truncate-col" title="${escapeHtml(t.folderName)}">${escapeHtml(t.folderName)}</td>
      <td class="truncate-col" title="${escapeHtml(t.plcId)}">${escapeHtml(t.plcId)}</td>
      <td>${escapeHtml(t.alarmMsg)}</td>
      <td>${t.level}</td>
      <td>${badge(t.enabled)}</td>
      <td class="row-actions">
        <button class="row-icon-btn" data-act="edit" title="수정">✎</button>
        <button class="row-icon-btn" data-act="dup" title="복제">⧉</button>
        <button class="row-icon-btn is-danger" data-act="del" title="삭제">✕</button>
      </td>
    </tr>`).join('');
  [...body.children].forEach((tr, i) => {
    const t = view[i];
    tr.querySelector('[data-act=edit]').addEventListener('click', () => openAlarmTagModal(t));
    tr.querySelector('[data-act=dup]').addEventListener('click', () => openAlarmTagModal(null, t));
    tr.querySelector('[data-act=del]').addEventListener('click', async () => {
      if (!confirm(`"${t.tagName}" 알람 태그를 삭제할까요?`)) return;
      try { await api('DELETE', `/api/admin/alarmtags/${t.tagId}`); await loadAlarmTags(); showToast('태그를 삭제했습니다', 'success'); }
      catch (e) { showToast(e.message, 'error'); }
    });
  });
}

function openAlarmTagModal(editing, dupFrom) {
  alarmTagEditId = editing ? editing.tagId : null;
  const src = editing || dupFrom;
  document.getElementById('alarmTagModalTitle').textContent = editing ? '알람 태그 수정' : (dupFrom ? '태그 복제 (내용 확인 후 저장)' : '새 알람 태그');
  const defaultFolder = src ? src.folderId : (selectedAlarmFolderId === 'ALL' ? null : selectedAlarmFolderId);
  fillFolderSelect(document.getElementById('atFolderSelect'), alarmFolders, 'id', 'name', defaultFolder);
  document.getElementById('atNameInput').value = editing ? src.tagName : (dupFrom ? incrementTrailingNumber(src.tagName) : '');
  document.getElementById('atAddressInput').value = editing ? src.address : (dupFrom ? incrementTrailingNumber(src.address) : '');
  document.getElementById('atPlcSelect').value = src ? src.plcId : '';
  document.getElementById('atMsgInput').value = src ? src.alarmMsg : '';
  document.getElementById('atLevelInput').value = src ? src.level : 1;
  document.getElementById('atEnabledInput').checked = src ? !!src.enabled : true;
  openModal('alarmTagModalBackdrop');
}
document.getElementById('alarmTagAddBtn').addEventListener('click', () => openAlarmTagModal(null, null));
document.getElementById('alarmTagForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    folderId: Number(document.getElementById('atFolderSelect').value),
    tagName: document.getElementById('atNameInput').value,
    address: document.getElementById('atAddressInput').value,
    plcId: document.getElementById('atPlcSelect').value,
    alarmMsg: document.getElementById('atMsgInput').value,
    level: Number(document.getElementById('atLevelInput').value) || 1,
    enabled: document.getElementById('atEnabledInput').checked
  };
  if (!body.folderId) { showToast('폴더를 선택하세요', 'error'); return; }
  try {
    if (alarmTagEditId) await api('PUT', `/api/admin/alarmtags/${alarmTagEditId}`, body);
    else await api('POST', '/api/admin/alarmtags', body);
    closeModal('alarmTagModalBackdrop');
    await loadAlarmTags();
    showToast('저장했습니다', 'success');
  } catch (e) { showToast(e.message, 'error'); }
});

document.getElementById('alarmFolderAddBtn').addEventListener('click', () => {
  document.getElementById('folderModalTitle').textContent = '새 알람 폴더';
  document.getElementById('folderForm').dataset.target = 'alarmfolder';
  document.getElementById('folderNameInput').value = '';
  document.getElementById('folderParentSelect').innerHTML = '<option value="">(최상위)</option>' +
    alarmFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  openModal('folderModalBackdrop');
});

bindLiveSearch('alarmTagSearch', () => { alarmTagSearch = document.getElementById('alarmTagSearch').value; renderAlarmTagTable(); });

document.getElementById('alarmTagImportBtn').addEventListener('click', () => document.getElementById('alarmTagImportFile').click());
document.getElementById('alarmTagImportFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  const qs = selectedAlarmFolderId === 'ALL' ? '' : `?folderId=${selectedAlarmFolderId}`;
  try {
    const result = await uploadFile('/api/admin/alarmtags/import' + qs, fd);
    await loadAlarmTags();
    showImportResult(result);
  } catch (e) { showToast(e.message, 'error'); }
  e.target.value = '';
});

// ============================================================================
// 4) 실시간 모니터링 — PLC를 새로 두드리지 않고 서버가 이미 폴링해서 메모리(또는 최근 스냅샷)에
//    들고 있는 값만 주기적으로 다시 물어봐서 화면을 갱신한다. 값 자체는 서버가 2초(모니터링/알람)
//    ·30초(온도) 주기로 이미 갱신해두므로, 여기 새로고침 주기는 "화면이 그 값을 얼마나 빨리
//    따라가 보여줄지"일 뿐이지 PLC 통신 빈도와는 무관하다.
// ============================================================================
function isMonitorTabActive() { return document.getElementById('tab-monitor').classList.contains('is-active'); }

function formatUpdatedAt(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour12: false });
}

// 설비 하나에 태그가 여러 개일 수 있어(예: BCF1 = 1존+2존), 카드 하나(=설비 하나) 안에
// 태그별 선을 색깔로 구분해서 Chart.js 그래프 하나에 같이 그린다(vendor/chart.umd.min.js,
// CDN 없이 로컬 파일 — 공장 PC라 인터넷이 항상 되리라는 보장이 없어서).
const TREND_COLORS = ['#0f6d8c', '#c0392b', '#b9770e', '#1e8449', '#6c5ce7', '#e17055', '#0984e3', '#636e72'];
const tempChartInstances = new Map(); // 설비명 → Chart 인스턴스. 매번 새로 만들지 않고 데이터만 갱신해서
                                       // 30초마다 차트가 깜빡이며 다시 그려지는 걸 막는다.

function shortTimeLabel(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

// 태그마다 스냅샷 행이 살짝 어긋나 있어도(널 스킵 등으로 개수가 다를 수 있음) 안전하게 맞추려고,
// 그룹 전체 타임스탬프의 합집합을 x축으로 놓고 태그별 값을 그 위치에 맞춰 채운다(없으면 null).
function buildAlignedSeries(groupTags) {
  const labelSet = new Set();
  groupTags.forEach(t => (t.series || []).forEach(p => labelSet.add(p.t)));
  const rawLabels = [...labelSet].sort();
  const namedSeries = groupTags.map(t => {
    const map = new Map((t.series || []).map(p => [p.t, p.v]));
    return { name: t.trendName || t.tagName, values: rawLabels.map(l => (map.has(l) ? map.get(l) : null)) };
  });
  return { labels: rawLabels.map(shortTimeLabel), namedSeries };
}

function makeTempDataset(name, values, colorIdx) {
  const color = TREND_COLORS[colorIdx % TREND_COLORS.length];
  return {
    label: name, data: values, borderColor: color, backgroundColor: color + '1a',
    borderWidth: 2, tension: 0.3, pointRadius: 0, pointHoverRadius: 4, fill: false, spanGaps: true
  };
}

function buildTempChartConfig(labels, namedSeries) {
  const style = getComputedStyle(document.documentElement);
  const gridColor = style.getPropertyValue('--border-soft').trim();
  const textColor = style.getPropertyValue('--text-faint').trim();
  return {
    type: 'line',
    data: { labels, datasets: namedSeries.map((s, i) => makeTempDataset(s.name, s.values, i)) },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      },
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
    }
  };
}

// 카드+캔버스 DOM은 있으면 재사용, 없으면 새로 만든다 — Chart 인스턴스도 있으면 데이터만 갱신(update),
// 없으면 새로 생성한다. 이렇게 해야 30초 자동 갱신마다 차트를 통째로 지웠다 새로 그리지 않는다.
function ensureTempCard(equip, tagCount) {
  let card = document.querySelector(`.trend-card[data-equip="${CSS.escape(equip)}"]`);
  if (!card) {
    card = document.createElement('div');
    card.className = 'trend-card';
    card.dataset.equip = equip;
    card.innerHTML = `
      <div class="trend-card-head">
        <span class="trend-card-name"></span>
        <span class="trend-card-equip"></span>
      </div>
      <div class="trend-chart-wrap"><canvas></canvas></div>
      <div class="trend-legend"></div>`;
    document.getElementById('monTempGrid').appendChild(card);
  }
  card.querySelector('.trend-card-name').textContent = equip;
  card.querySelector('.trend-card-name').title = equip;
  card.querySelector('.trend-card-equip').textContent = `${tagCount}개 태그`;
  return card;
}

function renderOrUpdateTempChart(card, labels, namedSeries) {
  const equip = card.dataset.equip;
  const canvas = card.querySelector('canvas');
  let chart = tempChartInstances.get(equip);
  if (chart && chart.data.datasets.length === namedSeries.length) {
    chart.data.labels = labels;
    namedSeries.forEach((s, i) => { chart.data.datasets[i].data = s.values; chart.data.datasets[i].label = s.name; });
    chart.update('none'); // 'none' = 애니메이션 없이 즉시 갱신(30초마다 매번 애니메이션 돌면 산만함)
  } else {
    if (chart) chart.destroy(); // 태그 구성(개수)이 바뀐 경우만 새로 생성
    chart = new Chart(canvas.getContext('2d'), buildTempChartConfig(labels, namedSeries));
    tempChartInstances.set(equip, chart);
  }
}

// ── 4-1) 모니터링 태그 실시간 값 ──────────────────────────────────────────
function populateMonitorFolderSelect() {
  const sel = document.getElementById('monFolderSelect');
  const current = sel.value || 'ALL';
  sel.innerHTML = '<option value="ALL">전체 폴더</option>' + folders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  sel.value = [...sel.options].some(o => o.value === current) ? current : 'ALL';
}
document.getElementById('monFolderSelect').addEventListener('change', refreshMonitorFolder);

// 표에서 클릭으로 고른 태그들 — 오른쪽 값쓰기 패널이 이 태그들을 대상으로 동작한다.
// 엑셀처럼: 클릭=단일 선택(기준점 이동), Shift+클릭=기준점~클릭 범위 선택, Ctrl/Cmd+클릭=개별 추가·제거.
let monFolderTags = [];
let selectedWriteTagIds = new Set();
let writeAnchorIndex = null;

async function refreshMonitorFolder() {
  const folderId = document.getElementById('monFolderSelect').value;
  const qs = folderId === 'ALL' ? '' : `?folderId=${folderId}`;
  try {
    const { tags, lastPollAt } = await api('GET', '/api/admin/monitor/foldertags' + qs);
    monFolderTags = tags;
    const body = document.getElementById('monFolderBody');
    const empty = document.getElementById('monFolderEmpty');
    document.getElementById('monFolderCount').textContent = `총 ${tags.length}건`;
    document.getElementById('monFolderUpdatedAt').textContent = formatUpdatedAt(lastPollAt);
    // 폴더 전환 등으로 표에서 사라진 태그는 선택에서도 정리한다.
    const stillValidIds = new Set(tags.map(t => t.id));
    [...selectedWriteTagIds].forEach(id => { if (!stillValidIds.has(id)) selectedWriteTagIds.delete(id); });
    if (tags.length === 0) { body.innerHTML = ''; empty.hidden = false; renderWritePanel(false); return; }
    empty.hidden = true;
    body.innerHTML = tags.map(t => `
      <tr data-writable data-id="${t.id}" class="${selectedWriteTagIds.has(t.id) ? 'is-write-selected' : ''}">
        <td class="id-col">${t.id}</td>
        <td class="name-col">${escapeHtml(t.name)}</td>
        <td><span class="addr">${escapeHtml(t.address)}</span></td>
        <td class="truncate-col" title="${escapeHtml(t.folderName)}">${escapeHtml(t.folderName)}</td>
        <td class="val-col">${t.value === null ? '—' : t.value}</td>
      </tr>`).join('');
    [...body.children].forEach((tr, i) => tr.addEventListener('click', e => handleWriteRowClick(e, i)));
    // 값쓰기 패널을 열어둔 채로 표가 갱신되면, 선택된 태그들의 "현재값" 표시도 최신으로 따라가게 한다.
    renderWritePanel(false);
  } catch (e) { showToast('모니터링 값 갱신 실패: ' + e.message, 'error'); }
}

function handleWriteRowClick(e, index) {
  const tag = monFolderTags[index];
  if (!tag) return;
  if (e.shiftKey && writeAnchorIndex !== null) {
    const [lo, hi] = writeAnchorIndex < index ? [writeAnchorIndex, index] : [index, writeAnchorIndex];
    selectedWriteTagIds = new Set(monFolderTags.slice(lo, hi + 1).map(t => t.id));
  } else if (e.ctrlKey || e.metaKey) {
    if (selectedWriteTagIds.has(tag.id)) selectedWriteTagIds.delete(tag.id);
    else selectedWriteTagIds.add(tag.id);
    writeAnchorIndex = index;
  } else {
    selectedWriteTagIds = new Set([tag.id]);
    writeAnchorIndex = index;
  }
  document.querySelectorAll('#monFolderBody tr').forEach(tr =>
    tr.classList.toggle('is-write-selected', selectedWriteTagIds.has(Number(tr.dataset.id))));
  renderWritePanel(true);
}

// refillValue: 사용자가 방금 선택을 바꿔서 다시 그리는 경우에만 입력창을 채운다.
// 2초 주기 자동 새로고침으로 다시 그릴 때도 매번 채우면 입력 중인 값이 계속 지워지기 때문에 false로 호출.
function renderWritePanel(refillValue) {
  const selected = monFolderTags.filter(t => selectedWriteTagIds.has(t.id));
  const empty = document.getElementById('writePanelEmpty');
  const form = document.getElementById('writePanelForm');
  if (selected.length === 0) { empty.hidden = false; form.hidden = true; return; }
  empty.hidden = true;
  form.hidden = false;
  document.getElementById('writeSelCount').textContent =
    selected.length === 1 ? `"${selected[0].name}" 선택됨` : `${selected.length}개 태그 선택됨`;
  document.getElementById('writeSelList').innerHTML = selected.map(t => `
    <div class="write-sel-row" data-id="${t.id}">
      <span class="write-sel-id">#${t.id}</span>
      <span class="write-sel-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
      <span class="write-sel-addr">${escapeHtml(t.address)}</span>
      <span class="write-sel-val">${t.value === null ? '—' : t.value}</span>
    </div>`).join('');
  document.getElementById('writeSubmitBtn').textContent = selected.length === 1 ? '쓰기' : `${selected.length}개에 쓰기`;
  if (refillValue) {
    const input = document.getElementById('writeValueInput');
    input.value = selected.length === 1 && selected[0].value !== null ? selected[0].value : '';
    input.focus();
  }
}

// folderId를 같이 보내서, 같은 이름의 태그가 다른 폴더에도 있어 모호해지는 경우를 막는다.
// 선택된 태그가 여럿이면 같은 값을 순서대로 각각에 써서(엑셀 범위 채우기와 동일한 효과) 일괄 반영한다.
document.getElementById('writePanelForm').addEventListener('submit', async e => {
  e.preventDefault();
  const selected = monFolderTags.filter(t => selectedWriteTagIds.has(t.id));
  if (selected.length === 0) return;
  const value = document.getElementById('writeValueInput').value;
  if (value === '') { showToast('값을 입력하세요', 'error'); return; }
  let okCount = 0, failCount = 0;
  for (const tag of selected) {
    try {
      const qs = `?name=${encodeURIComponent(tag.name)}&value=${encodeURIComponent(value)}&folderId=${tag.folderId}`;
      const res = await fetch('/api/foldertag/write/by-name' + qs);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '쓰기 실패');
      // 백그라운드 폴러가 캐시를 갱신할 다음 2초 주기를 기다리지 않고, 방금 쓴 값(서버가 쓰기 직후
      // 다시 읽어 검증한 값)으로 표를 바로 낙관적으로 갱신한다.
      const written = json.value ?? Number(value);
      tag.value = written;
      const row = document.querySelector(`#monFolderBody tr[data-id="${tag.id}"]`);
      if (row) row.querySelector('.val-col').textContent = written;
      okCount++;
    } catch (err) { failCount++; }
  }
  renderWritePanel(false);
  if (failCount === 0) showToast(`${okCount}개 태그에 ${value} 썼습니다`, 'success');
  else if (okCount === 0) showToast(`${failCount}개 태그 쓰기 모두 실패`, 'error');
  else showToast(`${okCount}개 성공 / ${failCount}개 실패`, 'error');
  const panel = document.getElementById('writePanel');
  panel.classList.add('is-flash');
  setTimeout(() => panel.classList.remove('is-flash'), 700);
  await refreshMonitorFolder();
});

// ── 4-2) 알람 태그 실시간 상태 ──────────────────────────────────────────
function populateMonitorAlarmFolderSelect() {
  const sel = document.getElementById('monAlarmFolderSelect');
  const current = sel.value || 'ALL';
  sel.innerHTML = '<option value="ALL">전체 폴더</option>' + alarmFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
  sel.value = [...sel.options].some(o => o.value === current) ? current : 'ALL';
}
document.getElementById('monAlarmFolderSelect').addEventListener('change', refreshMonitorAlarm);

function alarmStatusBadge(isOn) {
  if (isOn === null || isOn === undefined) return `<span class="badge badge-alarm-unknown">확인중</span>`;
  return isOn ? `<span class="badge badge-alarm-on">ON</span>` : `<span class="badge badge-alarm-off">OFF</span>`;
}

// 카드 클릭으로 고른 알람 태그들 — 모니터링 태그 표와 동일한 엑셀 스타일 다중선택.
// 클릭=단일 선택(기준점 이동), Shift+클릭=기준점~클릭 범위, Ctrl/Cmd+클릭=개별 추가·제거.
let monAlarmTags = [];
let selectedAlarmTagIds = new Set();
let alarmAnchorIndex = null;

async function refreshMonitorAlarm() {
  const folderId = document.getElementById('monAlarmFolderSelect').value;
  const qs = folderId === 'ALL' ? '' : `?folderId=${folderId}`;
  try {
    const { tags, lastPollAt } = await api('GET', '/api/admin/monitor/alarmtags' + qs);
    monAlarmTags = tags;
    const grid = document.getElementById('monAlarmGrid');
    const empty = document.getElementById('monAlarmEmpty');
    document.getElementById('monAlarmCount').textContent = `총 ${tags.length}건`;
    document.getElementById('monAlarmUpdatedAt').textContent = formatUpdatedAt(lastPollAt);
    // 폴더 전환 등으로 목록에서 사라진 태그는 선택에서도 정리한다.
    const stillValidIds = new Set(tags.map(t => t.tagId));
    [...selectedAlarmTagIds].forEach(id => { if (!stillValidIds.has(id)) selectedAlarmTagIds.delete(id); });
    if (tags.length === 0) { grid.innerHTML = ''; empty.hidden = false; renderAlarmSelCtrl(); return; }
    empty.hidden = true;
    grid.innerHTML = tags.map(t => `
      <div class="alarm-card${t.isOn ? ' is-on' : ''}${selectedAlarmTagIds.has(t.tagId) ? ' is-selected' : ''}" data-tag-id="${t.tagId}">
        <div class="alarm-card-top">
          <span class="alarm-card-name" title="${escapeHtml(t.tagName)}">${escapeHtml(t.tagName)}</span>
          ${alarmStatusBadge(t.isOn)}
        </div>
        <div class="alarm-card-msg">${escapeHtml(t.alarmMsg)}</div>
        <div class="alarm-card-meta">
          <span class="addr">${escapeHtml(t.address)}</span>
          <span class="alarm-card-folder" title="${escapeHtml(t.folderName)}">${escapeHtml(t.folderName)}</span>
          <div class="alarm-write-btns">
            <button type="button" class="alarm-write-btn${t.isOn ? ' is-active' : ''}" data-value="1" title="1 쓰기">1</button>
            <button type="button" class="alarm-write-btn${t.isOn === false ? ' is-active' : ''}" data-value="0" title="0 쓰기">0</button>
          </div>
          <span class="alarm-card-level">Lv.${t.level}</span>
        </div>
      </div>`).join('');
    [...grid.children].forEach((card, i) => {
      card.querySelectorAll('.alarm-write-btn').forEach(btn =>
        btn.addEventListener('click', e => { e.stopPropagation(); writeAlarmValue(tags[i], Number(btn.dataset.value)); }));
      card.addEventListener('click', e => handleAlarmCardClick(e, i));
    });
    renderAlarmSelCtrl();
  } catch (e) { showToast('알람 상태 갱신 실패: ' + e.message, 'error'); }
}

function handleAlarmCardClick(e, index) {
  const tag = monAlarmTags[index];
  if (!tag) return;
  if (e.shiftKey && alarmAnchorIndex !== null) {
    const [lo, hi] = alarmAnchorIndex < index ? [alarmAnchorIndex, index] : [index, alarmAnchorIndex];
    selectedAlarmTagIds = new Set(monAlarmTags.slice(lo, hi + 1).map(t => t.tagId));
  } else if (e.ctrlKey || e.metaKey) {
    if (selectedAlarmTagIds.has(tag.tagId)) selectedAlarmTagIds.delete(tag.tagId);
    else selectedAlarmTagIds.add(tag.tagId);
    alarmAnchorIndex = index;
  } else {
    selectedAlarmTagIds = new Set([tag.tagId]);
    alarmAnchorIndex = index;
  }
  document.querySelectorAll('#monAlarmGrid .alarm-card').forEach(card =>
    card.classList.toggle('is-selected', selectedAlarmTagIds.has(Number(card.dataset.tagId))));
  renderAlarmSelCtrl();
}

function renderAlarmSelCtrl() {
  const n = selectedAlarmTagIds.size;
  document.getElementById('alarmSelCount').textContent = n > 0 ? `${n}개 선택` : '선택 없음';
  document.getElementById('alarmBatchOnBtn').disabled = n === 0;
  document.getElementById('alarmBatchOffBtn').disabled = n === 0;
}

// 확인창 없이 바로 쓴다 — folders_tags에 등록 안 된 주소라도 plcId+address로 직접 쓸 수 있는
// 기존 엔드포인트(/api/foldertag/write/by-address)를 그대로 재사용한다.
async function writeAlarmValue(tag, value) {
  try {
    const qs = `?plcId=${encodeURIComponent(tag.plcId)}&address=${encodeURIComponent(tag.address)}&value=${value}`;
    const res = await fetch('/api/foldertag/write/by-address' + qs);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || '쓰기 실패');
    showToast(`"${tag.tagName}"에 ${value} 썼습니다`, 'success');
    await refreshMonitorAlarm();
  } catch (e) { showToast('쓰기 실패: ' + e.message, 'error'); }
}

// 선택된 알람 태그 전체에 같은 값을 순서대로 써서(엑셀 범위 채우기와 동일한 효과) 일괄 반영한다.
async function writeAlarmValuesBatch(tags, value) {
  if (tags.length === 0) return;
  let okCount = 0, failCount = 0;
  for (const tag of tags) {
    try {
      const qs = `?plcId=${encodeURIComponent(tag.plcId)}&address=${encodeURIComponent(tag.address)}&value=${value}`;
      const res = await fetch('/api/foldertag/write/by-address' + qs);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '쓰기 실패');
      okCount++;
    } catch (e) { failCount++; }
  }
  if (failCount === 0) showToast(`${okCount}개 태그에 ${value} 썼습니다`, 'success');
  else if (okCount === 0) showToast(`${failCount}개 태그 쓰기 모두 실패`, 'error');
  else showToast(`${okCount}개 성공 / ${failCount}개 실패`, 'error');
  await refreshMonitorAlarm();
}
document.getElementById('alarmBatchOnBtn').addEventListener('click', () =>
  writeAlarmValuesBatch(monAlarmTags.filter(t => selectedAlarmTagIds.has(t.tagId)), 1));
document.getElementById('alarmBatchOffBtn').addEventListener('click', () =>
  writeAlarmValuesBatch(monAlarmTags.filter(t => selectedAlarmTagIds.has(t.tagId)), 0));

// ── 4-3) 온도 태그 트렌드 ──────────────────────────────────────────
async function populateMonitorTempEquipSelect() {
  const { equipIds } = await api('GET', '/api/admin/temptags/equipids');
  const sel = document.getElementById('monTempEquipSelect');
  const current = sel.value || '';
  sel.innerHTML = '<option value="">전체 설비</option>' + equipIds.map(eq => `<option value="${escapeHtml(eq)}">${escapeHtml(eq)}</option>`).join('');
  sel.value = [...sel.options].some(o => o.value === current) ? current : '';
}
document.getElementById('monTempEquipSelect').addEventListener('change', refreshMonitorTemp);
// 30초 자동 갱신을 기다리지 않고, 방금 등록/수정한 온도 태그를 바로 확인하고 싶을 때 쓰는 수동 새로고침.
document.getElementById('monTempRefreshBtn').addEventListener('click', refreshMonitorTemp);

// 설비(equip_id) 기준으로 묶어서 카드 하나 = 설비 하나로 보여준다. equip_id를 안 적어둔
// 태그들은 "(설비 미지정)"으로 따로 묶어서 누락도 눈에 보이게 한다.
function groupTempTagsByEquip(tags) {
  const groups = new Map();
  for (const t of tags) {
    const key = t.equipId || '(설비 미지정)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  return groups;
}

async function refreshMonitorTemp() {
  const equipId = document.getElementById('monTempEquipSelect').value;
  const qs = '?minutes=60' + (equipId ? `&equipId=${encodeURIComponent(equipId)}` : '');
  try {
    const { tags } = await api('GET', '/api/admin/monitor/temptags' + qs);
    const grid = document.getElementById('monTempGrid');
    const empty = document.getElementById('monTempEmpty');
    const groups = groupTempTagsByEquip(tags);
    document.getElementById('monTempCount').textContent = `총 ${groups.size}개 설비 (태그 ${tags.length}개)`;
    document.getElementById('monTempUpdatedAt').textContent = formatUpdatedAt(new Date().toISOString());
    if (tags.length === 0) {
      grid.innerHTML = ''; empty.hidden = false;
      tempChartInstances.forEach(c => c.destroy()); tempChartInstances.clear();
      return;
    }
    empty.hidden = true;

    // 더 이상 존재하지 않는 설비의 카드/차트는 정리한다(태그를 지우거나 설비명을 바꾼 경우).
    const currentEquips = new Set(groups.keys());
    grid.querySelectorAll('.trend-card').forEach(card => {
      if (!currentEquips.has(card.dataset.equip)) {
        tempChartInstances.get(card.dataset.equip)?.destroy();
        tempChartInstances.delete(card.dataset.equip);
        card.remove();
      }
    });

    for (const [equip, groupTags] of groups) {
      const card = ensureTempCard(equip, groupTags.length);
      const { labels, namedSeries } = buildAlignedSeries(groupTags);
      renderOrUpdateTempChart(card, labels, namedSeries);
      card.querySelector('.trend-legend').innerHTML = groupTags.map((t, i) => `
        <div class="trend-legend-item">
          <span class="legend-dot" style="background:${TREND_COLORS[i % TREND_COLORS.length]}"></span>
          <span class="legend-name" title="${escapeHtml(t.tagName)}">${escapeHtml(t.trendName || t.tagName)}</span>
          <b>${t.current === null ? '값 없음' : t.current.toFixed(1)}</b>
        </div>`).join('');
    }
  } catch (e) { showToast('온도 트렌드 갱신 실패: ' + e.message, 'error'); }
}

async function refreshAllMonitor() {
  if (!isMonitorTabActive()) return;
  await Promise.all([refreshMonitorFolder(), refreshMonitorAlarm(), refreshMonitorTemp()]);
}

// 값 자체는 서버가 2초/30초 주기로 이미 갱신해두므로, 화면 새로고침은 그보다 약간 여유있게 잡는다
// (모니터링·알람은 2.5초 — 서버 폴링 주기와 거의 맞춤, 온도는 30초 — 어차피 그 주기로만 바뀜).
setInterval(() => { if (isMonitorTabActive()) { refreshMonitorFolder(); refreshMonitorAlarm(); } }, 2500);
setInterval(() => { if (isMonitorTabActive()) refreshMonitorTemp(); }, 30000);

// ============================================================================
// 초기 로딩
// ============================================================================
(async function init() {
  // 정렬 헤더는 정적 마크업이라 한 번만 연결한다.
  setupSortableHeaders('plcTable', plcSort, renderPlcTable);
  setupSortableHeaders('folderTagTable', folderTagSort, renderFolderTagTable);
  setupSortableHeaders('tempTagTable', tempTagSort, renderTempTagTable);
  setupSortableHeaders('alarmTagTable', alarmTagSort, renderAlarmTagTable);

  try {
    await loadPlcOptions();
    await loadPlcs();
    await loadFolders();
    updateFolderTagExportLink();
    await selectFolder('ALL');          // 모니터링 태그 화면은 처음부터 "전체"로 시작
    populateMonitorFolderSelect();
    await loadEquipIds();
    updateTempTagExportLink();
    await loadTempTags();
    await loadSnapshotColumns();
    await populateMonitorTempEquipSelect();
    await loadAlarmFolders();
    updateAlarmTagExportLink();
    await selectAlarmFolder('ALL');
    populateMonitorAlarmFolderSelect();
    // 실시간 모니터링의 알람 서브탭은 "전체"(238개) 대신 첫 폴더로 좁혀서 시작한다 — 그게 더 쓸모있다.
    if (alarmFolders.length > 0) document.getElementById('monAlarmFolderSelect').value = alarmFolders[0].id;
  } catch (e) {
    showToast('초기 로딩 실패: ' + e.message, 'error');
  }
})();
