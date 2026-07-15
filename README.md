# Privacy Calendar

A privacy-first, open-source calendar web app. All data stays on your device — no servers, no accounts, no tracking.

Why PWA? I hate loads of installed apps on my phone, That simple

Why make this? I dont use Caendars to store anything on my phone, but somtimes it just nice to know where a date lands on a day when plan planning things. Also added some important dates for extra info.

## Features

- **100% Private** — events stored in localStorage, nothing leaves your device
- **PWA Support** — install on Android/iOS, works offline
- **Swipe Navigation** — swipe left/right to change months
- **Color-coded Events** — 7 color options for organizing events
- **Recurring Events** — daily, weekly, monthly, yearly, or custom intervals with optional end date
- **World Holidays** — toggle holidays from 36 countries with a country selector
- **Important Dates** — Valentine's Day, Halloween, Mother's/Father's Day, and 12+ more dates
- **Import/Export** — backup and restore your events as JSON
- **Responsive** — works on mobile, tablet, and desktop
- **Zero Dependencies** — vanilla HTML, CSS, JavaScript only

## Countries Supported

| Region | Countries |
|--------|-----------|
| **Americas** | United States, Canada, Mexico, Brazil, Argentina, Colombia, Chile |
| **Europe** | United Kingdom, Ireland, France, Germany, Spain, Portugal, Italy, Netherlands, Belgium, Switzerland, Austria, Sweden, Norway, Denmark, Finland, Poland, Greece, Turkey |
| **Asia-Pacific** | Japan, South Korea, China, Thailand, Philippines, India, Indonesia, Australia, New Zealand |
| **Middle East/Africa** | UAE, South Africa |

## Quick Start

1. Open `index.html` in your browser
2. That's it — no build step, no API keys, no server needed

## Deploy to GitHub Pages

1. Fork or clone this repo
2. Push to GitHub
3. Enable Pages: Settings > Pages > Source: `Deploy from branch` > `main`
4. Your calendar is live at `https://<username>.github.io/<repo>/`

### Install as App (Android)

1. Open the deployed site in Chrome
2. Tap the "Add to Home Screen" prompt
3. The app installs as a standalone PWA

## Privacy

- No analytics, no cookies, no tracking pixels
- No server communication whatsoever
- All data stored in browser localStorage
- Data never leaves your device
- Fully open source — verify it yourself

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, Glassmorphism, Gradients)
- Vanilla JavaScript (ES6+)
- Service Worker (offline caching, network-first strategy)
- Web App Manifest (PWA)

## Project Structure

```
.
├── index.html          # Main app
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── css/
│   └── calendar.css    # Styles
├── js/
│   └── app.js          # Calendar logic
├── icon-192.png        # PWA icon
└── icon-512.png        # PWA icon
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.
