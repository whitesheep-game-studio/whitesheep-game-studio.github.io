const search = document.querySelector('#app-search');
const platform = document.querySelector('#app-platform');
const status = document.querySelector('#app-status');
if (search && platform && status) {
  const apps = [...document.querySelectorAll('[data-app]')];
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const app of apps) {
      const matches =
        app.dataset.search.includes(query) &&
        (!platform.value || app.dataset.platforms.split(' ').includes(platform.value)) &&
        (!status.value || app.dataset.status === status.value);
      app.hidden = !matches;
      if (matches) count++;
    }
    const locale = document.documentElement.lang;
    const template = window.WHITESHEEP_UI_TRANSLATIONS?.[locale]?.['directory.count'] || '{count}개 / 전체 {total}개';
    document.querySelector('#app-count').textContent = template.replace('{count}', String(count)).replace('{total}', String(apps.length));
    document.querySelector('#no-results').hidden = count !== 0;
  };
  search.addEventListener('input', update);
  platform.addEventListener('change', update);
  status.addEventListener('change', update);
  document.addEventListener('whitesheep:languagechange', update);
}
