document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('post-list');
    const jsonPath = 'posts/posts-gamedev.json';
    const downloadLabel = '📎 Download File';
    const errorText = 'Failed to load posts.';
    const emptyText = 'No posts available yet.';

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

    if (!container) return;

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
                article.innerHTML = `
          <h2>${post.title || ''}</h2>
          <small>${post.date || ''}</small>
          ${post.image ? `<img src="${post.image}" class="post-media" alt="Post Image" loading="lazy" decoding="async">` : ""}
          ${post.video ? `<video class="post-media" controls preload="none" src="${post.video}"></video>` : ""}
          <div class="post-copy">${post.content || ''}</div>
          ${post.file ? `<a href="${post.file}" download>${downloadLabel}</a>` : ""}
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
