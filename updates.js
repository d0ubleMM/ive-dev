/* Submit only on an explicit signup; no storage, analytics or background requests. */
(() => {
  for (const form of document.querySelectorAll('[data-updates-form]')) {
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('[data-updates-status]');
    const buttonText = button.textContent;
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      busy = true;
      button.disabled = true;
      button.textContent = 'Saving…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = '';
      delete status.dataset.state;
      const fields = new FormData(form);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          credentials: 'omit',
          redirect: 'error',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: String(fields.get('email') || '').trim(),
            consent: fields.get('consent') === 'yes',
            consent_version: fields.get('consent_version'),
            source: fields.get('source'),
            website: fields.get('website')
          }),
          signal: controller.signal
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || result?.ok !== true) {
          const message = typeof result?.message === 'string' ? result.message :
            'We couldn’t save your email. Please try again shortly.';
          throw new Error(message);
        }
        status.dataset.state = 'success';
        status.textContent = result.message || 'You’re on the list. Your email has been saved.';
        form.reset();
      } catch (error) {
        status.dataset.state = 'error';
        status.textContent = error.name === 'AbortError' ?
          'The request took longer than expected. Please try again; your address will only be saved once.' :
          (error instanceof TypeError ? 'We couldn’t connect. Check your connection and try again.' : error.message);
      } finally {
        clearTimeout(timeout);
        busy = false;
        button.disabled = false;
        button.textContent = buttonText;
        form.removeAttribute('aria-busy');
        status.focus();
      }
    });
  }
})();
