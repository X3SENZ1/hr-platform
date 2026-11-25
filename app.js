(function () {
  const STORAGE_KEY = 'osnova_hr_state_v3';

  const MONTHS_RU = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const MONTHS_NOM_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const MONTHS_SHORT_RU = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];

  const AVATAR_PALETTES = [
    { bg: '#E5E7EB', color: '#1F2937' },
    { bg: '#DBEAFE', color: '#1E40AF' },
    { bg: '#E0E7FF', color: '#3730A3' },
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#FCE7F3', color: '#9D174D' }
  ];

  const LEAVE_TYPE_META = {
    vacation: { label: 'Ежегодный отпуск', short: 'Отпуск' },
    dayoff: { label: 'Отгул', short: 'Отгул' },
    sick: { label: 'Больничный', short: 'Больничный' }
  };

  const LEAVE_STATUS_META = {
    pending: { label: 'На согласовании', statusClass: 'status-probation' },
    approved: { label: 'Одобрено', statusClass: 'status-active' },
    rejected: { label: 'Отклонено', statusClass: 'status-sick' }
  };

  const VIEW_META = {
    overview: {
      title: 'Обзор',
      subtitle: 'Сводка по команде на сегодня',
      ctaLabel: '+ Сотрудник',
      ctaAction: 'open-add-employee'
    },
    employees: {
      title: 'Сотрудники',
      subtitle: 'База команды и контакты',
      ctaLabel: '+ Сотрудник',
      ctaAction: 'open-add-employee'
    },
    onboarding: {
      title: 'Онбординг',
      subtitle: 'Планы адаптации и чек-листы',
      ctaLabel: '+ Запустить онбординг',
      ctaAction: 'open-add-onboarding'
    },
    leaves: {
      title: 'Отпуска',
      subtitle: 'Согласование и график отсутствий',
      ctaLabel: '+ Новая заявка',
      ctaAction: 'open-add-leave'
    },
    structure: {
      title: 'Структура',
      subtitle: 'Оргсхема и состав отделов',
      ctaLabel: '+ Сотрудник',
      ctaAction: 'open-add-employee'
    }
  };

  const now = new Date();
  const TODAY_ISO = window.HR_SEED.toISODate(now);

  let state = loadState();
  const ui = {
    view: 'overview',
    empSearch: '',
    empDept: 'all',
    empStatus: 'all',
    empLayout: 'table',
    onbFilter: 'active',
    onbOwnerFilter: 'all',
    selectedOnbId: null,
    leaveMonthYear: { year: now.getFullYear(), month: now.getMonth() },
    leaveStatusFilter: 'all',
    leaveDeptFilter: 'all',
    leaveShowAllTimeline: false,
    structureMode: 'tree',
    structureSearch: '',
    drawerEmployeeId: null,
    drawerTab: 'profile',
    drawerEditing: false,
    activeModal: null
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.departments)) {
          return parsed;
        }
      }
    } catch (e) {
      // Fall back to default seed
    }
    return window.HR_SEED.buildDefaultData();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore quota errors
    }
  }

  function resetDemoData() {
    state = window.HR_SEED.buildDefaultData();
    saveState();
    ui.selectedOnbId = null;
    closeDrawer();
    renderAll();
    showToast('Демо-данные восстановлены');
  }

  // --- Helpers ---
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseISODate(iso) {
    const parts = String(iso || '').split('-');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function formatDateFull(iso) {
    const d = parseISODate(iso);
    if (!d) return '—';
    return d.getDate() + ' ' + MONTHS_RU[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatDateRange(startIso, endIso) {
    const s = parseISODate(startIso);
    const e = parseISODate(endIso);
    if (!s || !e) return '—';
    const sStr = s.getDate() + ' ' + MONTHS_SHORT_RU[s.getMonth()];
    if (startIso === endIso) return sStr;
    return sStr + ' – ' + e.getDate() + ' ' + MONTHS_SHORT_RU[e.getMonth()];
  }

  function countCalendarDays(startIso, endIso) {
    const s = parseISODate(startIso);
    const e = parseISODate(endIso);
    if (!s || !e || e < s) return 0;
    return Math.round((e - s) / 86400000) + 1;
  }

  function pluralize(n, forms) {
    const abs = Math.abs(n) % 100;
    const n1 = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  function getInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function formatTenure(startIso) {
    const s = parseISODate(startIso);
    if (!s) return '—';
    const diffDays = Math.max(0, Math.floor((now - s) / 86400000));
    if (diffDays < 30) {
      const d = Math.max(1, diffDays);
      return d + ' ' + pluralize(d, ['день', 'дня', 'дней']);
    }
    const months = Math.floor(diffDays / 30.4);
    if (months < 12) return months + ' ' + pluralize(months, ['месяц', 'месяца', 'месяцев']);
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return years + ' ' + pluralize(years, ['год', 'года', 'лет']) + (rem > 0 ? ' ' + rem + ' мес.' : '');
  }

  function renderAvatar(emp, sizeClass) {
    const cls = sizeClass ? 'avatar ' + sizeClass : 'avatar';
    const bg = emp && emp.avatarBg ? emp.avatarBg : '#E5E7EB';
    const color = emp && emp.avatarColor ? emp.avatarColor : '#1F2937';
    return '<span class="' + cls + '" style="background:' + bg + ';color:' + color + ';">' + escapeHtml(getInitials(emp ? emp.name : '')) + '</span>';
  }

  function getEmployeeById(id) {
    return state.employees.find(function (e) { return e.id === id; }) || null;
  }

  function getDepartmentById(id) {
    return state.departments.find(function (d) { return d.id === id; }) || null;
  }

  function getActiveLeaveForEmployee(empId, dateIso) {
    const checkDate = dateIso || TODAY_ISO;
    return state.leaves.find(function (lv) {
      return lv.employeeId === empId && lv.status === 'approved' && lv.startDate <= checkDate && lv.endDate >= checkDate;
    }) || null;
  }

  function getEmployeeStatusMeta(emp) {
    const activeLeave = getActiveLeaveForEmployee(emp.id, TODAY_ISO);
    if (activeLeave) {
      if (activeLeave.type === 'sick') return { key: 'on_leave', label: 'Больничный', statusClass: 'status-sick' };
      if (activeLeave.type === 'dayoff') return { key: 'on_leave', label: 'Отгул', statusClass: 'status-on_leave' };
      return { key: 'on_leave', label: 'В отпуске', statusClass: 'status-on_leave' };
    }
    if (emp.status === 'probation') return { key: 'probation', label: 'Испытательный', statusClass: 'status-probation' };
    return { key: 'active', label: 'В штате', statusClass: 'status-active' };
  }

  function renderStatus(statusClass, label) {
    return '<span class="status-text ' + statusClass + '"><span class="status-dot-sm"></span>' + escapeHtml(label) + '</span>';
  }

  function getOnboardingProgress(track) {
    const total = track.tasks.length;
    const done = track.tasks.filter(function (t) { return t.done; }).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done: done, total: total, percent: percent };
  }

  function getOnboardingForEmployee(empId) {
    return state.onboarding.find(function (o) { return o.employeeId === empId; }) || null;
  }

  function getVacationBalance(emp) {
    const total = emp.vacationTotal || 28;
    const used = emp.vacationUsed || 0;
    return { total: total, used: used, remaining: Math.max(0, total - used) };
  }

  function findDepartmentOverlaps(employeeId, startDate, endDate, excludeLeaveId) {
    const emp = getEmployeeById(employeeId);
    if (!emp || !startDate || !endDate) return [];
    return state.leaves.filter(function (lv) {
      if (lv.id === excludeLeaveId || lv.status === 'rejected' || lv.employeeId === employeeId) return false;
      const other = getEmployeeById(lv.employeeId);
      return other && other.departmentId === emp.departmentId && lv.startDate <= endDate && lv.endDate >= startDate;
    });
  }

  function getUpcomingBirthdays() {
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const list = [];
    state.employees.forEach(function (emp) {
      if (!emp.birthday) return;
      const parts = emp.birthday.split('-');
      if (parts.length !== 2) return;
      const m = Number(parts[0]) - 1;
      const d = Number(parts[1]);
      let bday = new Date(now.getFullYear(), m, d, 12, 0, 0);
      if (bday < todayZero) bday = new Date(now.getFullYear() + 1, m, d, 12, 0, 0);
      const daysUntil = Math.round((bday - todayZero) / 86400000);
      if (daysUntil <= 14) {
        list.push({ emp: emp, daysUntil: daysUntil, dateStr: bday.getDate() + ' ' + MONTHS_SHORT_RU[bday.getMonth()] });
      }
    });
    return list.sort(function (a, b) { return a.daysUntil - b.daysUntil; });
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () { el.remove(); }, 2800);
  }

  // --- Chrome ---
  function updateChrome() {
    const meta = VIEW_META[ui.view] || VIEW_META.overview;
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.subtitle;
    document.getElementById('primaryCtaLabel').textContent = meta.ctaLabel;
    document.getElementById('primaryCtaBtn').dataset.action = meta.ctaAction;

    document.querySelectorAll('.nav-item[data-view]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === ui.view);
    });

    document.getElementById('employeesNavCount').textContent = String(state.employees.length);

    const activeOnbCount = state.onboarding.filter(function (o) { return getOnboardingProgress(o).percent < 100; }).length;
    const onbBadge = document.getElementById('onboardingNavBadge');
    onbBadge.textContent = String(activeOnbCount);
    onbBadge.classList.toggle('is-zero', activeOnbCount === 0);

    const pendingCount = state.leaves.filter(function (l) { return l.status === 'pending'; }).length;
    const leavesBadge = document.getElementById('pendingLeavesBadge');
    leavesBadge.textContent = String(pendingCount);
    leavesBadge.classList.toggle('is-zero', pendingCount === 0);
  }

  function switchView(viewName, skipHashUpdate) {
    if (!VIEW_META[viewName]) return;
    ui.view = viewName;
    if (!skipHashUpdate && window.location.hash !== '#' + viewName) window.location.hash = viewName;
    closeMobileSidebar();
    renderAll();
  }

  function renderAll() {
    updateChrome();
    const container = document.getElementById('mainView');
    if (ui.view === 'overview') container.innerHTML = renderOverviewHTML();
    else if (ui.view === 'employees') {
      container.innerHTML = renderEmployeesShellHTML();
      renderEmployeesResults();
    } else if (ui.view === 'onboarding') container.innerHTML = renderOnboardingHTML();
    else if (ui.view === 'leaves') container.innerHTML = renderLeavesHTML();
    else if (ui.view === 'structure') container.innerHTML = renderStructureHTML();

    if (ui.drawerEmployeeId) {
      const emp = getEmployeeById(ui.drawerEmployeeId);
      if (emp) renderDrawerContent(emp);
      else closeDrawer();
    }
  }

  // --- VIEW 1: OVERVIEW ---
  function renderOverviewHTML() {
    const totalEmp = state.employees.length;
    const probationCount = state.employees.filter(function (e) { return e.status === 'probation'; }).length;
    const activeTracks = state.onboarding.filter(function (o) { return getOnboardingProgress(o).percent < 100; });
    const avgOnb = activeTracks.length
      ? Math.round(activeTracks.reduce(function (s, o) { return s + getOnboardingProgress(o).percent; }, 0) / activeTracks.length)
      : 100;
    const outToday = state.employees.filter(function (e) { return Boolean(getActiveLeaveForEmployee(e.id, TODAY_ISO)); });
    const pendingLeaves = state.leaves.filter(function (l) { return l.status === 'pending'; });
    const openRolesTotal = state.departments.reduce(function (s, d) { return s + (d.openRoles || 0); }, 0);

    const metricsBar =
      '<section class="metrics-bar" aria-label="Ключевые показатели">' +
        '<div class="metric-cell" data-nav="employees">' +
          '<div class="metric-label">Сотрудники</div>' +
          '<div class="metric-val">' + totalEmp + '</div>' +
          '<div class="metric-note">' + (totalEmp - probationCount) + ' в штате · ' + probationCount + ' на испытательном</div>' +
        '</div>' +
        '<div class="metric-cell" data-nav="onboarding">' +
          '<div class="metric-label">На онбординге</div>' +
          '<div class="metric-val">' + activeTracks.length + '</div>' +
          '<div class="metric-note">Средний прогресс ' + avgOnb + '%</div>' +
        '</div>' +
        '<div class="metric-cell" data-nav="leaves">' +
          '<div class="metric-label">Отсутствуют сегодня</div>' +
          '<div class="metric-val">' + outToday.length + '</div>' +
          '<div class="metric-note">' + (outToday.length ? outToday.map(function (e) { return e.name.split(' ')[0]; }).join(', ') : 'Вся команда на месте') + '</div>' +
        '</div>' +
        '<div class="metric-cell" data-nav="leaves">' +
          '<div class="metric-label">На согласовании</div>' +
          '<div class="metric-val">' + pendingLeaves.length + '</div>' +
          '<div class="metric-note">' + (pendingLeaves.length ? 'Заявки на отпуск и отгул' : 'Очередь пуста') + '</div>' +
        '</div>' +
      '</section>';

    const pendingHtml = pendingLeaves.length === 0
      ? '<div class="empty-state"><div class="empty-state-title">Очередь пуста</div><div>Все заявки обработаны</div></div>'
      : pendingLeaves.map(function (lv) {
          const emp = getEmployeeById(lv.employeeId);
          if (!emp) return '';
          const typeMeta = LEAVE_TYPE_META[lv.type] || LEAVE_TYPE_META.vacation;
          const days = countCalendarDays(lv.startDate, lv.endDate);
          const overlaps = findDepartmentOverlaps(lv.employeeId, lv.startDate, lv.endDate, lv.id);
          const overlapNote = overlaps.length > 0
            ? '<div class="inline-warning">Пересечение в отделе: ' + overlaps.map(function (o) { const oe = getEmployeeById(o.employeeId); return oe ? escapeHtml(oe.name) : ''; }).join(', ') + '</div>'
            : '<div class="inline-ok">Пересечений в отделе нет</div>';
          return (
            '<div class="list-row">' +
              '<div class="person-cell" data-open-employee="' + emp.id + '" style="cursor:pointer;">' +
                renderAvatar(emp) +
                '<div class="person-meta">' +
                  '<div class="person-name">' + escapeHtml(emp.name) + ' <span style="font-weight:400;color:var(--text-muted);">· ' + typeMeta.short + ', ' + formatDateRange(lv.startDate, lv.endDate) + ' (' + days + ' ' + pluralize(days, ['день', 'дня', 'дней']) + ')</span></div>' +
                  overlapNote +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                '<button class="btn btn-sm btn-primary" data-leave-decision="approved" data-leave-id="' + lv.id + '" type="button">Одобрить</button>' +
                '<button class="btn btn-sm btn-secondary" data-leave-decision="rejected" data-leave-id="' + lv.id + '" type="button">Отклонить</button>' +
              '</div>' +
            '</div>'
          );
        }).join('');

    const onbHtml = activeTracks.length === 0
      ? '<div class="empty-state">Активных планов онбординга нет</div>'
      : activeTracks.map(function (track) {
          const emp = getEmployeeById(track.employeeId);
          if (!emp) return '';
          const buddy = getEmployeeById(track.buddyId);
          const prog = getOnboardingProgress(track);
          return (
            '<div class="list-row list-row-clickable" data-jump-onboarding="' + track.id + '">' +
              '<div class="person-cell">' +
                renderAvatar(emp) +
                '<div class="person-meta">' +
                  '<div class="person-name">' + escapeHtml(emp.name) + '</div>' +
                  '<div class="person-sub">' + escapeHtml(emp.role) + (buddy ? ' · бадди ' + escapeHtml(buddy.name.split(' ')[0]) : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="width:130px;text-align:right;">' +
                '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:5px;" class="tabular">' + prog.done + ' из ' + prog.total + ' · ' + prog.percent + '%</div>' +
                '<div class="progress-track"><div class="progress-fill" style="width:' + prog.percent + '%"></div></div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

    const deptsRows = state.departments.map(function (dept) {
      const count = state.employees.filter(function (e) { return e.departmentId === dept.id; }).length;
      return (
        '<div class="list-row list-row-clickable" data-filter-dept="' + dept.id + '">' +
          '<div style="display:flex;align-items:center;gap:9px;font-weight:500;">' +
            '<span class="dept-dot" style="background:' + dept.color + ';"></span>' +
            escapeHtml(dept.name) +
          '</div>' +
          '<div class="tabular" style="font-size:12.5px;color:var(--text-secondary);">' +
            count + ' чел.' + (dept.openRoles ? ' · <span style="color:var(--link);">+' + dept.openRoles + ' вак.</span>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('');

    const upcomingLeaves = state.leaves
      .filter(function (l) { return l.status === 'approved' && l.endDate >= TODAY_ISO; })
      .sort(function (a, b) { return a.startDate.localeCompare(b.startDate); })
      .slice(0, 4);
    const bdays = getUpcomingBirthdays().slice(0, 2);

    const scheduleRows = upcomingLeaves.map(function (lv) {
      const emp = getEmployeeById(lv.employeeId);
      if (!emp) return '';
      const typeMeta = LEAVE_TYPE_META[lv.type] || LEAVE_TYPE_META.vacation;
      const isNow = lv.startDate <= TODAY_ISO && lv.endDate >= TODAY_ISO;
      return (
        '<div class="list-row list-row-clickable" data-open-employee="' + emp.id + '">' +
          '<div class="person-cell">' +
            renderAvatar(emp, 'avatar-sm') +
            '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div><div class="person-sub">' + typeMeta.short + '</div></div>' +
          '</div>' +
          '<span class="tabular" style="font-size:12px;color:' + (isNow ? 'var(--info)' : 'var(--text-muted)') + ';font-weight:' + (isNow ? '600' : '400') + ';">' + (isNow ? 'сейчас · ' : '') + formatDateRange(lv.startDate, lv.endDate) + '</span>' +
        '</div>'
      );
    }).join('') + bdays.map(function (b) {
      const when = b.daysUntil === 0 ? 'сегодня' : (b.daysUntil === 1 ? 'завтра' : b.dateStr);
      return (
        '<div class="list-row list-row-clickable" data-open-employee="' + b.emp.id + '">' +
          '<div class="person-cell">' +
            renderAvatar(b.emp, 'avatar-sm') +
            '<div class="person-meta"><div class="person-name">' + escapeHtml(b.emp.name) + '</div><div class="person-sub">День рождения</div></div>' +
          '</div>' +
          '<span class="tabular" style="font-size:12px;color:var(--text-muted);">' + when + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      metricsBar +
      '<div class="dashboard-grid">' +
        '<div class="stack">' +
          '<section class="card">' +
            '<div class="card-header"><div><h2 class="card-title">Заявки на согласование</h2></div><button class="btn btn-sm btn-ghost" data-nav="leaves" type="button">Все заявки →</button></div>' +
            '<div>' + pendingHtml + '</div>' +
          '</section>' +
          '<section class="card">' +
            '<div class="card-header"><div><h2 class="card-title">Активный онбординг</h2></div><button class="btn btn-sm btn-ghost" data-nav="onboarding" type="button">К планам →</button></div>' +
            '<div>' + onbHtml + '</div>' +
          '</section>' +
        '</div>' +
        '<div class="stack">' +
          '<section class="card">' +
            '<div class="card-header"><div><h2 class="card-title">Отделы</h2></div><span class="card-subtitle">Открыто вакансий: ' + openRolesTotal + '</span></div>' +
            '<div>' + deptsRows + '</div>' +
          '</section>' +
          '<section class="card">' +
            '<div class="card-header"><div><h2 class="card-title">Календарь команды</h2></div><button class="btn btn-sm btn-ghost" data-nav="leaves" type="button">График →</button></div>' +
            '<div>' + (scheduleRows || '<div class="empty-state">Ближайших событий нет</div>') + '</div>' +
          '</section>' +
        '</div>' +
      '</div>'
    );
  }

  // --- VIEW 2: EMPLOYEES ---
  function renderEmployeesShellHTML() {
    const deptOptions = state.departments.map(function (d) {
      return '<option value="' + d.id + '"' + (ui.empDept === d.id ? ' selected' : '') + '>' + escapeHtml(d.name) + '</option>';
    }).join('');

    return (
      '<div class="toolbar">' +
        '<div class="toolbar-filters">' +
          '<input id="empSearchInput" type="search" class="input" style="width:240px;" placeholder="Поиск по имени, роли, городу..." value="' + escapeHtml(ui.empSearch) + '" />' +
          '<select id="empDeptFilter" class="select">' +
            '<option value="all"' + (ui.empDept === 'all' ? ' selected' : '') + '>Все отделы</option>' +
            deptOptions +
          '</select>' +
          '<select id="empStatusFilter" class="select">' +
            '<option value="all"' + (ui.empStatus === 'all' ? ' selected' : '') + '>Любой статус</option>' +
            '<option value="active"' + (ui.empStatus === 'active' ? ' selected' : '') + '>В штате</option>' +
            '<option value="probation"' + (ui.empStatus === 'probation' ? ' selected' : '') + '>Испытательный</option>' +
            '<option value="on_leave"' + (ui.empStatus === 'on_leave' ? ' selected' : '') + '>В отпуске / отсутствует</option>' +
          '</select>' +
        '</div>' +
        '<div class="segmented">' +
          '<button class="segmented-btn' + (ui.empLayout === 'table' ? ' active' : '') + '" data-emp-layout="table" type="button">Таблица</button>' +
          '<button class="segmented-btn' + (ui.empLayout === 'cards' ? ' active' : '') + '" data-emp-layout="cards" type="button">Карточки</button>' +
        '</div>' +
      '</div>' +
      '<div id="employeesResults"></div>'
    );
  }

  function getFilteredEmployees() {
    const q = ui.empSearch.trim().toLowerCase();
    return state.employees.filter(function (emp) {
      if (ui.empDept !== 'all' && emp.departmentId !== ui.empDept) return false;
      const statusMeta = getEmployeeStatusMeta(emp);
      if (ui.empStatus !== 'all' && statusMeta.key !== ui.empStatus) return false;
      if (!q) return true;
      const dept = getDepartmentById(emp.departmentId);
      const hay = [emp.name, emp.role, emp.city, emp.email, dept ? dept.name : ''].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderEmployeesResults() {
    const target = document.getElementById('employeesResults');
    if (!target) return;
    const list = getFilteredEmployees();

    if (list.length === 0) {
      target.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state-title">Ничего не найдено</div><div>Измените параметры поиска или фильтры</div></div></div>';
      return;
    }

    if (ui.empLayout === 'cards') {
      target.innerHTML = '<div class="cards-grid">' + list.map(function (emp) {
        const dept = getDepartmentById(emp.departmentId);
        const status = getEmployeeStatusMeta(emp);
        const bal = getVacationBalance(emp);
        return (
          '<article class="employee-card" data-open-employee="' + emp.id + '">' +
            '<div class="person-cell">' +
              renderAvatar(emp) +
              '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div><div class="person-sub">' + escapeHtml(emp.role) + '</div></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              renderStatus(status.statusClass, status.label) +
              '<span style="font-size:12px;color:var(--text-muted);">' + escapeHtml(dept ? dept.name : '—') + '</span>' +
            '</div>' +
            '<div class="employee-card-meta">' +
              '<div class="meta-line"><span>Локация</span><span>' + escapeHtml(emp.format) + ' · ' + escapeHtml(emp.city) + '</span></div>' +
              '<div class="meta-line"><span>Отпуск</span><span class="tabular">' + bal.remaining + ' / ' + bal.total + ' дн.</span></div>' +
            '</div>' +
          '</article>'
        );
      }).join('') + '</div>';
      return;
    }

    const rows = list.map(function (emp) {
      const dept = getDepartmentById(emp.departmentId);
      const status = getEmployeeStatusMeta(emp);
      const bal = getVacationBalance(emp);
      const manager = emp.managerId ? getEmployeeById(emp.managerId) : null;
      return (
        '<tr data-open-employee="' + emp.id + '">' +
          '<td><div class="person-cell">' + renderAvatar(emp) + '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div><div class="person-sub">' + escapeHtml(emp.email) + '</div></div></div></td>' +
          '<td><div>' + escapeHtml(emp.role) + '</div><div style="font-size:12px;color:var(--text-muted);">' + (manager ? escapeHtml(manager.name) : 'Руководитель компании') + '</div></td>' +
          '<td><span style="display:inline-flex;align-items:center;gap:7px;"><span class="dept-dot" style="background:' + (dept ? dept.color : '#999') + ';"></span>' + escapeHtml(dept ? dept.name : '—') + '</span></td>' +
          '<td>' + escapeHtml(emp.format) + ' · ' + escapeHtml(emp.city) + ' <span style="color:var(--text-muted);font-size:12px;">(' + escapeHtml(emp.timezone || 'МСК') + ')</span></td>' +
          '<td>' + renderStatus(status.statusClass, status.label) + '</td>' +
          '<td class="tabular" style="white-space:nowrap;">' + bal.remaining + ' <span style="color:var(--text-muted);">/ ' + bal.total + ' дн.</span></td>' +
        '</tr>'
      );
    }).join('');

    target.innerHTML =
      '<div class="card"><div class="table-wrap"><table class="data-table">' +
        '<thead><tr><th>Сотрудник</th><th>Должность и руководитель</th><th>Отдел</th><th>Локация</th><th>Статус</th><th>Остаток отпуска</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div></div>';
  }

  // --- VIEW 3: ONBOARDING ---
  function renderOnboardingHTML() {
    const filteredTracks = state.onboarding.filter(function (track) {
      const prog = getOnboardingProgress(track);
      return ui.onbFilter === 'completed' ? prog.percent === 100 : prog.percent < 100;
    });

    let selectedTrack = filteredTracks.find(function (t) { return t.id === ui.selectedOnbId; }) || filteredTracks[0] || null;
    if (selectedTrack) ui.selectedOnbId = selectedTrack.id;

    const activeCount = state.onboarding.filter(function (t) { return getOnboardingProgress(t).percent < 100; }).length;
    const completedCount = state.onboarding.length - activeCount;

    const listHtml = filteredTracks.length === 0
      ? '<div class="empty-state">Нет планов в этой категории</div>'
      : filteredTracks.map(function (track) {
          const emp = getEmployeeById(track.employeeId);
          if (!emp) return '';
          const prog = getOnboardingProgress(track);
          const isSelected = selectedTrack && selectedTrack.id === track.id;
          return (
            '<div class="newcomer-card' + (isSelected ? ' active' : '') + '" data-select-onb="' + track.id + '">' +
              '<div class="person-cell">' + renderAvatar(emp) + '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div><div class="person-sub">' + escapeHtml(emp.role) + '</div></div></div>' +
              '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:5px;">' +
                  '<span>Старт ' + formatDateFull(track.startedAt) + '</span>' +
                  '<span class="tabular" style="color:var(--text);font-weight:500;">' + prog.percent + '%</span>' +
                '</div>' +
                '<div class="progress-track"><div class="progress-fill' + (prog.percent === 100 ? ' done' : '') + '" style="width:' + prog.percent + '%"></div></div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

    let detailHtml = '<div class="card"><div class="empty-state"><div class="empty-state-title">Выберите сотрудника</div><div>Или запустите новый план адаптации</div></div></div>';
    if (selectedTrack) {
      const emp = getEmployeeById(selectedTrack.employeeId);
      const buddy = getEmployeeById(selectedTrack.buddyId);
      const dept = emp ? getDepartmentById(emp.departmentId) : null;
      const prog = getOnboardingProgress(selectedTrack);

      const ownerFilterRow =
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:11px 18px;border-top:1px solid var(--border);background:var(--surface-subtle);">' +
          '<span style="font-size:12px;color:var(--text-muted);">Ответственный</span>' +
          '<div class="segmented">' +
            ['all', 'HR', 'Бадди', 'Тимлид', 'Новичок'].map(function (ow) {
              return '<button class="segmented-btn' + (ui.onbOwnerFilter === ow ? ' active' : '') + '" data-onb-owner="' + ow + '" type="button">' + (ow === 'all' ? 'Все' : ow) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';

      const stages = ['День 1', 'Первая неделя', 'Первый месяц'];
      const extraStages = selectedTrack.tasks
        .map(function (t) { return t.stage; })
        .filter(function (s, idx, arr) { return stages.indexOf(s) === -1 && arr.indexOf(s) === idx; });
      const allStages = stages.concat(extraStages);

      const stagesHtml = allStages.map(function (stageName) {
        const stageTasks = selectedTrack.tasks.filter(function (t) { return t.stage === stageName; });
        const visibleTasks = ui.onbOwnerFilter === 'all'
          ? stageTasks
          : stageTasks.filter(function (t) { return t.owner === ui.onbOwnerFilter; });
        if (visibleTasks.length === 0) return '';
        const doneInStage = stageTasks.filter(function (t) { return t.done; }).length;
        return (
          '<div class="stage-group">' +
            '<div class="stage-header">' +
              '<span class="stage-title">' + escapeHtml(stageName) + '</span>' +
              '<span style="font-size:12px;color:var(--text-muted);" class="tabular">' + doneInStage + ' / ' + stageTasks.length + '</span>' +
            '</div>' +
            visibleTasks.map(function (task) {
              return (
                '<label class="checklist-item' + (task.done ? ' done' : '') + '">' +
                  '<input type="checkbox" class="checklist-checkbox" data-toggle-task="' + task.id + '" data-onb-id="' + selectedTrack.id + '"' + (task.done ? ' checked' : '') + ' />' +
                  '<span class="checklist-label">' + escapeHtml(task.title) + '</span>' +
                  '<span class="owner-label">' + escapeHtml(task.owner) + '</span>' +
                '</label>'
              );
            }).join('') +
          '</div>'
        );
      }).join('');

      detailHtml =
        '<section class="card">' +
          '<div class="card-body">' +
            '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;">' +
              '<div class="person-cell" data-open-employee="' + (emp ? emp.id : '') + '" style="cursor:pointer;">' +
                renderAvatar(emp, 'avatar-lg') +
                '<div>' +
                  '<h2 style="margin:0;font-size:16px;font-weight:600;">' + escapeHtml(emp ? emp.name : 'Сотрудник') + '</h2>' +
                  '<div style="color:var(--text-secondary);font-size:13px;">' + escapeHtml(emp ? emp.role : '') + (dept ? ' · ' + escapeHtml(dept.name) : '') + '</div>' +
                  '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Выход ' + formatDateFull(selectedTrack.startedAt) + (buddy ? ' · Бадди: <button class="link-btn" type="button" data-open-employee="' + buddy.id + '">' + escapeHtml(buddy.name) + '</button>' : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="min-width:165px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px;"><span>Прогресс</span><strong class="tabular">' + prog.done + ' / ' + prog.total + '</strong></div>' +
                '<div class="progress-track" style="height:6px;"><div class="progress-fill' + (prog.percent === 100 ? ' done' : '') + '" style="width:' + prog.percent + '%"></div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          ownerFilterRow +
          (stagesHtml || '<div class="empty-state">Нет задач для выбранной роли</div>') +
          '<form id="inlineAddTaskForm" class="inline-add-task" data-onb-id="' + selectedTrack.id + '">' +
            '<input type="text" name="title" class="input" placeholder="Новая задача в план..." required />' +
            '<select name="stage" class="select"><option value="День 1">День 1</option><option value="Первая неделя" selected>Первая неделя</option><option value="Первый месяц">Первый месяц</option></select>' +
            '<select name="owner" class="select"><option value="HR">HR</option><option value="Бадди">Бадди</option><option value="Тимлид">Тимлид</option><option value="Новичок">Новичок</option></select>' +
            '<button class="btn btn-primary" type="submit">Добавить</button>' +
          '</form>' +
        '</section>';
    }

    return (
      '<div class="onboarding-layout">' +
        '<section class="card">' +
          '<div class="card-header" style="flex-wrap:wrap;">' +
            '<h2 class="card-title">Новички</h2>' +
            '<div class="segmented">' +
              '<button class="segmented-btn' + (ui.onbFilter === 'active' ? ' active' : '') + '" data-onb-filter="active" type="button">В работе · ' + activeCount + '</button>' +
              '<button class="segmented-btn' + (ui.onbFilter === 'completed' ? ' active' : '') + '" data-onb-filter="completed" type="button">Готово · ' + completedCount + '</button>' +
            '</div>' +
          '</div>' +
          '<div>' + listHtml + '</div>' +
        '</section>' +
        detailHtml +
      '</div>'
    );
  }

  // --- VIEW 4: LEAVES ---
  function renderLeavesHTML() {
    const pendingLeaves = state.leaves.filter(function (l) { return l.status === 'pending'; });
    let approvalSection = '';
    if (pendingLeaves.length > 0) {
      approvalSection =
        '<section class="card" style="margin-bottom:18px;">' +
          '<div class="card-header"><h2 class="card-title">Ожидают согласования (' + pendingLeaves.length + ')</h2></div>' +
          '<div>' +
            pendingLeaves.map(function (lv) {
              const emp = getEmployeeById(lv.employeeId);
              if (!emp) return '';
              const typeMeta = LEAVE_TYPE_META[lv.type] || LEAVE_TYPE_META.vacation;
              const days = countCalendarDays(lv.startDate, lv.endDate);
              const bal = getVacationBalance(emp);
              const overlaps = findDepartmentOverlaps(lv.employeeId, lv.startDate, lv.endDate, lv.id);
              const conflictText = overlaps.length > 0
                ? '<div class="inline-warning">Пересечение в отделе: ' + overlaps.map(function (o) { const oe = getEmployeeById(o.employeeId); return oe ? escapeHtml(oe.name) : ''; }).join(', ') + '</div>'
                : '<div class="inline-ok">Пересечений в отделе нет' + (lv.comment ? ' · ' + escapeHtml(lv.comment) : '') + '</div>';

              return (
                '<div class="list-row">' +
                  '<div class="person-cell" data-open-employee="' + emp.id + '" style="cursor:pointer;">' +
                    renderAvatar(emp) +
                    '<div class="person-meta">' +
                      '<div class="person-name">' + escapeHtml(emp.name) + ' <span style="font-weight:400;color:var(--text-muted);">· ' + typeMeta.short + ', ' + formatDateRange(lv.startDate, lv.endDate) + ' (' + days + ' дн., остаток ' + bal.remaining + ' дн.)</span></div>' +
                      conflictText +
                    '</div>' +
                  '</div>' +
                  '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                    '<button class="btn btn-sm btn-primary" data-leave-decision="approved" data-leave-id="' + lv.id + '" type="button">Одобрить</button>' +
                    '<button class="btn btn-sm btn-secondary" data-leave-decision="rejected" data-leave-id="' + lv.id + '" type="button">Отклонить</button>' +
                  '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</section>';
    }

    const year = ui.leaveMonthYear.year;
    const month = ui.leaveMonthYear.month;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStartIso = year + '-' + String(month + 1).padStart(2, '0') + '-01';
    const monthEndIso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(daysInMonth).padStart(2, '0');

    const monthLeaves = state.leaves.filter(function (lv) {
      return lv.status !== 'rejected' && lv.startDate <= monthEndIso && lv.endDate >= monthStartIso;
    });

    const deptFiltered = state.employees.filter(function (emp) {
      return ui.leaveDeptFilter === 'all' || emp.departmentId === ui.leaveDeptFilter;
    });

    const timelineEmployees = ui.leaveShowAllTimeline
      ? deptFiltered
      : deptFiltered.filter(function (emp) { return monthLeaves.some(function (lv) { return lv.employeeId === emp.id; }); });

    let headerCells = '';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d, 12, 0, 0);
      const iso = window.HR_SEED.toISODate(dateObj);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const isToday = iso === TODAY_ISO;
      headerCells += '<th class="timeline-day-th' + (isWeekend ? ' weekend' : '') + (isToday ? ' today' : '') + '">' + d + '</th>';
    }

    const timelineRows = timelineEmployees.length === 0
      ? '<tr><td colspan="' + (daysInMonth + 1) + '" style="text-align:center;padding:24px;color:var(--text-muted);">Отсутствий в этом месяце нет</td></tr>'
      : timelineEmployees.map(function (emp) {
          const empLeaves = monthLeaves.filter(function (lv) { return lv.employeeId === emp.id; });
          let cells = '';
          for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d, 12, 0, 0);
            const iso = window.HR_SEED.toISODate(dateObj);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const isToday = iso === TODAY_ISO;
            const match = empLeaves.find(function (lv) { return lv.startDate <= iso && lv.endDate >= iso; });
            let inner = '';
            if (match) {
              const typeMeta = LEAVE_TYPE_META[match.type] || LEAVE_TYPE_META.vacation;
              const statusMeta = LEAVE_STATUS_META[match.status] || LEAVE_STATUS_META.approved;
              inner = '<span class="timeline-bar ' + match.type + (match.status === 'pending' ? ' pending' : '') + '" title="' + escapeHtml(emp.name + ': ' + typeMeta.short + ' (' + formatDateRange(match.startDate, match.endDate) + ') — ' + statusMeta.label) + '"></span>';
            }
            cells += '<td class="timeline-cell' + (isWeekend ? ' weekend' : '') + (isToday ? ' today' : '') + '">' + inner + '</td>';
          }
          return '<tr><td><div class="person-cell" data-open-employee="' + emp.id + '" style="cursor:pointer;">' + renderAvatar(emp, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div></div></div></td>' + cells + '</tr>';
        }).join('');

    const filteredRequests = state.leaves
      .filter(function (lv) { return ui.leaveStatusFilter === 'all' || lv.status === ui.leaveStatusFilter; })
      .slice()
      .sort(function (a, b) { return b.startDate.localeCompare(a.startDate); });

    const reqRows = filteredRequests.map(function (lv) {
      const emp = getEmployeeById(lv.employeeId);
      if (!emp) return '';
      const typeMeta = LEAVE_TYPE_META[lv.type] || LEAVE_TYPE_META.vacation;
      const statusMeta = LEAVE_STATUS_META[lv.status] || LEAVE_STATUS_META.pending;
      const days = countCalendarDays(lv.startDate, lv.endDate);
      return (
        '<tr>' +
          '<td><div class="person-cell" data-open-employee="' + emp.id + '" style="cursor:pointer;">' + renderAvatar(emp, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div></div></div></td>' +
          '<td>' + typeMeta.label + '</td>' +
          '<td class="tabular">' + formatDateRange(lv.startDate, lv.endDate) + '</td>' +
          '<td class="tabular">' + days + ' дн.</td>' +
          '<td>' + renderStatus(statusMeta.statusClass, statusMeta.label) + '</td>' +
          '<td style="color:var(--text-secondary);max-width:250px;">' + escapeHtml(lv.comment || '—') + '</td>' +
          '<td style="text-align:right;"><button class="btn btn-sm btn-ghost" data-delete-leave="' + lv.id + '" type="button">Удалить</button></td>' +
        '</tr>'
      );
    }).join('');

    const deptOptions = state.departments.map(function (d) {
      return '<option value="' + d.id + '"' + (ui.leaveDeptFilter === d.id ? ' selected' : '') + '>' + escapeHtml(d.name) + '</option>';
    }).join('');

    return (
      approvalSection +
      '<section class="card" style="margin-bottom:18px;">' +
        '<div class="card-header" style="flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<button class="icon-btn" data-month-shift="-1" type="button" aria-label="Предыдущий месяц"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
            '<h2 class="card-title" style="min-width:130px;text-align:center;">' + MONTHS_NOM_RU[month] + ' ' + year + '</h2>' +
            '<button class="icon-btn" data-month-shift="1" type="button" aria-label="Следующий месяц"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
            '<select id="leaveDeptFilter" class="select" style="height:28px;font-size:12px;"><option value="all">Все отделы</option>' + deptOptions + '</select>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
            '<div class="timeline-legend"><span><span class="legend-dot" style="background:#BFDBFE;"></span>Отпуск</span><span><span class="legend-dot" style="background:#DDD6FE;"></span>Отгул</span><span><span class="legend-dot" style="background:#FECACA;"></span>Больничный</span></div>' +
            '<button class="btn btn-sm btn-secondary" data-toggle-timeline-all type="button">' + (ui.leaveShowAllTimeline ? 'Только с отпусками' : 'Показать всех') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="timeline-wrap"><table class="timeline-table"><thead><tr><th>Сотрудник</th>' + headerCells + '</tr></thead><tbody>' + timelineRows + '</tbody></table></div>' +
      '</section>' +
      '<section class="card">' +
        '<div class="card-header" style="flex-wrap:wrap;">' +
          '<h2 class="card-title">Все заявки</h2>' +
          '<div class="segmented">' +
            '<button class="segmented-btn' + (ui.leaveStatusFilter === 'all' ? ' active' : '') + '" data-leave-filter="all" type="button">Все</button>' +
            '<button class="segmented-btn' + (ui.leaveStatusFilter === 'pending' ? ' active' : '') + '" data-leave-filter="pending" type="button">Ожидают</button>' +
            '<button class="segmented-btn' + (ui.leaveStatusFilter === 'approved' ? ' active' : '') + '" data-leave-filter="approved" type="button">Одобрены</button>' +
            '<button class="segmented-btn' + (ui.leaveStatusFilter === 'rejected' ? ' active' : '') + '" data-leave-filter="rejected" type="button">Отклонены</button>' +
          '</div>' +
        '</div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Сотрудник</th><th>Тип</th><th>Период</th><th>Длительность</th><th>Статус</th><th>Комментарий</th><th></th></tr></thead><tbody>' + (reqRows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">Заявок нет</td></tr>') + '</tbody></table></div>' +
      '</section>'
    );
  }

  // --- VIEW 5: STRUCTURE ---
  function renderStructureHTML() {
    const q = ui.structureSearch.trim().toLowerCase();
    const toggleHtml =
      '<div class="toolbar">' +
        '<input id="structureSearchInput" type="search" class="input" style="width:240px;" placeholder="Найти на оргсхеме..." value="' + escapeHtml(ui.structureSearch) + '" />' +
        '<div class="segmented">' +
          '<button class="segmented-btn' + (ui.structureMode === 'tree' ? ' active' : '') + '" data-structure-mode="tree" type="button">Оргсхема</button>' +
          '<button class="segmented-btn' + (ui.structureMode === 'cards' ? ' active' : '') + '" data-structure-mode="cards" type="button">Отделы</button>' +
        '</div>' +
      '</div>';

    function matchClass(emp) {
      if (!q || !emp) return '';
      return (emp.name + ' ' + emp.role).toLowerCase().indexOf(q) !== -1 ? ' org-highlight' : ' org-dim';
    }

    if (ui.structureMode === 'cards') {
      const cardsHtml = state.departments.map(function (dept) {
        const members = state.employees.filter(function (e) { return e.departmentId === dept.id; });
        const lead = getEmployeeById(dept.leadId);
        return (
          '<section class="card"><div class="card-body">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
              '<div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:14.5px;"><span class="dept-dot" style="background:' + dept.color + ';"></span>' + escapeHtml(dept.name) + '</div>' +
              '<span style="font-size:12px;color:var(--text-muted);">' + members.length + ' чел.</span>' +
            '</div>' +
            '<p style="margin:0 0 12px;color:var(--text-secondary);font-size:12.5px;">' + escapeHtml(dept.description) + '</p>' +
            (lead ? '<div style="margin-bottom:10px;"><button class="org-lead-btn' + matchClass(lead) + '" data-open-employee="' + lead.id + '" type="button">' + renderAvatar(lead, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(lead.name) + '</div><div class="person-sub">' + escapeHtml(lead.role) + '</div></div></button></div>' : '') +
            '<div style="display:flex;flex-direction:column;gap:2px;margin-bottom:12px;">' +
              members.filter(function (m) { return !lead || m.id !== lead.id; }).map(function (m) {
                return '<button class="org-member-btn' + matchClass(m) + '" data-open-employee="' + m.id + '" type="button">' + renderAvatar(m, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(m.name) + '</div><div class="person-sub">' + escapeHtml(m.role) + '</div></div></button>';
              }).join('') +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);">' +
              '<span>Вакансий: ' + (dept.openRoles || 0) + '</span>' +
              '<button class="link-btn" data-filter-dept="' + dept.id + '" type="button">Открыть в базе →</button>' +
            '</div>' +
          '</div></section>'
        );
      }).join('');
      return toggleHtml + '<div class="dept-cards-grid">' + cardsHtml + '</div>';
    }

    const execDept = getDepartmentById('exec');
    const ceo = (execDept && getEmployeeById(execDept.leadId)) || state.employees[0];
    const execOthers = state.employees.filter(function (e) { return e.departmentId === 'exec' && (!ceo || e.id !== ceo.id); });
    const branchDepts = state.departments.filter(function (d) { return d.id !== 'exec'; });

    const branchesHtml = branchDepts.map(function (dept) {
      const members = state.employees.filter(function (e) { return e.departmentId === dept.id; });
      const lead = getEmployeeById(dept.leadId);
      const others = members.filter(function (m) { return !lead || m.id !== lead.id; });
      return (
        '<div class="org-branch-col">' +
          '<div class="org-dept-box">' +
            '<div class="org-dept-head">' +
              '<div class="org-dept-title-row">' +
                '<div class="org-dept-name"><span class="dept-dot" style="background:' + dept.color + ';"></span>' + escapeHtml(dept.name) + '</div>' +
                '<span class="tabular" style="font-size:12px;color:var(--text-muted);">' + members.length + (dept.openRoles ? ' · +' + dept.openRoles + ' вак.' : '') + '</span>' +
              '</div>' +
              (lead ? '<button class="org-lead-btn' + matchClass(lead) + '" data-open-employee="' + lead.id + '" type="button">' + renderAvatar(lead, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(lead.name) + '</div><div class="person-sub">' + escapeHtml(lead.role) + '</div></div></button>' : '') +
            '</div>' +
            '<div class="org-members-list">' +
              (others.length
                ? others.map(function (m) {
                    const st = getEmployeeStatusMeta(m);
                    return '<button class="org-member-btn' + matchClass(m) + '" data-open-employee="' + m.id + '" type="button">' + renderAvatar(m, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(m.name) + '</div><div class="person-sub">' + escapeHtml(m.role) + (st.key === 'probation' ? ' · исп.' : '') + '</div></div></button>';
                  }).join('')
                : '<div style="padding:10px;font-size:12px;color:var(--text-muted);text-align:center;">Нет участников</div>') +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    return (
      toggleHtml +
      '<div class="org-tree-scroll"><div class="org-tree">' +
        (ceo
          ? '<div class="org-ceo-node' + matchClass(ceo) + '" data-open-employee="' + ceo.id + '">' +
              renderAvatar(ceo) +
              '<div><div style="font-weight:600;font-size:14px;">' + escapeHtml(ceo.name) + '</div><div style="font-size:12px;color:var(--text-muted);">' + escapeHtml(ceo.role) + '</div></div>' +
            '</div>' +
            (execOthers.length
              ? '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px;">' +
                  execOthers.map(function (m) { return '<button class="btn btn-sm btn-secondary' + matchClass(m) + '" data-open-employee="' + m.id + '" type="button">' + escapeHtml(m.name) + '</button>'; }).join('') +
                '</div>'
              : '')
          : '') +
        '<div class="org-stem-down"></div>' +
        '<div class="org-branches" style="grid-template-columns:repeat(' + branchDepts.length + ', minmax(215px, 1fr));">' + branchesHtml + '</div>' +
      '</div></div>'
    );
  }

  // --- DRAWER ---
  function openEmployeeDrawer(empId) {
    const emp = getEmployeeById(empId);
    if (!emp) return;
    ui.drawerEmployeeId = emp.id;
    ui.drawerTab = 'profile';
    ui.drawerEditing = false;
    renderDrawerContent(emp);
    document.getElementById('drawerBackdrop').classList.add('open');
    document.getElementById('employeeDrawer').classList.add('open');
    document.getElementById('employeeDrawer').setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    ui.drawerEmployeeId = null;
    ui.drawerEditing = false;
    document.getElementById('drawerBackdrop').classList.remove('open');
    document.getElementById('employeeDrawer').classList.remove('open');
    document.getElementById('employeeDrawer').setAttribute('aria-hidden', 'true');
  }

  function renderDrawerContent(emp) {
    const dept = getDepartmentById(emp.departmentId);
    const manager = emp.managerId ? getEmployeeById(emp.managerId) : null;
    const reports = state.employees.filter(function (e) { return e.managerId === emp.id; });
    const status = getEmployeeStatusMeta(emp);
    const bal = getVacationBalance(emp);
    const onb = getOnboardingForEmployee(emp.id);
    const empLeaves = state.leaves.filter(function (l) { return l.employeeId === emp.id; }).sort(function (a, b) { return b.startDate.localeCompare(a.startDate); });

    document.getElementById('drawerTitle').textContent = emp.name;
    document.getElementById('drawerEditToggleBtn').textContent = ui.drawerEditing ? 'Отмена' : 'Изменить';

    let bodyHtml = '';
    if (ui.drawerEditing) {
      bodyHtml =
        '<form id="drawerEditForm" class="form-grid" data-emp-id="' + emp.id + '">' +
          '<label class="form-field full"><span>Должность</span><input type="text" name="role" value="' + escapeHtml(emp.role) + '" required /></label>' +
          '<label class="form-field"><span>Отдел</span><select name="departmentId">' +
            state.departments.map(function (d) { return '<option value="' + d.id + '"' + (emp.departmentId === d.id ? ' selected' : '') + '>' + escapeHtml(d.name) + '</option>'; }).join('') +
          '</select></label>' +
          '<label class="form-field"><span>Формат</span><select name="format">' +
            ['Гибрид', 'Удалённо', 'Офис'].map(function (f) { return '<option value="' + f + '"' + (emp.format === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') +
          '</select></label>' +
          '<label class="form-field"><span>Город</span><input type="text" name="city" value="' + escapeHtml(emp.city) + '" /></label>' +
          '<label class="form-field"><span>Telegram</span><input type="text" name="telegram" value="' + escapeHtml(emp.telegram || '') + '" /></label>' +
          '<label class="form-field full"><span>Телефон</span><input type="text" name="phone" value="' + escapeHtml(emp.phone || '') + '" /></label>' +
          '<div class="form-field full" style="flex-direction:row;justify-content:flex-end;margin-top:4px;"><button class="btn btn-primary" type="submit">Сохранить</button></div>' +
        '</form>';
    } else if (ui.drawerTab === 'profile') {
      bodyHtml =
        '<div class="drawer-section">' +
          '<h3 class="drawer-section-title">Контакты и работа</h3>' +
          '<div class="info-grid">' +
            '<div><div class="info-item-label">Email</div><div class="info-item-value">' + escapeHtml(emp.email) + '</div></div>' +
            '<div><div class="info-item-label">Telegram</div><div class="info-item-value">' + escapeHtml(emp.telegram || '—') + '</div></div>' +
            '<div><div class="info-item-label">Локация</div><div class="info-item-value">' + escapeHtml(emp.format) + ' · ' + escapeHtml(emp.city) + ' (' + escapeHtml(emp.timezone || 'МСК') + ')</div></div>' +
            '<div><div class="info-item-label">Телефон</div><div class="info-item-value">' + escapeHtml(emp.phone || '—') + '</div></div>' +
            '<div><div class="info-item-label">В команде с</div><div class="info-item-value">' + formatDateFull(emp.startDate) + ' (' + formatTenure(emp.startDate) + ')</div></div>' +
            '<div><div class="info-item-label">Руководитель</div><div class="info-item-value">' + (manager ? '<button class="link-btn" type="button" data-open-employee="' + manager.id + '">' + escapeHtml(manager.name) + '</button>' : '—') + '</div></div>' +
          '</div>' +
        '</div>' +
        (reports.length
          ? '<div class="drawer-section"><h3 class="drawer-section-title">В подчинении (' + reports.length + ')</h3><div style="display:flex;flex-wrap:wrap;gap:6px;">' +
              reports.map(function (r) { return '<button class="btn btn-sm btn-secondary" data-open-employee="' + r.id + '" type="button">' + escapeHtml(r.name) + '</button>'; }).join('') +
            '</div></div>'
          : '');
    } else if (ui.drawerTab === 'leaves') {
      bodyHtml =
        '<div class="drawer-section">' +
          '<div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--surface-subtle);border:1px solid var(--border);border-radius:8px;">' +
            '<div><div class="info-item-label">Доступно</div><div style="font-size:18px;font-weight:600;" class="tabular">' + bal.remaining + ' дн.</div></div>' +
            '<div><div class="info-item-label">Использовано</div><div style="font-size:18px;font-weight:600;color:var(--text-secondary);" class="tabular">' + bal.used + ' дн.</div></div>' +
            '<div><div class="info-item-label">Лимит</div><div style="font-size:18px;font-weight:600;color:var(--text-secondary);" class="tabular">' + bal.total + ' дн.</div></div>' +
          '</div>' +
          '<button class="btn btn-primary" data-request-leave-for="' + emp.id + '" type="button">+ Оформить заявку</button>' +
        '</div>' +
        '<div class="drawer-section">' +
          '<h3 class="drawer-section-title">История</h3>' +
          (empLeaves.length
            ? empLeaves.map(function (lv) {
                const t = LEAVE_TYPE_META[lv.type] || LEAVE_TYPE_META.vacation;
                const s = LEAVE_STATUS_META[lv.status] || LEAVE_STATUS_META.pending;
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12.5px;"><div><strong>' + t.short + '</strong> · <span class="tabular">' + formatDateRange(lv.startDate, lv.endDate) + '</span></div>' + renderStatus(s.statusClass, s.label) + '</div>';
              }).join('')
            : '<div style="font-size:12.5px;color:var(--text-muted);">Заявок нет</div>') +
        '</div>';
    } else {
      bodyHtml = onb
        ? (function () {
            const prog = getOnboardingProgress(onb);
            return '<div class="drawer-section"><div style="display:flex;justify-content:space-between;font-size:13px;"><span>Прогресс адаптации</span><strong class="tabular">' + prog.done + ' / ' + prog.total + ' (' + prog.percent + '%)</strong></div><div class="progress-track"><div class="progress-fill' + (prog.percent === 100 ? ' done' : '') + '" style="width:' + prog.percent + '%"></div></div><div><button class="link-btn" data-jump-onboarding="' + onb.id + '" type="button">Открыть чек-лист →</button></div></div>';
          })()
        : '<div style="font-size:13px;color:var(--text-muted);">Активного плана онбординга нет</div>';
    }

    document.getElementById('drawerContent').innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;">' +
        renderAvatar(emp, 'avatar-lg') +
        '<div style="min-width:0;flex:1;">' +
          '<h2 style="margin:0;font-size:17px;font-weight:600;">' + escapeHtml(emp.name) + '</h2>' +
          '<div style="color:var(--text-secondary);font-size:13px;">' + escapeHtml(emp.role) + (dept ? ' · ' + escapeHtml(dept.name) : '') + '</div>' +
          '<div style="margin-top:6px;">' + renderStatus(status.statusClass, status.label) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm btn-secondary" data-request-leave-for="' + emp.id + '" type="button">Оформить отпуск</button>' +
        '<button class="btn btn-sm btn-secondary" data-toggle-probation="' + emp.id + '" type="button">' + (emp.status === 'probation' ? 'Перевести в штат' : 'Испытательный') + '</button>' +
      '</div>' +
      (ui.drawerEditing ? '' :
        '<div class="drawer-tabs">' +
          '<button class="drawer-tab' + (ui.drawerTab === 'profile' ? ' active' : '') + '" data-drawer-tab="profile" type="button">Профиль</button>' +
          '<button class="drawer-tab' + (ui.drawerTab === 'leaves' ? ' active' : '') + '" data-drawer-tab="leaves" type="button">Отпуска (' + bal.remaining + ' дн.)</button>' +
          '<button class="drawer-tab' + (ui.drawerTab === 'onb' ? ' active' : '') + '" data-drawer-tab="onb" type="button">Онбординг</button>' +
        '</div>') +
      bodyHtml;
  }

  // --- MODALS & COMMAND PALETTE ---
  function openModal(modalId, prefill) {
    const backdrop = document.getElementById('modalBackdrop');
    document.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; });
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modalId === 'addEmployeeModal') populateAddEmployeeForm();
    else if (modalId === 'addLeaveModal') populateAddLeaveForm(prefill && prefill.employeeId);
    else if (modalId === 'addOnboardingModal') populateAddOnboardingForm();
    else if (modalId === 'commandModal') {
      const inp = document.getElementById('commandInput');
      inp.value = '';
      renderCommandResults('');
      setTimeout(function () { inp.focus(); }, 20);
    }

    modal.hidden = false;
    backdrop.classList.add('open');
    ui.activeModal = modalId;
  }

  function closeAllModals() {
    document.getElementById('modalBackdrop').classList.remove('open');
    document.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; });
    ui.activeModal = null;
  }

  function renderCommandResults(query) {
    const q = String(query || '').trim().toLowerCase();
    const actions = [
      { label: 'Добавить сотрудника', hint: 'Штат', cmd: 'open-add-employee' },
      { label: 'Оформить отпуск / отгул', hint: 'Отпуска', cmd: 'open-add-leave' },
      { label: 'Открыть оргсхему', hint: 'Структура', nav: 'structure' },
      { label: 'Перейти к онбордингу', hint: 'Онбординг', nav: 'onboarding' }
    ].filter(function (a) { return !q || a.label.toLowerCase().indexOf(q) !== -1; });

    const emps = state.employees.filter(function (e) {
      if (!q) return true;
      return [e.name, e.role, e.city].join(' ').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 6);

    let html = '';
    if (emps.length) {
      html += '<div class="command-group-title">Сотрудники</div>';
      html += emps.map(function (emp) {
        const dept = getDepartmentById(emp.departmentId);
        return '<button class="command-item" data-cmd-emp="' + emp.id + '" type="button"><div class="person-cell">' + renderAvatar(emp, 'avatar-sm') + '<div class="person-meta"><div class="person-name">' + escapeHtml(emp.name) + '</div><div class="person-sub">' + escapeHtml(emp.role) + (dept ? ' · ' + escapeHtml(dept.name) : '') + '</div></div></div><span style="font-size:12px;color:var(--text-muted);">Открыть →</span></button>';
      }).join('');
    }
    if (actions.length) {
      html += '<div class="command-group-title">Действия</div>';
      html += actions.map(function (a) {
        const attr = a.cmd ? 'data-cmd-action="' + a.cmd + '"' : 'data-cmd-nav="' + a.nav + '"';
        return '<button class="command-item" ' + attr + ' type="button"><span>' + escapeHtml(a.label) + '</span><span style="font-size:11.5px;color:var(--text-muted);">' + escapeHtml(a.hint) + '</span></button>';
      }).join('');
    }
    document.getElementById('commandResults').innerHTML = html || '<div class="empty-state" style="padding:20px;">Ничего не найдено</div>';
  }

  function populateAddEmployeeForm() {
    const form = document.getElementById('addEmployeeForm');
    form.reset();
    form.elements.startDate.value = TODAY_ISO;
    form.elements.city.value = 'Москва';
    document.getElementById('empDeptSelect').innerHTML = state.departments.map(function (d) {
      return '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>';
    }).join('');
    document.getElementById('empDeptSelect').value = 'eng';
    document.getElementById('empManagerSelect').innerHTML = '<option value="">Без руководителя</option>' +
      state.employees.map(function (e) { return '<option value="' + e.id + '">' + escapeHtml(e.name) + ' — ' + escapeHtml(e.role) + '</option>'; }).join('');
    document.getElementById('empManagerSelect').value = 'emp-2';
  }

  function populateAddLeaveForm(preselectEmpId) {
    const form = document.getElementById('addLeaveForm');
    form.reset();
    document.getElementById('leaveEmployeeSelect').innerHTML = state.employees.map(function (e) {
      return '<option value="' + e.id + '">' + escapeHtml(e.name) + ' (' + escapeHtml(e.role) + ')</option>';
    }).join('');
    if (preselectEmpId) document.getElementById('leaveEmployeeSelect').value = preselectEmpId;
    document.getElementById('leaveStartInput').value = window.HR_SEED.offsetISO(3);
    document.getElementById('leaveEndInput').value = window.HR_SEED.offsetISO(7);
    updateLeaveDaysPreview();
  }

  function updateLeaveDaysPreview() {
    const start = document.getElementById('leaveStartInput').value;
    const end = document.getElementById('leaveEndInput').value;
    const empId = document.getElementById('leaveEmployeeSelect').value;
    const preview = document.getElementById('leaveDaysPreview');
    const days = countCalendarDays(start, end);
    if (!start || !end) {
      preview.className = 'leave-preview full';
      preview.textContent = 'Выберите даты';
      return;
    }
    if (days <= 0) {
      preview.className = 'leave-preview full error';
      preview.textContent = 'Дата окончания должна быть не раньше даты начала';
      return;
    }
    const emp = getEmployeeById(empId);
    const bal = emp ? getVacationBalance(emp) : { remaining: 28 };
    const overlaps = findDepartmentOverlaps(empId, start, end);
    const overlapLine = overlaps.length > 0
      ? '<span style="color:var(--warn);">Пересечение в отделе: ' + overlaps.map(function (o) { const oe = getEmployeeById(o.employeeId); return oe ? escapeHtml(oe.name) : ''; }).join(', ') + '</span>'
      : '<span style="color:var(--text-muted);">Пересечений в отделе нет</span>';
    preview.className = 'leave-preview full';
    preview.innerHTML = '<span>Длительность: <strong>' + days + ' ' + pluralize(days, ['день', 'дня', 'дней']) + '</strong> · Доступно: ' + bal.remaining + ' дн.</span>' + overlapLine;
  }

  function populateAddOnboardingForm() {
    const form = document.getElementById('addOnboardingForm');
    form.reset();
    const candidates = state.employees.filter(function (e) { return !getOnboardingForEmployee(e.id); });
    const list = candidates.length ? candidates : state.employees;
    document.getElementById('onbEmployeeSelect').innerHTML = list.map(function (e) {
      return '<option value="' + e.id + '">' + escapeHtml(e.name) + ' — ' + escapeHtml(e.role) + '</option>';
    }).join('');
    document.getElementById('onbBuddySelect').innerHTML = state.employees.map(function (e) {
      return '<option value="' + e.id + '">' + escapeHtml(e.name) + '</option>';
    }).join('');
    document.getElementById('onbBuddySelect').value = 'emp-12';
  }

  // --- ACTIONS ---
  function handleAddEmployee(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = String(fd.get('name') || '').trim();
    const role = String(fd.get('role') || '').trim();
    const deptId = String(fd.get('departmentId') || 'eng');
    const managerId = String(fd.get('managerId') || '') || null;
    const format = String(fd.get('format') || 'Гибрид');
    const city = String(fd.get('city') || 'Москва').trim() || 'Москва';
    const startDate = String(fd.get('startDate') || TODAY_ISO);
    const email = String(fd.get('email') || '').trim();
    const telegram = String(fd.get('telegram') || '').trim();
    const startOnboarding = fd.get('startOnboarding') === 'on';
    if (!name || !role || !email) return;

    const palette = AVATAR_PALETTES[state.employees.length % AVATAR_PALETTES.length];
    const newId = 'emp-' + Date.now();
    state.employees.push({
      id: newId, name: name, role: role, departmentId: deptId, managerId: managerId,
      status: startOnboarding ? 'probation' : 'active',
      format: format, city: city, timezone: 'МСК', email: email, telegram: telegram,
      phone: '', startDate: startDate, birthday: '', vacationTotal: 28, vacationUsed: 0,
      avatarBg: palette.bg, avatarColor: palette.color
    });

    if (startOnboarding) {
      const dept = getDepartmentById(deptId);
      const buddyId = (dept && dept.leadId && dept.leadId !== newId) ? dept.leadId : 'emp-12';
      const tpl = deptId === 'eng' ? 'tech' : 'standard';
      const tasks = window.HR_SEED.ONBOARDING_TEMPLATES[tpl].map(function (item, idx) {
        return { id: 't-' + Date.now() + '-' + idx, stage: item.stage, title: item.title, owner: item.owner, done: false };
      });
      const newTrack = { id: 'onb-' + Date.now(), employeeId: newId, buddyId: buddyId, startedAt: startDate, tasks: tasks };
      state.onboarding.unshift(newTrack);
      ui.selectedOnbId = newTrack.id;
    }

    saveState();
    closeAllModals();
    renderAll();
    showToast('Сотрудник добавлен');
  }

  function handleAddLeave(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const employeeId = String(fd.get('employeeId') || '');
    const type = String(fd.get('type') || 'vacation');
    const status = String(fd.get('status') || 'pending');
    const startDate = String(fd.get('startDate') || '');
    const endDate = String(fd.get('endDate') || '');
    const comment = String(fd.get('comment') || '').trim();
    if (!employeeId || countCalendarDays(startDate, endDate) <= 0) {
      updateLeaveDaysPreview();
      return;
    }

    state.leaves.unshift({ id: 'lv-' + Date.now(), employeeId: employeeId, type: type, startDate: startDate, endDate: endDate, status: status, comment: comment });
    if (status === 'approved' && type === 'vacation') {
      const emp = getEmployeeById(employeeId);
      if (emp) emp.vacationUsed = (emp.vacationUsed || 0) + countCalendarDays(startDate, endDate);
    }
    const startObj = parseISODate(startDate);
    if (startObj) ui.leaveMonthYear = { year: startObj.getFullYear(), month: startObj.getMonth() };

    saveState();
    closeAllModals();
    renderAll();
    showToast('Заявка создана');
  }

  function handleAddOnboarding(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const employeeId = String(fd.get('employeeId') || '');
    const buddyId = String(fd.get('buddyId') || '');
    const tpl = String(fd.get('template') || 'standard');
    const emp = getEmployeeById(employeeId);
    if (!emp) return;

    const existing = getOnboardingForEmployee(employeeId);
    if (existing) {
      ui.selectedOnbId = existing.id;
      ui.onbFilter = getOnboardingProgress(existing).percent === 100 ? 'completed' : 'active';
      closeAllModals();
      switchView('onboarding');
      showToast('У сотрудника уже есть план адаптации');
      return;
    }

    const tasks = window.HR_SEED.ONBOARDING_TEMPLATES[tpl].map(function (item, idx) {
      return { id: 't-' + Date.now() + '-' + idx, stage: item.stage, title: item.title, owner: item.owner, done: false };
    });
    const newTrack = { id: 'onb-' + Date.now(), employeeId: employeeId, buddyId: buddyId, startedAt: emp.startDate || TODAY_ISO, tasks: tasks };
    state.onboarding.unshift(newTrack);
    ui.onbFilter = 'active';
    ui.selectedOnbId = newTrack.id;
    saveState();
    closeAllModals();
    switchView('onboarding');
    showToast('План онбординга создан');
  }

  function handleLeaveDecision(leaveId, decision) {
    const lv = state.leaves.find(function (l) { return l.id === leaveId; });
    if (!lv) return;
    const prev = lv.status;
    lv.status = decision;
    if (prev !== 'approved' && decision === 'approved' && lv.type === 'vacation') {
      const emp = getEmployeeById(lv.employeeId);
      if (emp) emp.vacationUsed = (emp.vacationUsed || 0) + countCalendarDays(lv.startDate, lv.endDate);
    }
    saveState();
    renderAll();
    showToast(decision === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена');
  }

  function openMobileSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  }

  function bindEvents() {
    document.querySelectorAll('.nav-item[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () { switchView(btn.dataset.view); });
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', openMobileSidebar);
    document.getElementById('closeSidebarBtn').addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);
    document.getElementById('resetDemoBtn').addEventListener('click', resetDemoData);

    document.getElementById('commandTriggerBtn').addEventListener('click', function () { openModal('commandModal'); });
    document.getElementById('commandInput').addEventListener('input', function (e) { renderCommandResults(e.target.value); });

    document.getElementById('primaryCtaBtn').addEventListener('click', function () {
      const act = this.dataset.action;
      if (act === 'open-add-leave') openModal('addLeaveModal');
      else if (act === 'open-add-onboarding') openModal('addOnboardingModal');
      else openModal('addEmployeeModal');
    });

    document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
    document.getElementById('drawerEditToggleBtn').addEventListener('click', function () {
      ui.drawerEditing = !ui.drawerEditing;
      const emp = getEmployeeById(ui.drawerEmployeeId);
      if (emp) renderDrawerContent(emp);
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) { btn.addEventListener('click', closeAllModals); });
    document.getElementById('modalBackdrop').addEventListener('click', function (e) { if (e.target === this) closeAllModals(); });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openModal('commandModal');
      } else if (e.key === 'Escape') {
        if (ui.activeModal) closeAllModals();
        else if (ui.drawerEmployeeId) closeDrawer();
      }
    });

    document.getElementById('addEmployeeForm').addEventListener('submit', handleAddEmployee);
    document.getElementById('addLeaveForm').addEventListener('submit', handleAddLeave);
    document.getElementById('addOnboardingForm').addEventListener('submit', handleAddOnboarding);
    document.getElementById('leaveStartInput').addEventListener('change', updateLeaveDaysPreview);
    document.getElementById('leaveEndInput').addEventListener('change', updateLeaveDaysPreview);
    document.getElementById('leaveEmployeeSelect').addEventListener('change', updateLeaveDaysPreview);

    document.getElementById('drawerContent').addEventListener('submit', function (e) {
      if (e.target.id === 'drawerEditForm') {
        e.preventDefault();
        const emp = getEmployeeById(e.target.dataset.empId);
        if (!emp) return;
        const fd = new FormData(e.target);
        emp.role = String(fd.get('role') || emp.role).trim();
        emp.departmentId = String(fd.get('departmentId') || emp.departmentId);
        emp.format = String(fd.get('format') || emp.format);
        emp.city = String(fd.get('city') || emp.city).trim();
        emp.telegram = String(fd.get('telegram') || '').trim();
        emp.phone = String(fd.get('phone') || '').trim();
        ui.drawerEditing = false;
        saveState();
        renderAll();
        showToast('Профиль обновлён');
      }
    });

    document.addEventListener('click', function (e) {
      const target = e.target;

      const cmdEmp = target.closest('[data-cmd-emp]');
      if (cmdEmp) { closeAllModals(); openEmployeeDrawer(cmdEmp.dataset.cmdEmp); return; }

      const cmdAction = target.closest('[data-cmd-action]');
      if (cmdAction) {
        const act = cmdAction.dataset.cmdAction;
        if (act === 'open-add-employee') openModal('addEmployeeModal');
        else if (act === 'open-add-leave') openModal('addLeaveModal');
        return;
      }

      const cmdNav = target.closest('[data-cmd-nav]');
      if (cmdNav) { closeAllModals(); switchView(cmdNav.dataset.cmdNav); return; }

      const decisionBtn = target.closest('[data-leave-decision]');
      if (decisionBtn) { e.stopPropagation(); handleLeaveDecision(decisionBtn.dataset.leaveId, decisionBtn.dataset.leaveDecision); return; }

      const deleteLeaveBtn = target.closest('[data-delete-leave]');
      if (deleteLeaveBtn) {
        const lvId = deleteLeaveBtn.dataset.deleteLeave;
        const removed = state.leaves.find(function (l) { return l.id === lvId; });
        if (removed && removed.status === 'approved' && removed.type === 'vacation') {
          const emp = getEmployeeById(removed.employeeId);
          if (emp) emp.vacationUsed = Math.max(0, (emp.vacationUsed || 0) - countCalendarDays(removed.startDate, removed.endDate));
        }
        state.leaves = state.leaves.filter(function (l) { return l.id !== lvId; });
        saveState();
        renderAll();
        showToast('Заявка удалена');
        return;
      }

      const openEmp = target.closest('[data-open-employee]');
      if (openEmp && openEmp.dataset.openEmployee) { openEmployeeDrawer(openEmp.dataset.openEmployee); return; }

      const navBtn = target.closest('[data-nav]');
      if (navBtn) { e.preventDefault(); switchView(navBtn.dataset.nav); return; }

      const filterDeptBtn = target.closest('[data-filter-dept]');
      if (filterDeptBtn) { ui.empDept = filterDeptBtn.dataset.filterDept; ui.empStatus = 'all'; switchView('employees'); return; }

      const jumpOnb = target.closest('[data-jump-onboarding]');
      if (jumpOnb) {
        const track = state.onboarding.find(function (t) { return t.id === jumpOnb.dataset.jumpOnboarding; });
        if (track) {
          ui.onbFilter = getOnboardingProgress(track).percent === 100 ? 'completed' : 'active';
          ui.selectedOnbId = track.id;
        }
        closeDrawer();
        switchView('onboarding');
        return;
      }

      const drawerTab = target.closest('[data-drawer-tab]');
      if (drawerTab) {
        ui.drawerTab = drawerTab.dataset.drawerTab;
        const emp = getEmployeeById(ui.drawerEmployeeId);
        if (emp) renderDrawerContent(emp);
        return;
      }

      const layoutBtn = target.closest('[data-emp-layout]');
      if (layoutBtn) { ui.empLayout = layoutBtn.dataset.empLayout; renderAll(); return; }

      const selectOnb = target.closest('[data-select-onb]');
      if (selectOnb) { ui.selectedOnbId = selectOnb.dataset.selectOnb; renderAll(); return; }

      const onbFilterBtn = target.closest('[data-onb-filter]');
      if (onbFilterBtn) { ui.onbFilter = onbFilterBtn.dataset.onbFilter; ui.selectedOnbId = null; renderAll(); return; }

      const onbOwnerBtn = target.closest('[data-onb-owner]');
      if (onbOwnerBtn) { ui.onbOwnerFilter = onbOwnerBtn.dataset.onbOwner; renderAll(); return; }

      const monthShift = target.closest('[data-month-shift]');
      if (monthShift) {
        const d = new Date(ui.leaveMonthYear.year, ui.leaveMonthYear.month + Number(monthShift.dataset.monthShift), 1);
        ui.leaveMonthYear = { year: d.getFullYear(), month: d.getMonth() };
        renderAll();
        return;
      }

      const toggleTimelineAll = target.closest('[data-toggle-timeline-all]');
      if (toggleTimelineAll) { ui.leaveShowAllTimeline = !ui.leaveShowAllTimeline; renderAll(); return; }

      const leaveFilterBtn = target.closest('[data-leave-filter]');
      if (leaveFilterBtn) { ui.leaveStatusFilter = leaveFilterBtn.dataset.leaveFilter; renderAll(); return; }

      const structModeBtn = target.closest('[data-structure-mode]');
      if (structModeBtn) { ui.structureMode = structModeBtn.dataset.structureMode; renderAll(); return; }

      const reqLeaveFor = target.closest('[data-request-leave-for]');
      if (reqLeaveFor) { openModal('addLeaveModal', { employeeId: reqLeaveFor.dataset.requestLeaveFor }); return; }

      const toggleProb = target.closest('[data-toggle-probation]');
      if (toggleProb) {
        const emp = getEmployeeById(toggleProb.dataset.toggleProbation);
        if (emp) {
          emp.status = emp.status === 'probation' ? 'active' : 'probation';
          saveState();
          renderAll();
          showToast(emp.status === 'active' ? 'Переведён в штат' : 'Установлен испытательный срок');
        }
      }
    });

    const mainView = document.getElementById('mainView');
    mainView.addEventListener('input', function (e) {
      if (e.target.id === 'empSearchInput') {
        ui.empSearch = e.target.value;
        renderEmployeesResults();
      } else if (e.target.id === 'structureSearchInput') {
        ui.structureSearch = e.target.value;
        const pos = e.target.selectionStart;
        renderAll();
        const inp = document.getElementById('structureSearchInput');
        if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
      }
    });

    mainView.addEventListener('change', function (e) {
      if (e.target.id === 'empDeptFilter') { ui.empDept = e.target.value; renderEmployeesResults(); }
      else if (e.target.id === 'empStatusFilter') { ui.empStatus = e.target.value; renderEmployeesResults(); }
      else if (e.target.id === 'leaveDeptFilter') { ui.leaveDeptFilter = e.target.value; renderAll(); }
      else if (e.target.matches('[data-toggle-task]')) {
        const track = state.onboarding.find(function (t) { return t.id === e.target.dataset.onbId; });
        if (track) {
          const task = track.tasks.find(function (t) { return t.id === e.target.dataset.toggleTask; });
          if (task) { task.done = e.target.checked; saveState(); renderAll(); }
        }
      }
    });

    mainView.addEventListener('submit', function (e) {
      if (e.target.id === 'inlineAddTaskForm') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const title = String(fd.get('title') || '').trim();
        if (!title) return;
        const track = state.onboarding.find(function (t) { return t.id === e.target.dataset.onbId; });
        if (track) {
          track.tasks.push({ id: 't-' + Date.now(), stage: String(fd.get('stage') || 'Первая неделя'), title: title, owner: String(fd.get('owner') || 'HR'), done: false });
          saveState();
          renderAll();
          showToast('Задача добавлена');
        }
      }
    });
  }

  function syncViewFromHash() {
    const hashView = window.location.hash.replace(/^#/, '');
    if (VIEW_META[hashView]) ui.view = hashView;
  }

  window.addEventListener('hashchange', function () {
    const hashView = window.location.hash.replace(/^#/, '');
    if (VIEW_META[hashView] && hashView !== ui.view) switchView(hashView, true);
  });

  syncViewFromHash();
  bindEvents();
  renderAll();
})();
