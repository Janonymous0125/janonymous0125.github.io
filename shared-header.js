const sharedChromeConfig = window.sharedChromeConfig || {};
const sharedHeaderConfig = sharedChromeConfig.header || {};
const sharedHeaderPages = sharedHeaderConfig.pages || {};
const sharedBlogKeys = new Set(sharedHeaderConfig.blogNav || []);
const sharedBlogButtonLabel = sharedHeaderConfig.blogButtonLabel || 'Blog ▾';

function buildNavLink(href, label, currentKey, linkKey) {
    const isCurrent = currentKey === linkKey;
    return `<a href="${href}"${isCurrent ? ' aria-current="page"' : ''}>${label}</a>`;
}

function buildBlogDropdown(currentKey) {
    const isBlogCurrent = sharedBlogKeys.has(currentKey);
    const blogLinks = (sharedHeaderConfig.blogNav || []).map((key) => {
        const page = sharedHeaderPages[key];
        if (!page) return '';
        return buildNavLink(page.href, page.label, currentKey, key);
    }).join('');

    return `
        <div class="dropdown${isBlogCurrent ? ' open-current' : ''}">
            <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false"${isBlogCurrent ? ' aria-current="page"' : ''}>${sharedBlogButtonLabel}</button>
            <div class="dropdown-content">
                ${blogLinks}
            </div>
        </div>
    `;
}

function buildSharedHeader(currentKey, pageTitle) {
    const resolvedKey = sharedHeaderPages[currentKey] ? currentKey : 'home';
    const resolvedTitle = pageTitle || (sharedHeaderPages[resolvedKey] && sharedHeaderPages[resolvedKey].h1) || 'Jeremiah Wong Zhi Qi';
    const primaryNavMarkup = (sharedHeaderConfig.primaryNav || []).map((key) => {
        if (key === 'contact') {
            return '';
        }
        const page = sharedHeaderPages[key];
        if (!page) return '';
        return buildNavLink(page.href, page.label, resolvedKey, key);
    }).join('');
    const contactPage = sharedHeaderPages.contact || { href: 'contact.html', label: 'Contact' };

    return `
        <header>
            <h1>${resolvedTitle}</h1>
            <nav>
                ${primaryNavMarkup}
                ${buildBlogDropdown(resolvedKey)}
                ${buildNavLink(contactPage.href, contactPage.label, resolvedKey, 'contact')}
                <button id="darkModeToggle" aria-label="Toggle dark mode" aria-pressed="false">🌓</button>
            </nav>
        </header>
    `;
}

document.querySelectorAll('[data-shared-header]').forEach((mount) => {
    const pageKey = mount.getAttribute('data-page-key') || 'home';
    const pageTitle = mount.getAttribute('data-page-title') || '';
    mount.outerHTML = buildSharedHeader(pageKey, pageTitle);
});
