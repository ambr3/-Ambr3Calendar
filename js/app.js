(() => {
  'use strict';

  const STORAGE_KEY = 'privacy_calendar_events';
  const HOLIDAYS_STORAGE_KEY = 'privacy_calendar_holidays_v2';
  const THEME_KEY = 'privacy_calendar_theme';
  const SETTINGS_KEY = 'ambr3_calendar_settings';
  const ACCENT_COLOR_KEY = 'ambr3_calendar_accent';
  const APP_NAME_KEY = 'ambr3_calendar_appname';
  const HOLIDAY_COLOR = '#dc2626';
  const IMPORTANT_COLOR = '#f97316';

  const LANGS = {
    en: { months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], today: 'Today' },
    fr: { months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
          days: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], today: "Aujourd'hui" },
    de: { months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
          days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], today: 'Heute' },
    es: { months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
          days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], today: 'Hoy' },
    it: { months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
          days: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'], today: 'Oggi' },
    nl: { months: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
          days: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'], today: 'Vandaag' },
    pt: { months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
          days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], today: 'Hoje' },
    tr: { months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
          days: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], today: 'Bugün' },
    sr: { months: ['Јануар', 'Фебруар', 'Март', 'Април', 'Мај', 'Јун', 'Јул', 'Август', 'Септембар', 'Октобар', 'Новембар', 'Децембар'],
          days: ['Нед', 'Пон', 'Уто', 'Сре', 'Чет', 'Пет', 'Суб'], today: 'Данас' },
    'sr-lat': { months: ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'],
          days: ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'], today: 'Danas' },
  };

  let currentDate = new Date();
  let selectedDate = null;
  let currentView = 'month';
  let weekStart = 0;
  let lang = 'en';
  let accentColor = '#8b5cf6';
  let appName = '';
  let events = {};
  let selectedCountries = ['uk'];
  let enabledImportantDates = ['valentines', 'halloween', 'mothers_day', 'fathers_day', 'new_years_eve'];
  let allCountryHolidays = {};
  let importantDatesData = {};
  let dragEvent = null;
  let notifiedEvents = {};

  function L() { return LANGS[lang] || LANGS.en; }
  function monthName(m) { return L().months[m] || ''; }
  function dayName(d) { return L().days[d] || ''; }
  function daysOrder() {
    const out = [];
    for (let i = 0; i < 7; i++) out.push((weekStart + i) % 7);
    return out;
  }
  function startOfWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() - weekStart + 7) % 7));
    return d;
  }
  function addDaysKey(key, n) {
    const d = parseDateKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function dayOffset(fromKey, toKey) {
    return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86400000);
  }
  function timeToMinutes(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // ===== THEME =====
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    safeSet(THEME_KEY, next);
    applyTheme(next);
  }

  function initTheme() {
    const saved = safeGet(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  }

  function applyAccentColor(color) {
    accentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);
    safeSet(ACCENT_COLOR_KEY, color);
  }

  function applyAppName(name) {
    appName = name;
    const brandEl = document.getElementById('brand');
    const defaultName = 'Ambr3Calendar';
    if (brandEl) brandEl.textContent = name || defaultName;
    document.title = name || defaultName;
    safeSet(APP_NAME_KEY, name);
  }

  function loadAccentColor() {
    const saved = safeGet(ACCENT_COLOR_KEY);
    if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) {
      applyAccentColor(saved);
    }
  }

  function loadAppName() {
    const saved = safeGet(APP_NAME_KEY);
    if (saved) {
      applyAppName(saved);
    }
  }

  const COUNTRY_META = {
    uk: { name: 'United Kingdom', flag: '🇬🇧' },
    us: { name: 'United States', flag: '🇺🇸' },
    ie: { name: 'Ireland', flag: '🇮🇪' },
    fr: { name: 'France', flag: '🇫🇷' },
    de: { name: 'Germany', flag: '🇩🇪' },
    es: { name: 'Spain', flag: '🇪🇸' },
    pt: { name: 'Portugal', flag: '🇵🇹' },
    it: { name: 'Italy', flag: '🇮🇹' },
    nl: { name: 'Netherlands', flag: '🇳🇱' },
    be: { name: 'Belgium', flag: '🇧🇪' },
    ch: { name: 'Switzerland', flag: '🇨🇭' },
    at: { name: 'Austria', flag: '🇦🇹' },
    se: { name: 'Sweden', flag: '🇸🇪' },
    no: { name: 'Norway', flag: '🇳🇴' },
    dk: { name: 'Denmark', flag: '🇩🇰' },
    fi: { name: 'Finland', flag: '🇫🇮' },
    pl: { name: 'Poland', flag: '🇵🇱' },
    gr: { name: 'Greece', flag: '🇬🇷' },
    tr: { name: 'Turkey', flag: '🇹🇷' },
    jp: { name: 'Japan', flag: '🇯🇵' },
    kr: { name: 'South Korea', flag: '🇰🇷' },
    cn: { name: 'China', flag: '🇨🇳' },
    th: { name: 'Thailand', flag: '🇹🇭' },
    ph: { name: 'Philippines', flag: '🇵🇭' },
    in_: { name: 'India', flag: '🇮🇳' },
    id: { name: 'Indonesia', flag: '🇮🇩' },
    au: { name: 'Australia', flag: '🇦🇺' },
    nz: { name: 'New Zealand', flag: '🇳🇿' },
    ca: { name: 'Canada', flag: '🇨🇦' },
    mx: { name: 'Mexico', flag: '🇲🇽' },
    br: { name: 'Brazil', flag: '🇧🇷' },
    ar: { name: 'Argentina', flag: '🇦🇷' },
    co: { name: 'Colombia', flag: '🇨🇴' },
    cl: { name: 'Chile', flag: '🇨🇱' },
    za: { name: 'South Africa', flag: '🇿🇦' },
    ae: { name: 'UAE', flag: '🇦🇪' },
  };

  const IMPORTANT_DATES_META = {
    valentines:    { name: "Valentine's Day", icon: '💕', fixed: '02-14' },
    april_fools:   { name: "April Fools' Day", icon: '🤡', fixed: '04-01' },
    earth_day:     { name: 'Earth Day', icon: '🌍', fixed: '04-22' },
    halloween:     { name: 'Halloween', icon: '🎃', fixed: '10-31' },
    remembrance:   { name: 'Remembrance Day', icon: '🕊️', fixed: '11-11' },
    new_years_eve: { name: "New Year's Eve", icon: '🎆', fixed: '12-31' },
    womens_day:    { name: "International Women's Day", icon: '💜', fixed: '03-08' },
    mens_day:      { name: "International Men's Day", icon: '💙', fixed: '11-19' },
    world_health:  { name: 'World Health Day', icon: '🏥', fixed: '04-07' },
    world_env:     { name: 'World Environment Day', icon: '🌿', fixed: '06-05' },
    teachers_day:  { name: "World Teachers' Day", icon: '📚', fixed: '10-05' },
    hug_day:       { name: 'National Hug Day', icon: '🤗', fixed: '01-21' },
    pizza_day:     { name: 'World Pizza Day', icon: '🍕', fixed: '02-09' },
    coffee_day:    { name: 'International Coffee Day', icon: '☕', fixed: '10-01' },
    kindness_day:  { name: 'World Kindness Day', icon: '💛', fixed: '11-13' },
    mothers_day:   { name: "Mother's Day", icon: '🌹', computed: 'us_mothers' },
    fathers_day:   { name: "Father's Day", icon: '👔', computed: 'us_fathers' },
  };

  function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function safeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function sanitizeEvent(ev) {
    if (!ev || typeof ev !== 'object') return null;
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    const e = {};
    e.id = (typeof ev.id === 'string' && ev.id ? ev.id : safeId())
      .replace(/[\r\n]/g, '')
      .slice(0, 200);
    e.title = String(ev.title || '').slice(0, 300);
    e.time = timeRe.test(ev.time || '') ? ev.time : null;
    e.endTime = timeRe.test(ev.endTime || '') ? ev.endTime : null;
    e.endDate = dateRe.test(ev.endDate || '') ? ev.endDate : null;
    e.reminder = Number.isFinite(ev.reminder) && ev.reminder >= 0 ? ev.reminder : null;
    e.desc = String(ev.desc || '').slice(0, 2000);
    e.color = /^#[0-9a-fA-F]{6}$/.test(ev.color || '') ? ev.color : '#6366f1';
    if (ev.recurrence && typeof ev.recurrence === 'object') {
      const freq = ev.recurrence.frequency;
      if (freq === 'daily' || freq === 'weekly' || freq === 'monthly' || freq === 'yearly') {
        e.recurrence = {
          frequency: freq,
          interval: Math.max(1, parseInt(ev.recurrence.interval, 10) || 1),
          endDate: dateRe.test(ev.recurrence.endDate || '') ? ev.recurrence.endDate : null,
        };
      }
    }
    if (ev.holiday) e.holiday = true;
    if (ev.important) e.important = true;
    if (ev.country) e.country = String(ev.country).slice(0, 100);
    return e;
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function formatTimeRange(start, end) {
    if (!start) return 'All day';
    let str = formatTime(start);
    if (end) str += ` \u2013 ${formatTime(end)}`;
    return str;
  }

  function nthWeekdayOfMonth(year, month, weekday, n) {
    const d = new Date(year, month, 1);
    let count = 0;
    while (d.getMonth() === month) {
      if (d.getDay() === weekday) {
        count++;
        if (count === n) return d.getDate();
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function lastWeekdayOfMonth(year, month, weekday) {
    const d = new Date(year, month + 1, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d.getDate();
  }

  function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function getEasterMonday(year) {
    const e = getEaster(year);
    e.setDate(e.getDate() + 1);
    return e;
  }

  function getGoodFriday(year) {
    const e = getEaster(year);
    e.setDate(e.getDate() - 2);
    return e;
  }

  function firstMonday(year, month) {
    const d = new Date(year, month, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    return [d.getFullYear(), d.getMonth(), d.getDate()];
  }

  function lastMonday(year, month) {
    const d = new Date(year, month + 1, 0);
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
    return [d.getFullYear(), d.getMonth(), d.getDate()];
  }

  // ===== WORLD HOLIDAYS DATA =====
  const WORLD_HOLIDAYS_DATA = {
    uk: {
      fixed: {
        '01-01': "New Year's Day", '03-01': "St David's Day", '03-17': "St Patrick's Day",
        '04-23': "St George's Day", '07-12': "Battle of the Boyne",
        '12-25': 'Christmas Day', '12-26': 'Boxing Day',
      },
      computed(year) {
        const h = {};
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Easter Monday';
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        h[dateKey(...firstMonday(year, 4))] = 'Early May Bank Holiday';
        h[dateKey(...lastMonday(year, 4))] = 'Spring Bank Holiday';
        h[dateKey(...lastMonday(year, 7))] = 'Summer Bank Holiday';
        return h;
      }
    },
    us: {
      fixed: {
        '01-01': "New Year's Day", '06-19': 'Juneteenth', '07-04': 'Independence Day',
        '11-11': "Veterans Day", '12-25': 'Christmas Day',
      },
      computed(year) {
        const h = {};
        h[dateKey(year, 0, nthWeekdayOfMonth(year, 0, 1, 3))] = 'Martin Luther King Jr. Day';
        h[dateKey(year, 1, nthWeekdayOfMonth(year, 1, 1, 3))] = "Presidents' Day";
        h[dateKey(year, 4, lastWeekdayOfMonth(year, 4, 1))] = 'Memorial Day';
        h[dateKey(year, 8, nthWeekdayOfMonth(year, 8, 1, 1))] = 'Labor Day';
        h[dateKey(year, 10, nthWeekdayOfMonth(year, 10, 4, 4))] = 'Thanksgiving Day';
        return h;
      }
    },
    fr: {
      fixed: {
        '01-01': "Jour de l'An", '05-01': 'Fête du Travail', '05-08': 'Victoire 1945',
        '07-14': 'Fête Nationale', '08-15': 'Assomption', '11-01': 'Toussaint',
        '11-11': 'Armistice', '12-25': 'Noël',
      },
      computed(year) {
        const h = {};
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Lundi de Pâques';
        return h;
      }
    },
    de: {
      fixed: {
        '01-01': 'Neujahrstag', '05-01': 'Tag der Arbeit', '10-03': 'Tag der Deutschen Einheit',
        '12-25': 'Erster Weihnachtstag', '12-26': 'Zweiter Weihnachtstag',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Karfreitag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Ostermontag';
        h[dateKey(year, 9, 31)] = 'Reformationstag';
        h[dateKey(year, 10, 1)] = 'Allerheiligen';
        return h;
      }
    },
    es: {
      fixed: {
        '01-01': 'Año Nuevo', '01-06': 'Día de Reyes', '05-01': 'Día del Trabajo',
        '08-15': 'Asunción', '10-12': 'Fiesta Nacional', '11-01': 'Todos los Santos',
        '12-06': 'Día de la Constitución', '12-08': 'Inmaculada Concepción',
        '12-25': 'Navidad',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Viernes Santo';
        return h;
      }
    },
    it: {
      fixed: {
        '01-01': 'Capodanno', '01-06': 'Epifania', '04-25': 'Festa della Liberazione',
        '05-01': 'Festa del Lavoro', '06-02': 'Festa della Repubblica',
        '08-15': 'Ferragosto', '11-01': 'Ognissanti', '12-08': 'Immacolata Concezione',
        '12-25': 'Natale', '12-26': 'Santo Stefano',
      },
      computed(year) {
        const h = {};
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = "Lunedì dell'Angelo";
        return h;
      }
    },
    jp: {
      fixed: {
        '01-01': '元日 (New Year)', '02-11': '建国記念の日', '02-23': '天皇誕生日',
        '05-03': '宪法纪念日', '05-04': 'みどりの日', '05-05': 'こどもの日',
        '08-11': '山の日', '11-03': '文化の日', '11-23': '勤労感謝の日',
      },
      computed(year) {
        const h = {};
        h[dateKey(year, 0, nthWeekdayOfMonth(year, 0, 1, 2))] = '成人の日';
        h[dateKey(year, 6, nthWeekdayOfMonth(year, 6, 1, 3))] = '海の日';
        h[dateKey(year, 8, nthWeekdayOfMonth(year, 8, 1, 3))] = '敬老の日';
        h[dateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 2))] = 'スポーツの日';
        return h;
      }
    },
    au: {
      fixed: {
        '01-01': "New Year's Day", '01-26': 'Australia Day', '04-25': 'ANZAC Day',
        '12-25': 'Christmas Day', '12-26': 'Boxing Day',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const easter = getEaster(year);
        easter.setDate(easter.getDate() + 1);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Easter Saturday';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Easter Monday';
        h[dateKey(year, 5, nthWeekdayOfMonth(year, 5, 1, 2))] = "Queen's Birthday";
        return h;
      }
    },
    ca: {
      fixed: {
        '01-01': "New Year's Day", '07-01': 'Canada Day', '11-11': 'Remembrance Day',
        '12-25': 'Christmas Day',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Easter Monday';
        h[dateKey(year, 4, lastWeekdayOfMonth(year, 4, 1) < 25 ? lastWeekdayOfMonth(year, 4, 1) : nthWeekdayOfMonth(year, 4, 1, 3))] = 'Victoria Day';
        h[dateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 2))] = 'Thanksgiving';
        return h;
      }
    },
    in_: {
      fixed: {
        '01-26': 'Republic Day', '08-15': 'Independence Day', '10-02': 'Gandhi Jayanti',
      },
      computed(year) {
        const h = {};
        h[dateKey(year, 0, nthWeekdayOfMonth(year, 0, 1, 4) || 26)] = 'Republic Day';
        return h;
      }
    },
    br: {
      fixed: {
        '01-01': 'Ano Novo', '04-21': 'Tiradentes', '05-01': 'Dia do Trabalho',
        '09-07': 'Independência', '10-12': 'Nossa Senhora Aparecida',
        '11-02': 'Finados', '11-15': 'Proclamação da República', '12-25': 'Natal',
      },
      computed(year) {
        const h = {};
        const easter = getEaster(year);
        const carnival = new Date(easter);
        carnival.setDate(carnival.getDate() - 48);
        h[dateKey(carnival.getFullYear(), carnival.getMonth(), carnival.getDate())] = 'Carnaval';
        const corpus = new Date(easter);
        corpus.setDate(corpus.getDate() + 60);
        h[dateKey(corpus.getFullYear(), corpus.getMonth(), corpus.getDate())] = 'Corpus Christi';
        return h;
      }
    },
    cn: {
      fixed: {
        '01-01': '元旦', '05-01': '劳动节', '10-01': '国庆节', '10-02': '国庆节',
      },
      computed(year) {
        const h = {};
        const dates = {
          2024: [['02-10', '春节'], ['02-11', '春节'], ['02-12', '春节'], ['04-04', '清明节'], ['06-10', '端午节'], ['09-17', '中秋节']],
          2025: [['01-29', '春节'], ['01-30', '春节'], ['01-31', '春节'], ['04-04', '清明节'], ['05-31', '端午节'], ['10-06', '中秋节']],
          2026: [['02-17', '春节'], ['02-18', '春节'], ['02-19', '春节'], ['04-05', '清明节'], ['06-19', '端午节'], ['09-25', '中秋节']],
          2027: [['02-06', '春节'], ['02-07', '春节'], ['02-08', '春节'], ['04-05', '清明节'], ['06-09', '端午节'], ['10-15', '中秋节']],
        };
        if (dates[year]) {
          for (const [mmdd, name] of dates[year]) {
            h[`${year}-${mmdd}`] = name;
          }
        }
        return h;
      }
    },
    kr: {
      fixed: {
        '01-01': 'New Year', '03-01': 'Independence Movement Day', '05-05': 'Children\'s Day',
        '06-06': 'Memorial Day', '08-15': 'Liberation Day', '10-03': 'National Foundation Day',
        '10-09': 'Hangul Day', '12-25': 'Christmas',
      },
      computed(year) {
        const h = {};
        const lunar = {
          2024: [['02-10', 'Seollal'], ['02-11', 'Seollal'], ['02-12', 'Seollal'], ['04-10', 'Buddha\'s Birthday'], ['09-17', 'Chuseok'], ['09-18', 'Chuseok'], ['09-19', 'Chuseok']],
          2025: [['01-29', 'Seollal'], ['01-30', 'Seollal'], ['01-31', 'Seollal'], ['05-05', 'Buddha\'s Birthday'], ['10-06', 'Chuseok'], ['10-07', 'Chuseok'], ['10-08', 'Chuseok']],
          2026: [['02-17', 'Seollal'], ['02-18', 'Seollal'], ['02-19', 'Seollal'], ['05-24', 'Buddha\'s Birthday'], ['09-25', 'Chuseok'], ['09-26', 'Chuseok'], ['09-27', 'Chuseok']],
          2027: [['02-06', 'Seollal'], ['02-07', 'Seollal'], ['02-08', 'Seollal'], ['05-13', 'Buddha\'s Birthday'], ['10-15', 'Chuseok'], ['10-16', 'Chuseok'], ['10-17', 'Chuseok']],
        };
        if (lunar[year]) {
          for (const [mmdd, name] of lunar[year]) h[`${year}-${mmdd}`] = name;
        }
        return h;
      }
    },
    ie: {
      fixed: {
        '01-01': 'New Year\'s Day', '03-17': 'St. Patrick\'s Day', '10-31': 'Halloween',
        '12-25': 'Christmas Day', '12-26': 'St. Stephen\'s Day',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Easter Monday';
        h[dateKey(year, 4, nthWeekdayOfMonth(year, 4, 1, 1))] = 'May Bank Holiday';
        h[dateKey(year, 5, nthWeekdayOfMonth(year, 5, 1, 1))] = 'June Bank Holiday';
        h[dateKey(year, 7, nthWeekdayOfMonth(year, 7, 1, 1))] = 'August Bank Holiday';
        h[dateKey(year, 9, lastWeekdayOfMonth(year, 9, 1))] = 'October Bank Holiday';
        return h;
      }
    },
    pt: {
      fixed: {
        '01-01': 'Ano Novo', '04-25': 'Dia da Liberdade', '05-01': 'Dia do Trabalhador',
        '06-10': 'Dia de Portugal', '08-15': 'Assunção', '10-05': 'Implantação da República',
        '11-01': 'Dia de Todos os Santos', '12-01': 'Restauração da Independência', '12-25': 'Natal',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Sexta-feira Santa';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Segunda-feira de Páscoa';
        return h;
      }
    },
    nl: {
      fixed: {
        '01-01': 'Nieuwjaarsdag', '04-27': 'Koningsdag', '05-05': 'Bevrijdingsdag',
        '12-25': 'Eerste Kerstdag', '12-26': 'Tweede Kerstdag',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Goede Vrijdag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Tweede Paasdag';
        const easter = getEaster(year);
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Hemelvaartsdag';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Pinkstermaandag';
        return h;
      }
    },
    be: {
      fixed: {
        '01-01': 'Nieuwjaarsdag', '05-01': 'Dag van de Arbeid', '07-21': 'Nationale Feestdag',
        '08-15': 'Onze-Lieve-Vrouwe Hemelvaart', '11-01': 'Allerheiligen',
        '11-11': 'Wapenstilstand', '12-25': 'Kerstmis',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Goede Vrijdag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Paasmaandag';
        const easter = getEaster(year);
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Pinkstermaandag';
        return h;
      }
    },
    ch: {
      fixed: {
        '01-01': 'Neujahr', '05-01': 'Tag der Arbeit', '08-01': 'Bundesfeier',
        '12-25': 'Weihnachten',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Karfreitag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Ostermontag';
        const easter = getEaster(year);
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Auffahrt';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Pfingstmontag';
        return h;
      }
    },
    at: {
      fixed: {
        '01-01': 'Neujahr', '01-06': 'Heilige Drei Könige', '05-01': 'Staatsfeiertag',
        '08-15': 'Mariä Himmelfahrt', '10-26': 'Nationalfeiertag', '11-01': 'Allerheiligen',
        '12-08': 'Maria Empfängnis', '12-25': 'Christtag', '12-26': 'Stefanstag',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Karfreitag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Ostermontag';
        const easter = getEaster(year);
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Christi Himmelfahrt';
        const corpus = new Date(easter);
        corpus.setDate(corpus.getDate() + 60);
        h[dateKey(corpus.getFullYear(), corpus.getMonth(), corpus.getDate())] = 'Fronleichnam';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Pfingstmontag';
        return h;
      }
    },
    se: {
      fixed: {
        '01-01': 'Nyårsdagen', '01-06': 'Trettondedag Jul', '05-01': 'Första maj',
        '06-06': 'Sveriges nationaldag', '12-25': 'Juldagen', '12-26': 'Annandag jul',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Långfredag';
        const easter = getEaster(year);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Påskdagen';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Annandag påsk';
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Kristi Himmelsfärdsdag';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Pingstdagen';
        return h;
      }
    },
    no: {
      fixed: {
        '01-01': 'Nyttårsdag', '05-01': 'Arbeidernes dag', '05-17': 'Grunnlovsdagen',
        '12-25': 'Første juledag', '12-26': 'Andre juledag',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Langfredag';
        const easter = getEaster(year);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Første påskedag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Andre påskedag';
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Kristi Himmelfartsdag';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Første pinsedag';
        return h;
      }
    },
    dk: {
      fixed: {
        '01-01': 'Nytårsdag', '06-01': 'Grundlovsdag', '12-25': 'Første juledag', '12-26': 'Anden juledag',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Langfredag';
        const easter = getEaster(year);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Første påskedag';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Anden påskedag';
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Kristi Himmelfartsdag';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Første pinsedag';
        return h;
      }
    },
    fi: {
      fixed: {
        '01-01': 'Uudenvuodenpäivä', '01-06': 'Loppiainen', '05-01': 'Vappu',
        '12-06': 'Itsenäisyyspäivä', '12-25': 'Joulupäivä', '12-26': 'Tapaninpäivä',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Pitkäperjantai';
        const easter = getEaster(year);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Pääsiäispäivä';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = '2. pääsiäispäivä';
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Helatorstai';
        const whit = new Date(easter);
        whit.setDate(whit.getDate() + 50);
        h[dateKey(whit.getFullYear(), whit.getMonth(), whit.getDate())] = 'Helluntaipäivä';
        const ms = new Date(year, 5, 20);
        while (ms.getDay() !== 6) ms.setDate(ms.getDate() + 1);
        h[dateKey(ms.getFullYear(), ms.getMonth(), ms.getDate())] = 'Juhannuspäivä';
        return h;
      }
    },
    pl: {
      fixed: {
        '01-01': 'Nowy Rok', '01-06': 'Trzech Króli', '05-01': 'Święto Pracy',
        '05-03': 'Święto Konstytucji', '08-15': 'Wniebowzięcie NMP',
        '11-01': 'Wszystkich Świętych', '11-11': 'Święto Niepodległości',
        '12-25': 'Boże Narodzenie', '12-26': 'Drugi dzień Bożego Narodzenia',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Wielki Piątek';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Poniedziałek Wielkanocny';
        const easter = getEaster(year);
        const corpus = new Date(easter);
        corpus.setDate(corpus.getDate() + 60);
        h[dateKey(corpus.getFullYear(), corpus.getMonth(), corpus.getDate())] = 'Boże Ciało';
        return h;
      }
    },
    gr: {
      fixed: {
        '01-01': 'Πρωτοχρονιά', '01-06': 'Θεοφάνεια', '03-25': 'Εικοσι-πέμπτη Μαρτίου',
        '05-01': 'Εργατική Πρωτομαγιά', '08-15': 'Κοίμηση Θεοτόκου',
        '10-28': 'Επέτειος του ΟΧΙ', '12-25': 'Χριστούγεννα', '12-26': 'Επομένη Χριστουγέννων',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Μεγάλη Παρασκευή';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Δευτέρα Πάσχα';
        return h;
      }
    },
    tr: {
      fixed: {
        '01-01': 'Yılbaşı', '04-23': 'Ulusal Egemenlik Bayramı', '05-01': 'Emek ve Dayanışma Günü',
        '05-19': 'Gençlik ve Spor Bayramı', '07-15': 'Demokrasi Bayramı',
        '08-30': 'Zafer Bayramı', '10-29': 'Cumhuriyet Bayramı',
      },
      computed(year) {
        const h = {};
        const islamic = {
          2024: [['04-10', 'Ramazan Bayramı'], ['04-11', 'Ramazan Bayramı'], ['04-12', 'Ramazan Bayramı'], ['06-17', 'Kurban Bayramı'], ['06-18', 'Kurban Bayramı'], ['06-19', 'Kurban Bayramı'], ['06-20', 'Kurban Bayramı']],
          2025: [['03-30', 'Ramazan Bayramı'], ['03-31', 'Ramazan Bayramı'], ['04-01', 'Ramazan Bayramı'], ['06-07', 'Kurban Bayramı'], ['06-08', 'Kurban Bayramı'], ['06-09', 'Kurban Bayramı'], ['06-10', 'Kurban Bayramı']],
          2026: [['03-20', 'Ramazan Bayramı'], ['03-21', 'Ramazan Bayramı'], ['03-22', 'Ramazan Bayramı'], ['05-27', 'Kurban Bayramı'], ['05-28', 'Kurban Bayramı'], ['05-29', 'Kurban Bayramı'], ['05-30', 'Kurban Bayramı']],
          2027: [['03-09', 'Ramazan Bayramı'], ['03-10', 'Ramazan Bayramı'], ['03-11', 'Ramazan Bayramı'], ['05-17', 'Kurban Bayramı'], ['05-18', 'Kurban Bayramı'], ['05-19', 'Kurban Bayramı'], ['05-20', 'Kurban Bayramı']],
        };
        if (islamic[year]) {
          for (const [mmdd, name] of islamic[year]) h[`${year}-${mmdd}`] = name;
        }
        return h;
      }
    },
    th: {
      fixed: {
        '01-01': 'New Year\'s Day', '04-06': 'Chakri Memorial Day', '04-13': 'Songkran',
        '04-14': 'Songkran', '04-15': 'Songkran', '05-01': 'Labour Day',
        '05-04': 'Coronation Day', '07-28': 'King\'s Birthday', '08-12': 'Queen\'s Birthday',
        '10-13': 'King Bhumibol Memorial', '10-23': 'Chulalongkorn Day',
        '12-05': 'King Bhumibol Birthday', '12-10': 'Constitution Day',
      },
      computed: null
    },
    ph: {
      fixed: {
        '01-01': 'New Year\'s Day', '04-09': 'Araw ng Kagitingan', '05-01': 'Labor Day',
        '06-12': 'Independence Day', '08-21': 'Ninoy Aquino Day',
        '11-01': 'All Saints\' Day', '11-30': 'Bonifacio Day',
        '12-25': 'Christmas Day', '12-30': 'Rizal Day', '12-31': 'Last Day of Year',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const easter = getEaster(year);
        easter.setDate(easter.getDate() - 2);
        h[dateKey(easter.getFullYear(), easter.getMonth(), easter.getDate())] = 'Maundy Thursday';
        h[dateKey(year, 7, lastWeekdayOfMonth(year, 7, 1))] = 'National Heroes Day';
        return h;
      }
    },
    id: {
      fixed: {
        '01-01': 'Tahun Baru', '05-01': 'Hari Buruh', '08-17': 'Hari Kemerdekaan',
        '12-25': 'Natal',
      },
      computed(year) {
        const h = {};
        const islamic = {
          2024: [['04-10', 'Idul Fitri'], ['04-11', 'Idul Fitri'], ['06-17', 'Idul Adha'], ['07-07', 'Tahun Baru Islam']],
          2025: [['03-30', 'Idul Fitri'], ['03-31', 'Idul Fitri'], ['06-07', 'Idul Adha'], ['06-26', 'Tahun Baru Islam']],
          2026: [['03-20', 'Idul Fitri'], ['03-21', 'Idul Fitri'], ['05-27', 'Idul Adha'], ['06-16', 'Tahun Baru Islam']],
          2027: [['03-09', 'Idul Fitri'], ['03-10', 'Idul Fitri'], ['05-17', 'Idul Adha'], ['06-05', 'Tahun Baru Islam']],
        };
        if (islamic[year]) {
          for (const [mmdd, name] of islamic[year]) h[`${year}-${mmdd}`] = name;
        }
        const buddha = {
          2024: '05-23', 2025: '05-12', 2026: '05-31', 2027: '05-19',
        };
        if (buddha[year]) h[`${year}-${buddha[year]}`] = 'Waisak';
        const asc = new Date(getEaster(year));
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Kenaikan Yesus';
        return h;
      }
    },
    nz: {
      fixed: {
        '01-01': 'New Year\'s Day', '01-02': 'Day after New Year\'s',
        '02-06': 'Waitangi Day', '04-25': 'ANZAC Day',
        '12-25': 'Christmas Day', '12-26': 'Boxing Day',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Easter Monday';
        h[dateKey(year, 5, nthWeekdayOfMonth(year, 5, 1, 1))] = 'Queen\'s Birthday';
        h[dateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 4))] = 'Labour Day';
        return h;
      }
    },
    mx: {
      fixed: {
        '01-01': 'Año Nuevo', '05-01': 'Día del Trabajo', '09-16': 'Día de la Independencia',
        '11-02': 'Día de los Muertos', '12-25': 'Navidad',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Viernes Santo';
        h[dateKey(year, 0, nthWeekdayOfMonth(year, 0, 1, 1))] = 'Día de los Reyes';
        h[dateKey(year, 1, nthWeekdayOfMonth(year, 1, 1, 1))] = 'Día de la Constitución';
        h[dateKey(year, 2, nthWeekdayOfMonth(year, 2, 1, 3))] = 'Natalicio de Benito Juárez';
        h[dateKey(year, 9, nthWeekdayOfMonth(year, 9, 1, 2))] = 'Día de la Raza';
        h[dateKey(year, 10, nthWeekdayOfMonth(year, 10, 1, 3))] = 'Revolución Mexicana';
        return h;
      }
    },
    ar: {
      fixed: {
        '01-01': 'Año Nuevo', '05-01': 'Día del Trabajador', '05-25': 'Revolución de Mayo',
        '06-20': 'Día de la Bandera', '07-09': 'Día de la Independencia',
        '12-08': 'Inmaculada Concepción', '12-25': 'Navidad',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Viernes Santo';
        const easter = getEaster(year);
        const carnivalMon = new Date(easter);
        carnivalMon.setDate(carnivalMon.getDate() - 48);
        h[dateKey(carnivalMon.getFullYear(), carnivalMon.getMonth(), carnivalMon.getDate())] = 'Carnaval';
        return h;
      }
    },
    co: {
      fixed: {
        '01-01': 'Año Nuevo', '01-06': 'Día de los Reyes Magos', '03-19': 'Día de San José',
        '05-01': 'Día del Trabajo', '07-20': 'Día de la Independencia',
        '08-07': 'Batalla de Boyacá', '08-15': 'Asunción de la Virgen',
        '10-12': 'Día de la Raza', '11-01': 'Todos los Santos',
        '11-11': 'Independencia de Cartagena', '12-08': 'Inmaculada Concepción',
        '12-25': 'Navidad',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Viernes Santo';
        const easter = getEaster(year);
        const asc = new Date(easter);
        asc.setDate(asc.getDate() + 39);
        h[dateKey(asc.getFullYear(), asc.getMonth(), asc.getDate())] = 'Ascensión del Señor';
        const corpus = new Date(easter);
        corpus.setDate(corpus.getDate() + 60);
        h[dateKey(corpus.getFullYear(), corpus.getMonth(), corpus.getDate())] = 'Corpus Christi';
        const sacred = new Date(easter);
        sacred.setDate(sacred.getDate() + 68);
        h[dateKey(sacred.getFullYear(), sacred.getMonth(), sacred.getDate())] = 'Sagrado Corazón';
        return h;
      }
    },
    cl: {
      fixed: {
        '01-01': 'Año Nuevo', '05-01': 'Día del Trabajo', '05-21': 'Día de las Glorias Navales',
        '06-26': 'San Pedro y San Pablo', '07-16': 'Virgen del Carmen',
        '08-15': 'Asunción de la Virgen', '09-18': 'Fiestas Patrias',
        '09-19': 'Glorias del Ejército', '10-12': 'Encuentro de Dos Mundos',
        '11-01': 'Día de los Santos', '12-08': 'Inmaculada Concepción', '12-25': 'Navidad',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Viernes Santo';
        return h;
      }
    },
    za: {
      fixed: {
        '01-01': 'New Year\'s Day', '03-21': 'Human Rights Day', '04-27': 'Freedom Day',
        '05-01': 'Workers\' Day', '06-16': 'Youth Day', '08-09': 'National Women\'s Day',
        '09-24': 'Heritage Day', '12-16': 'Day of Reconciliation',
        '12-25': 'Christmas Day', '12-26': 'Day of Goodwill',
      },
      computed(year) {
        const h = {};
        const gf = getGoodFriday(year);
        h[dateKey(gf.getFullYear(), gf.getMonth(), gf.getDate())] = 'Good Friday';
        const em = getEasterMonday(year);
        h[dateKey(em.getFullYear(), em.getMonth(), em.getDate())] = 'Family Day';
        return h;
      }
    },
    ae: {
      fixed: {
        '01-01': 'New Year\'s Day', '12-02': 'National Day', '12-03': 'National Day (observed)',
      },
      computed(year) {
        const h = {};
        const islamic = {
          2024: [['04-10', 'Eid al-Fitr'], ['04-11', 'Eid al-Fitr'], ['06-17', 'Eid al-Adha'], ['06-18', 'Eid al-Adha'], ['06-19', 'Eid al-Adha'], ['07-07', 'Islamic New Year']],
          2025: [['03-30', 'Eid al-Fitr'], ['03-31', 'Eid al-Fitr'], ['06-07', 'Eid al-Adha'], ['06-08', 'Eid al-Adha'], ['06-09', 'Eid al-Adha'], ['06-26', 'Islamic New Year']],
          2026: [['03-20', 'Eid al-Fitr'], ['03-21', 'Eid al-Fitr'], ['05-27', 'Eid al-Adha'], ['05-28', 'Eid al-Adha'], ['05-29', 'Eid al-Adha'], ['06-16', 'Islamic New Year']],
          2027: [['03-09', 'Eid al-Fitr'], ['03-10', 'Eid al-Fitr'], ['05-17', 'Eid al-Adha'], ['05-18', 'Eid al-Adha'], ['05-19', 'Eid al-Adha'], ['06-05', 'Islamic New Year']],
        };
        if (islamic[year]) {
          for (const [mmdd, name] of islamic[year]) h[`${year}-${mmdd}`] = name;
        }
        return h;
      }
    },
  };

  // ===== PRECOMPUTE HOLIDAYS =====
  function precomputeAllHolidays() {
    const thisYear = new Date().getFullYear();
    for (const [code, data] of Object.entries(WORLD_HOLIDAYS_DATA)) {
      allCountryHolidays[code] = {};
      for (let y = thisYear - 1; y <= thisYear + 2; y++) {
        for (const [mmdd, name] of Object.entries(data.fixed || {})) {
          allCountryHolidays[code][`${y}-${mmdd}`] = name;
        }
        if (data.computed) {
          Object.assign(allCountryHolidays[code], data.computed(y));
        }
      }
    }
  }

  function precomputeImportantDates() {
    const thisYear = new Date().getFullYear();
    importantDatesData = {};
    for (const [id, meta] of Object.entries(IMPORTANT_DATES_META)) {
      importantDatesData[id] = {};
      if (meta.fixed) {
        for (let y = thisYear - 1; y <= thisYear + 2; y++) {
          importantDatesData[id][`${y}-${meta.fixed}`] = meta.name;
        }
      }
      if (meta.computed === 'us_mothers') {
        for (let y = thisYear - 1; y <= thisYear + 2; y++) {
          const day = nthWeekdayOfMonth(y, 4, 0, 2);
          if (day) importantDatesData[id][dateKey(y, 4, day)] = meta.name;
        }
      }
      if (meta.computed === 'us_fathers') {
        for (let y = thisYear - 1; y <= thisYear + 2; y++) {
          const day = nthWeekdayOfMonth(y, 5, 0, 3);
          if (day) importantDatesData[id][dateKey(y, 5, day)] = meta.name;
        }
      }
    }
  }

  // ===== DOM =====
  const currentMonthEl = document.getElementById('current-month');
  const weekdayHeader = document.getElementById('weekday-header');
  const daysGrid = document.getElementById('days-grid');
  const eventPanel = document.getElementById('event-panel');
  const panelDate = document.getElementById('panel-date');
  const eventsList = document.getElementById('events-list');
  const eventModal = document.getElementById('event-modal');
  const eventForm = document.getElementById('event-form');
  const deleteBtn = document.getElementById('delete-event-btn');
  const holidaysPanel = document.getElementById('holidays-panel');
  const settingsModal = document.getElementById('settings-modal');
  const searchOverlay = document.getElementById('search-overlay');
  let editingKey = null;

  // ===== ANDROID TIME FIX =====
  const timeValues = {};
  function setupTimeInputFix() {
    ['event-time', 'event-end-time'].forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', () => { timeValues[id] = input.value; });
      input.addEventListener('input', () => { timeValues[id] = input.value; });
      input.addEventListener('blur', () => { timeValues[id] = input.value; });
    });
  }

  function scrollInputIntoView(input) {
    const modal = input.closest('.modal-content');
    if (!modal) return;
    const focus = () => {
      const rect = input.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const within = rect.top >= modalRect.top && rect.bottom <= modalRect.bottom;
      if (!within) input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    setTimeout(focus, 300);
    setTimeout(focus, 700);
  }

  // ===== INIT =====
  function init() {
    initTheme();
    loadAccentColor();
    loadAppName();
    loadSettings();
    loadEvents();
    loadHolidayPreference();
    precomputeAllHolidays();
    precomputeImportantDates();
    buildJumpOptions();
    populateSettings();
    renderCalendar();
    bindEvents();
    setupTimeInputFix();
    registerSW();
    initReminders();
  }

  // ===== STORAGE =====
  function loadEvents() {
    try {
      const raw = safeGet(STORAGE_KEY);
      events = raw ? JSON.parse(raw) : {};
      if (!events || typeof events !== 'object') { events = {}; return; }
      for (const key of Object.keys(events)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(events[key])) { delete events[key]; continue; }
        events[key] = events[key].map(sanitizeEvent).filter(Boolean);
        if (!events[key].length) delete events[key];
      }
    } catch { events = {}; }
  }

  function saveEvents() {
    safeSet(STORAGE_KEY, JSON.stringify(events));
  }

  function loadHolidayPreference() {
    const saved = safeGet(HOLIDAYS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.countries)) {
        const valid = parsed.countries.filter(c => COUNTRY_META[c]);
        if (valid.length) selectedCountries = valid;
      }
      if (Array.isArray(parsed.important)) {
        const valid = parsed.important.filter(id => IMPORTANT_DATES_META[id]);
        if (valid.length) enabledImportantDates = valid;
      }
    } catch { /* keep defaults */ }
  }

  function saveHolidayPreference() {
    safeSet(HOLIDAYS_STORAGE_KEY, JSON.stringify({
      countries: selectedCountries,
      important: enabledImportantDates,
    }));
  }

  // ===== SETTINGS =====
  function loadSettings() {
    try {
      const s = JSON.parse(safeGet(SETTINGS_KEY) || '{}');
      if (s.weekStart === 0 || s.weekStart === 1) weekStart = s.weekStart;
      if (s.lang && LANGS[s.lang]) lang = s.lang;
    } catch { /* keep defaults */ }
  }

  function saveSettings() {
    safeSet(SETTINGS_KEY, JSON.stringify({ weekStart, lang }));
  }

  function populateSettings() {
    document.getElementById('week-start-select').value = String(weekStart);
    const ls = document.getElementById('lang-select');
    const langNames = { en: 'English', fr: 'Fran\u00e7ais', de: 'Deutsch', es: 'Espa\u00f1ol', it: 'Italiano', nl: 'Nederlands', pt: 'Portugu\u00eas', tr: 'T\u00fcrk\u00e7e', sr: '\u0421\u0440\u043f\u0441\u043a\u0438', 'sr-lat': 'Srpski' };
    ls.innerHTML = Object.keys(LANGS).map(c => `<option value="${c}">${langNames[c] || c}</option>`).join('');
    ls.value = lang;
    document.getElementById('accent-color-input').value = accentColor;
    document.getElementById('app-name-input').value = appName;
  }

  function setView(view) {
    currentView = view;
    updateViewButtons();
    renderCalendar();
  }

  function updateViewButtons() {
    document.querySelectorAll('.view-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === currentView);
    });
  }

  function viewTitle() {
    if (currentView === 'year') return String(currentDate.getFullYear());
    if (currentView === 'week') {
      const s = startOfWeek(currentDate);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      if (s.getFullYear() !== e.getFullYear()) return `${monthName(s.getMonth())} ${s.getFullYear()} \u2013 ${monthName(e.getMonth())} ${e.getFullYear()}`;
      if (s.getMonth() !== e.getMonth()) return `${monthName(s.getMonth())} \u2013 ${monthName(e.getMonth())} ${e.getFullYear()}`;
      return `${monthName(s.getMonth())} ${s.getFullYear()}`;
    }
    return `${monthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
  }

  function formatShortDate(d) {
    return `${d.getDate()} ${monthName(d.getMonth()).slice(0, 3)} ${d.getFullYear()}`;
  }

  // ===== QUICK JUMP =====
  function buildJumpOptions() {
    const m = document.getElementById('jump-month');
    m.innerHTML = L().months.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    const y = document.getElementById('jump-year');
    const yr = currentDate.getFullYear();
    const opts = [];
    for (let i = yr - 10; i <= yr + 10; i++) opts.push(`<option value="${i}">${i}</option>`);
    y.innerHTML = opts.join('');
  }

  function toggleJump() {
    const pop = document.getElementById('jump-pop');
    if (pop.classList.contains('hidden')) {
      document.getElementById('jump-month').value = currentDate.getMonth();
      document.getElementById('jump-year').value = currentDate.getFullYear();
      pop.classList.remove('hidden');
    } else {
      pop.classList.add('hidden');
    }
  }

  function applyJump() {
    const m = parseInt(document.getElementById('jump-month').value, 10);
    const y = parseInt(document.getElementById('jump-year').value, 10);
    currentDate = new Date(y, m, 1);
    document.getElementById('jump-pop').classList.add('hidden');
    setView('month');
  }

  // ===== SEARCH =====
  function openSearch() {
    document.getElementById('search-overlay').classList.remove('hidden');
    const inp = document.getElementById('search-input');
    inp.value = '';
    document.getElementById('search-results').innerHTML = '<div class="search-empty">Type to search your events</div>';
    setTimeout(() => inp.focus(), 50);
  }

  function closeSearch() {
    document.getElementById('search-overlay').classList.add('hidden');
  }

  function runSearch(q) {
    const res = document.getElementById('search-results');
    const needle = q.trim().toLowerCase();
    if (!needle) {
      res.innerHTML = '<div class="search-empty">Type to search your events</div>';
      return;
    }
    const matches = [];
    for (const [key, evs] of Object.entries(events)) {
      for (const ev of evs) {
        if ((ev.title || '').toLowerCase().includes(needle) || (ev.desc || '').toLowerCase().includes(needle)) {
          matches.push({ key, ev });
        }
      }
    }
    if (matches.length === 0) {
      res.innerHTML = '<div class="search-empty">No matching events</div>';
      return;
    }
    res.innerHTML = '';
    matches.slice(0, 50).forEach(({ key, ev }) => {
      const d = parseDateKey(key);
      const item = document.createElement('div');
      item.className = 'search-result-item';
      const bar = document.createElement('div');
      bar.className = 'event-color-bar';
      bar.style.background = ev.color || '#6366f1';
      const info = document.createElement('div');
      info.className = 'search-result-info';
      const title = document.createElement('div');
      title.className = 'search-result-title';
      title.textContent = ev.title;
      const meta = document.createElement('div');
      meta.className = 'search-result-meta';
      meta.textContent = `${d.getDate()} ${monthName(d.getMonth())}`;
      info.appendChild(title);
      info.appendChild(meta);
      item.appendChild(bar);
      item.appendChild(info);
      item.addEventListener('click', () => {
        closeSearch();
        currentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        setView('month');
        openPanel(key);
      });
      res.appendChild(item);
    });
  }

  // ===== SETTINGS MODAL =====
  function openSettings() {
    if ('Notification' in window) syncReminderBtn();
    document.getElementById('settings-modal').classList.remove('hidden');
  }

  function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  // ===== REMINDERS =====
  function syncReminderBtn() {
    const btn = document.getElementById('reminder-permission-btn');
    if (!btn) return;
    if (Notification.permission === 'granted') {
      btn.textContent = 'Notifications enabled';
      btn.disabled = true;
    } else if (Notification.permission === 'denied') {
      btn.textContent = 'Notifications blocked by browser';
      btn.disabled = true;
    } else {
      btn.textContent = 'Enable notifications';
      btn.disabled = false;
    }
  }

  function initReminders() {
    if (!('Notification' in window)) return;
    const btn = document.getElementById('reminder-permission-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        Notification.requestPermission().then(syncReminderBtn).catch(() => {});
      });
    }
    syncReminderBtn();
    checkReminders();
    setInterval(checkReminders, 30000);
  }

  function checkReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const nowKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const tryNotify = (key, ev) => {
      if (ev.holiday || ev.important || !ev.time || ev.reminder == null) return;
      const [h, m] = ev.time.split(':').map(Number);
      const d = parseDateKey(key);
      d.setHours(h, m, 0, 0);
      const minDiff = Math.round((d.getTime() - now.getTime()) / 60000);
      if (minDiff < 0 || minDiff > ev.reminder) return;
      const nid = key + '_' + ev.id + '_' + ev.reminder;
      if (notifiedEvents[nid]) return;
      notifiedEvents[nid] = true;
      const when = ev.reminder === 0
        ? 'now'
        : ev.reminder >= 60
        ? `${Math.round(ev.reminder / 60)} hour(s) before`
        : `${ev.reminder} minutes before`;
      try {
        new Notification(ev.title, { body: `${formatTime(ev.time)} \u00B7 ${when}`, tag: nid });
      } catch { /* notifications may fail on some platforms */ }
      const ids = Object.keys(notifiedEvents);
      if (ids.length > 500) delete notifiedEvents[ids[0]];
    };
    for (const [key, evs] of Object.entries(events)) {
      if (key < nowKey) continue;
      for (const ev of evs) tryNotify(key, ev);
    }
    for (const ev of getRecurringEventsForKey(nowKey)) tryNotify(nowKey, ev);
  }

  // ===== DRAG & DROP =====
  function makeDraggable(el, key, evId) {
    el.draggable = true;
    el.addEventListener('dragstart', (e) => {
      dragEvent = { id: evId, fromKey: key };
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', evId); } catch { /* ignore */ }
      el.classList.add('drag-source');
    });
    el.addEventListener('dragend', () => {
      dragEvent = null;
      el.classList.remove('drag-source');
      document.querySelectorAll('.drop-active').forEach(d => d.classList.remove('drop-active'));
    });
  }

  function setupDrop(el) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop-active'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-active'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drop-active');
      if (!dragEvent) return;
      const toKey = el.dataset.key;
      if (!toKey || toKey === dragEvent.fromKey) return;
      const list = events[dragEvent.fromKey] || [];
      const idx = list.findIndex(x => x.id === dragEvent.id);
      if (idx < 0) return;
      const ev = list[idx];
      list.splice(idx, 1);
      if (!list.length) delete events[dragEvent.fromKey];
      if (ev.endDate) ev.endDate = addDaysKey(ev.endDate, dayOffset(dragEvent.fromKey, toKey));
      if (!events[toKey]) events[toKey] = [];
      events[toKey].push(ev);
      saveEvents();
      renderCalendar();
    });
  }

  // ===== HOLIDAYS =====
  function getHolidaysForKey(key) {
    const holidays = [];
    for (const code of selectedCountries) {
      const countryKey = code === 'in_' ? 'in_' : code;
      if (allCountryHolidays[countryKey] && allCountryHolidays[countryKey][key]) {
        holidays.push({ name: allCountryHolidays[countryKey][key], country: COUNTRY_META[code]?.name || code });
      }
    }
    for (const id of enabledImportantDates) {
      if (importantDatesData[id] && importantDatesData[id][key]) {
        holidays.push({ name: importantDatesData[id][key], country: '__important__', icon: IMPORTANT_DATES_META[id]?.icon || '📌' });
      }
    }
    return holidays;
  }

  // ===== RECURRENCE =====
  function isRecurringOnDate(startDate, targetDate, recurrence) {
    if (targetDate <= startDate) return false;
    if (recurrence.endDate) {
      const endDate = parseDateKey(recurrence.endDate);
      if (targetDate > endDate) return false;
    }
    const diffMs = targetDate.getTime() - startDate.getTime();
    const dayDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const interval = recurrence.interval || 1;

    switch (recurrence.frequency) {
      case 'daily':
        return dayDiff % interval === 0;
      case 'weekly':
        return dayDiff % (7 * interval) === 0;
      case 'monthly': {
        const monthDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
                          (targetDate.getMonth() - startDate.getMonth());
        return monthDiff % interval === 0 && targetDate.getDate() === startDate.getDate();
      }
      case 'yearly': {
        const yearDiff = targetDate.getFullYear() - startDate.getFullYear();
        return yearDiff % interval === 0 &&
               targetDate.getMonth() === startDate.getMonth() &&
               targetDate.getDate() === startDate.getDate();
      }
      default:
        return false;
    }
  }

  function getRecurringEventsForKey(key) {
    const targetDate = parseDateKey(key);
    const results = [];
    for (const [dateStr, dayEvents] of Object.entries(events)) {
      if (dateStr === key) continue;
      for (const ev of dayEvents) {
        if (ev.recurrence && ev.recurrence.frequency !== 'none') {
          const startDate = parseDateKey(dateStr);
          if (isRecurringOnDate(startDate, targetDate, ev.recurrence)) {
            results.push({ ...ev, originalDate: dateStr });
          }
        }
      }
    }
    return results;
  }

  // ===== GET EVENTS FOR KEY =====
  function getSpanningEventsForKey(key) {
    const target = parseDateKey(key);
    const results = [];
    for (const [dateStr, dayEvents] of Object.entries(events)) {
      if (dateStr === key) continue;
      for (const ev of dayEvents) {
        if (ev.endDate && !ev.recurrence) {
          const start = parseDateKey(dateStr);
          const end = parseDateKey(ev.endDate);
          if (target >= start && target <= end) results.push({ ...ev, originalDate: dateStr });
        }
      }
    }
    return results;
  }

  function getEventsForKey(key) {
    const userEvs = events[key] || [];
    const recurringEvs = getRecurringEventsForKey(key);
    const spanningEvs = getSpanningEventsForKey(key);
    const allUserEvs = [...recurringEvs, ...spanningEvs, ...userEvs];

    const holidays = getHolidaysForKey(key);
    if (holidays.length > 0) {
      const holidayEvs = holidays.map((h, i) => ({
        id: h.country === '__important__' ? `__important_${i}__` : `__holiday_${i}__`,
        title: h.name,
        color: h.country === '__important__' ? IMPORTANT_COLOR : HOLIDAY_COLOR,
        holiday: h.country !== '__important__',
        important: h.country === '__important__',
        country: h.country,
        icon: h.icon,
      }));
      return [...holidayEvs, ...allUserEvs];
    }
    return allUserEvs;
  }

  // ===== RENDER =====
  function renderWeekdays() {
    weekdayHeader.innerHTML = daysOrder().map(d => `<span>${dayName(d)}</span>`).join('');
  }

  function renderCalendar() {
    currentMonthEl.textContent = viewTitle();
    updateViewButtons();
    if (currentView === 'week') return renderWeekView();
    if (currentView === 'year') return renderYearView();
    renderMonthView();
  }

  function renderMonthView() {
    document.getElementById('month-view').classList.remove('hidden');
    weekdayHeader.classList.remove('hidden');
    daysGrid.classList.remove('hidden');
    document.getElementById('week-view').classList.add('hidden');
    document.getElementById('year-view').classList.add('hidden');
    renderWeekdays();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const lead = (firstDay - weekStart + 7) % 7;
    daysGrid.innerHTML = '';

    for (let i = lead - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      daysGrid.appendChild(createDayCell(new Date(year, month - 1, day), day, true, false));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = dateKey(year, month, day);
      daysGrid.appendChild(createDayCell(d, day, false, key === todayKey));
    }
    const totalCells = lead + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      daysGrid.appendChild(createDayCell(new Date(year, month + 1, day), day, true, false));
    }
    renderMonthEventsList();
  }

  function renderWeekView() {
    weekdayHeader.classList.add('hidden');
    daysGrid.classList.add('hidden');
    document.getElementById('month-view').classList.add('hidden');
    document.getElementById('year-view').classList.add('hidden');
    document.getElementById('month-events-list').classList.add('hidden');
    const wk = document.getElementById('week-view');
    wk.classList.remove('hidden');
    wk.innerHTML = '';

    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const start = startOfWeek(currentDate);
    const hourPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--week-hour')) || 48;

    const body = document.createElement('div');
    body.className = 'week-body';

    const gutter = document.createElement('div');
    gutter.className = 'week-gutter';
    for (let h = 0; h < 24; h++) {
      const lab = document.createElement('div');
      lab.className = 'week-gutter-label';
      lab.textContent = `${String(h).padStart(2, '0')}:00`;
      gutter.appendChild(lab);
    }
    body.appendChild(gutter);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      const isToday = key === todayKey;
      const isOther = d.getMonth() !== currentDate.getMonth();

      const col = document.createElement('div');
      col.className = 'week-col';
      col.dataset.key = key;
      const head = document.createElement('div');
      head.className = 'week-day-head' + (isToday ? ' today' : '') + (isOther ? ' other-month' : '');
      head.innerHTML = `<span>${dayName(d.getDay())}</span><span class="week-day-num">${d.getDate()}</span>`;
      col.appendChild(head);

      const slots = document.createElement('div');
      slots.className = 'week-slots';

      for (let h = 0; h < 24; h++) {
        const s = document.createElement('div');
        s.className = 'week-slot' + (h < 23 ? ' half' : '');
        slots.appendChild(s);
      }

      const evs = getEventsForKey(key);
      evs.forEach(ev => {
        const pill = document.createElement('div');
        pill.className = 'week-event';
        pill.style.background = ev.color || '#6366f1';
        if (ev.holiday) pill.classList.add('holiday');
        const minutes = ev.time ? timeToMinutes(ev.time) : 0;
        const endMin = ev.endTime ? timeToMinutes(ev.endTime) : Math.min(minutes + 60, 1440);
        pill.style.top = (minutes / 60 * hourPx) + 'px';
        pill.style.height = Math.max((endMin - minutes) / 60 * hourPx, 22) + 'px';
        pill.textContent = (ev.time ? ev.time.slice(0, 5) + ' ' : '') + ev.title;
        pill.title = ev.title;
        if (!ev.holiday && !ev.important) {
          makeDraggable(pill, ev.originalDate || key, ev.id);
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(ev.originalDate || key, ev.id);
          });
        }
        slots.appendChild(pill);
      });

      col.appendChild(slots);
      setupDrop(col);
      col.addEventListener('click', (e) => {
        if (e.target.closest('.week-event')) return;
        openPanel(key);
      });
      body.appendChild(col);
    }
    wk.appendChild(body);

    const todayArr = new Date();
    const weekStartDate = startOfWeek(currentDate);
    const scrollRange = new Date(weekStartDate);
    scrollRange.setDate(scrollRange.getDate() + 7);
    if (todayArr >= weekStartDate && todayArr < scrollRange) {
      const nowMin = todayArr.getHours() * 60 + todayArr.getMinutes();
      requestAnimationFrame(() => {
        const wkBody = wk.querySelector('.week-body');
        if (wkBody) wkBody.scrollTop = Math.max(0, (nowMin / 60) * hourPx - 120);
      });
    }
  }

  function renderYearView() {
    weekdayHeader.classList.add('hidden');
    daysGrid.classList.add('hidden');
    document.getElementById('month-view').classList.add('hidden');
    document.getElementById('week-view').classList.add('hidden');
    document.getElementById('month-events-list').classList.add('hidden');
    const yv = document.getElementById('year-view');
    yv.classList.remove('hidden');
    yv.innerHTML = '';

    const year = currentDate.getFullYear();
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    for (let m = 0; m < 12; m++) {
      const box = document.createElement('div');
      box.className = 'year-month';
      const title = document.createElement('div');
      title.className = 'year-month-title';
      title.textContent = `${monthName(m)} ${year}`;
      title.addEventListener('click', () => {
        currentDate = new Date(year, m, 1);
        setView('month');
      });
      box.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'year-grid';
      for (let i = 0; i < 7; i++) {
        const w = document.createElement('div');
        w.className = 'wk';
        w.textContent = dayName((weekStart + i) % 7).slice(0, 1);
        grid.appendChild(w);
      }
      const first = new Date(year, m, 1);
      const fow = (first.getDay() - weekStart + 7) % 7;
      for (let i = 0; i < fow; i++) {
        const c = document.createElement('div');
        c.className = 'year-day other-month';
        grid.appendChild(c);
      }
      const dim = new Date(year, m + 1, 0).getDate();
      for (let day = 1; day <= dim; day++) {
        const key = dateKey(year, m, day);
        const cell = document.createElement('div');
        cell.className = 'year-day';
        if (key === todayKey) cell.classList.add('today');
        if (getEventsForKey(key).length) cell.classList.add('has-events');
        cell.textContent = day;
        cell.addEventListener('click', () => {
          currentDate = new Date(year, m, day);
          setView('month');
        });
        grid.appendChild(cell);
      }
      box.appendChild(grid);
      yv.appendChild(box);
    }
  }

  function createDayCell(date, dayNum, isOther, isToday) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isOther) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');

    const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
    cell.dataset.key = key;
    if (selectedDate && key === selectedDate) cell.classList.add('selected');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = dayNum;
    cell.appendChild(num);

    const dayEvents = getEventsForKey(key);
    if (dayEvents.length > 0) {
      const hl = document.createElement('div');
      hl.className = 'date-highlight';
      hl.style.background = dayEvents[0].color || '#6366f1';
      hl.title = dayEvents.map(ev => ev.title).join(', ');
      cell.appendChild(hl);
    }

    setupDrop(cell);
    cell.addEventListener('click', () => openPanel(key));
    return cell;
  }

  function renderMonthEventsList() {
    const el = document.getElementById('month-events-list');
    el.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const key = dateKey(year, month, day);
      getEventsForKey(key).forEach(ev => rows.push({ key, day, ev }));
    }

    if (rows.length === 0) {
      el.classList.add('hidden');
      return;
    }

    rows.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      if (a.ev.holiday && !b.ev.holiday) return -1;
      if (!a.ev.holiday && b.ev.holiday) return 1;
      if (a.ev.important && !b.ev.important) return -1;
      if (!a.ev.important && b.ev.important) return 1;
      return timeToMinutes(a.ev.time) - timeToMinutes(b.ev.time);
    });

    const title = document.createElement('div');
    title.className = 'month-list-title';
    title.textContent = `${monthName(month)} ${year} · ${rows.length} ${rows.length === 1 ? 'event' : 'events'}`;
    el.appendChild(title);

    rows.forEach(({ key, day, ev }) => {
      const item = document.createElement('div');
      item.className = 'event-item';

      const date = document.createElement('div');
      date.className = 'month-ev-date';
      const dayNum = document.createElement('div');
      dayNum.className = 'month-ev-day';
      dayNum.textContent = day;
      const wd = document.createElement('div');
      wd.className = 'month-ev-wd';
      wd.textContent = dayName(new Date(year, month, day).getDay()).slice(0, 3);
      date.appendChild(dayNum);
      date.appendChild(wd);
      item.appendChild(date);

      const bar = document.createElement('div');
      bar.className = 'event-color-bar';
      bar.style.background = ev.color || '#6366f1';
      item.appendChild(bar);

      const info = document.createElement('div');
      info.className = 'event-info';

      const name = document.createElement('div');
      name.className = 'event-name';
      name.appendChild(document.createTextNode(ev.title || ''));
      if (ev.holiday) {
        const tag = document.createElement('span');
        tag.className = 'holiday-tag';
        tag.textContent = ev.country || 'Holiday';
        name.appendChild(tag);
      } else if (ev.important) {
        const tag = document.createElement('span');
        tag.className = 'important-tag';
        tag.textContent = 'Important';
        name.appendChild(tag);
      }
      info.appendChild(name);

      const time = document.createElement('div');
      time.className = 'event-time-display';
      if (ev.holiday) time.textContent = 'Public Holiday';
      else if (ev.important) time.textContent = 'Important Date';
      else {
        time.textContent = formatTimeRange(ev.time, ev.endTime);
        if (ev.endDate && ev.endDate !== key && /^\d{4}-\d{2}-\d{2}$/.test(ev.endDate)) {
          time.textContent += ' · ends ' + formatShortDate(parseDateKey(ev.endDate));
        }
      }
      info.appendChild(time);

      item.appendChild(info);
      if (!ev.holiday && !ev.important) {
        item.addEventListener('click', () => openModal(ev.originalDate || key, ev.id));
      } else {
        item.addEventListener('click', () => openPanel(key));
      }
      el.appendChild(item);
    });

    el.classList.remove('hidden');
  }

  // ===== EVENT PANEL =====
  function openPanel(key) {
    selectedDate = key;
    const d = parseDateKey(key);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    panelDate.textContent = d.toLocaleDateString('en-GB', options);

    const dayEvents = getEventsForKey(key);
    eventsList.innerHTML = '';

    if (dayEvents.length === 0) {
      eventsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:16px 0">No events</p>';
    } else {
      dayEvents
        .sort((a, b) => {
          if (a.holiday && !b.holiday) return -1;
          if (!a.holiday && b.holiday) return 1;
          if (a.important && !b.important) return -1;
          if (!a.important && b.important) return 1;
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        })
        .forEach(ev => {
          const item = document.createElement('div');
          item.className = 'event-item';
          if (ev.holiday) item.classList.add('holiday-item');

          const bar = document.createElement('div');
          bar.className = 'event-color-bar';
          bar.style.background = ev.color || '#6366f1';
          item.appendChild(bar);

          const info = document.createElement('div');
          info.className = 'event-info';

          const name = document.createElement('div');
          name.className = 'event-name';
          name.appendChild(document.createTextNode(ev.title || ''));
          if (ev.holiday) {
            const tag = document.createElement('span');
            tag.className = 'holiday-tag';
            tag.textContent = ev.country || 'Holiday';
            name.appendChild(tag);
          } else if (ev.important) {
            const tag = document.createElement('span');
            tag.className = 'important-tag';
            tag.textContent = 'Important';
            name.appendChild(tag);
          }
          if (ev.recurrence && ev.recurrence.frequency !== 'none') {
            const badge = document.createElement('span');
            badge.className = 'recurrence-badge';
            badge.textContent = '\u21B4 ' + ev.recurrence.frequency;
            name.appendChild(badge);
          }
          info.appendChild(name);

          const time = document.createElement('div');
          time.className = 'event-time-display';
          let timeText;
          if (ev.holiday) timeText = 'Public Holiday';
          else if (ev.important) timeText = 'Important Date';
          else {
            timeText = formatTimeRange(ev.time, ev.endTime);
            if (ev.endDate && ev.endDate !== key && /^\d{4}-\d{2}-\d{2}$/.test(ev.endDate)) {
              timeText += ' \u00B7 ends ' + formatShortDate(parseDateKey(ev.endDate));
            }
          }
          time.textContent = timeText;
          info.appendChild(time);

          item.appendChild(info);
          if (!ev.holiday && !ev.important) {
            item.addEventListener('click', () => openModal(ev.originalDate || key, ev.id));
          }
          eventsList.appendChild(item);
        });
    }

    closeHolidaysPanel();
    eventPanel.classList.remove('hidden');
    renderCalendar();
  }

  // ===== EVENT MODAL =====
  function openModal(dateKey, eventId) {
    eventModal.classList.remove('hidden');
    editingKey = null;
    document.getElementById('event-id').value = eventId || '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-end-time').value = '';
    document.getElementById('event-end-date').value = '';
    document.getElementById('event-reminder').value = '';
    document.getElementById('event-desc').value = '';
    document.getElementById('event-recurrence').value = 'none';
    document.getElementById('recurrence-interval').value = '1';
    document.getElementById('recurrence-end').value = '';
    hideRecurrenceOptions();
    setEventColor('#6366f1');
    timeValues['event-time'] = '';
    timeValues['event-end-time'] = '';

    if (eventId) {
      document.getElementById('modal-title').textContent = 'Edit Event';
      deleteBtn.classList.remove('hidden');
      const sourceKey = (events[dateKey] || []).some(e => e.id === eventId)
        ? dateKey
        : (findEventKey(eventId) || dateKey);
      editingKey = sourceKey;
      const ev = (events[sourceKey] || []).find(e => e.id === eventId);
      if (ev) {
        document.getElementById('event-title').value = ev.title;
        document.getElementById('event-time').value = ev.time || '';
        document.getElementById('event-end-time').value = ev.endTime || '';
        document.getElementById('event-end-date').value = ev.endDate || '';
        document.getElementById('event-reminder').value = ev.reminder != null ? String(ev.reminder) : '';
        document.getElementById('event-desc').value = ev.desc || '';
        setEventColor(ev.color || '#6366f1');
        timeValues['event-time'] = ev.time || '';
        timeValues['event-end-time'] = ev.endTime || '';
        if (ev.recurrence && ev.recurrence.frequency !== 'none') {
          document.getElementById('event-recurrence').value = ev.recurrence.frequency;
          document.getElementById('recurrence-interval').value = ev.recurrence.interval || 1;
          document.getElementById('recurrence-end').value = ev.recurrence.endDate || '';
          showRecurrenceOptions(ev.recurrence.frequency);
        }
      }
    } else {
      document.getElementById('modal-title').textContent = 'New Event';
      deleteBtn.classList.add('hidden');
    }
    setTimeout(() => {
      const titleInput = document.getElementById('event-title');
      if (titleInput && !eventModal.classList.contains('hidden')) titleInput.focus();
    }, 50);
  }

  function findEventKey(evId) {
    for (const [k, evs] of Object.entries(events)) {
      if (evs.some(e => e.id === evId)) return k;
    }
    return null;
  }

  function closeModal() {
    eventModal.classList.add('hidden');
  }

  function setEventColor(color) {
    document.getElementById('event-color').value = color;
    document.querySelectorAll('.color-dot').forEach(dot => {
      const active = dot.dataset.color === color;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
  }

  function showRecurrenceOptions(frequency) {
    const container = document.getElementById('recurrence-options');
    const unitSpan = document.getElementById('recurrence-unit');
    const units = { daily: 'day(s)', weekly: 'week(s)', monthly: 'month(s)', yearly: 'year(s)' };
    unitSpan.textContent = units[frequency] || '';
    container.classList.remove('hidden');
  }

  function hideRecurrenceOptions() {
    document.getElementById('recurrence-options').classList.add('hidden');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value || safeId();
    const title = document.getElementById('event-title').value.trim();
    if (!title) return;

    const time = timeValues['event-time'] || document.getElementById('event-time').value;
    const endTime = timeValues['event-end-time'] || document.getElementById('event-end-time').value;
    const endDate = document.getElementById('event-end-date').value || null;
    const reminderRaw = document.getElementById('event-reminder').value;
    const reminder = reminderRaw ? parseInt(reminderRaw, 10) : null;

    const recurrenceValue = document.getElementById('event-recurrence').value;
    let recurrence = null;
    if (recurrenceValue !== 'none') {
      recurrence = {
        frequency: recurrenceValue,
        interval: parseInt(document.getElementById('recurrence-interval').value, 10) || 1,
        endDate: document.getElementById('recurrence-end').value || null,
      };
    }

    const ev = sanitizeEvent({
      id,
      title,
      time,
      endTime,
      endDate,
      reminder,
      desc: document.getElementById('event-desc').value.trim(),
      color: document.getElementById('event-color').value,
      recurrence,
    });
    if (!ev) return;

    const storeKey = editingKey || selectedDate;
    if (!storeKey) return;
    if (!events[storeKey]) events[storeKey] = [];
    const existing = events[storeKey].findIndex(x => x.id === id);
    if (existing >= 0) {
      events[storeKey][existing] = ev;
    } else {
      events[storeKey].push(ev);
    }

    saveEvents();
    closeModal();
    openPanel(storeKey);
  }

  function handleDelete() {
    const id = document.getElementById('event-id').value;
    const storeKey = editingKey || selectedDate;
    if (!id || !storeKey) return;
    events[storeKey] = (events[storeKey] || []).filter(x => x.id !== id);
    if (events[storeKey].length === 0) delete events[storeKey];
    saveEvents();
    closeModal();
    openPanel(storeKey);
  }

  // ===== HOLIDAYS PANEL =====
  function openHolidaysPanel() {
    eventPanel.classList.add('hidden');
    eventModal.classList.add('hidden');
    renderCountryList();
    renderImportantDatesList();
    holidaysPanel.classList.remove('hidden');
    document.getElementById('holidays-btn').classList.add('active');
  }

  function closeHolidaysPanel() {
    holidaysPanel.classList.add('hidden');
    document.getElementById('holidays-btn').classList.remove('active');
  }

  function renderCountryList() {
    const container = document.getElementById('holidays-country-list');
    container.innerHTML = '';
    for (const [code, meta] of Object.entries(COUNTRY_META)) {
      const item = document.createElement('label');
      item.className = 'country-item';
      const checked = selectedCountries.includes(code) ? 'checked' : '';
      item.innerHTML = `
        <span class="country-flag">${meta.flag}</span>
        <span class="country-name">${meta.name}</span>
        <input type="checkbox" class="country-toggle" data-country="${code}" ${checked}>
      `;
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!selectedCountries.includes(code)) selectedCountries.push(code);
        } else {
          selectedCountries = selectedCountries.filter(c => c !== code);
        }
        saveHolidayPreference();
        renderCalendar();
        if (selectedDate) openPanel(selectedDate);
      });
      container.appendChild(item);
    }
  }

  function renderImportantDatesList() {
    const container = document.getElementById('important-dates-toggles');
    container.innerHTML = '';
    for (const [id, meta] of Object.entries(IMPORTANT_DATES_META)) {
      const item = document.createElement('label');
      item.className = 'important-date-item';
      const checked = enabledImportantDates.includes(id) ? 'checked' : '';
      item.innerHTML = `
        <span class="date-icon">${meta.icon}</span>
        <span class="date-name">${meta.name}</span>
        <input type="checkbox" class="country-toggle" data-important="${id}" ${checked}>
      `;
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!enabledImportantDates.includes(id)) enabledImportantDates.push(id);
        } else {
          enabledImportantDates = enabledImportantDates.filter(d => d !== id);
        }
        saveHolidayPreference();
        renderCalendar();
        if (selectedDate) openPanel(selectedDate);
      });
      container.appendChild(item);
    }
  }

  // ===== EXPORT / IMPORT =====
  function downloadBlob(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const data = {
      version: 3,
      exported: new Date().toISOString(),
      events,
      settings: { countries: selectedCountries, important: enabledImportantDates, weekStart, lang },
    };
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    downloadBlob(JSON.stringify(data, null, 2), 'application/json', `ambr3-calendar-${stamp}.json`);
  }

  function icsDateStr(d) {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function icsDateTimeStr(d) {
    return `${icsDateStr(d)}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  }

  function icsEscape(s) {
    return s.replace(/[\\;,]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  }

  function icsUnescape(s) {
    return s.replace(/\\([\\,;nN])/g, (_, ch) => {
      if (ch === 'n' || ch === 'N') return '\n';
      return ch;
    });
  }

  function exportIcs() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ambr3Calendar//EN', 'CALSCALE:GREGORIAN'];
    for (const [key, evs] of Object.entries(events)) {
      for (const ev of evs) {
        if (ev.holiday || ev.important) continue;
        const [y, m, d] = key.split('-').map(Number);
        lines.push('BEGIN:VEVENT', `UID:${icsEscape(ev.id)}@ambr3calendar`, `DTSTAMP:${icsDateTimeStr(new Date())}`, `SUMMARY:${icsEscape(ev.title)}`);
        if (ev.time) {
          const start = new Date(y, m - 1, d);
          const [hh, mm] = ev.time.split(':').map(Number);
          start.setHours(hh, mm, 0, 0);
          let end;
          if (ev.endTime) {
            end = new Date(start);
            const [eh, em] = ev.endTime.split(':').map(Number);
            end.setHours(eh, em, 0, 0);
          } else {
            end = new Date(start);
            end.setHours(end.getHours() + 1);
          }
          lines.push(`DTSTART:${icsDateTimeStr(start)}`, `DTEND:${icsDateTimeStr(end)}`);
        } else {
          let endKey = ev.endDate || key;
          if (ev.endDate) {
            const e = parseDateKey(ev.endDate);
            e.setDate(e.getDate() + 1);
            endKey = dateKey(e.getFullYear(), e.getMonth(), e.getDate());
          }
          lines.push(`DTSTART;VALUE=DATE:${key.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${endKey.replace(/-/g, '')}`);
        }
        if (ev.desc) lines.push(`DESCRIPTION:${icsEscape(ev.desc)}`);
        if (ev.recurrence && ev.recurrence.frequency !== 'none') {
          const f = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }[ev.recurrence.frequency];
          let rrule = `FREQ=${f}`;
          if (ev.recurrence.interval > 1) rrule += `;INTERVAL=${ev.recurrence.interval}`;
          if (ev.recurrence.endDate) rrule += `;UNTIL=${ev.recurrence.endDate.replace(/-/g, '')}T000000Z`;
          lines.push(`RRULE:${rrule}`);
        }
        lines.push('END:VEVENT');
      }
    }
    lines.push('END:VCALENDAR');
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    downloadBlob(lines.join('\r\n') + '\r\n', 'text/calendar', `ambr3-calendar-${stamp}.ics`);
  }

  function importIcs(text) {
    const unfolded = [];
    for (const l of text.split(/\r?\n/)) {
      if (/^[ \t]/.test(l) && unfolded.length) unfolded[unfolded.length - 1] += l.trim();
      else unfolded.push(l.trim());
    }
    const items = [];
    let cur = null;
    for (const line of unfolded) {
      if (!line) continue;
      if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
      if (line === 'END:VEVENT') { if (cur) items.push(cur); cur = null; continue; }
      if (!cur) continue;
      const ci = line.indexOf(':');
      if (ci < 0) continue;
      const name = line.slice(0, ci).toUpperCase();
      const val = line.slice(ci + 1);
      cur[name] = (cur[name] ? cur[name] + '\n' : '') + val;
    }

    let count = 0;
    for (const v of items) {
      const startProp = Object.keys(v).find(k => k === 'DTSTART' || k.startsWith('DTSTART;'));
      const dtstart = startProp ? v[startProp] : '';
      if (!dtstart || !v.SUMMARY) continue;
      const isAllDay = startProp.toUpperCase().includes('VALUE=DATE') && !dtstart.includes('T');
      let key, time = '';
      if (isAllDay) {
        const mm = dtstart.match(/(\d{4})(\d{2})(\d{2})/);
        if (!mm) continue;
        key = `${mm[1]}-${mm[2]}-${mm[3]}`;
      } else {
        const mm = dtstart.match(/(\d{4})(\d{2})(\d{2})[T](\d{2})(\d{2})/);
        if (!mm) continue;
        key = `${mm[1]}-${mm[2]}-${mm[3]}`;
        time = `${mm[4]}:${mm[5]}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;

      let endTime = '';
      let endDate = null;
      const endProp = Object.keys(v).find(k => k === 'DTEND' || k.startsWith('DTEND;'));
      if (endProp && v[endProp]) {
        const dend = v[endProp];
        if (isAllDay) {
          const em = dend.match(/(\d{4})(\d{2})(\d{2})/);
          if (em) {
            const e = new Date(+em[1], +em[2] - 1, +em[3]);
            e.setDate(e.getDate() - 1);
            endDate = dateKey(e.getFullYear(), e.getMonth(), e.getDate());
          }
        } else {
          const em = dend.match(/[T](\d{2})(\d{2})/);
          if (em) endTime = `${em[1]}:${em[2]}`;
        }
      }

      let recurrence = null;
      if (v.RRULE) {
        const fmap = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', YEARLY: 'yearly' };
        const freq = (v.RRULE.match(/FREQ=([A-Z]+)/) || [])[1];
        const interval = parseInt((v.RRULE.match(/INTERVAL=(\d+)/) || [])[1], 10) || 1;
        const until = (v.RRULE.match(/UNTIL=(\d{4})(\d{2})(\d{2})/) || []);
        if (fmap[freq]) {
          recurrence = { frequency: fmap[freq], interval, endDate: until.length ? `${until[1]}-${until[2]}-${until[3]}` : null };
        }
      }

      const ev = sanitizeEvent({
        id: (v.UID || safeId()).split('@')[0],
        title: icsUnescape(v.SUMMARY || ''),
        time,
        endTime,
        endDate,
        desc: icsUnescape(v.DESCRIPTION || ''),
        color: '#6366f1',
        recurrence,
      });
      if (!ev) continue;
      if (!events[key]) events[key] = [];
      if (!events[key].find(e => e.id === ev.id)) events[key].push(ev);
      count++;
    }

    if (count === 0) {
      alert('No events found in this .ics file');
      return;
    }
    saveEvents();
    renderCalendar();
    if (selectedDate) openPanel(selectedDate);
    alert(`Imported ${count} event(s)`);
  }

  function handleImportFile(file) {
    const reader = new FileReader();
    reader.onerror = () => { alert('Failed to read file'); };
    reader.onload = (e) => {
      const name = (file.name || '').toLowerCase();
      if (name.endsWith('.ics')) {
        try { importIcs(String(e.target.result)); }
        catch { alert('Failed to parse iCalendar file'); }
        return;
      }
      try {
        const data = JSON.parse(e.target.result);
        if (!data.events || typeof data.events !== 'object') {
          alert('Invalid calendar file');
          return;
        }
        const count = Object.values(data.events).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
        const overwrite = confirm(
          `Found ${count} event(s) in file.\n\nOK = Merge with existing events\nCancel = Replace all events`
        );
        if (overwrite) {
          for (const [key, evs] of Object.entries(data.events)) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(evs)) continue;
            if (!events[key]) events[key] = [];
            for (const raw of evs) {
              const ev = sanitizeEvent(raw);
              if (!ev) continue;
              if (!events[key].find(e => e.id === ev.id)) events[key].push(ev);
            }
          }
        } else {
          events = {};
          for (const [key, evs] of Object.entries(data.events)) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(evs)) continue;
            events[key] = evs.map(sanitizeEvent).filter(Boolean);
            if (!events[key].length) delete events[key];
          }
        }
        if (data.settings && Array.isArray(data.settings.countries)) {
          selectedCountries = data.settings.countries.filter(c => COUNTRY_META[c]);
        }
        if (data.settings && Array.isArray(data.settings.important)) {
          enabledImportantDates = data.settings.important.filter(id => IMPORTANT_DATES_META[id]);
        }
        saveEvents();
        saveHolidayPreference();
        renderCalendar();
        if (selectedDate) openPanel(selectedDate);
        alert('Events imported successfully');
      } catch {
        alert('Failed to parse calendar file');
      }
    };
    reader.readAsText(file);
  }

  // ===== NAVIGATION =====
  function prevPeriod() {
    if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
    else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
    else currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
  }

  function nextPeriod() {
    if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
    else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() + 1);
    else currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
  }

  function goToday() {
    currentDate = new Date();
    renderCalendar();
    if (currentView !== 'year') {
      const key = dateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      openPanel(key);
    }
  }

  // ===== BIND EVENTS =====
  function bindEvents() {
    document.getElementById('prev-month').addEventListener('click', prevPeriod);
    document.getElementById('next-month').addEventListener('click', nextPeriod);
    document.getElementById('today-btn').addEventListener('click', goToday);
    document.getElementById('today-btn').textContent = L().today;
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('current-month').addEventListener('click', toggleJump);
    document.getElementById('jump-month').addEventListener('change', applyJump);
    document.getElementById('jump-year').addEventListener('change', applyJump);
    document.getElementById('jump-close').addEventListener('click', () => {
      document.getElementById('jump-pop').classList.add('hidden');
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => setView(btn.dataset.view));
    });

    document.getElementById('close-panel').addEventListener('click', () => {
      eventPanel.classList.add('hidden');
      selectedDate = null;
      renderCalendar();
    });

    document.getElementById('add-event-btn').addEventListener('click', () => openModal(selectedDate));
    document.getElementById('close-modal').addEventListener('click', closeModal);
    eventForm.addEventListener('submit', handleSubmit);
    deleteBtn.addEventListener('click', handleDelete);

    eventForm.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('focus', () => scrollInputIntoView(el));
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => setEventColor(dot.dataset.color));
    });

    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) closeModal();
    });

    // Holidays
    document.getElementById('holidays-btn').addEventListener('click', () => {
      if (holidaysPanel.classList.contains('hidden')) {
        openHolidaysPanel();
      } else {
        closeHolidaysPanel();
      }
    });
    document.getElementById('close-holidays-panel').addEventListener('click', closeHolidaysPanel);

    // Recurrence
    document.getElementById('event-recurrence').addEventListener('change', (e) => {
      if (e.target.value !== 'none') {
        showRecurrenceOptions(e.target.value);
      } else {
        hideRecurrenceOptions();
      }
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', openSearch);
    document.getElementById('close-search').addEventListener('click', closeSearch);
    document.getElementById('search-input').addEventListener('input', (e) => runSearch(e.target.value));
    document.getElementById('search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
    });
    document.getElementById('search-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'search-overlay') closeSearch();
    });

    // Settings
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings').addEventListener('click', closeSettings);
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') closeSettings();
    });
    document.getElementById('week-start-select').addEventListener('change', (e) => {
      weekStart = parseInt(e.target.value, 10);
      saveSettings();
      renderCalendar();
    });
    document.getElementById('lang-select').addEventListener('change', (e) => {
      lang = e.target.value;
      saveSettings();
      document.getElementById('today-btn').textContent = L().today;
      buildJumpOptions();
      renderCalendar();
    });
    document.getElementById('accent-color-input').addEventListener('input', (e) => {
      applyAccentColor(e.target.value);
    });
    document.getElementById('app-name-input').addEventListener('input', (e) => {
      applyAppName(e.target.value.trim());
    });
    document.getElementById('export-json-btn').addEventListener('click', exportJson);
    document.getElementById('import-json-btn').addEventListener('click', () => {
      openSettings();
      document.getElementById('import-file').click();
    });
    document.getElementById('export-ics-btn').addEventListener('click', exportIcs);
    document.getElementById('import-ics-btn').addEventListener('click', () => {
      openSettings();
      document.getElementById('import-file').click();
    });
    document.getElementById('export-btn').addEventListener('click', exportJson);
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleImportFile(file);
      e.target.value = '';
    });

    // Close jump popover when clicking elsewhere
    document.addEventListener('click', (e) => {
      const pop = document.getElementById('jump-pop');
      if (!pop.classList.contains('hidden') && !pop.contains(e.target) && e.target.id !== 'current-month') {
        pop.classList.add('hidden');
      }
    });

    // Swipe
    let touchStartX = 0;
    document.getElementById('calendar').addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.getElementById('calendar').addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) nextPeriod();
        else prevPeriod();
      }
    }, { passive: true });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!eventModal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeModal();
        return;
      }
      if (!settingsModal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeSettings();
        return;
      }
      if (!searchOverlay.classList.contains('hidden')) {
        if (e.key === 'Escape') closeSearch();
        return;
      }
      if (!holidaysPanel.classList.contains('hidden')) {
        if (e.key === 'Escape') closeHolidaysPanel();
        return;
      }
      if (!eventPanel.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          eventPanel.classList.add('hidden');
          selectedDate = null;
          renderCalendar();
        }
        return;
      }
      if (e.key === 'ArrowLeft') prevPeriod();
      else if (e.key === 'ArrowRight') nextPeriod();
    });
  }

  // ===== SERVICE WORKER =====
  function registerSW() {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
    }
  }

  init();
})();
