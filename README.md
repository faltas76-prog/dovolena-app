(() => {
  "use strict";

  const STORAGE_KEY = "evidence_dovolene_v1";

  const MONTHS = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];

  const DAYS = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

  const STATUS = {
    vacation: { label: "Dovolená", short: "D", cls: "status-vacation", icon: "✓" },
    sick: { label: "Nemoc", short: "N", cls: "status-sick", icon: "N" },
    business: { label: "Služební cesta", short: "SC", cls: "status-business", icon: "SC" },
    working: { label: "Práce", short: "P", cls: "status-working", icon: "•" }
  };

  let state = loadState();
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let summaryYear = currentYear;

  function defaultState() {
    const names = [
      "Jan Novák", "Petr Svoboda", "Tomáš Dvořák", "Martin Černý",
      "Pavel Procházka", "Lukáš Kučera", "Michal Veselý", "David Horák",
      "Jakub Němec", "Ondřej Pokorný"
    ];
    return {
      version: 1,
      employees: names.map((name, i) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}-${i}`,
        name,
        allowance: 25
      })),
      entries: {}
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.employees)) return defaultState();
      return parsed;
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function keyFor(employeeId, year, month, day) {
    return `${employeeId}_${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function getStatus(employeeId, year, month, day) {
    return state.entries[keyFor(employeeId, year, month, day)] || "";
  }

  function setStatus(employeeId, year, month, day, status) {
    const key = keyFor(employeeId, year, month, day);
    if (status) state.entries[key] = status;
    else delete state.entries[key];
    saveState();
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function dateFromParts(year, month, day) {
    return new Date(year, month, day);
  }

  function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
  }

  function isToday(year, month, day) {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  }

  function formatDate(year, month, day) {
    return `${day}. ${month + 1}. ${year}`;
  }

  function render() {
    renderHeader();
    renderCalendar();
    renderStats();
    renderSummary();
  }

  function renderHeader() {
    document.getElementById("monthName").textContent = MONTHS[currentMonth];
    document.getElementById("yearName").textContent = currentYear;
    document.getElementById("summaryYear").textContent = summaryYear;
    document.getElementById("employeeCount").textContent = state.employees.length;
    document.getElementById("activeMonthLabel").textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  }

  function renderCalendar() {
    const table = document.getElementById("calendarTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const totalDays = daysInMonth(currentYear, currentMonth);

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headerRow = document.createElement("tr");
    const nameTh = document.createElement("th");
    nameTh.className = "name-col";
    nameTh.textContent = "Zaměstnanec";
    headerRow.appendChild(nameTh);

    for (let day = 1; day <= totalDays; day++) {
      const date = dateFromParts(currentYear, currentMonth, day);
      const th = document.createElement("th");
      if (isWeekend(date)) th.classList.add("weekend-head");
      if (isToday(currentYear, currentMonth, day)) th.style.boxShadow = "inset 0 -3px 0 #1f6f43";
      th.innerHTML = `<span class="day-number">${day}</span><span class="day-name">${DAYS[date.getDay()]}</span>`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    state.employees.forEach(employee => {
      const tr = document.createElement("tr");
      tr.className = "employee-row";

      const th = document.createElement("th");
      const wrapper = document.createElement("div");
      wrapper.className = "employee-name";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = employee.name;
      wrapper.appendChild(nameSpan);

      const actions = document.createElement("span");
      actions.className = "employee-actions";

      const edit = document.createElement("button");
      edit.className = "mini-btn";
      edit.title = "Upravit zaměstnance";
      edit.textContent = "✎";
      edit.addEventListener("click", e => {
        e.stopPropagation();
        openEmployeeModal(employee);
      });

      const del = document.createElement("button");
      del.className = "mini-btn delete";
      del.title = "Smazat zaměstnance";
      del.textContent = "×";
      del.addEventListener("click", e => {
        e.stopPropagation();
        deleteEmployee(employee.id);
      });

      actions.append(edit, del);
      wrapper.appendChild(actions);

      const meta = document.createElement("div");
      meta.className = "employee-meta";
      meta.textContent = `Nárok ${employee.allowance} dní`;
      th.append(wrapper, meta);
      tr.appendChild(th);

      for (let day = 1; day <= totalDays; day++) {
        const date = dateFromParts(currentYear, currentMonth, day);
        const td = document.createElement("td");
        td.className = "day-cell";
        if (isWeekend(date)) td.classList.add("weekend");
        if (isToday(currentYear, currentMonth, day)) td.classList.add("today");

        const status = getStatus(employee.id, currentYear, currentMonth, day);
        if (status && STATUS[status]) {
          const div = document.createElement("div");
          div.className = `status ${STATUS[status].cls}`;
          div.textContent = STATUS[status].icon;
          div.title = STATUS[status].label;
          td.appendChild(div);
        }

        td.addEventListener("click", () => openDayModal(employee, currentYear, currentMonth, day));
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
  }

  function renderStats() {
    let monthVacation = 0;
    let todayVacation = 0;

    state.employees.forEach(employee => {
      const total = daysInMonth(currentYear, currentMonth);
      for (let day = 1; day <= total; day++) {
        if (getStatus(employee.id, currentYear, currentMonth, day) === "vacation") {
          monthVacation++;
          if (isToday(currentYear, currentMonth, day)) todayVacation++;
        }
      }
    });

    document.getElementById("monthVacationCount").textContent =
      `${monthVacation} ${monthVacation === 1 ? "den" : monthVacation >= 2 && monthVacation <= 4 ? "dny" : "dní"}`;
    document.getElementById("todayVacationCount").textContent = todayVacation;
  }

  function countVacation(employeeId, year) {
    let count = 0;
    for (let month = 0; month < 12; month++) {
      const total = daysInMonth(year, month);
      for (let day = 1; day <= total; day++) {
        if (getStatus(employeeId, year, month, day) === "vacation") count++;
      }
    }
    return count;
  }

  function renderSummary() {
    const body = document.getElementById("summaryBody");
    body.innerHTML = "";

    state.employees.forEach(employee => {
      const used = countVacation(employee.id, summaryYear);
      const planned = countVacation(employee.id, summaryYear);
      const remaining = employee.allowance - used;
      const percent = employee.allowance > 0 ? Math.min(100, Math.round((used / employee.allowance) * 100)) : 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(employee.name)}</strong></td>
        <td>${employee.allowance}</td>
        <td>${used}</td>
        <td>${planned}</td>
        <td class="${remaining < 0 ? "remaining-negative" : remaining === 0 ? "remaining-zero" : "remaining-good"}">${remaining}</td>
        <td>
          <div class="progress" title="${percent}%">
            <div style="width:${percent}%"></div>
          </div>
        </td>
      `;
      body.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function openDayModal(employee, year, month, day) {
    const modal = document.getElementById("dayModal");
    const content = document.getElementById("dayModalContent");
    const current = getStatus(employee.id, year, month, day);

    content.innerHTML = `
      <div class="day-date">${formatDate(year, month, day)}</div>
      <div class="day-employee">${escapeHtml(employee.name)}</div>
      <div class="status-options">
        ${Object.entries(STATUS).map(([key, s]) => `
          <button class="status-option ${current === key ? "active" : ""}" data-status="${key}">
            ${s.icon} ${s.label}
            <span class="sub">${key === "vacation" ? "Čerpání dovolené" : key === "sick" ? "Pracovní neschopnost" : key === "business" ? "Pracovní cesta" : "Běžný pracovní den"}</span>
          </button>
        `).join("")}
        <button class="status-option ${!current ? "active" : ""}" data-status="">
          ○ Bez záznamu
          <span class="sub">Odstranit označení</span>
        </button>
      </div>
    `;

    content.querySelectorAll("[data-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        setStatus(employee.id, year, month, day, btn.dataset.status);
        closeModal("dayModal");
        render();
      });
    });

    modal.classList.remove("hidden");
  }

  function openEmployeeModal(employee = null) {
    const modal = document.getElementById("employeeModal");
    document.getElementById("employeeModalTitle").textContent =
      employee ? "Upravit zaměstnance" : "Přidat zaměstnance";
    document.getElementById("employeeId").value = employee ? employee.id : "";
    document.getElementById("employeeName").value = employee ? employee.name : "";
    document.getElementById("employeeAllowance").value = employee ? employee.allowance : 25;
    modal.classList.remove("hidden");
    setTimeout(() => document.getElementById("employeeName").focus(), 50);
  }

  function saveEmployeeFromForm(e) {
    e.preventDefault();
    const id = document.getElementById("employeeId").value;
    const name = document.getElementById("employeeName").value.trim();
    const allowance = Number(document.getElementById("employeeAllowance").value);

    if (!name) return;

    if (id) {
      const employee = state.employees.find(e => e.id === id);
      if (employee) {
        employee.name = name;
        employee.allowance = allowance;
      }
    } else {
      if (state.employees.length >= 50) {
        alert("Maximálně 50 zaměstnanců.");
        return;
      }
      state.employees.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`,
        name,
        allowance
      });
    }

    saveState();
    closeModal("employeeModal");
    render();
  }

  function deleteEmployee(id) {
    const employee = state.employees.find(e => e.id === id);
    if (!employee) return;

    if (!confirm(`Opravdu chcete smazat zaměstnance „${employee.name}“?`)) return;

    state.employees = state.employees.filter(e => e.id !== id);

    Object.keys(state.entries).forEach(key => {
      if (key.startsWith(id + "_")) delete state.entries[key];
    });

    saveState();
    render();
  }

  function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    render();
  }

  function goToday() {
    const d = new Date();
    currentYear = d.getFullYear();
    currentMonth = d.getMonth();
    summaryYear = d.getFullYear();
    render();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dovolena-zaloha-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported.employees) || typeof imported.entries !== "object") {
          throw new Error("Neplatný formát");
        }
        state = imported;
        saveState();
        render();
        alert("Data byla úspěšně importována.");
        closeModal("settingsModal");
      } catch {
        alert("Soubor není platná záloha této aplikace.");
      }
    };
    reader.readAsText(file);
  }

  document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
  document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
  document.getElementById("todayBtn").addEventListener("click", goToday);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("addEmployeeBtn").addEventListener("click", () => openEmployeeModal());
  document.getElementById("settingsBtn").addEventListener("click", () => document.getElementById("settingsModal").classList.remove("hidden"));
  document.getElementById("employeeForm").addEventListener("submit", saveEmployeeFromForm);

  document.getElementById("prevYear").addEventListener("click", () => {
    summaryYear--;
    renderSummary();
    document.getElementById("summaryYear").textContent = summaryYear;
  });

  document.getElementById("nextYear").addEventListener("click", () => {
    summaryYear++;
    renderSummary();
    document.getElementById("summaryYear").textContent = summaryYear;
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);

  document.getElementById("importFile").addEventListener("change", e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Opravdu chcete smazat všechny záznamy a obnovit výchozí zaměstnance?")) return;
    state = defaultState();
    saveState();
    goToday();
    closeModal("settingsModal");
  });

  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => closeModal(el.dataset.close));
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal:not(.hidden)").forEach(m => m.classList.add("hidden"));
    }
    if (e.key === "ArrowLeft" && !e.ctrlKey && !e.altKey) changeMonth(-1);
    if (e.key === "ArrowRight" && !e.ctrlKey && !e.altKey) changeMonth(1);
  });

  render();
})();
