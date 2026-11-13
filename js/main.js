/* Start-up and navigation. */
'use strict';

function go(screen) {
  Audio2.stop();
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(screen());
  window.scrollTo(0, 0);
}

(async function start() {
  await Store.open();
  await loadState();
  go(Home);
  if (!Store.persistent) toast('Storage is off in this browser, so progress won\'t be kept.', 5000);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try { if ('serviceWorker' in navigator && window.self === window.top) navigator.serviceWorker.register('sw.js'); } catch (e) {}
})();
