import { features, activityForRange, ranges, number, scaleCount, visibleFeatures, toCsv } from './data.js';
import { artwork, icons } from './figma-artwork.js';
import { featureDetails } from './feature-details.js';


// Preserve the prototype controller inside one React-owned feature subtree.
// Global listeners are gated while hidden and released on unmount/StrictMode cleanup.
export function mountProductUsage(root) {
const $ = selector => root.querySelector(selector);
const lifecycle = new AbortController();
let disposed = false;
const isActive = () => root.dataset.productUsageActive === 'true';
const onDocument = (type, listener) => document.addEventListener(type, event => {
  if (isActive()) listener(event);
}, { signal: lifecycle.signal });
const onWindow = (type, listener, options = {}) => window.addEventListener(type, event => {
  if (isActive()) listener(event);
}, { ...options, signal: lifecycle.signal });

const state = { range: 'Month', tab: 'features', query: '', category: '', feature: null, anchor: null };
const tooltip = $('#tooltip');
const detail = $('#feature-detail');
const filterMenu = $('#filter-menu');
const manageMenu = $('#manage-menu');
let toastTimer;
let featureCloseTimer;
let pointerInSurface = false;
const metric = (value, label) => `<div class="metric"><dt>${label}</dt><dd>${value}</dd></div>`;
const summaryLine = (actions, share) => `<span>${number(actions)}</span> actions · <span>${share}</span> of total`;

for (const name of ['search', 'export', 'filter']) $(`#${name}-icon`).src = icons[name];

function positionSelection(control) {
  const selected = control.querySelector('[aria-pressed="true"], [aria-selected="true"]');
  const indicator = control.querySelector('.selection-indicator');
  indicator.style.width = `${selected.offsetWidth}px`;
  indicator.style.transform = `translateX(${selected.offsetLeft}px)`;
}

// One persistent pill per control; selection only changes its geometry.
const segmentedResize = new ResizeObserver(entries => entries.forEach(({ target }) => positionSelection(target)));
root.querySelectorAll('.segmented').forEach(control => {
  const indicator = document.createElement('span');
  indicator.className = 'selection-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  control.prepend(indicator);
  positionSelection(control);
  segmentedResize.observe(control);
});

function renderActivity() {
  const range = ranges[state.range];
  const { total, segments } = activityForRange(state.range);
  $('#activity-subtitle').textContent = `${number(total)} total actions across all features ${range.period}`;
  $('#summary').innerHTML = metric(number(total), 'Total actions') + metric(number(range.users), 'Active users') + metric(number(range.sessions), 'Unique sessions') + metric(range.average, 'Avg. session length (min)');
  // Zero-basis flex tracks divide the full width in the ratio of these counts.
  $('#distribution').innerHTML = segments.map((d, i) => `<button type="button" class="bar-segment" data-segment="${d.id}" style="--color:${d.color};--actions:${d.actions};z-index:${segments.length-i}" aria-label="${d.label}: ${number(d.actions)} actions, ${d.share} of total"><span class="bar-fill" aria-hidden="true"></span></button>`).join('');
  $('#legend').innerHTML = segments.map(d => `<div class="legend-item" style="width:${d.legendWidth}px"><span class="legend-dot" style="--color:${d.color}"></span><span class="legend-label">${d.label}</span><span>${number(d.actions)}</span></div>`).join('');
  root.querySelectorAll('[data-segment]').forEach(button => {
    const d = segments.find(d => d.id === button.dataset.segment);
    const show = () => {
      const box = button.getBoundingClientRect();
      tooltip.innerHTML = `<div class="tooltip-body"><h2>${d.label}</h2><p>${summaryLine(d.actions, d.share)}</p></div><div class="tooltip-line"><img src="${icons.tooltipLine}" width="20" height="1" alt=""></div><span class="tooltip-endpoint" aria-hidden="true"></span>`;
      tooltip.hidden = false;
      const endpointX = box.right - 5;
      const left = Math.max(8, Math.min(endpointX - tooltip.offsetWidth + .5, innerWidth - tooltip.offsetWidth - 8));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(8, box.top - 76)}px`;
      // Keep the marker on the segment when the card reaches a viewport edge.
      tooltip.style.setProperty('--connector-x', `${endpointX - left}px`);
      button.setAttribute('aria-describedby', 'tooltip');
    };
    button.addEventListener('pointerenter', show);
    button.addEventListener('focus', show);
    button.addEventListener('pointerleave', () => { if (!button.matches(':focus-visible')) hideTooltip(); });
    button.addEventListener('blur', hideTooltip);
  });
}

function renderRows() {
  const rows = visibleFeatures(state.query, state.category, state.range);
  $('#feature-rows').innerHTML = rows.map(f => `<tr data-feature="${f.id}">
    <td><div class="feature-name"><span>${f.name.replace('&', '&amp;')}</span><button class="feature-info" type="button" aria-label="Details for ${f.name.replace('&', '&amp;')}" aria-haspopup="dialog" aria-expanded="false" data-info="${f.id}"><span class="info-symbol" style="mask-image:url('${icons.info}')" aria-hidden="true"></span></button></div></td>
    <td><span class="badge" style="--badge-color:${f.color}">${artwork[f.art]}<span class="badge-label">${f.category}</span></span></td>
    <td>${number(f.actions)}</td><td>${number(f.users)}</td><td>${f.time}</td><td>${f.share}</td>
  </tr>`).join('');
  $('#no-results').hidden = rows.length > 0;
  $('#no-results').textContent = state.query ? 'No features match your search.' : 'No features match this category.';
  root.querySelectorAll('[data-info]').forEach(trigger => {
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') openFeature(trigger.dataset.info, trigger);
    });
    trigger.addEventListener('pointerleave', scheduleFeatureClose);
  });
}

function hideTooltip() {
  tooltip.hidden = true;
  root.querySelectorAll('[aria-describedby="tooltip"]').forEach(el => el.removeAttribute('aria-describedby'));
}

function closeFeature(restoreFocus = false) {
  clearTimeout(featureCloseTimer);
  const anchor = state.anchor;
  if (anchor) anchor.setAttribute('aria-expanded', 'false');
  detail.hidden = true;
  state.feature = null;
  state.anchor = null;
  if (restoreFocus && anchor?.isConnected) anchor.focus({ preventScroll: true });
}

function scheduleFeatureClose() {
  clearTimeout(featureCloseTimer);
  featureCloseTimer = setTimeout(() => {
    if (!state.anchor?.matches(':hover') && !detail.matches(':hover')) closeFeature();
  }, 120);
}
detail.addEventListener('pointerenter', () => clearTimeout(featureCloseTimer));
detail.addEventListener('pointerleave', scheduleFeatureClose);

function closeMenus(restoreFocus = false) {
  if (!filterMenu.hidden && restoreFocus) $('#filter').focus();
  if (!manageMenu.hidden && restoreFocus) $('#manage').focus();
  filterMenu.hidden = true;
  manageMenu.hidden = true;
  $('#filter').setAttribute('aria-expanded', 'false');
  $('#manage').setAttribute('aria-expanded', 'false');
}

function positionFeature() {
  if (!state.anchor || detail.hidden) return;
  const rect = state.anchor.getBoundingClientRect();
  detail.style.left = `${Math.max(12, Math.min(rect.right + 17, innerWidth - detail.offsetWidth - 12))}px`;
  detail.style.top = `${Math.max(12, Math.min(rect.top - 83, innerHeight - detail.offsetHeight - 12))}px`;
}

function openFeature(id, anchor) {
  clearTimeout(featureCloseTimer);
  if (state.feature === id) return;
  closeFeature(); closeMenus(); hideTooltip();
  state.feature = id;
  state.anchor = anchor;
  anchor.setAttribute('aria-expanded', 'true');
  const f = features.find(f => f.id === id);
  const content = featureDetails[id];
  const art = `<span class="feature-art"><img src="${content.orb}" width="37" height="37" alt=""></span>`;
  const trend = state.range === 'Month' ? `<div class="trend pill${content.change.startsWith('-') ? ' trend-negative' : ''}" style="--trend-width:${content.badgeWidth}px"><p><span>${content.change}</span> vs last month</p></div>` : '';
  const description = `<p class="description">${content.description.replace('this month', ranges[state.range].period)}</p>`;
  detail.innerHTML = `<div class="detail-intro"><div class="detail-header"><div class="detail-identity">${art}<div class="detail-heading"><h2 id="detail-title">${f.name.replace('&', '&amp;')}</h2><p>${summaryLine(scaleCount(f.actions, state.range), f.share)}</p></div></div>${trend}</div>${description}</div>
    <dl class="detail-metrics">${metric(number(scaleCount(f.users, state.range)), 'Unique users')}${metric(number(scaleCount(content.sessions, state.range)), 'Sessions')}${metric(f.time, 'Avg. time')}</dl>
    <div class="top-actions"><div class="action-row"><span>Top actions</span><span>Total actions</span></div>${content.actions.map(action => `<div class="action-row"><span class="action-label"><img src="${action.icon}" width="14" height="14" alt="">${action.label}</span><span>${number(scaleCount(action.count, state.range))}</span></div>`).join('')}</div>`;
  detail.hidden = false;
  positionFeature();
}

root.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => {
  state.range = button.dataset.range;
  closeFeature(); closeMenus(); hideTooltip();
  root.querySelectorAll('[data-range]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  positionSelection(button.closest('.segmented'));
  renderActivity(); renderRows();
}));

function selectTab(tab) {
  closeFeature(); closeMenus(); hideTooltip();
  state.tab = tab;
  root.querySelectorAll('[data-tab]').forEach(button => {
    button.setAttribute('aria-selected', String(button.dataset.tab === tab));
    button.tabIndex = button.dataset.tab === tab ? 0 : -1;
  });
  positionSelection($('.view-tabs'));
  $('.table-scroll').hidden = tab !== 'features';
  $('#segments-empty').hidden = tab !== 'segments';
  $('#usage-panel').setAttribute('aria-labelledby', tab === 'features' ? 'features-tab' : 'segments-tab');
  $('#search').disabled = tab !== 'features';
  $('#filter').disabled = tab !== 'features';
}
root.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => selectTab(button.dataset.tab));
  button.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const tab = event.key === 'Home' ? 'features' : event.key === 'End' ? 'segments' : state.tab === 'features' ? 'segments' : 'features';
      selectTab(tab); $(`[data-tab="${tab}"]`).focus();
    }
  });
});
$('#search').addEventListener('input', event => { state.query = event.target.value; closeFeature(); renderRows(); });

function positionMenu(menu, button) {
  const rect = button.getBoundingClientRect();
  menu.style.left = `${Math.max(12, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
  menu.style.top = `${Math.min(rect.bottom + 8, innerHeight - menu.offsetHeight - 12)}px`;
}

$('#category-options').innerHTML = ['', ...features.map(f => f.category)].map(category => `<label class="category-option"><input type="radio" name="category" value="${category}" ${category ? '' : 'checked'}><span>${category || 'All categories'}</span></label>`).join('');
$('#category-options').addEventListener('change', event => {
  state.category = event.target.value;
  $('.filter-indicator').hidden = !state.category;
  closeFeature(); renderRows(); closeMenus(true);
});
$('#filter').addEventListener('click', () => {
  const open = filterMenu.hidden;
  closeFeature(); closeMenus();
  filterMenu.hidden = !open;
  $('#filter').setAttribute('aria-expanded', String(open));
  if (open) { positionMenu(filterMenu, $('#filter')); filterMenu.querySelector('input:checked').focus(); }
});
$('#manage').addEventListener('click', () => {
  const open = manageMenu.hidden;
  closeFeature(); closeMenus();
  manageMenu.hidden = !open;
  $('#manage').setAttribute('aria-expanded', String(open));
  if (open) { positionMenu(manageMenu, $('#manage')); $('#view-features').focus(); }
});
$('#view-features').addEventListener('click', () => {
  state.query = ''; state.category = ''; $('#search').value = '';
  $('.filter-indicator').hidden = true;
  $('#category-options input[value=""]').checked = true;
  selectTab('features'); renderRows(); $('#search').focus();
});

function announce(message) {
  clearTimeout(toastTimer);
  $('#status').textContent = message; $('#status').hidden = false;
  toastTimer = setTimeout(() => { $('#status').hidden = true; }, 2600);
}
$('#export').addEventListener('click', () => {
  if (state.tab !== 'features') { announce('No user segments to export.'); return; }
  const rows = visibleFeatures(state.query, state.category, state.range);
  const url = URL.createObjectURL(new Blob(['\uFEFF' + toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `product-usage-${state.range.toLowerCase()}.csv`;
  root.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`Exported ${rows.length} ${rows.length === 1 ? 'feature' : 'features'}.`);
});

onDocument('pointerdown', event => {
  pointerInSurface = [detail, filterMenu, manageMenu].some(surface => surface.contains(event.target));
  if (!detail.hidden && !detail.contains(event.target) && !event.target.closest('[data-info]')) closeFeature();
  if (!event.target.closest('#filter-menu, #filter, #manage-menu, #manage')) closeMenus();
});
onDocument('pointerup', () => { pointerInSurface = false; });
onDocument('pointercancel', () => { pointerInSurface = false; });
onDocument('focusin', event => {
  // WebKit focuses the new tabindex=0 host panel when clicking a radio or
  // button. Let that in-surface pointer action finish before outside dismissal.
  if (pointerInSurface && event.target === root.parentElement) return;
  if (!detail.hidden && !detail.contains(event.target) && !event.target.closest('[data-info]')) closeFeature();
  if (!event.target.closest('#filter-menu, #filter, #manage-menu, #manage')) closeMenus();
});
onDocument('keydown', event => {
  if (event.key === 'Escape') { closeFeature(true); closeMenus(true); hideTooltip(); }
});
onWindow('resize', () => { positionFeature(); closeMenus(); hideTooltip(); });
onWindow('scroll', () => { positionFeature(); closeMenus(); hideTooltip(); }, { passive: true });
renderActivity(); renderRows();

// Fonts can finish loading after the first measurement. Hidden panels can also
// report zero widths, so refresh the existing pills when the page returns.
function refresh() {
  if (disposed || !isActive()) return;
  root.querySelectorAll('.segmented').forEach(positionSelection);
  positionFeature();
}
document.fonts.ready.then(refresh);
root.addEventListener('scroll', () => {
  if (isActive()) { positionFeature(); closeMenus(); hideTooltip(); }
}, { passive: true, signal: lifecycle.signal });
return {
  refresh,
  destroy() {
    disposed = true;
    lifecycle.abort();
    segmentedResize.disconnect();
    clearTimeout(toastTimer);
    clearTimeout(featureCloseTimer);
  },
};
}
