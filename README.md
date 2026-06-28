# 🛡️ AI Anti-Frust: Master Edition

> **Das ultimative Backup-Schild für deine KI-Prompts.**

[![CI](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/actions/workflows/ci.yml/badge.svg)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-23%20passed-brightgreen)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/actions/workflows/ci.yml)
[![GitHub Release](https://img.shields.io/github/v/release/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition?label=release&color=blue)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/releases/latest)
[![License: MIT](https://img.shields.io/github/license/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition?color=blue)](LICENSE.md)
[![GitHub issues](https://img.shields.io/github/issues/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/issues)
[![GitHub stars](https://img.shields.io/github/stars/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition?style=social)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition)

---

## Warum dieses Skript?

**Seid ihr auch genervt, wenn eure mühsam formulierten Text-Eingaben plötzlich im digitalen Nirvana verschwinden?** Ganz gleich, ob ihr einen zu schnellen **"Trigger Finger"** (Strg+R) hattet, eure Internetverbindung streikt oder der Browser den Tab im Hintergrund "optimiert": Dieses Skript ist euer Lebensretter! Es fungiert als unsichtbares Fangnetz und stellt nicht nur den Text, sondern sogar die exakte **Cursor-Position** wieder her.

---

## Unterstützte Plattformen

Das Skript ist für die gängigsten KI-Interfaces optimiert und umgeht sogar komplexe Sicherheitsmechanismen wie **Trusted Types**.

| Plattform | Status |
| :--- | :---: |
| 🔵 **Gemini** (Google) | Unterstützt |
| 🟢 **ChatGPT** (OpenAI) | Unterstützt |
| 🟣 **Claude** (Anthropic) | Unterstützt |
| ⚫ **Grok** (xAI) | Unterstützt |

---

## Kompatibilitäts-Matrix

| Erweiterung | ![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_16x16.png) Chrome | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_16x16.png) Firefox | ![Edge](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_16x16.png) Edge | ![Brave](https://raw.githubusercontent.com/alrra/browser-logos/master/src/brave/brave_16x16.png) Brave |
| :--- | :---: | :---: | :---: | :---: |
| **Violentmonkey** | ⭐ Empfohlen | ✅ | ✅ | ✅ |
| **Tampermonkey** | ✅ | ✅ | ✅ | ✅ |

> [!TIP]
> **Warum Violentmonkey?** Es ist Open Source, arbeitet extrem speichereffizient und bietet die beste Performance für Skripte, die moderne Frameworks (React/ProseMirror) manipulieren.

---

## Installation

### Schnellinstallation (1 Klick)

> Voraussetzung: [Violentmonkey](https://violentmonkey.github.io/) oder [Tampermonkey](https://www.tampermonkey.net/) muss installiert sein.

[![Install](https://img.shields.io/badge/Install%20Userscript-klick%20hier-blue?style=for-the-badge&logo=tampermonkey)](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/raw/main/ai-anti-frust.user.js)

Klicke auf den Button oben. Dein Userscript-Manager erkennt die `.user.js`-Datei automatisch und bietet die Installation an.

### Manuelle Installation

1.  **Manager installieren:** Installiere [Violentmonkey](https://violentmonkey.github.io/) oder [Tampermonkey](https://www.tampermonkey.net/) als Browser-Erweiterung.
2.  **Skript hinzufügen:** Erstelle ein neues Skript im Dashboard deines Managers.
3.  **Code einfügen:** Kopiere den gesamten Inhalt der [`ai-anti-frust.user.js`](ai-anti-frust.user.js) hinein, speichere und lade deine KI-Seite neu.

### Updates

Wenn ein [Release](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/releases) veröffentlicht wird, kannst du das Skript einfach erneut über den Installationslink installieren — dein Manager aktualisiert es automatisch.

---

### ⚙️ Options Menu & Prompt History (Neu in v8.5)

**Settings / Options Menu**
Ein Zahnrad-Icon (⚙️) erscheint oben rechts neben dem Backup-Lösch-Button. Beim Klick öffnet sich ein Panel mit folgenden Einstellungen:
* **Show prompt history icon** – Blendet das Verlaufs-Icon ein/aus.
* **Show settings icon** – Blendet das Zahnrad-Icon ein/aus (erst entdeckbar, dann ausblendbar).
* **Max history entries** – Maximale Anzahl gespeicherter Prompts (1–500).

**Prompt History Overlay**
Ein Verlaufs-Icon (📜) öffnet ein Overlay mit allen gespeicherten Prompts (neueste zuerst). Jeder Eintrag zeigt Zeitstempel, Host und eine Vorschau. Aktionen pro Eintrag:
* **Copy** – Kopiert den vollen Prompt-Text in die Zwischenablage.
* **New chat** – Startet einen neuen Chat auf der aktuellen Plattform und füllt den Prompt automatisch ein (ohne abzusenden).
* **Delete** – Entfernt den einzelnen Eintrag aus dem Verlauf.
* **Clear all history** – Löscht den gesamten Verlauf.

Prompts werden automatisch beim Absenden (Enter) erfasst. Die bestehende Backup/Restore-Funktionalität bleibt vollständig erhalten.

---

### ⚡ Performance & Sicherheit

## Features

| Feature | Beschreibung |
| :--- | :--- |
| **Auto-Backup** | Jede Eingabe wird automatisch im `localStorage` gesichert |
| **Cursor-Restore** | Exakte Cursor-Position wird per DOM-Walker wiederhergestellt |
| **Smart State-Sync** | Nutzt native Setter, damit React/Vue den "Senden"-Button korrekt aktiviert |
| **Zero-Latency** | Speicherung nur bei Interaktion (Tippen/Klicken), kein Polling |
| **Privacy First** | 100% lokal — keine Server, keine Cloud, keine Telemetrie |
| **CSP Safe** | Umgeht Content-Security-Policy & Trusted Types sicher |
| **Lösch-Button** | Rote 🗑️-Schaltfläche zum manuellen Leeren des Backups |

---

## FAQ

<details>
<summary><strong>Der rote Lösch-Button 🗑️ erscheint nicht?</strong></summary>

- **Kein Backup vorhanden:** Die Mülltonne wird erst eingeblendet, sobald tatsächlich Text im Speicher liegt. Tippe ein paar Worte!
- **Skript inaktiv:** Klicke auf dein Extension-Icon und prüfe, ob der Schalter auf **AN** steht.

</details>

<details>
<summary><strong>Wie aktiviere ich ein deaktiviertes Skript?</strong></summary>

1. Öffne das Dashboard deines Managers (Rechtsklick auf das Icon -> Dashboard).
2. Suche **"Universal AI Anti-Frust"**.
3. Schiebe den Regler auf **Aktiv (Grün)** und lade den KI-Tab neu.

</details>

<details>
<summary><strong>Bleibt mein Cursor da, wo ich aufgehört habe?</strong></summary>

**Definitiv!** Dank des integrierten *DOM-Walkers* wird die exakte Zeichen-Position gespeichert. Du machst nach einem Refresh nahtlos dort weiter, wo du aufgehört hast.

</details>

---

## Development & Testing

**Voraussetzungen:** [Node.js](https://nodejs.org/) (LTS)

```bash
# Abhängigkeiten installieren
npm install

# Linting ausführen
npm run lint

# Unit-Tests ausführen
npm test

# UserScript-Metadaten validieren
npm run validate:meta
```

### Projekt-Struktur

```
.
├── ai-anti-frust.user.js       # Das Userscript (Hauptdatei)
├── package.json                # Node-Tooling & Skripte
├── .eslintrc.json              # ESLint-Konfiguration
├── tests/
│   ├── helpers.test.js         # Unit-Tests (Jest + jsdom)
│   └── setup.js                # Test-Setup (Userscript-Globals)
├── scripts/
│   └── validate-meta.js        # Metadaten-Validierung
└── .github/workflows/
    ├── ci.yml                  # CI: Lint + Tests + Meta-Check
    └── release.yml             # Release: Tag → GitHub Release
```

### CI/CD Pipeline

| Check | Trigger | Beschreibung |
| :--- | :--- | :--- |
| **Lint** | Push / PR → `main` | ESLint mit Browser + ES2021 Env |
| **Tests** | Push / PR → `main` | 23 Jest-Tests für Helper-Funktionen |
| **Meta-Check** | Push / PR → `main` | Validiert `@name`, `@version`, `@match`, `@grant` |
| **Release** | Tag `v*` | Erstellt GitHub Release mit Skript als Asset |

### Releases erstellen

```bash
git tag v8.4
git push origin v8.4
```

Die Release-Pipeline erstellt automatisch ein [GitHub Release](https://github.com/kokolores495/AI-Anti-Frust-Prompt-Cache---Master-Edition/releases) mit `ai-anti-frust.user.js` als Download-Asset.

---

## Für Entwickler

Wenn du das Skript erweitern willst, beachte die `setNativeValue` Funktion — sie ist der Schlüssel, um die Framework-Hürden von React und Vue zu nehmen. Die Helper-Funktionen sind am Ende der IIFE per `module.exports` für Tests exportiert (der Guard `typeof module !== 'undefined'` verhindert Fehler im Browser).

---

## Lizenz & Disclaimer

Dieses Projekt steht unter der [**MIT-Lizenz**](LICENSE.md).

> [!IMPORTANT]
> Dieses Tool ist ein Community-Projekt und steht in keiner offiziellen Verbindung zu Google, OpenAI, Anthropic oder xAI. Nutzung auf eigene Gefahr.
