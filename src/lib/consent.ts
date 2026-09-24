import type { OptionalService, Purpose } from './services';
export function initConsent(services: OptionalService[]) {
  const dialog = document.querySelector<HTMLDialogElement>('#consent');
  const opener = document.querySelector<HTMLButtonElement>('#consent-open');
  if (!dialog || !opener || !services.length) return;
  const key = 'site-consent-v1';
  const signature = services
    .map((s) => `${s.id}:${s.purpose}`)
    .sort()
    .join('|');
  const purposes = [...new Set(services.map((s) => s.purpose))];
  const options = dialog.querySelector<HTMLElement>('#consent-options')!;
  const inputs = [...dialog.querySelectorAll<HTMLInputElement>('input')];
  const active = new Map<string, void | (() => void)>();
  let selected: Purpose[] = [];
  let saved = false;
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (
      value?.signature === signature &&
      Number.isFinite(value.time) &&
      value.time <= Date.now() &&
      Date.now() - value.time < 180 * 86400000 &&
      Array.isArray(value.selected)
    ) {
      selected = purposes.filter((p) => value.selected.includes(p));
      saved = true;
    }
  } catch {}
  function apply() {
    for (const service of services)
      if (selected.includes(service.purpose) && !active.has(service.id))
        active.set(service.id, service.start());
  }
  const show = () => {
    inputs.forEach((i) => (i.checked = selected.includes(i.value as Purpose)));
    dialog.showModal();
  };
  inputs.forEach(
    (i) =>
      (i.closest<HTMLElement>('label')!.hidden = !purposes.includes(
        i.value as Purpose,
      )),
  );
  opener.hidden = false;
  opener.onclick = () => {
    options.hidden = false;
    show();
  };
  dialog.addEventListener('cancel', (e) => {
    if (!saved) e.preventDefault();
  });
  dialog.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-consent]',
    )?.dataset.consent;
    if (!action) return;
    if (action === 'configure') {
      options.hidden = false;
      inputs.find((i) => !i.closest<HTMLElement>('label')!.hidden)?.focus();
      return;
    }
    const next: Purpose[] =
      action === 'accept'
        ? [...purposes]
        : action === 'reject'
          ? []
          : inputs
              .filter((i) => i.checked && purposes.includes(i.value as Purpose))
              .map((i) => i.value as Purpose);
    const revoked = selected.some((p) => !next.includes(p));
    selected = next;
    saved = true;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ signature, time: Date.now(), selected }),
      );
    } catch {}
    if (revoked) {
      for (const stop of active.values()) {
        try {
          if (stop) stop();
        } catch (error) {
          console.error('Optional service cleanup failed', error);
        }
      }
      location.reload();
      return;
    }
    apply();
    dialog.close();
    opener.focus();
  });
  apply();
  if (!saved) show();
}
