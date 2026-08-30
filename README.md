# Ambr3Calendar
A privacy-first, open-source calendar web app. All data stays on your device — no servers, no accounts, no tracking.

I would always recommend using Vanadium (GrapheneOS) or Brave Browser to install PWA's for max security. Please use at your own risk, this has been vibe-coded, all code has been read before each push but always check for security flaws before using. My coding is not the best.

---
## Features

- **Month, Week & Year views** — switch with the toolbar buttons; the month grid shows each date in its own square box.
- **Quick jump** — tap the month/year title to jump straight to any month.
- **Search** — find events and holidays instantly across your calendar.
- **Events** — all-day or timed events, end time, end date, colors, descriptions.
- **Recurring events** — daily, weekly, monthly, yearly, with custom intervals and an end date.
- **Multi-day events** — spanning events show on every day they cover.
- **Drag & drop** — move events between days by dragging the colored pill.
- **Reminders** — optional browser notifications before an event (enable in Settings).
- **Holidays & important dates** — toggle countries and special dates from the Holidays panel.
- **Week start + language settings** — choose Sunday/Monday start and English, Français, Deutsch, Español, Italiano, Nederlands, Português, Türkçe, Српски / Srpski.
- **Backup & restore** — export/import your data as JSON or standard iCal (.ics), so it stays portable and safe.
- **Dark & light themes** — with an animated glassmorphism look.

## Privacy & Security

- **100% local** — everything is stored in your browser's localStorage. Nothing is ever sent to a server.
- **No cookies, no trackers, no third-party code** — not even Google Fonts; only the system font stack.
- **No network capability** — the app's Content-Security-Policy sets `connect-src 'none'`, so the page cannot make network requests at all.
- **Hardened headers/meta** — strict CSP, `no-referrer`, and a Permissions-Policy that disables camera, microphone, geolocation, payment, clipboard, sensors and more.
- **Clickjacking** — the CSP meta tag cannot enforce `frame-ancestors 'none'`; browsers ignore it in `<meta>`. The hosting server must send `X-Frame-Options: DENY` (and/or a `frame-ancestors 'none'` CSP header). A sample [`.htaccess`](.htaccess) is included for Apache hosts.
- **Warning** — because data lives only in the browser, clearing the browser cache/site data deletes your events. Export a backup regularly.

## PWA

- Installable on Android, iOS, and desktop (manifest + icons, standalone display).
- Works offline thanks to the service worker — cached assets are served when there's no connection.
- Fullscreen/standalone mode with safe-area support for notched phones.


- Each date now sits in its own square box with a visible border; the calendar card auto-sizes to fit.
- Bigger fonts, larger touch targets, and bigger toolbar/action buttons for mobile use.
- Settings hint now warns that clearing the browser cache/site data deletes local events.


## License

Ambr3Calendar is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, version 3 of the License** (or, at your option, any later version).

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU General Public License v3](LICENSE) for details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.



