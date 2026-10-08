import { mountManageSettings } from './manage-settings.js';
import { monthlyUsage, number } from './data.js';

// Native dialog provides background isolation; settings belong to the page lifecycle.
export function mountManageProduct(root, { beforeOpen, saved, onFeaturesChange, restoreFocus }) {
  const dialog = root.querySelector('#manage-menu');
  const trigger = root.querySelector('#manage');
  const closeButton = dialog.querySelector('.manage-close');
  function renderSummary() {
    const { total, percentage, progress } = monthlyUsage(saved);
    dialog.querySelector('.manage-usage-total p').textContent = `${number(total)} / ${number(saved.actionLimit)} actions this month`;
    dialog.querySelector('.manage-usage-total > span').textContent = `${percentage.toFixed(1)}%`;
    dialog.querySelector('.manage-progress-fill').style.width = `${progress}%`;
  }
  const settings = mountManageSettings(dialog, saved, renderSummary, restoreFocus);
  renderSummary();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let closeTimer;
  let backdropPress = false;

  function finishClose(shouldRestoreFocus = true, fromEscape = false) {
    clearTimeout(closeTimer);
    settings.cancel();
    dialog.close();
    delete dialog.dataset.closing;
    trigger.setAttribute('aria-expanded', 'false');
    if (shouldRestoreFocus) restoreFocus(trigger, fromEscape);
  }

  function close(fromEscape = false) {
    if (!dialog.open || dialog.dataset.closing) return;
    settings.cancel();
    if (reducedMotion.matches) finishClose(true, fromEscape);
    else {
      dialog.dataset.closing = 'true';
      closeTimer = setTimeout(() => finishClose(true, fromEscape), 160);
    }
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    beforeOpen();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    closeButton.focus({ preventScroll: true });
  });
  closeButton.addEventListener('click', () => close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!settings.cancel(true, true)) close(true); });
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && event.target === dialog && outside(event)) close();
    backdropPress = false;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      if (!settings.cancel(true, true)) close(true);
    } else if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([disabled])')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
  dialog.querySelectorAll('[role="switch"]').forEach(button => {
    const id = button.dataset.featureToggle;
    button.setAttribute('aria-checked', String(saved.enabledFeatures[id]));
    button.addEventListener('click', () => {
      const checked = !saved.enabledFeatures[id];
      saved.enabledFeatures[id] = checked;
      button.setAttribute('aria-checked', String(checked));
      onFeaturesChange();
      renderSummary();
    });
  });
  return { destroy() { clearTimeout(closeTimer); if (dialog.open) finishClose(false); } };
}
