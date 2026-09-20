/**
 * Заготовка под i18n.
 * Позже здесь будет загрузка ./locales/{lang}.json и t('key').
 */

let currentLang = 'rus';
let messages = {};

export async function loadLocale(lang = 'rus') {
  try {
    const res = await fetch(`./src/locales/${lang}.json`);
    if (!res.ok) throw new Error(res.status);
    messages = await res.json();
    currentLang = lang;
  } catch (e) {
    console.warn('[i18n] Не удалось загрузить локаль:', e);
  }
}

export function t(key, fallback = key) {
  return messages[key] ?? fallback;
}

export function getLang() {
  return currentLang;
}
