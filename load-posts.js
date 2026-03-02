document.addEventListener("DOMContentLoaded", () => {
    const postContainers = document.querySelectorAll('[data-posts-json]');

    function attachMediaFallbacks(article) {
        article.querySelectorAll('img.post-media').forEach(img => {
            img.addEventListener('error', () => {
                if (img.dataset.fallbackApplied === 'true') return;
                img.dataset.fallbackApplied = 'true';
                img.src = 'images/post1.jpg';
                img.alt = 'Fallback post image';
            });
        });

        article.querySelectorAll('video.post-media').forEach(video => {
            video.addEventListener('error', () => {
                const fallback = document.createElement('p');
                fallback.textContent = '⚠️ Video unavailable.';
                video.replaceWith(fallback);
            }, { once: true });
        });
    }

    postContainers.forEach(container => {
        const jsonPath = container.dataset.postsJson;
        const downloadLabel = container.dataset.downloadLabel || 'Download File';
        const errorText = container.dataset.errorText || 'Failed to load posts.';
        const emptyText = container.dataset.emptyText || 'No posts available yet.';

        if (!jsonPath) return;

        fetch(jsonPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(posts => {
                if (!Array.isArray(posts)) {
                    throw new Error('Invalid posts payload');
                }

                container.innerHTML = '';

                if (posts.length === 0) {
                    container.textContent = emptyText;
                    return;
                }

                posts.forEach(post => {
                    const article = document.createElement('article');
                    const externalLabel = post.externalLabel || 'Open External Media';
                    article.innerHTML = `
          <h2>${post.title || ''}</h2>
          <small>${post.date || ''}</small>
          ${post.image ? `<img src="${post.image}" class="post-media" alt="Post Image" loading="lazy" decoding="async">` : ""}
          ${post.video ? `<video class="post-media" controls preload="none" src="${post.video}"></video>` : ""}
          <div class="post-copy">${post.content || ''}</div>
          ${(post.externalUrl || post.file) ? `<div class="post-actions">${post.externalUrl ? `<a href="${post.externalUrl}" class="post-action-link" target="_blank" rel="noopener noreferrer">${externalLabel}</a>` : ''}${post.file ? `<a href="${post.file}" download>${downloadLabel}</a>` : ''}</div>` : ''}
        `;

                    attachMediaFallbacks(article);
                    container.appendChild(article);
                });
            })
            .catch(err => {
                container.textContent = errorText;
                console.error('Error loading posts:', err);
            });
    });
});
