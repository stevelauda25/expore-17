// Drafts stay local; only valid saves update the shared Product Usage settings.
export function mountManageSettings(dialog, saved, onChange, restoreFocus) {
  const cycles = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const rows = new Map([...dialog.querySelectorAll('[data-manage-setting]')].map(row =>
    [row.dataset.manageSetting, { row, resting: row.innerHTML }]));
  let active = null;
  let draft = null;
  const number = value => value.toLocaleString('en-US');

  function parseLimit(value) {
    const text = value.trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) return null;
    const result = Number(text.replaceAll(',', ''));
    return Number.isSafeInteger(result) && result > 0 ? result : null;
  }
  function parseAlert(value) {
    const text = value.trim();
    if (!/^\d+(?:\.\d+)?%?$/.test(text)) return null;
    const result = Number(text.replace('%', ''));
    return result >= 0 && result <= 100 ? result : null;
  }
  function normalized() {
    if (active === 'actionLimit') {
      const actionLimit = parseLimit(draft.actionLimit);
      return actionLimit === null ? null : { actionLimit };
    }
    if (active === 'alerts') {
      const alert1 = parseAlert(draft.alert1), alert2 = parseAlert(draft.alert2);
      return alert1 === null || alert2 === null || alert1 > alert2 ? null : { alert1, alert2 };
    }
    return active === 'resetCycle' ? { resetCycle: draft.resetCycle } : null;
  }
  function changes() {
    const value = normalized();
    return value && Object.keys(value).some(key => value[key] !== saved[key]) ? value : null;
  }
  function updateSave() {
    rows.get(active).row.querySelector('.manage-save').disabled = !changes();
  }
  function cancel(shouldRestoreFocus = false, fromEscape = false) {
    if (!active) return false;
    const key = active, { row, resting } = rows.get(key);
    row.innerHTML = resting;
    row.querySelector('p:last-child').textContent = key === 'actionLimit' ? `${number(saved.actionLimit)} actions`
      : key === 'alerts' ? `${saved.alert1}% · ${saved.alert2}%` : saved.resetCycle;
    delete row.dataset.editing;
    active = null; draft = null;
    if (shouldRestoreFocus) restoreFocus(row.querySelector('.manage-edit'), fromEscape);
    return true;
  }
  function save() {
    const value = changes();
    if (!value) return;
    Object.assign(saved, value);
    onChange();
    cancel(true);
  }
  function input(name, label, value, mode = 'numeric') {
    return `<input class="manage-input" name="${name}" aria-label="${label}" inputmode="${mode}" type="text" value="${value}" autocomplete="off" spellcheck="false">`;
  }
  function edit(key) {
    cancel();
    active = key;
    draft = { actionLimit: number(saved.actionLimit), alert1: `${saved.alert1}%`, alert2: `${saved.alert2}%`, resetCycle: saved.resetCycle };
    const { row } = rows.get(key);
    row.dataset.editing = key;
    const values = key === 'actionLimit' ? input('actionLimit', 'Monthly action limit', draft.actionLimit)
      : key === 'alerts' ? `<label class="manage-alert"><span>Alert 1</span>${input('alert1', 'Alert 1', draft.alert1, 'decimal')}</label><label class="manage-alert"><span>Alert 2</span>${input('alert2', 'Alert 2', draft.alert2, 'decimal')}</label>`
        : cycles.map(cycle => `<button type="button" class="manage-cycle" role="radio" aria-checked="${cycle === saved.resetCycle}" tabindex="${cycle === saved.resetCycle ? 0 : -1}" data-cycle="${cycle}">${cycle}</button>`).join('');
    row.innerHTML = `<div class="manage-editor-values"${key === 'resetCycle' ? ' role="radiogroup" aria-label="Reset cycle"' : ''}>${values}</div><button type="button" class="manage-save" disabled>Save</button>`;
    row.querySelector('input, [aria-checked="true"]').focus({ preventScroll: true });
  }
  function selectCycle(button) {
    draft.resetCycle = button.dataset.cycle;
    rows.get(active).row.querySelectorAll('[role="radio"]').forEach(radio => {
      const selected = radio === button;
      radio.setAttribute('aria-checked', String(selected));
      radio.tabIndex = selected ? 0 : -1;
    });
    button.focus({ preventScroll: true });
    updateSave();
  }
  const usage = dialog.querySelector('.manage-usage');
  usage.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.matches('.manage-edit')) edit(button.closest('[data-manage-setting]').dataset.manageSetting);
    else if (button?.matches('.manage-save')) save();
    else if (button?.matches('.manage-cycle')) selectCycle(button);
  });
  usage.addEventListener('input', event => {
    if (!event.target.matches('.manage-input')) return;
    draft[event.target.name] = event.target.value;
    updateSave();
  });
  usage.addEventListener('focusout', event => {
    const field = event.target;
    if (!active || !field.matches('.manage-input')) return;
    const value = field.name === 'actionLimit' ? parseLimit(field.value) : parseAlert(field.value);
    if (value !== null) {
      field.value = field.name === 'actionLimit' ? number(value) : `${value}%`;
      draft[field.name] = field.value;
    }
  });
  usage.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.target.matches('.manage-input') && event.key === 'Enter') {
      event.preventDefault(); save();
    } else if (event.target.matches('.manage-cycle') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const buttons = [...rows.get(active).row.querySelectorAll('[role="radio"]')];
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      selectCycle(buttons[(buttons.indexOf(event.target) + offset + buttons.length) % buttons.length]);
    }
  });
  return { cancel };
}
