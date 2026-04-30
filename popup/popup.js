// popup/popup.js

const PROFILE_KEYS = [
  { key: "firstName",   label: "First name" },
  { key: "lastName",    label: "Last name" },
  { key: "fullName",    label: "Full name" },
  { key: "email",       label: "Email" },
  { key: "phone",       label: "Phone" },
  { key: "company",     label: "Company" },
  { key: "jobTitle",    label: "Job title" },
  { key: "address",     label: "Street" },
  { key: "address2",    label: "Apt / Suite" },
  { key: "city",        label: "City" },
  { key: "state",       label: "State" },
  { key: "zip",         label: "ZIP" },
  { key: "country",     label: "Country" },
  { key: "dob",         label: "Date of birth" },
  { key: "website",     label: "Website" },
  { key: "username",    label: "Username" },
  { key: "gender",      label: "Gender" },
  { key: "nationality", label: "Nationality" },
  { key: "national_id", label: "National ID" },
  { key: "passport",    label: "Passport" },
];

// ── State ──────────────────────────────────────────────────────────────────────
let profiles = {};         // { profileName: { key: value, ... } }
let manualMappings = {};   // { fingerprint: fieldKey }
let currentTab = "fill";

// ── Storage helpers ────────────────────────────────────────────────────────────
function loadStorage() {
  return new Promise(resolve => {
    chrome.storage.local.get(["profiles","manualMappings"], (data) => {
      profiles       = data.profiles       || { "Default": {} };
      manualMappings = data.manualMappings || {};
      resolve();
    });
  });
}
function saveStorage() {
  return new Promise(resolve => {
    chrome.storage.local.set({ profiles, manualMappings }, resolve);
  });
}

// ── Tab switching ──────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById(`tab-${tab}`).classList.add("active");
    currentTab = tab;
    if (tab === "profiles") renderProfilesTab();
    if (tab === "fill")     renderFillTab();
  });
});

// ── Fill Tab ───────────────────────────────────────────────────────────────────
function renderFillTab() {
  const sel = document.getElementById("activeProfile");
  const current = sel.value;
  sel.innerHTML = Object.keys(profiles).map(n =>
    `<option value="${n}" ${n === current ? "selected" : ""}>${n}</option>`
  ).join("");
  renderPreview(sel.value);
}

function renderPreview(profileName) {
  const profile = profiles[profileName] || {};
  const grid = document.getElementById("previewGrid");
  const filled = PROFILE_KEYS.filter(f => profile[f.key]);
  if (!filled.length) {
    grid.innerHTML = `<div class="empty-state">No data in this profile yet</div>`;
    return;
  }
  grid.innerHTML = filled.map(f =>
    `<div class="preview-item">
      <div class="p-label">${f.label}</div>
      <div class="p-value" title="${profile[f.key]}">${profile[f.key]}</div>
    </div>`
  ).join("");
}

document.getElementById("activeProfile").addEventListener("change", e => {
  renderPreview(e.target.value);
});

document.getElementById("btnFill").addEventListener("click", () => {
  const profileName = document.getElementById("activeProfile").value;
  const profile     = profiles[profileName] || {};
  const resultEl    = document.getElementById("fillResult");

  resultEl.textContent = "Filling…";
  resultEl.className   = "fill-result";

  chrome.runtime.sendMessage({
    action: "fill_form",
    profile,
    manualMappings
  }, (response) => {
    if (chrome.runtime.lastError || !response?.success) {
      resultEl.textContent = "❌ Could not reach the page";
      resultEl.className   = "fill-result error";
    } else {
      const n = response.filled || 0;
      resultEl.textContent = n > 0 ? `✅ Filled ${n} field${n !== 1 ? "s" : ""}` : "⚠️ No matching fields found";
      resultEl.className   = `fill-result ${n > 0 ? "success" : "error"}`;
    }
  });
});

document.getElementById("btnNewProfile").addEventListener("click", () => {
  const name = prompt("New profile name:");
  if (!name || !name.trim()) return;
  const n = name.trim();
  if (profiles[n]) return alert("A profile with that name already exists.");
  profiles[n] = {};
  saveStorage().then(() => {
    renderFillTab();
    renderProfilesTab();
    // Switch to profiles tab to edit it
    document.querySelector('[data-tab="profiles"]').click();
    document.getElementById("editProfile").value = n;
    loadProfileIntoForm(n);
  });
});

// ── Profiles Tab ───────────────────────────────────────────────────────────────
function renderProfilesTab() {
  const sel = document.getElementById("editProfile");
  const current = sel.value;
  sel.innerHTML = Object.keys(profiles).map(n =>
    `<option value="${n}" ${n === current ? "selected" : ""}>${n}</option>`
  ).join("");
  loadProfileIntoForm(sel.value);
}

