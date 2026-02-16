document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    const pageMap = {
        'index.html': '/',
        'process.html': '/process',
        'cv-generator-demo.html': '/cv-generator',
        'gallery.html': '/gallery',
        'about.html': '/about'
    };
    
    const currentRoute = pageMap[currentPage] || '/';
    
    const navItems = [
        { label: 'Hem', href: 'index.html', route: '/' },
        { label: 'Sök Jobb', href: 'process.html', route: '/process' },
        { label: 'CV Generator', href: 'cv-generator-demo.html', route: '/cv-generator' },
        { label: 'Galleri', href: 'gallery.html', route: '/gallery' },
        { label: 'Om oss', href: 'about.html', route: '/tech' }
    ];
    const navbarHTML = `
        <nav class="navbar">
            <div class="container">
                <div class="nav-content">
                    <!-- Logo with subtitle -->
                    <a href="index.html" class="logo">
                        <div class="logo-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="logo-text">
                            <span class="logo-title">MyCareerKit</span>
                            <span class="logo-subtitle">AI-drivna karriärverktyg</span>
                        </div>
                    </a>

                    <!-- Mobile Menu Toggle -->
                    <button class="menu-toggle" aria-label="Toggle menu">
                        <i class="fas fa-bars"></i>
                    </button>

                    <!-- Navigation Items -->
                    <div class="nav-menu">
                        ${navItems.map(item => `
                            <a href="${item.href}" 
                               class="nav-link ${currentRoute === item.route ? 'active' : ''}"
                               data-label="${item.label}">
                                ${item.label}
                            </a>
                        `).join('')}
                    </div>

                    <!-- Coming Soon Badge -->
                    <div class="nav-badge animate-pulse">
                        Kommer Snart
                    </div>
                </div>
            </div>
        </nav>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    const navLinks = document.querySelectorAll('.nav-link');
    let hoveredItem = null;
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            hoveredItem = this.getAttribute('data-label');
            updateUnderlines();
        });
        
        link.addEventListener('mouseleave', function() {
            hoveredItem = null;
            updateUnderlines();
        });
    });
    
    // Create underline element
    const underline = document.createElement('div');
    underline.className = 'nav-underline';
    document.querySelector('.nav-menu').appendChild(underline);
    
    function updateUnderlines() {
        const activeLink = document.querySelector('.nav-link.active');
        const hoverLink = hoveredItem ? 
            document.querySelector(`.nav-link[data-label="${hoveredItem}"]`) : null;
        
        const targetLink = hoverLink || activeLink;
        
        if (targetLink) {
            const rect = targetLink.getBoundingClientRect();
            const menuRect = targetLink.parentElement.getBoundingClientRect();
            
            underline.style.display = 'block';
            underline.style.width = `${rect.width}px`;
            underline.style.transform = `translateX(${rect.left - menuRect.left}px)`;
            underline.style.opacity = '1';
        } else {
            underline.style.opacity = '0';
        }
    }
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
    setTimeout(updateUnderlines, 100);
    window.addEventListener('resize', updateUnderlines);
});