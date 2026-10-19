'use strict';

// Presentation translations never change the catalog or form option values.
(() => {
 const storageKey = 'ff-skin-vault-language';
 const languages = [
  {code: 'en', name: 'English', flag: '🇬🇧'},
  {code: 'ar', name: 'العربية', flag: '🇸🇦'},
  {code: 'hi', name: 'हिन्दी', flag: '🇮🇳'},
  {code: 'es', name: 'Español', flag: '🇪🇸'}
 ];
 const supported = code => languages.some(language => language.code === code);
 const dictionaries = new Map([['en', Promise.resolve({})]]);
 const textSources = new WeakMap(), attributeSources = new WeakMap();
 let finishInitialLoad;
 const ready = new Promise(resolve => { finishInitialLoad = resolve; });
 let language = 'en', dictionary = {}, uppercaseKeys = new Map(), requestId = 0;
 const templates = [
  '{guns} guns · {skins} skin entries',
  'Showing {count} of {total} skins',
  '{count} categories', '{count} guns', '{count} skin entries', '{count} items',
  'Watch {skin} source video at {time}', 'Source video preview for {skin}',
  'Watch source · {time}', '{gun} — {skin} skin', '{gun} gun', '{gun} skins',
  'Delete “{skin}”? Export a backup first if you want to keep it.',
  'Import failed: {error}', 'Catalog request failed ({status}).',
  '{error} Serve this site through an HTTP server, rather than opening the HTML file directly.',
  'Language changed to {language}.'
 ].map(key => {
  const parameters = [];
  const expression = key.split(/(\{\w+\})/).map(part => {
   if (/^\{\w+\}$/.test(part)) { parameters.push(part.slice(1, -1)); return '(.+?)'; }
   return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return {key, parameters, match: new RegExp(`^${expression}$`, 'su')};
 });

 function interpolate(value, parameters) {
  return value.replace(/\{(\w+)\}/g, (placeholder, key) => parameters[key] ?? placeholder);
 }
 function translate(source, parameters) {
  if (typeof source !== 'string' || !source) return source;
  if (parameters) return interpolate(dictionary[source] || source, parameters);
  if (language === 'en') return source;
  if (Object.hasOwn(dictionary, source)) return dictionary[source];
  if (uppercaseKeys.has(source)) return uppercaseKeys.get(source).toLocaleUpperCase(language);
  // Gun selectors combine a translated category with a canonical weapon name.
  const divider = source.indexOf(' / ');
  if (divider !== -1 && Object.hasOwn(dictionary, source.slice(0, divider))) {
   return translate(source.slice(0, divider)) + source.slice(divider);
  }
  for (const template of templates) {
   const values = source.match(template.match);
   if (!values) continue;
   const parameters = Object.fromEntries(template.parameters.map((key, index) => [key, key === 'error' ? translate(values[index + 1]) : values[index + 1]]));
   return interpolate(dictionary[template.key] || template.key, parameters);
  }
  return source;
 }

 const skipped = 'script, style, textarea, .logo, #language-select, .skin-name, .edit-item > span, .gun-card h3, .art strong, [data-i18n-skip]';
 function translateText(node) {
  if (!node.nodeValue.trim() || node.parentElement?.closest(skipped)) return;
  let record = textSources.get(node);
  if (!record || node.nodeValue !== record.rendered) record = {source: node.nodeValue};
  const whitespace = record.source.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const translated = whitespace[1] + translate(whitespace[2]) + whitespace[3];
  record.rendered = translated;
  textSources.set(node, record);
  if (node.nodeValue !== translated) node.nodeValue = translated;
 }
 function translateAttributes(element) {
  if (element.closest('script, style, .logo, [data-i18n-skip]')) return;
  let records = attributeSources.get(element);
  if (!records) { records = new Map(); attributeSources.set(element, records); }
  for (const attribute of ['placeholder', 'aria-label', 'title', 'alt']) {
   const current = element.getAttribute(attribute);
   if (current === null) continue;
   let record = records.get(attribute);
   if (!record || current !== record.rendered) record = {source: current};
   record.rendered = translate(record.source);
   records.set(attribute, record);
   if (current !== record.rendered) element.setAttribute(attribute, record.rendered);
  }
 }
 function translatePage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translateText(walker.currentNode);
  for (const element of document.body.querySelectorAll('[placeholder], [aria-label], [title], [alt]')) translateAttributes(element);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = translate('Explore Free Fire gun skins, rarity, and attributes in a community fan catalog.');
  const heading = document.querySelector('main h1');
  if (heading) {
   const title = heading.textContent.replace(/\n/g, ' ') + ' | Free Fire Skin Vault';
   if (document.title !== title) document.title = title;
  }
 }

 const header = document.querySelector('header');
 const actions = document.createElement('div'); actions.className = 'header-actions';
 const navigation = header.querySelector('nav'); actions.append(navigation);
 const label = document.createElement('label'); label.className = 'language-control';
 const caption = document.createElement('span'); caption.className = 'sr-only'; caption.textContent = 'Language';
 const select = document.createElement('select'); select.id = 'language-select'; select.className = 'language-select'; select.setAttribute('aria-label', 'Language');
 for (const item of languages) {
  const option = document.createElement('option'); option.value = item.code; option.lang = item.code; option.textContent = `${item.flag} ${item.name}`; select.append(option);
 }
 label.append(caption, select); actions.append(label); header.append(actions);
 const status = document.createElement('p'); status.className = 'sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); header.after(status);
 let queued = false;
 const observer = new MutationObserver(() => {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; translatePage(); });
 });
 observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt']});

 function loadDictionary(code) {
  if (!dictionaries.has(code)) {
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 10000);
   const loading = fetch(`locales/${code}.json?v=1`, {cache: 'no-cache', signal: controller.signal}).then(async response => {
    if (!response.ok) throw Error('Translation unavailable');
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.keys(data).length || Object.values(data).some(value => typeof value !== 'string')) throw Error('Invalid translation');
    return data;
   }).catch(error => { dictionaries.delete(code); throw error; }).finally(() => clearTimeout(timeout));
   dictionaries.set(code, loading);
  }
  return dictionaries.get(code);
 }
 async function changeLanguage(code, {save = true, announce = true} = {}) {
  if (!supported(code)) code = 'en';
  const sequence = ++requestId;
  select.value = code;
  select.setAttribute('aria-busy', 'true');
  try {
   const next = await loadDictionary(code);
   if (sequence !== requestId) return false;
   dictionary = next; language = code;
   uppercaseKeys = new Map(Object.entries(next).map(([key, value]) => [key.toLocaleUpperCase('en'), value]));
   document.documentElement.lang = code; document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
   select.value = code;
   if (save) { try { localStorage.setItem(storageKey, code); } catch { /* Preference still works for this page. */ } }
   status.className = 'sr-only';
   status.textContent = announce ? `Language changed to ${languages.find(item => item.code === code).name}.` : '';
   translatePage();
   finishInitialLoad();
   return true;
  } catch {
   if (sequence === requestId) {
    select.value = language;
    status.className = 'language-feedback'; status.textContent = 'Unable to change language. Please try again.';
    translatePage();
    finishInitialLoad();
   }
   return false;
  } finally {
   if (sequence === requestId) select.removeAttribute('aria-busy');
  }
 }
 select.addEventListener('change', () => { void changeLanguage(select.value); });
 let saved = 'en';
 try { const value = localStorage.getItem(storageKey); if (supported(value)) saved = value; } catch { /* English is the default. */ }
 window.SkinVaultI18n = {t: translate, setLanguage: changeLanguage, get language() { return language; }, ready};
 void changeLanguage(saved, {save: false, announce: false});
})();