function loadProfileIntoForm(profileName) {
  const profile = profiles[profileName] || {};
  document.querySelectorAll("#fieldsForm input[data-key]").forEach(input => {
    input.value = profile[input.dataset.key] || "";
  });
}

document.getElementById("editProfile").addEventListener("change", e => {
  loadProfileIntoForm(e.target.value);
});

document.getElementById("btnSaveProfile").addEventListener("click", () => {
  const profileName = document.getElementById("editProfile").value;
  const data = {};
  document.querySelectorAll("#fieldsForm input[data-key]").forEach(input => {
    if (input.value.trim()) data[input.dataset.key] = input.value.trim();
  });
  profiles[profileName] = data;
  saveStorage().then(() => {
    const msg = document.getElementById("saveMsg");
    msg.textContent = "✅ Saved!";
    msg.className   = "save-msg ok";
    setTimeout(() => { msg.textContent = ""; }, 2000);
    renderFillTab();
  });
});

document.getElementById("btnDeleteProfile").addEventListener("click", () => {
  const names = Object.keys(profiles);
  if (names.length <= 1) return alert("You must keep at least one profile.");
  const profileName = document.getElementById("editProfile").value;
  if (!confirm(`Delete profile "${profileName}"?`)) return;
  delete profiles[profileName];
  saveStorage().then(() => {
    renderProfilesTab();
    renderFillTab();
  });
});

// ── Manual Mapping Tab ─────────────────────────────────────────────────────────
document.getElementById("btnScan").addEventListener("click", () => {
  const listEl = document.getElementById("manualList");
  listEl.innerHTML = `<div class="no-fields-msg">Scanning…</div>`;

  chrome.runtime.sendMessage({ action: "scan_fields" }, (response) => {
    const saveRow = document.getElementById("manualSaveRow");

    if (chrome.runtime.lastError || !response?.success) {
      listEl.innerHTML = `<div class="no-fields-msg">❌ Could not reach the page. Make sure you're on a web page.</div>`;
      saveRow.style.display = "none";
      return;
    }

    const fields = response.fields || [];
    if (!fields.length) {
      listEl.innerHTML = `<div class="no-fields-msg">No visible form fields found on this page.</div>`;
      saveRow.style.display = "none";
      return;
    }

    saveRow.style.display = "block";

    const optionsHtml = `
      <option value="">— Skip —</option>
      ${PROFILE_KEYS.map(f => `<option value="${f.key}">${f.label}</option>`).join("")}
    `;

    listEl.innerHTML = fields.map(f => {
      const isMatched   = !!f.detectedKey;
      const currentMap  = manualMappings[f.fingerprint] || f.detectedKey || "";
      const matchLabel  = isMatched
        ? `<span class="match-badge ok">✓ Auto</span>`
        : `<span class="match-badge no">? Unmatched</span>`;

      return `
        <div class="manual-item ${isMatched ? "matched" : "unmatched"}" data-fp="${escHtml(f.fingerprint)}">
          <div class="manual-item-top">
            <span class="field-label-text">${escHtml(f.label)}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span class="field-type-badge">${escHtml(f.type)}</span>
              ${matchLabel}
            </div>
          </div>
          <div class="manual-item-bottom">
            <span class="map-label">Map to:</span>
            <select class="map-select" data-fp="${escHtml(f.fingerprint)}">
              ${optionsHtml}
            </select>
          </div>
        </div>`;
    }).join("");

    // Set select values
    listEl.querySelectorAll("select.map-select").forEach(sel => {
      const fp  = sel.dataset.fp;
      const key = manualMappings[fp] || fields.find(f => f.fingerprint === fp)?.detectedKey || "";
      sel.value = key;
    });
  });
});

document.getElementById("btnSaveMappings").addEventListener("click", () => {
  document.querySelectorAll(".map-select").forEach(sel => {
    const fp  = sel.dataset.fp;
    const val = sel.value;
    if (val) {
      manualMappings[fp] = val;
    } else {
      delete manualMappings[fp];
    }
  });
  saveStorage().then(() => {
    const btn = document.getElementById("btnSaveMappings");
    btn.textContent = "✅ Mappings saved!";
    setTimeout(() => { btn.textContent = "💾 Save Mappings"; }, 2000);
  });
});

// ── Utils ──────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Init ───────────────────────────────────────────────────────────────────────
loadStorage().then(() => {
  renderFillTab();
});
