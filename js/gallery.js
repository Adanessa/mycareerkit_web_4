// js/gallery.js
document.addEventListener('DOMContentLoaded', function() {
    // Sample gallery data with placeholders
    const galleryData = [
        {
            id: 1,
            title: "Modern Tech CV",
            description: "Clean, professional design perfect for tech roles",
            category: "technology",
            tags: ["Modern", "Clean", "Professional"],
            date: "2025-01-15",
            htmlFile: "cv-modern-tech.html", // Replace with actual HTML file path
            thumbnail: "assets/thumbnails/cv-tech.jpg" // Replace with actual thumbnail path
        },
        {
            id: 2,
            title: "Creative Designer CV",
            description: "Bold and creative design for visual roles",
            category: "design",
            tags: ["Creative", "Colorful", "Modern"],
            date: "2025-01-10",
            htmlFile: "cv-creative-designer.html",
            thumbnail: "assets/thumbnails/cv-design.jpg"
        },
        {
            id: 3,
            title: "Executive Leadership CV",
            description: "Elegant and sophisticated for executive positions",
            category: "business",
            tags: ["Elegant", "Professional", "Minimal"],
            date: "2025-01-05",
            htmlFile: "cv-executive.html",
            thumbnail: "assets/thumbnails/cv-executive.jpg"
        },
        {
            id: 4,
            title: "Academic Researcher CV",
            description: "Structured and detailed for academic applications",
            category: "academic",
            tags: ["Structured", "Detailed", "Professional"],
            date: "2024-12-20",
            htmlFile: "cv-academic.html",
            thumbnail: "assets/thumbnails/cv-academic.jpg"
        },
        {
            id: 5,
            title: "Minimalist Professional CV",
            description: "Ultra-clean design focusing on content",
            category: "professional",
            tags: ["Minimal", "Clean", "Elegant"],
            date: "2024-12-15",
            htmlFile: "cv-minimalist.html",
            thumbnail: "assets/thumbnails/cv-minimal.jpg"
        },
        {
            id: 6,
            title: "Showstopper Animated CV",
            description: "Dynamic HTML CV with animations and interactions",
            category: "showstopper",
            tags: ["Animated", "Interactive", "Dynamic"],
            date: "2024-12-10",
            htmlFile: "cv-showstopper.html",
            thumbnail: "assets/thumbnails/cv-animated.jpg"
        }
    ];

    // DOM Elements
    const galleryGrid = document.getElementById('galleryGrid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const previewModal = document.getElementById('previewModal');
    const previewFrame = document.getElementById('previewFrame');
    const previewTitle = document.getElementById('previewTitle');
    const previewClose = document.getElementById('previewClose');
    const previewDownload = document.getElementById('previewDownload');
    const previewOpen = document.getElementById('previewOpen');
    const emptyState = document.getElementById('emptyState');

    let currentFilter = 'all';

    // Initialize gallery
    function initGallery() {
        renderGalleryItems(galleryData);
        setupEventListeners();
    }

    // Render gallery items
    function renderGalleryItems(items) {
        if (items.length === 0) {
            emptyState.style.display = 'block';
            galleryGrid.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        
        galleryGrid.innerHTML = items.map(item => `
            <div class="gallery-item" data-id="${item.id}" data-category="${item.category}">
                <div class="gallery-thumbnail-container">
                    <div class="gallery-thumbnail">
                        <div class="gallery-thumbnail-placeholder">
                            <i class="fas fa-file-alt"></i>
                            <span>${item.title}</span>
                        </div>
                    </div>
                    <div class="gallery-overlay">
                        <div class="gallery-overlay-content">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            <div class="gallery-overlay-tags">
                                ${item.tags.map(tag => `<span class="gallery-tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="gallery-info">
                    <h3>${item.title}</h3>
                    <div class="gallery-meta">
                        <span class="gallery-category">${formatCategory(item.category)}</span>
                        <span class="gallery-date">${formatDate(item.date)}</span>
                    </div>
                    <p class="gallery-description-short">${item.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Format category name
    function formatCategory(category) {
        const categoryMap = {
            'technology': 'Technology',
            'design': 'Design',
            'business': 'Business',
            'academic': 'Academic',
            'professional': 'Professional',
            'showstopper': 'Showstopper'
        };
        return categoryMap[category] || category;
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short'
        });
    }

    // Filter gallery items
    function filterGallery(category) {
        currentFilter = category;
        
        // Update active button
        filterButtons.forEach(btn => {
            if (btn.dataset.filter === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Filter items
        let filteredItems;
        if (category === 'all') {
            filteredItems = galleryData;
        } else {
            filteredItems = galleryData.filter(item => item.category === category);
        }
        
        renderGalleryItems(filteredItems);
    }

    // Open preview
    function openPreview(itemId) {
        const item = galleryData.find(i => i.id === itemId);
        if (!item) return;
        
        previewTitle.textContent = item.title;
        previewFrame.src = item.htmlFile;
        
        // Update download link
        previewDownload.href = item.htmlFile;
        previewDownload.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}.html`;
        
        // Update open in new window link
        previewOpen.href = item.htmlFile;
        previewOpen.target = '_blank';
        
        previewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close preview
    function closePreview() {
        previewModal.classList.remove('active');
        previewFrame.src = '';
        document.body.style.overflow = '';
    }

    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterGallery(btn.dataset.filter);
            });
        });
        
        // Gallery items click
        galleryGrid.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');
            if (galleryItem) {
                const itemId = parseInt(galleryItem.dataset.id);
                openPreview(itemId);
            }
        });
        
        // Close modal
        previewClose.addEventListener('click', closePreview);
        
        // Close modal on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePreview();
            }
        });
        
        // Close modal on backdrop click
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreview();
            }
        });
    }

    // Initialize the gallery
    initGallery();
});