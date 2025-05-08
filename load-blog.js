document.addEventListener("DOMContentLoaded", () => {
  fetch('posts/generalposts.json')
    .then(response => response.json())
    .then(posts => {
      const container = document.getElementById('blog-posts');
      container.innerHTML = '';

      posts.forEach(post => {
        const article = document.createElement('article');
        article.innerHTML = `
          <h2>${post.title}</h2>
          <small>${post.date}</small>
          ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image">` : ''}
          <p>${post.content}</p>
        `;
        container.appendChild(article);
      });
    })
    .catch(error => {
      console.error('Error loading blog posts:', error);
      document.getElementById('blog-posts').textContent = 'Failed to load posts.';
    });
});
