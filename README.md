# 🛡️ AI Anti-Frust: Master Edition
> **Das ultimative Backup-Schild für deine KI-Prompts.**

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-8.4-green.svg)
![Status](https://img.shields.io/badge/status-stable-success.svg)

---

### 💡 Warum dieses Skript?
**Seid ihr auch genervt, wenn eure mühsam formulierten Text-Eingaben plötzlich im digitalen Nirvana verschwinden?** Ganz gleich, ob ihr einen zu schnellen **"Trigger Finger"** (Strg+R) hattet, eure Internetverbindung streikt oder der Browser den Tab im Hintergrund "optimiert": Dieses Skript ist euer Lebensretter! Es fungiert als unsichtbares Fangnetz und stellt nicht nur den Text, sondern sogar die exakte **Cursor-Position** wieder her.

---

### 🚀 Unterstützte Plattformen
Das Skript ist für die gängigsten KI-Interfaces optimiert und umgeht sogar komplexe Sicherheitsmechanismen wie **Trusted Types**.

* 🔵 **Gemini** (Google)
* 🟢 **ChatGPT** (OpenAI)
* 🟣 **Claude** (Anthropic)
* ⚫ **Grok** (xAI)

---

### 💻 Kompatibilitäts-Matrix

| Erweiterung | ![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_16x16.png) Chrome | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_16x16.png) Firefox | ![Edge](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_16x16.png) Edge | ![Brave](https://raw.githubusercontent.com/alrra/browser-logos/master/src/brave/brave_16x16.png) Brave |
| :--- | :---: | :---: | :---: | :---: |
| **Violentmonkey** | ⭐ Empfohlen | ✅ | ✅ | ✅ |
| **Tampermonkey** | ✅ | ✅ | ✅ | ✅ |

> [!TIP]
> **Warum Violentmonkey?** Es ist Open Source, arbeitet extrem speichereffizient und bietet die beste Performance für Skripte, die moderne Frameworks (React/ProseMirror) manipulieren.

---

### 🛠️ Installation in 3 Schritten

1.  **Manager wählen:** Installiere [Violentmonkey](https://violentmonkey.github.io/) oder [Tampermonkey](https://www.tampermonkey.net/).
2.  **Skript hinzufügen:** Erstelle ein neues Skript in deinem Manager.
3.  **Code einfügen:** Kopiere den Inhalt der `ai-anti-frust.user.js` hinein, speichere ihn und lade deine KI-Seite neu.

---

### ⚡ Performance & Sicherheit

* **Zero-Latency:** Speicherung erfolgt asynchron nur bei Interaktion (Tippen/Klicken).
* **Privacy First:** Daten bleiben zu **100% lokal** im `localStorage` deines Browsers.
* **Smart State-Sync:** Nutzt native Setter, um Framework-interne States (z.B. React `useState`) korrekt zu triggern, damit der Senden-Button sofort aktiv wird.

---

### ❓ FAQ - Häufig gestellte Fragen

#### Der rote Lösch-Button 🗑️ erscheint nicht?
* **Kein Backup vorhanden:** Die rote Mülltonne (🗑️) wird erst eingeblendet, sobald tatsächlich Text im Speicher liegt. Tippe ein paar Worte!
* **Skript inaktiv:** Klicke auf dein Extension-Icon und prüfe, ob der Schalter auf **AN** steht.

#### Wie aktiviere ich ein deaktiviertes Skript?
1.  Öffne das Dashboard deines Managers (Rechtsklick auf das Icon -> Dashboard).
2.  Suche **"Universal AI Anti-Frust"**.
3.  Schiebe den Regler auf **Aktiv (Grün)** und lade den KI-Tab neu.

#### Bleibt mein Cursor da, wo ich aufgehört habe?
**Definitiv!** Dank des integrierten *DOM-Walkers* wird die exakte Zeichen-Position gespeichert. Du machst nach einem Refresh nahtlos dort weiter, wo du aufgehört hast.

---

### 📜 Lizenz & Disclaimer
Dieses Projekt steht unter der **MIT-Lizenz**. 

> [!IMPORTANT]
> Dieses Tool ist ein Community-Projekt und steht in keiner offiziellen Verbindung zu Google, OpenAI, Anthropic oder xAI. Nutzung auf eigene Gefahr.

---

### 👨‍💻 Für Entwickler
Wenn du das Skript erweitern willst, beachte die `setNativeValue` Funktion – sie ist der Schlüssel, um die Framework-Hürden von React und Vue zu nehmen.

---

### 🧪 Development & Testing

**Voraussetzungen:** Node.js (LTS)

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

**Releases erstellen:**

1. Erstelle einen Git-Tag mit Versionspräfix: `git tag v8.4`
2. Pushe den Tag: `git push origin v8.4`
3. Die GitHub Actions Release-Pipeline führt automatisch alle Checks aus und erstellt ein Release mit `ai-anti-frust.user.js` als Download-Asset.

**CI/CD:** Jeder Push und Pull-Request auf `main` löst automatisch Linting, Metadaten-Validierung und Unit-Tests aus.