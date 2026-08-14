# Ambr3Calendar
> **Version: 0.2.0 Beta**

A privacy-first, open-source calendar web app. All data stays on your device — no servers, no accounts, no tracking.

Why PWA? I hate loads of installed apps on my phone, that simple.

Why make this? I dont use Calendars to store my events, I still use a diary (Yes with a pen) but somtimes its just nice to know where a date lands on a day when planning things. Also i added some important dates for extra info.

This is partially Vibe-Coded, I can code but not well, there's currently around 4000 odd lines of code, something i could not do on my own. AI helps me allot to get my ideas into real things, without AI by the time Ive coded something, I've either got bored or i just cant get the code to work.


I would always recommend using Vanadium (GrapheneOS) or Brave Browser to install PWA's for max security. Please use at your own risk, as stated this has been vibe-coded and always check for security flaws before using.

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

## Changelog

### 0.2.0 Beta — 2026-08-13

#### New views & navigation
- Added **Week** and **Year** views alongside Month (toolbar switch).
- Week view is a full time-grid with 24h slots, draggable events and a clickable day header.
- Year view shows all 12 months at a glance; tapping a month or day jumps into it.
- Added **quick jump** popover — tap the month/year title to navigate to any month.
- Navigation (prev/next/today) now works per-view and respects the week-start setting.
- Added swipe gestures (left/right) to change period on touch devices.

#### Events
- Events can now have an **end date** (multi-day spanning events) and a **reminder** (browser notification offset).
- Multi-day events are shown on every day they cover and are reflected when searching/exporting.
- **Drag & drop** events between days in Month and Week views.
- Editing a recurring occurrence now edits the original event entry.

#### Search & settings
- Added **search** overlay — finds events (and holidays) by title or description.
- Added **Settings** modal: week start (Sun/Mon), language, notifications, and data tools.
- Export/import now supports **JSON backup** and **standard iCal (.ics)**, including recurrence rules.

#### UI / mobile
- Each date now sits in its own square box with a visible border; the calendar card auto-sizes to fit.
- Bigger fonts, larger touch targets, and bigger toolbar/action buttons for mobile use.
- Settings hint now warns that clearing the browser cache/site data deletes local events.

#### PWA & privacy hardening
- Manifest upgraded for installability (id, scope, maskable icons, display override).
- Service worker rewritten: offline fallback to cached shell, query-string-insensitive caching, secure-context registration, cache version bump.
- CSP hardened (explicit `worker-src`/`manifest-src`; `frame-ancestors 'none'` is declared in the meta policy but note it only takes effect when served as an HTTP header — see the `.htaccess`), `no-referrer`, and a Permissions-Policy disabling camera, mic, geolocation, payment, clipboard and sensors.
- Removed cache headers that conflicted with offline caching.

#### Fixes
- Fixed a startup crash from a missing notifications button.
- Search results layout fixed to match the app's styling.
- Week/Year view markup aligned with the stylesheet.

---

## License

Ambr3Calendar is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, version 3 of the License** (or, at your option, any later version).

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU General Public License v3](LICENSE) for details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.



