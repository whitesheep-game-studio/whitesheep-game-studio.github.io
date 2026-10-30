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
    document.querySelector('#app-count').textContent = `${count}개 / 전체 ${apps.length}개`;
    document.querySelector('#no-results').hidden = count !== 0;
  };
  search.addEventListener('input', update);
  platform.addEventListener('change', update);
  status.addEventListener('change', update);
}
