# ⚡ SmartFill — Auto Form Filler for Microsoft Edge

> Automatically fill web forms with your saved profiles.  
> Manual mapping for fields the extension can't recognise automatically.

![Edge](https://img.shields.io/badge/Microsoft_Edge-MV3-0078D7?style=flat&logo=microsoftedge&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-60a5fa?style=flat)
![Storage](https://img.shields.io/badge/Storage-Local_Only-34d399?style=flat)
![No Server](https://img.shields.io/badge/Server-None-f87171?style=flat)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tabs Overview](#tabs-overview)
  - [Fill Tab](#fill-tab)
  - [Profiles Tab](#profiles-tab)
  - [Manual Map Tab](#manual-map-tab)
- [How Field Detection Works](#how-field-detection-works)
- [Supported Fields](#supported-fields)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [File Structure](#file-structure)

---

## Features

- **One-click form filling** — fill an entire page form with a single click
- **Multiple profiles** — Personal, Work, or any custom profile
- **20 field types** — name, email, phone, address, passport, national ID, and more
- **Manual mapping** — assign custom/unrecognised fields to profile data
- **Persistent mappings** — mapped fields are remembered per website forever
- **Framework compatible** — fires native events so React, Vue, and Angular forms detect the values
- **100% local** — all data stored in your browser, nothing sent to any server

---

## Installation

> **Requires Microsoft Edge 109 or later.**

**1. Download and unzip**

Unzip `smartfill-extension.zip` to a **permanent folder** on your PC.
```
C:\Extensions\SmartFill\
```
> ⚠️ Do not move or delete this folder after installation — Edge loads the extension from it directly.

**2. Open the Extensions page**

In Edge, navigate to:
```
edge://extensions
```
Or go to **⋯ Menu → Extensions → Manage extensions**.

**3. Enable Developer mode**

Toggle **Developer mode** ON in the bottom-left corner of the page.

**4. Load the extension**

Click **Load unpacked** → navigate to and select the `autofill-extension` folder (the one containing `manifest.json`).

SmartFill will appear in your extensions list with a ⚡ icon.

**5. Pin to toolbar**

Click the 🧩 puzzle icon in Edge's toolbar → click the **pin** icon next to SmartFill so the ⚡ button is always visible.

---

## Quick Start

```
1. Go to any website with a form
2. Click the ⚡ SmartFill icon in the toolbar
3. Select your profile from the dropdown
4. Click ⚡ Fill This Page
5. Done — your fields are filled
```

If any fields weren't filled automatically, use the [Manual Map tab](#manual-map-tab) to assign them.

---

## Tabs Overview

### Fill Tab

The main tab. Use it every time you want to fill a form.

| Element | Description |
|---|---|
| Profile dropdown | Choose which profile to use for filling |
| **＋** button | Create a new profile |
| **⚡ Fill This Page** | Scan and fill all matching visible fields |
| Result message | Shows how many fields were filled |
| Preview grid | Shows the data that will be used from the selected profile |

**After clicking Fill:**
- ✅ `Filled N fields` — success
- ⚠️ `No matching fields found` — use Manual Map tab
- ❌ `Could not reach the page` — you're on a restricted page (see [Troubleshooting](#troubleshooting))

---

### Profiles Tab

Create and manage your data profiles.

**To create a new profile:**
1. On the Fill tab, click **＋** next to the profile dropdown
2. Enter a name (e.g. `Work`, `Personal`, `Visa Application`)
3. You'll be taken to the Profiles tab automatically
4. Fill in your information across the 4 groups:
   - 👤 **Personal** — name, DOB, gender, nationality, national ID, passport
   - 📬 **Contact** — email, phone, website, username
   - 🏢 **Professional** — company, job title
   - 🏠 **Address** — street, apt, city, state, ZIP, country
5. Click **💾 Save Profile**

**To edit a profile:** Select it from the dropdown, change fields, click Save.

**To delete a profile:** Select it and click the 🗑 button. You must always keep at least one profile.

---

### Manual Map Tab

For fields that SmartFill can't automatically recognise.

**Step-by-step:**

1. Navigate to the page with the unrecognised form
2. Open SmartFill → go to **Manual Map** tab
3. Click **🔍 Scan Page Fields**
4. All visible form fields appear with their status:
   - 🟢 **✓ Auto** — automatically matched to a profile field
   - 🔴 **? Unmatched** — needs manual assignment
5. For each unmatched field, use the **Map to:** dropdown to pick the correct profile field
6. Click **💾 Save Mappings**

> **Mappings are permanent.** Once saved, SmartFill remembers them for that field on that website — you never have to map it again.

You can also override auto-matched fields here if the extension made the wrong guess.

---

## How Field Detection Works

SmartFill uses a 4-layer priority chain to identify each input:

```
Priority 1 — autocomplete attribute      autocomplete="given-name"
Priority 2 — name / id / placeholder     name="first_name", placeholder="Your email"
Priority 3 — associated label text       <label for="f">First name</label>
Priority 4 — input type hint             type="email", type="tel", type="date"
```

**Fields always skipped:**
- `type="password"` — never filled for security
- `type="hidden"` — invisible, never filled
- `type="submit"` / `type="button"` — not data fields

**Framework support:**

After filling a value, SmartFill fires the following events so modern JS frameworks detect the change:
```
input  →  change  →  keydown  →  keyup  →  keypress
```
This covers React controlled inputs, Vue v-model, and Angular [(ngModel)].

---

## Supported Fields

| Profile Field | Detection Keywords | autocomplete |
|---|---|---|
| First name | first, fname, given, forename, prenom | `given-name` |
| Last name | last, lname, surname, family | `family-name` |
| Full name | name, fullname | `name` |
| Email | email, mail, courriel | `email` |
| Phone | phone, tel, mobile, cell, gsm, portable | `tel` |
| Company | company, org, organization, employer, societe | `organization` |
| Job title | title, job, position, role, fonction | `organization-title` |
| Street | address, street, addr, rue, adresse | `address-line1` |
| Apt / Suite | address2, apt, suite, unit, apartment | `address-line2` |
| City | city, town, locality, ville | `address-level2` |
| State / Region | state, province, region, county | `address-level1` |
| ZIP / Postal | zip, postal, postcode, code.postal | `postal-code` |
| Country | country, nation, pays | `country-name` |
| Date of birth | dob, birth, birthday, birthdate, naissance | `bday` |
| Website | website, url, site, web, homepage | `url` |
| Username | username, login, handle, pseudo, identifiant | `username` |
| Gender | gender, sex, genre | `sex` |
| Nationality | nationality, citizenship, nationalite | — |
| National ID | national.id, cin, nni, id.card, identity | — |
| Passport | passport, passport.number, passport.no | — |

---

## Troubleshooting

**"No matching fields found" after clicking Fill**

- The form may be inside a modal or tab that hasn't fully loaded yet — wait and try again
- Use the **Manual Map** tab to manually assign fields
- Some SPAs render forms dynamically — give the page a moment to fully render

**Fields filled but form doesn't register the values**

- SmartFill fires native events to handle this — if a framework still misses it, click into a field once after filling to trigger re-validation

**"Could not reach the page" error**

SmartFill cannot inject into:
- Edge internal pages (`edge://...`)
- The Extensions management page
- PDF files
- Local files (`file://...`) unless you enable "Allow access to file URLs" in the extension settings

**Extension disappears after restarting Edge**

Edge sometimes disables unpacked extensions on restart. Go to `edge://extensions` and re-enable SmartFill. This is normal for developer-mode extensions.

**To update SmartFill:**
1. Replace files in the `autofill-extension` folder
2. Go to `edge://extensions`
3. Click the 🔄 **Reload** button on the SmartFill card

---

## Privacy

| What | Detail |
|---|---|
| Data storage | `chrome.storage.local` — your browser only |
| Network requests | None — SmartFill makes zero external requests |
| Telemetry | None |
| Passwords | Never read, never filled |
| Third parties | None |

All profile data and field mappings live exclusively in your browser's local storage. Uninstalling the extension deletes everything.

---

## File Structure

```
autofill-extension/
├── manifest.json                 ← Edge MV3 manifest
├── README.md                     ← This file
├── MANUAL.html                   ← Full visual manual (open in browser)
│
├── popup/
│   ├── popup.html                ← Extension popup UI (3 tabs)
│   ├── popup.css                 ← Dark theme styling
│   └── popup.js                  ← Profile management + manual mapping logic
│
├── content/
│   └── autofill.js               ← Field scanner + filler (injected into pages)
│
├── background/
│   └── service-worker.js         ← Message router (popup ↔ content script)
│
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

*SmartFill v1.0 — Built for Microsoft Edge (Chromium) · MV3 · No server · No tracking*
