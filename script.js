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

// Timeline Animation on Scroll (Fade-in for items)
const timelineItems = document.querySelectorAll('.timeline-item');

const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.2 // 20% of item is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Do not unobserve here if you want them to fade in every time they scroll into view
            // observer.unobserve(entry.target); 
        } else {
            // Optional: Remove 'in-view' class when out of view, to re-trigger on scroll back
            entry.target.classList.remove('in-view');
        }
    });
}, observerOptions);

timelineItems.forEach(item => {
    observer.observe(item);
});

// Automatic Horizontal Scroll for Timeline
const timeline = document.querySelector('.timeline');
let scrollAmount = 0; // This variable is not strictly needed if directly manipulating scrollLeft
const scrollSpeed = 0.5; // Adjust scroll speed here (pixels per frame)
let scrollDirection = 1; // 1 for right, -1 for left

function autoScrollTimeline() {
    if (!timeline) return;

    // Check if the user is hovering over the timeline
    if (timeline.matches(':hover')) {
        requestAnimationFrame(autoScrollTimeline); // Continue animation but don't scroll
        return;
    }

    timeline.scrollLeft += scrollSpeed * scrollDirection;

    // Change direction if reached ends
    if (timeline.scrollLeft >= (timeline.scrollWidth - timeline.clientWidth - 1)) { // -1 for a small buffer
        scrollDirection = -1;
    } else if (timeline.scrollLeft <= 0) {
        scrollDirection = 1;
    }

    requestAnimationFrame(autoScrollTimeline);
}

// Start auto-scrolling when the page loads
if (timeline) {
    autoScrollTimeline();
}


// Resume PDF Download
const downloadResumeBtn = document.getElementById('downloadResumeBtn');

if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener('click', () => {
        // Replace 'path/to/your/resume.pdf' with the actual path to your PDF file
        const resumeUrl = 'files/My_Resume.pdf';
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = 'My_Resume.pdf'; // Suggested filename for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}