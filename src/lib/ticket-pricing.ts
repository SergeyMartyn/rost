import type { PriceQuote } from '../../worker/promotions';

// Isolated from the contact form: no personal data is sent for price previews.
export function ticketPricing(isRu: boolean, changed: () => void) {
  const input = document.querySelector<HTMLInputElement>('#ticket-promo');
  const apply = document.querySelector<HTMLButtonElement>(
    '#ticket-promo-apply',
  );
  const remove = document.querySelector<HTMLButtonElement>(
    '#ticket-promo-remove',
  );
  const message = document.querySelector<HTMLElement>('#ticket-promo-message');
  const breakdown = document.querySelector<HTMLElement>('#ticket-price');
  const base = document.querySelector<HTMLElement>('#ticket-price-base');
  const baseLabel = document.querySelector<HTMLElement>('#ticket-price-label');
  const secondRow = document.querySelector<HTMLElement>(
    '#ticket-second-participant',
  );
  const secondName = document.querySelector<HTMLInputElement>(
    '#ticket-second-name',
  );
  const showSecond = (show: boolean, clear = false) => {
    if (secondRow) secondRow.hidden = !show;
    if (secondName) {
      secondName.disabled = !show;
      secondName.required = show;
      if (clear) {
        secondName.value = '';
        secondName.setCustomValidity('');
      }
    }
  };
  const discount = document.querySelector<HTMLElement>(
    '#ticket-price-discount',
  );
  const total = document.querySelector<HTMLElement>('#ticket-price-total');
  const discountRow = document.querySelector<HTMLElement>(
    '#ticket-price-discount-row',
  );
  const details = document.querySelector<HTMLDetailsElement>(
    '#ticket-promo-details',
  );
  let ticket = '';
  let revision = 0;
  let current: PriceQuote | null = null;
  let busy = false;
  const money = (cents: number) =>
    '€' +
    (cents / 100).toLocaleString(isRu ? 'ru-RU' : 'de-DE', {
      minimumFractionDigits: cents % 100 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  const normalized = () => input?.value.trim().toUpperCase() || '';
  const text = (value: string, error = false) => {
    if (!message) return;
    message.textContent = value;
    message.classList.toggle('text-red-800', error);
    message.classList.toggle('text-brand', !error);
    input?.setAttribute('aria-invalid', String(error));
  };
  const errorText = (code: string) => {
    if (code === 'promo_not_applicable')
      return isRu
        ? 'Промокод не применяется к этому билету. Уберите код, чтобы оплатить без скидки.'
        : 'Dieser Code gilt nicht für dieses Ticket. Entferne ihn, um ohne Rabatt fortzufahren.';
    if (code === 'invalid_promo')
      return isRu
        ? 'Промокод не найден или больше не действует.'
        : 'Der Code ist ungültig oder nicht mehr aktiv.';
    if (code === 'offer_ended' || code === 'event_archived')
      return isRu
        ? 'Продажа выбранного билета завершена. Выберите другой билет.'
        : 'Dieses Ticket wird nicht mehr angeboten. Bitte wähle ein anderes Ticket.';
    return isRu
      ? 'Не удалось проверить цену. Попробуйте ещё раз.'
      : 'Der Preis konnte nicht geprüft werden. Bitte versuche es erneut.';
  };
  async function refresh(notice = '') {
    const request = ++revision;
    const code = normalized();
    const selected = ticket;
    showSecond(false);
    current = null;
    busy = true;
    if (apply) {
      apply.disabled = true;
      apply.setAttribute('aria-busy', 'true');
    }
    text(isRu ? 'Проверяем цену…' : 'Preis wird geprüft…');
    changed();
    try {
      const response = await fetch('/api/orders/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: selected, promoCode: code }),
        signal: AbortSignal.timeout(15000),
      });
      const data = (await response.json()) as Partial<PriceQuote> & {
        error?: string;
      };
      if (request !== revision) return;
      if (!response.ok) throw new Error(data.error || 'pricing_unavailable');
      if (
        typeof data.quoteKey !== 'string' ||
        (data.quantity !== 1 && data.quantity !== 2) ||
        (!code && data.quantity !== 1) ||
        !Number.isInteger(data.unitAmountCents) ||
        !Number.isInteger(data.amountCents) ||
        !Number.isInteger(data.baseAmountCents) ||
        !Number.isInteger(data.discountCents) ||
        !Number.isInteger(data.discountPercent) ||
        (data.amountCents ?? 0) <= 0 ||
        (data.discountCents ?? -1) < 0 ||
        data.baseAmountCents !== (data.unitAmountCents ?? 0) * data.quantity ||
        data.baseAmountCents !==
          (data.amountCents ?? 0) + (data.discountCents ?? 0) ||
        (data.promoCode || '') !== code
      )
        throw new Error('pricing_unavailable');
      current = data as PriceQuote;
      showSecond(current.quantity === 2, current.quantity === 1);
      if (baseLabel)
        baseLabel.textContent =
          current.quantity === 2
            ? isRu
              ? '2 билета'
              : '2 Tickets'
            : isRu
              ? 'Стоимость билета'
              : 'Ticketpreis';
      if (base)
        base.textContent =
          current.quantity === 2
            ? `2 × ${money(current.unitAmountCents)} = ${money(current.baseAmountCents)}`
            : money(current.baseAmountCents);
      if (discount)
        discount.textContent = `${current.discountPercent}% · −${money(current.discountCents)}`;
      if (total) total.textContent = money(current.amountCents);
      if (discountRow) discountRow.hidden = !current.discountCents;
      if (breakdown) breakdown.hidden = false;
      if (input) input.value = current.promoCode || '';
      text(
        notice ||
          (current.promoCode
            ? isRu
              ? 'Промокод применён.'
              : 'Der Code wurde angewendet.'
            : ''),
      );
    } catch (error) {
      if (request !== revision) return;
      if (breakdown) breakdown.hidden = true;
      text(errorText(error instanceof Error ? error.message : ''), true);
    } finally {
      if (request === revision) {
        busy = false;
        if (apply) {
          apply.disabled = false;
          apply.removeAttribute('aria-busy');
        }
        if (remove) remove.hidden = !normalized();
        changed();
      }
    }
  }
  input?.addEventListener('input', () => {
    ++revision;
    current = null;
    busy = false;
    if (apply) {
      apply.disabled = false;
      apply.removeAttribute('aria-busy');
    }
    if (remove) remove.hidden = !normalized();
    if (breakdown) breakdown.hidden = true;
    showSecond(false, !normalized());
    text(
      isRu
        ? 'Нажмите «Применить», чтобы проверить цену.'
        : 'Klicke auf „Anwenden“, um den Preis zu prüfen.',
    );
    changed();
  });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void refresh();
    }
  });
  apply?.addEventListener('click', () => void refresh());
  remove?.addEventListener('click', () => {
    if (input) input.value = '';
    showSecond(false, true);
    void refresh();
  });
  return {
    reset(key: string) {
      ++revision;
      ticket = key;
      current = null;
      busy = false;
      if (input) input.value = '';
      if (remove) remove.hidden = true;
      if (details) details.open = false;
      if (breakdown) breakdown.hidden = true;
      showSecond(false, true);
      if (apply) {
        apply.disabled = false;
        apply.removeAttribute('aria-busy');
      }
      text('');
    },
    refresh,
    ready: () =>
      !busy && !!current && (current.promoCode || '') === normalized(),
    payload: () => ({
      promoCode: current?.promoCode || '',
      quoteKey: current?.quoteKey,
      quantity: current?.quantity ?? 1,
      secondParticipantName:
        current?.quantity === 2 ? secondName?.value.trim() || '' : undefined,
    }),
    validate: () => {
      if (current?.quantity !== 2) return true;
      if (!secondName) return false;
      secondName.setCustomValidity(
        secondName.value.trim().length < 2
          ? isRu
            ? 'Введите имя второго участника.'
            : 'Gib den Namen der zweiten Person ein.'
          : '',
      );
      return secondName.reportValidity();
    },
    reject(code: string) {
      if (code === 'price_changed') {
        void refresh(
          isRu
            ? 'Цена обновилась. Проверьте итог и снова выберите способ оплаты.'
            : 'Der Preis wurde aktualisiert. Prüfe den Gesamtpreis und wähle erneut die Zahlungsart.',
        );
      } else {
        ++revision;
        current = null;
        busy = false;
        if (breakdown) breakdown.hidden = true;
        showSecond(false);
        text(errorText(code), true);
        changed();
      }
    },
  };
}
