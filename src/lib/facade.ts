// Click-to-load facades (R-9.2): before the click there is no iframe and no
// request to the provider. The click loads only this one element. The choice is
// not stored — after a reload the facade is shown again.
import '../styles/facade.css';

export function initFacades() {
  document
    .querySelectorAll<HTMLElement>('[data-facade-load]')
    .forEach((button) =>
      button.addEventListener('click', () => {
        const facade = button.closest<HTMLElement>('[data-facade]');
        const src = facade?.dataset.facadeSrc;
        if (!facade || !src || facade.querySelector('iframe')) return;
        const frame = document.createElement('iframe');
        frame.src = src;
        frame.title = facade.dataset.facadeTitle || '';
        frame.className = 'facade__frame';
        frame.loading = 'lazy';
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.allowFullscreen = true;
        frame.allow = facade.dataset.facadeAllow || '';
        facade
          .querySelectorAll('[data-facade-ui]')
          .forEach((element) => element.remove());
        facade.appendChild(frame);
        frame.focus();
      }),
    );
}
