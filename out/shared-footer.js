document.addEventListener('DOMContentLoaded', () => {
  const sharedChromeConfig = window.sharedChromeConfig || {};
  const footerConfig = sharedChromeConfig.footer || {};

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const buildLinkAttributes = (item, ariaLabel) => {
    const attributes = [`href="${escapeHtml(item.href)}"`];
    if (item.download) attributes.push('download');
    if (item.target) attributes.push(`target="${escapeHtml(item.target)}"`);
    if (item.rel) attributes.push(`rel="${escapeHtml(item.rel)}"`);
    if (ariaLabel) attributes.push(`aria-label="${escapeHtml(ariaLabel)}"`);
    return attributes.join(' ');
  };

  const trustLinksMarkup = (footerConfig.trustLinks || []).map((item) => (
    `        <a ${buildLinkAttributes(item)}>${escapeHtml(item.label)}</a>`
  )).join('\n');

  const socialLinksMarkup = (footerConfig.socialLinks || []).map((item) => (
    `        <a ${buildLinkAttributes(item, item.label)}>` +
      `\n          <img src="${escapeHtml(item.icon)}" alt="${escapeHtml(item.label)}" />` +
      `\n        </a>`
  )).join('\n');

  const footerMarkup = `
    <footer class="footer">
      <div class="footer-trust-links">
${trustLinksMarkup}
      </div>
      <div class="social-icons">
${socialLinksMarkup}
      </div>
      <p class="footer-copy">${escapeHtml(footerConfig.copy || '')}</p>
    </footer>
  `;

  document.querySelectorAll('[data-shared-footer]').forEach((mountPoint) => {
    mountPoint.outerHTML = footerMarkup;
  });
});
