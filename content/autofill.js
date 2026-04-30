// content/autofill.js
// Injected into every page — scans, matches and fills form fields

// ── Field Detection Rules ──────────────────────────────────────────────────────
const FIELD_RULES = [
  { key: "firstName",   patterns: ["first.name","fname","first","given.name","forename","christian.name","prenom","firstname"] },
  { key: "lastName",    patterns: ["last.name","lname","last","family.name","surname","second.name","lastname"] },
  { key: "fullName",    patterns: ["full.name","fullname","name","your.name","nom"] },
  { key: "email",       patterns: ["email","e.mail","mail","courriel","email.address"] },
  { key: "phone",       patterns: ["phone","tel","mobile","cell","contact.number","telephone","gsm","portable"] },
  { key: "company",     patterns: ["company","organisation","organization","org","employer","business","societe","entreprise"] },
  { key: "jobTitle",    patterns: ["job.title","title","position","role","occupation","post","fonction"] },
  { key: "address",     patterns: ["address","street","addr","address1","address.line","rue","adresse","line.1"] },
  { key: "address2",    patterns: ["address2","address.line.2","apt","suite","unit","apartment","floor"] },
  { key: "city",        patterns: ["city","town","locality","ville","cit"] },
  { key: "state",       patterns: ["state","province","region","county","department"] },
  { key: "zip",         patterns: ["zip","postal","postcode","post.code","npa","code.postal"] },
  { key: "country",     patterns: ["country","nation","pays"] },
  { key: "dob",         patterns: ["dob","birth","birthday","date.of.birth","birthdate","naissance"] },
  { key: "website",     patterns: ["website","url","site","web","homepage"] },
  { key: "username",    patterns: ["username","user.name","login","handle","pseudo","identifiant"] },
  { key: "gender",      patterns: ["gender","sex","genre"] },
  { key: "nationality", patterns: ["nationality","citizenship","nationalite"] },
  { key: "passport",    patterns: ["passport","passport.number","passport.no"] },
  { key: "national_id", patterns: ["national.id","id.number","cin","nni","id.card","identity"] },
];

// Autocomplete attribute → field key
const AUTOCOMPLETE_MAP = {
  "given-name":         "firstName",
  "family-name":        "lastName",
  "name":               "fullName",
  "email":              "email",
  "tel":                "phone",
  "organization":       "company",
  "organization-title": "jobTitle",
  "address-line1":      "address",
  "address-line2":      "address2",
  "address-level2":     "city",
  "address-level1":     "state",
  "postal-code":        "zip",
  "country-name":       "country",
  "country":            "country",
  "bday":               "dob",
  "url":                "website",
  "username":           "username",
  "sex":                "gender",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalize(str) {
  return (str || "").toLowerCase().replace(/[\s\-_\.\/\\]+/g, ".");
}

function matchesPatterns(str, patterns) {
  const n = normalize(str);
  return patterns.some(p => n.includes(p));
}

function getLabelText(input) {
  // Method 1: label[for=id]
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.innerText || label.textContent;
  }
  // Method 2: parent label
  const parentLabel = input.closest("label");
  if (parentLabel) return parentLabel.innerText || parentLabel.textContent;
  // Method 3: preceding sibling label
  let prev = input.previousElementSibling;
  while (prev) {
    if (prev.tagName === "LABEL") return prev.innerText || prev.textContent;
    prev = prev.previousElementSibling;
  }
  // Method 4: aria-labelledby
  const labelId = input.getAttribute("aria-labelledby");
  if (labelId) {
    const el = document.getElementById(labelId);
    if (el) return el.innerText || el.textContent;
  }
  return "";
}

function detectFieldKey(input) {
  // Skip passwords and hidden fields
  if (input.type === "password" || input.type === "hidden") return null;

  // 1. autocomplete attribute (most reliable)
  const ac = input.getAttribute("autocomplete");
  if (ac && AUTOCOMPLETE_MAP[ac]) return AUTOCOMPLETE_MAP[ac];

  // 2. Gather all signal strings
  const signals = [
    input.getAttribute("name")        || "",
    input.getAttribute("id")          || "",
    input.getAttribute("placeholder") || "",
    input.getAttribute("aria-label")  || "",
    input.getAttribute("data-field")  || "",
    input.getAttribute("data-name")   || "",
    getLabelText(input),
  ].join(" ");

  // 3. Match against rules
  for (const rule of FIELD_RULES) {
    if (matchesPatterns(signals, rule.patterns)) return rule.key;
  }

  // 4. Type hints
  if (input.type === "email") return "email";
  if (input.type === "tel")   return "phone";
  if (input.type === "date")  return "dob";
  if (input.type === "url")   return "website";

  return null; // unmatched
}

function getFieldFingerprint(input) {
  return [
    input.getAttribute("name"),
    input.getAttribute("id"),
    input.getAttribute("placeholder"),
    input.type,
    getLabelText(input).trim().slice(0, 40),
  ].filter(Boolean).join("|");
}

function fillInput(input, value) {
  if (!value) return;
  const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

  if (input.tagName === "SELECT") {
    const opts = Array.from(input.options);
    const match = opts.find(o =>
      normalize(o.value).includes(normalize(value)) ||
      normalize(o.text).includes(normalize(value))
    );
    if (match) {
      input.value = match.value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }

  // Native setter → triggers React/Vue/Angular onChange
  if (nativeInputSetter) {
    nativeInputSetter.call(input, value);
  } else {
    input.value = value;
  }

  // Fire all relevant events so frameworks pick it up
  input.dispatchEvent(new Event("input",  { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keydown",  { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keyup",    { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keypress", { bubbles: true }));
}

// ── Message Handler ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── SCAN: return all inputs + their detected key / unmatched fingerprint
  if (message.action === "scan_fields") {
    const inputs = Array.from(document.querySelectorAll(
      "input:not([type=hidden]):not([type=password]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=checkbox]):not([type=radio]), textarea, select"
    )).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
    });

    const fields = inputs.map(input => {
      const key         = detectFieldKey(input);
      const fingerprint = getFieldFingerprint(input);
      const label       = getLabelText(input).trim() || input.getAttribute("placeholder") || input.getAttribute("name") || input.getAttribute("id") || "Unknown field";
      return {
        fingerprint,
        detectedKey: key,
        label: label.slice(0, 60),
        type: input.type || input.tagName.toLowerCase(),
        matched: !!key,
      };
    });

    sendResponse({ success: true, fields });
    return true;
  }

  // ── FILL: fill the page inputs using profile + manual mappings
  if (message.action === "fill_form") {
    const { profile, manualMappings } = message;
    const inputs = Array.from(document.querySelectorAll(
      "input:not([type=hidden]):not([type=password]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=checkbox]):not([type=radio]), textarea, select"
    )).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
    });

    let filled = 0;
    inputs.forEach(input => {
      let key = detectFieldKey(input);

      // Override with manual mapping if set
      const fp = getFieldFingerprint(input);
      if (manualMappings[fp]) key = manualMappings[fp];

      if (key && profile[key]) {
        fillInput(input, profile[key]);
        filled++;
      }
    });

    sendResponse({ success: true, filled });
    return true;
  }

});
