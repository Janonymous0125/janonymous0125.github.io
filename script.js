const toggle = document.getElementById('darkModeToggle');

function updateDarkModeToggleState() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
}

if (toggle) {
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
        updateDarkModeToggleState();
    });
}

// Apply saved preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
}
updateDarkModeToggleState();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Smooth transition when navigating links
document.querySelectorAll('a[href$=".html"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const target = this.href;
        const content = document.querySelector('.page-content');

        if (!content || prefersReducedMotion.matches) {
            return;
        }

        e.preventDefault();
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
function setDropdownOpenState(dropdown, isOpen) {
    if (!dropdown) return;
    const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
    dropdown.classList.toggle('open', isOpen);
    if (dropdownToggle) {
        dropdownToggle.setAttribute('aria-expanded', String(isOpen));
    }
}

function closeAllDropdowns(exceptDropdown = null) {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        if (dropdown !== exceptDropdown) {
            setDropdownOpenState(dropdown, false);
        }
    });
}

document.querySelectorAll('.dropdown-toggle').forEach(dropdownToggle => {
    dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = dropdownToggle.closest('.dropdown');
        const willOpen = !dropdown.classList.contains('open');

        closeAllDropdowns(dropdown);
        setDropdownOpenState(dropdown, willOpen);
    });

    dropdownToggle.addEventListener('keydown', (e) => {
        const dropdown = dropdownToggle.closest('.dropdown');
        const menuLinks = dropdown ? dropdown.querySelectorAll('.dropdown-content a') : [];

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const willOpen = dropdown && !dropdown.classList.contains('open');
            closeAllDropdowns(dropdown);
            setDropdownOpenState(dropdown, willOpen);
            if (willOpen && menuLinks.length) {
                menuLinks[0].focus();
            }
        } else if (e.key === 'ArrowDown') {
            if (dropdown && !dropdown.classList.contains('open')) {
                e.preventDefault();
                closeAllDropdowns(dropdown);
                setDropdownOpenState(dropdown, true);
            }
            if (menuLinks.length) {
                e.preventDefault();
                menuLinks[0].focus();
            }
        } else if (e.key === 'Escape') {
            setDropdownOpenState(dropdown, false);
        }
    });
});

document.querySelectorAll('.dropdown-content').forEach(menu => {
    menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const dropdown = menu.closest('.dropdown');
            setDropdownOpenState(dropdown, false);
            const dropdownToggle = dropdown ? dropdown.querySelector('.dropdown-toggle') : null;
            if (dropdownToggle) dropdownToggle.focus();
        }
    });
});

// Optional: Close dropdown if you click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        closeAllDropdowns();
    }
});

// Homepage ambience audio (opt-in)
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggleBtn = document.getElementById('musicToggleBtn');

function updateMusicToggleLabel() {
    if (!backgroundMusic || !musicToggleBtn) return;
    const isPlaying = !backgroundMusic.paused;
    musicToggleBtn.textContent = isPlaying ? '⏸ Pause Ambience' : '▶ Play Ambience';
    musicToggleBtn.setAttribute('aria-pressed', String(isPlaying));
}

if (backgroundMusic && musicToggleBtn) {
    const savedMusicPreference = localStorage.getItem('portfolioMusicEnabled') === 'true';

    if (savedMusicPreference) {
        backgroundMusic.play().catch(() => {
            updateMusicToggleLabel();
        });
    }

    backgroundMusic.addEventListener('play', updateMusicToggleLabel);
    backgroundMusic.addEventListener('pause', updateMusicToggleLabel);

    musicToggleBtn.addEventListener('click', async () => {
        try {
            if (backgroundMusic.paused) {
                await backgroundMusic.play();
                localStorage.setItem('portfolioMusicEnabled', 'true');
            } else {
                backgroundMusic.pause();
                localStorage.setItem('portfolioMusicEnabled', 'false');
            }
        } catch (error) {
            console.error('Unable to toggle background music:', error);
        } finally {
            updateMusicToggleLabel();
        }
    });

    updateMusicToggleLabel();
}

// Timeline Animation on Scroll (Fade-in for items)
const timelineItems = document.querySelectorAll('.timeline-item');

const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.2 // 20% of item is visible
};

let observer = null;

if (timelineItems.length) {
    if (prefersReducedMotion.matches) {
        timelineItems.forEach(item => item.classList.add('in-view'));
    } else {
        observer = new IntersectionObserver((entries) => {
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
    }
}

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
if (timeline && !prefersReducedMotion.matches) {
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