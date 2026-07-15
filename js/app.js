(() => {
  'use strict';

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const STORAGE_KEY = 'privacy_calendar_events';
  const HOLIDAYS_STORAGE_KEY = 'privacy_calendar_holidays_v2';
  const THEME_KEY = 'privacy_calendar_theme';
  const HOLIDAY_COLOR = '#dc2626';
  const IMPORTANT_COLOR = '#f59e0b';

  let currentDate = new Date();
  let selectedDate = null;
  let events = {};
  let selectedCountries = ['uk'];
  let enabledImportantDates = ['valentines', 'halloween', 'mothers_day', 'fathers_day', 'new_years_eve'];
  let allCountryHolidays = {};
  let importantDatesData = {};

  // ===== THEME =====
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

  // ===== INIT =====
  function init() {
    initTheme();
    loadEvents();
    loadHolidayPreference();
    precomputeAllHolidays();
    precomputeImportantDates();
    renderWeekdays();
    renderCalendar();
    bindEvents();
    setupTimeInputFix();
    registerSW();
  }

  // ===== STORAGE =====
  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      events = raw ? JSON.parse(raw) : {};
    } catch { events = {}; }
  }

  function saveEvents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  function loadHolidayPreference() {
    try {
      const saved = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.countries) selectedCountries = parsed.countries;
        if (parsed.important) enabledImportantDates = parsed.important;
      }
    } catch { /* keep defaults */ }
  }

  function saveHolidayPreference() {
    localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify({
      countries: selectedCountries,
      important: enabledImportantDates,
    }));
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
  function getEventsForKey(key) {
    const userEvs = events[key] || [];
    const recurringEvs = getRecurringEventsForKey(key);
    const allUserEvs = [...recurringEvs, ...userEvs];

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
    weekdayHeader.innerHTML = WEEKDAYS.map(d => `<span>${d}</span>`).join('');
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

    daysGrid.innerHTML = '';

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      daysGrid.appendChild(createDayCell(new Date(year, month - 1, day), day, true, false));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = dateKey(year, month, day);
      daysGrid.appendChild(createDayCell(d, day, false, key === todayKey));
    }
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      daysGrid.appendChild(createDayCell(new Date(year, month + 1, day), day, true, false));
    }
  }

  function createDayCell(date, dayNum, isOther, isToday) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isOther) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');

    const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
    if (selectedDate && key === selectedDate) cell.classList.add('selected');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = dayNum;
    cell.appendChild(num);

    const dayEvents = getEventsForKey(key);
    if (dayEvents.length > 0) {
      const evContainer = document.createElement('div');
      evContainer.className = 'day-events';
      dayEvents.slice(0, 2).forEach(ev => {
        if (window.innerWidth > 400) {
          const pill = document.createElement('div');
          pill.className = 'event-pill';
          pill.style.background = ev.color || '#6366f1';
          pill.textContent = ev.title;
          evContainer.appendChild(pill);
        } else {
          const dot = document.createElement('div');
          dot.className = 'event-dot';
          dot.style.background = ev.color || '#6366f1';
          dot.style.color = ev.color || '#6366f1';
          evContainer.appendChild(dot);
        }
      });
      if (dayEvents.length > 2) {
        const more = document.createElement('div');
        more.className = 'event-pill';
        more.style.background = 'var(--surface-hover)';
        more.textContent = `+${dayEvents.length - 2}`;
        evContainer.appendChild(more);
      }
      cell.appendChild(evContainer);
    }

    cell.addEventListener('click', () => openPanel(key));
    return cell;
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
          return (a.time || '').localeCompare(b.time || '');
        })
        .forEach(ev => {
          const item = document.createElement('div');
          item.className = 'event-item';
          if (ev.holiday) item.classList.add('holiday-item');
          const tagHtml = ev.holiday
            ? ` <span class="holiday-tag">${escapeHtml(ev.country || 'Holiday')}</span>`
            : ev.important
            ? ` <span class="important-tag">Important</span>`
            : '';
          const recurrenceBadge = (ev.recurrence && ev.recurrence.frequency !== 'none')
            ? `<span class="recurrence-badge">&#8634; ${ev.recurrence.frequency}</span>`
            : '';
          const timeDisplay = ev.holiday ? 'Public Holiday'
            : ev.important ? 'Important Date'
            : formatTimeRange(ev.time, ev.endTime);
          item.innerHTML = `
            <div class="event-color-bar" style="background:${ev.color || '#6366f1'}"></div>
            <div class="event-info">
              <div class="event-name">${escapeHtml(ev.title)}${tagHtml}${recurrenceBadge}</div>
              <div class="event-time-display">${timeDisplay}</div>
            </div>
          `;
          if (!ev.holiday && !ev.important) {
            item.addEventListener('click', () => openModal(key, ev.id));
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
    document.getElementById('event-id').value = eventId || '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-end-time').value = '';
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
      const ev = (events[dateKey] || []).find(e => e.id === eventId);
      if (ev) {
        document.getElementById('event-title').value = ev.title;
        document.getElementById('event-time').value = ev.time || '';
        document.getElementById('event-end-time').value = ev.endTime || '';
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
  }

  function closeModal() {
    eventModal.classList.add('hidden');
  }

  function setEventColor(color) {
    document.getElementById('event-color').value = color;
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === color);
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
    const id = document.getElementById('event-id').value || crypto.randomUUID();
    const title = document.getElementById('event-title').value.trim();
    if (!title) return;

    const time = timeValues['event-time'] || document.getElementById('event-time').value;
    const endTime = timeValues['event-end-time'] || document.getElementById('event-end-time').value;

    const recurrenceValue = document.getElementById('event-recurrence').value;
    let recurrence = null;
    if (recurrenceValue !== 'none') {
      recurrence = {
        frequency: recurrenceValue,
        interval: parseInt(document.getElementById('recurrence-interval').value) || 1,
        endDate: document.getElementById('recurrence-end').value || null,
      };
    }

    const ev = {
      id,
      title,
      time,
      endTime,
      desc: document.getElementById('event-desc').value.trim(),
      color: document.getElementById('event-color').value,
      recurrence,
    };

    if (!events[selectedDate]) events[selectedDate] = [];
    const existing = events[selectedDate].findIndex(e => e.id === id);
    if (existing >= 0) {
      events[selectedDate][existing] = ev;
    } else {
      events[selectedDate].push(ev);
    }

    saveEvents();
    closeModal();
    openPanel(selectedDate);
  }

  function handleDelete() {
    const id = document.getElementById('event-id').value;
    if (!id || !selectedDate) return;
    events[selectedDate] = (events[selectedDate] || []).filter(e => e.id !== id);
    if (events[selectedDate].length === 0) delete events[selectedDate];
    saveEvents();
    closeModal();
    openPanel(selectedDate);
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
  function exportEvents() {
    const data = {
      version: 2,
      exported: new Date().toISOString(),
      events,
      settings: { countries: selectedCountries, important: enabledImportantDates },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    a.download = `privacy-calendar-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importEvents(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.events || typeof data.events !== 'object') {
          alert('Invalid calendar file');
          return;
        }
        const count = Object.values(data.events).reduce((n, arr) => n + arr.length, 0);
        const overwrite = confirm(
          `Found ${count} event(s) in file.\n\nOK = Merge with existing events\nCancel = Replace all events`
        );
        if (overwrite) {
          for (const [key, evs] of Object.entries(data.events)) {
            if (!events[key]) events[key] = [];
            for (const ev of evs) {
              if (!events[key].find(e => e.id === ev.id)) {
                events[key].push(ev);
              }
            }
          }
        } else {
          events = data.events;
        }
        saveEvents();
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
  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  }

  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  }

  function goToday() {
    currentDate = new Date();
    const key = dateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    renderCalendar();
    openPanel(key);
  }

  // ===== BIND EVENTS =====
  function bindEvents() {
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    document.getElementById('today-btn').addEventListener('click', goToday);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    document.getElementById('close-panel').addEventListener('click', () => {
      eventPanel.classList.add('hidden');
      selectedDate = null;
      renderCalendar();
    });

    document.getElementById('add-event-btn').addEventListener('click', () => openModal(selectedDate));
    document.getElementById('close-modal').addEventListener('click', closeModal);
    eventForm.addEventListener('submit', handleSubmit);
    deleteBtn.addEventListener('click', handleDelete);

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

    // Export / Import
    document.getElementById('export-btn').addEventListener('click', exportEvents);
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importEvents(file);
      e.target.value = '';
    });

    // Swipe
    let touchStartX = 0;
    document.getElementById('calendar').addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.getElementById('calendar').addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) nextMonth();
        else prevMonth();
      }
    }, { passive: true });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!eventModal.classList.contains('hidden')) {
        if (e.key === 'Escape') closeModal();
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
      if (e.key === 'ArrowLeft') prevMonth();
      else if (e.key === 'ArrowRight') nextMonth();
    });
  }

  // ===== SERVICE WORKER =====
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
