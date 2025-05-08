document.addEventListener("DOMContentLoaded", () => {
    fetch('posts/posts-music.json')
        .then(response => response.json())
        .then(posts => {
            const container = document.getElementById('post-list');
            container.innerHTML = '';

            posts.forEach(post => {
                const article = document.createElement('article');
                article.innerHTML = `
          <h2>${post.title}</h2>
          <small>${post.date}</small>
          ${post.image ? `<img src="${post.image}" class="post-media" alt="Post Image">` : ""}
          ${post.video ? `<video class="post-media" controls src="${post.video}"></video>` : ""}
          <p>${post.content}</p>
          ${post.file ? `<a href="${post.file}" download>Download File</a>` : ""}
        `;

                container.appendChild(article);
            });
        })
        .catch(err => {
            document.getElementById('post-list').textContent = 'Failed to load posts.';
            console.error('Error loading posts:', err);
        });
});
