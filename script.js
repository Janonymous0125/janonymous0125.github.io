const toggle = document.getElementById('darkModeToggle');

toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

// Apply saved preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}
// Smooth transition when navigating links
document.querySelectorAll('a[href$=".html"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = this.href;

    e.preventDefault();
    const content = document.querySelector('.page-content');
    content.classList.add('page-exit');

    setTimeout(() => {
      window.location.href = target;
    }, 500); // Match the transition duration
  });
});
window.addEventListener('load', () => {
  const content = document.querySelector('.page-content');
  if (content) {
    content.classList.remove('page-exit'); // ensures fresh entry
  }
});
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.dropdown');
        dropdown.classList.toggle('open');

        // Close other dropdowns
        document.querySelectorAll('.dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
    });
});

// Optional: Close dropdown if you click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
    }
});
