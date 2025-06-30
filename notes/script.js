document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('main section');

    // --- Section Visibility Management ---

    // Function to hide all sections in the main content area
    function hideAllSections() {
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Function to show a specific section and, optionally, scroll to an element within it
    function showSectionAndScrollToElement(sectionId, elementToScrollId = null) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block'; // Show the section

            // Determine the element to scroll to: the specific element or the section itself
            const elementToScroll = elementToScrollId ? document.getElementById(elementToScrollId) : targetSection;
            if (elementToScroll) {
                elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Smooth scroll
            }
        }
    }

    // --- Initial Page Load ---

    // Hide all sections when the page loads
    hideAllSections();

    // Dynamically show the first section found in the <main> element by default
    // This makes the script reusable across different HTML files.
    if (sections.length > 0) {
        showSectionAndScrollToElement(sections[0].id);
    }

    // --- Navigation Link Click Handler ---

    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent the browser's default jump to anchor behavior

            const targetHref = this.getAttribute('href');
            let sectionId = targetHref.substring(1); // Extract the ID (e.g., "introduction", "bandit0")

            let elementToScrollId = null;

            // Define a mapping for sub-sections that are within a larger parent section.
            // When a sub-section link is clicked, the parent section is displayed,
            // and then the page scrolls to the specific sub-section element.
            const subSectionMapping = {
                'bandit0': 'OTW-bandit',
                'bandit1': 'OTW-bandit',
                'hackingnotes': 'hackingnotes', // Ensure 'hackingnotes' also targets its section
                'catwt1': 'OTW-bandit',
                'nanowt1': 'OTW-bandit',
                'viwt1': 'OTW-bandit',
                'vimwt1': 'OTW-bandit'
                // Add more 'subSectionId': 'parentSectionId' pairs as needed for other HTML files
            };

            // Check if the clicked link targets a known sub-section
            if (subSectionMapping[sectionId]) {
                elementToScrollId = sectionId; // Store the ID of the specific element to scroll to
                sectionId = subSectionMapping[sectionId]; // Update sectionId to the parent section's ID
            }

            hideAllSections(); // Hide all sections
            showSectionAndScrollToElement(sectionId, elementToScrollId); // Show the relevant section and scroll

            // If the clicked link is inside a <details> element (dropdown), ensure it's open
            const parentDetails = this.closest('details');
            if (parentDetails && !parentDetails.open) {
                parentDetails.open = true;
            }
        });
    });

    // --- Code Block Copy Button Functionality ---

    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target'); // Get the ID of the code element to copy
            const codeElement = document.getElementById(targetId);

            if (codeElement) {
                const codeToCopy = codeElement.textContent; // Get the text content of the code block
                navigator.clipboard.writeText(codeToCopy) // Copy to clipboard
                    .then(() => {
                        alert('Code copied to clipboard!'); // Success message
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err); // Error handling
                    });
            }
        });
    });

    // --- Construction Modal Logic ---
    const modal = document.getElementById("construction-modal");
    const closeBtn = document.getElementById("close-modal");

    if (modal && closeBtn) { // Ensure elements exist before adding listeners
        modal.style.display = "flex"; // Show the modal initially

        closeBtn.addEventListener("click", () => {
            modal.style.display = "none"; // Hide modal on close button click
        });

        // Optional: Close modal if clicked outside of modal-content
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

});