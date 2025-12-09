// js/cv-generator.js
// AI CV Generator Demo Animation

document.addEventListener('DOMContentLoaded', function() {
    // Demo Configuration
    const demoConfig = {
        isRunning: true,
        currentStep: 0,
        totalSteps: 7,
        loopDuration: 20000, // 20 seconds per loop
        stepDurations: [2000, 2000, 2000, 2000, 3000, 5000, 3000]
    };

    // Sample Data
    const sampleProfiles = [
        { 
            name: "Anna Svensson", 
            title: "Frontend Utvecklare", 
            email: "anna.svensson@example.com", 
            phone: "073-123 45 67",
            summary: "Erfaren Frontend-utvecklare med 5+ års erfarenhet av React, TypeScript och moderna webbtekniker. Passionerad för att skapa responsiva och tillgängliga användargränssnitt."
        },
        { 
            name: "Erik Andersson", 
            title: "Backend Utvecklare", 
            email: "erik.andersson@example.com", 
            phone: "072-987 65 43",
            summary: "Senior Backend-utvecklare specialiserad på Node.js, Python och molnarkitektur. Erfarenhet av att bygga skalbara API:er och mikroservicearkitekturer."
        },
        { 
            name: "Maria Johansson", 
            title: "UX Designer", 
            email: "maria.johansson@example.com", 
            phone: "076-555 12 34",
            summary: "Kreativ UX-designer med bakgrund inom psykologi och interaktionsdesign. Expert på användarforskning, wireframing och prototyputveckling."
        },
        { 
            name: "Karl Bengtsson", 
            title: "DevOps Engineer", 
            email: "karl.bengtsson@example.com", 
            phone: "070-111 22 33",
            summary: "DevOps-specialist med omfattande erfarenhet av CI/CD, containerisering och molninfrastruktur. Certifierad inom AWS och Kubernetes."
        }
    ];

    const sampleJobs = [
        { title: "Frontend Developer", company: "TechCorp AB", location: "Stockholm", salary: "45 000 kr/mån" },
        { title: "Fullstack Developer", company: "InnovateIT", location: "Göteborg", salary: "52 000 kr/mån" },
        { title: "DevOps Engineer", company: "CloudSystems", location: "Remote", salary: "48 000 kr/mån" },
        { title: "UX Designer", company: "DesignStudio", location: "Malmö", salary: "42 000 kr/mån" }
    ];

    const cvStyles = ["Professionell", "Kreativ", "Minimalistisk", "Modern", "Corporate", "Tech"];
    const aiProviders = ["DeepSeek", "Groq", "OpenAI", "Anthropic"];
    const aiModels = {
        "DeepSeek": ["DeepSeek Coder V2", "DeepSeek Chat V3", "DeepSeek Math"],
        "Groq": ["Llama 3 70B", "Mixtral 8x7B", "Gemma 7B"],
        "OpenAI": ["GPT-4 Turbo", "GPT-4", "GPT-3.5 Turbo"],
        "Anthropic": ["Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku"]
    };
    const outputFormats = ["PDF", "HTML", "DOCX", "Markdown"];

    const prompts = [
        '"Ett modernt CV med tydlig typografi och blåa detaljer"',
        '"Anpassa CV:t för en mjukvaruutvecklarroll med fokus på tekniska färdigheter"',
        '"Lägg till avdelning för personliga projekt och open-source bidrag"',
        '"Fokusera på ledarskapserfarenhet och agila metoder"',
        '"Designa ett minimalistiskt CV med stark visuell hierarki"',
        '"Inkludera kvantifierbara resultat och prestationer"'
    ];

    // DOM Elements
    const elements = {
        profileSelect: document.getElementById('profileSelect'),
        jobSelect: document.getElementById('jobSelect'),
        styleSelect: document.getElementById('styleSelect'),
        promptText: document.getElementById('promptText'),
        providerSelect: document.getElementById('providerSelect'),
        modelSelect: document.getElementById('modelSelect'),
        creativitySlider: document.getElementById('creativitySlider'),
        creativityValue: document.getElementById('creativityValue'),
        formatSelect: document.getElementById('formatSelect'),
        autosaveCheckbox: document.getElementById('autosaveCheckbox'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        taskbarDot: document.getElementById('taskbarDot'),
        taskbarStatus: document.getElementById('taskbarStatus'),
        cvPreview: document.getElementById('cvPreview'),

        
        // Status indicators
        profileStatus: document.querySelector('#profileStatus .status-text'),
        styleStatus: document.querySelector('#styleStatus .status-text'),
        aiStatus: document.querySelector('#aiStatus .status-text'),
        outputStatus: document.querySelector('#outputStatus .status-text')
    };

    // Current demo state
    let currentState = {
        profile: null,
        job: null,
        style: null,
        prompt: '',
        provider: null,
        model: null,
        creativity: 1.2,
        format: 'PDF',
        autosave: true
    };

    // Typewriter effect
    async function typeText(element, text, speed = 30, prefix = '') {
        return new Promise(resolve => {
            let i = 0;
            element.textContent = prefix;
            element.classList.add('typing');
            
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent = prefix + text.substring(0, i + 1);
                    i++;
                } else {
                    clearInterval(interval);
                    element.classList.remove('typing');
                    resolve();
                }
            }, speed);
        });
    }

    // Clear text with backspace effect
    async function clearText(element, speed = 20) {
        return new Promise(resolve => {
            const text = element.textContent;
            if (!text) {
                resolve();
                return;
            }
            
            let i = text.length;
            element.classList.add('typing');
            
            const interval = setInterval(() => {
                if (i > 0) {
                    element.textContent = text.substring(0, i - 1);
                    i--;
                } else {
                    clearInterval(interval);
                    element.classList.remove('typing');
                    resolve();
                }
            }, speed);
        });
    }

    // Simulate dropdown selection
    async function simulateDropdown(element, values, selectedIndex, speed = 100) {
        element.classList.add('typing');
        
        // Show "Selecting..." briefly
        const originalText = element.textContent;
        element.textContent = "Väljer...";
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulate scrolling through options
        for (let i = 0; i <= selectedIndex; i++) {
            element.textContent = values[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        element.classList.remove('typing');
    }

    // Update creativity value display
    function updateCreativity(value) {
        const creativity = (value / 10).toFixed(1);
        elements.creativityValue.textContent = creativity;
        currentState.creativity = parseFloat(creativity);
        elements.creativityValue.classList.add('typing');
        setTimeout(() => elements.creativityValue.classList.remove('typing'), 300);
    }

    // Generate CV content based on current state
    function generateCVContent() {
        if (!currentState.profile) return '';
        
        const profile = currentState.profile;
        const job = currentState.job || { 
            title: profile.title, 
            company: "Söker nya utmaningar", 
            location: "Sverige",
            salary: "Enligt överenskommelse"
        };
        
        const skills = {
            "Frontend Utvecklare": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL", "Jest"],
            "Backend Utvecklare": ["Node.js", "Python", "PostgreSQL", "Docker", "AWS", "Redis"],
            "UX Designer": ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping", "Design Systems"],
            "DevOps Engineer": ["Kubernetes", "Terraform", "Jenkins", "Prometheus", "Grafana", "GitLab CI"]
        };
        
        const profileSkills = skills[profile.title] || skills["Frontend Utvecklare"];
        
        return `
            <div class="cv-header">
                <h1 class="cv-name">${profile.name}</h1>
                <div class="cv-title">${job.title} • ${currentState.style} CV</div>
                <div class="cv-contact">
                    <span><i class="fas fa-envelope"></i> ${profile.email}</span>
                    <span><i class="fas fa-phone"></i> ${profile.phone}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                </div>
            </div>
            
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-user"></i> Profilsammanfattning</h2>
                <div class="cv-item">
                    <div class="cv-item-description">
                        ${profile.summary} ${currentState.prompt ? currentState.prompt.replace(/"/g, '') : 'Specialiserad på att leverera högkvalitativa lösningar som överträffar förväntningar.'}
                    </div>
                </div>
            </div>
            
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-briefcase"></i> Erfarenhet</h2>
                <div class="cv-item">
                    <div class="cv-item-title">Senior ${profile.title}</div>
                    <div class="cv-item-meta">${job.company} | 2020 - Nuvarande | ${job.salary}</div>
                    <div class="cv-item-description">
                        • Ledde utvecklingen av flera kundprojekt med moderna teknologier<br>
                        • Implementerade CI/CD pipelines som minskade deployment-tid med 60%<br>
                        • Coachade juniora utvecklare och förbättrade teamets kodkvalitet<br>
                        • Optimera prestanda vilket resulterade i 40% snabbare laddningstider
                    </div>
                </div>
                
                <div class="cv-item">
                    <div class="cv-item-title">${profile.title}</div>
                    <div class="cv-item-meta">Digital Solutions AB | 2018 - 2020</div>
                    <div class="cv-item-description">
                        • Utvecklade och underhöll flera webbapplikationer<br>
                        • Samarbetade med UX-designers för att implementera användarvänliga gränssnitt<br>
                        • Deltog i kodgranskningar och bidrog till bättre utvecklingsprocesser
                    </div>
                </div>
            </div>
            
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-graduation-cap"></i> Utbildning</h2>
                <div class="cv-item">
                    <div class="cv-item-title">Kandidatexamen i Datateknik</div>
                    <div class="cv-item-meta">KTH Royal Institute of Technology | 2015 - 2018</div>
                    <div class="cv-item-description">
                        Specialisering inom ${profile.title.includes('Design') ? 'interaktionsdesign' : 'mjukvaruutveckling'}. 
                        Examensarbete om ${profile.title.includes('Design') ? 'AI-drivna användarupplevelser' : 'skalbara webbapplikationer'} fick högsta betyg.
                    </div>
                </div>
            </div>
            
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-code"></i> Tekniska Färdigheter</h2>
                <div class="cv-item">
                    <div class="cv-item-description">
                        <strong>Programmeringsspråk:</strong> ${profileSkills.slice(0, 3).join(', ')}<br>
                        <strong>Ramverk & Bibliotek:</strong> ${profileSkills.slice(3, 6).join(', ')}<br>
                        <strong>Verktyg & Plattformar:</strong> Git, Docker, AWS, Figma, Jenkins, Jira<br>
                        <strong>Språk:</strong> Svenska (modersmål), Engelska (flytande)
                    </div>
                </div>
            </div>
            
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-project-diagram"></i> Projekt</h2>
                <div class="cv-item">
                    <div class="cv-item-title">E-handelsplattform</div>
                    <div class="cv-item-description">
                        Ledde utvecklingen av en React-baserad e-handelsplattform som hanterar 10k+ användare. 
                        Implementerat real-time inventeringssystem och betalningsintegrationer.
                    </div>
                </div>
                
                <div class="cv-item">
                    <div class="cv-item-title">AI-drivet CV-verktyg</div>
                    <div class="cv-item-description">
                        Medutvecklade ett AI-drivet verktyg för CV-generering med ${currentState.provider} API. 
                        Plattformen genererar anpassade CV:n baserat på användarens profil och preferenser.
                    </div>
                </div>
            </div>
            
            <div class="cv-footer" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; font-size: 0.9rem; text-align: center;">
                <p>Genererat med MyCareerKit AI CV Generator • ${currentState.provider} ${currentState.model} • ${new Date().toLocaleDateString('sv-SE')}</p>
            </div>
        `;
    }

    // Update CV preview with animation
    function updateCVPreview() {
        const content = generateCVContent();
        const preview = elements.cvPreview;
        
        // Fade out
        preview.style.transition = 'opacity 0.3s ease';
        preview.style.opacity = '0';
        
        setTimeout(() => {
            // Update content
            preview.innerHTML = content;
            
            // Fade in with slide up
            preview.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            preview.style.opacity = '0';
            preview.style.transform = 'translateY(20px)';
            
            // Trigger reflow
            void preview.offsetWidth;
            
            // Animate in
            preview.style.opacity = '1';
            preview.style.transform = 'translateY(0)';
        }, 300);
    }

    // Step 1: Select Profile
    async function stepSelectProfile() {
        updateStatus("Väljer profil...", "var(--color-warning)");
        elements.profileStatus.textContent = "Väljer profil...";
        
        const profileIndex = Math.floor(Math.random() * sampleProfiles.length);
        const profile = sampleProfiles[profileIndex];
        
        await simulateDropdown(elements.profileSelect, 
            sampleProfiles.map(p => `${p.name} - ${p.title}`), 
            profileIndex,
            80
        );
        
        currentState.profile = profile;
        elements.profileStatus.textContent = `Vald: ${profile.name}`;
        
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 2: Select Job (optional)
    async function stepSelectJob() {
        updateStatus("Söker jobb...", "var(--color-primary)");
        
        const jobIndex = Math.floor(Math.random() * sampleJobs.length);
        const job = sampleJobs[jobIndex];
        
        await typeText(elements.jobSelect, `${job.title} - ${job.company}`, 40);
        currentState.job = job;
        
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 3: Select Style
    async function stepSelectStyle() {
        updateStatus("Anpassar design...", "var(--color-primary)");
        elements.styleStatus.textContent = "Anpassar design...";
        
        const styleIndex = Math.floor(Math.random() * cvStyles.length);
        await simulateDropdown(elements.styleSelect, cvStyles, styleIndex, 100);
        
        currentState.style = cvStyles[styleIndex];
        elements.styleStatus.textContent = `Vald: ${currentState.style}`;
        
        // Update prompt
        const promptIndex = Math.floor(Math.random() * prompts.length);
        await typeText(elements.promptText, prompts[promptIndex], 25);
        currentState.prompt = prompts[promptIndex];
        
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 4: Configure AI
    async function stepConfigureAI() {
        updateStatus("Konfigurerar AI...", "var(--color-primary)");
        elements.aiStatus.textContent = "Konfigurerar AI...";
        
        // Select provider
        const providerIndex = Math.floor(Math.random() * aiProviders.length);
        await simulateDropdown(elements.providerSelect, aiProviders, providerIndex, 120);
        currentState.provider = aiProviders[providerIndex];
        
        // Select model for provider
        const models = aiModels[currentState.provider] || aiModels["DeepSeek"];
        const modelIndex = Math.floor(Math.random() * models.length);
        await simulateDropdown(elements.modelSelect, models, modelIndex, 100);
        currentState.model = models[modelIndex];
        
        // Adjust creativity slider with animation
        const targetValue = 8 + Math.floor(Math.random() * 8);
        const currentValue = parseInt(elements.creativitySlider.value);
        const steps = Math.abs(targetValue - currentValue);
        const stepTime = 50;
        
        for (let i = 0; i < steps; i++) {
            if (targetValue > currentValue) {
                elements.creativitySlider.value = currentValue + i + 1;
            } else {
                elements.creativitySlider.value = currentValue - i - 1;
            }
            updateCreativity(elements.creativitySlider.value);
            await new Promise(resolve => setTimeout(resolve, stepTime));
        }
        
        elements.aiStatus.textContent = `Inställd: ${currentState.model}`;
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 5: Configure Output
    async function stepConfigureOutput() {
        updateStatus("Inställer utdata...", "var(--color-primary)");
        elements.outputStatus.textContent = "Inställer utdata...";
        
        // Select format
        const formatIndex = Math.floor(Math.random() * outputFormats.length);
        await simulateDropdown(elements.formatSelect, outputFormats, formatIndex, 100);
        currentState.format = outputFormats[formatIndex];
        
        // Randomly toggle autosave sometimes
        if (Math.random() > 0.7) {
            elements.autosaveCheckbox.classList.toggle('checked');
            currentState.autosave = !currentState.autosave;
            
            // Add click animation
            elements.autosaveCheckbox.style.transform = 'scale(0.9)';
            setTimeout(() => {
                elements.autosaveCheckbox.style.transform = 'scale(1)';
            }, 150);
        }
        
        elements.outputStatus.textContent = `Inställd: ${currentState.format}`;
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 6: Generate CV
    async function stepGenerateCV() {
        updateStatus("✨ Genererar CV...", "var(--color-accent)");
        
        // Show progress animation
        elements.progressFill.style.transition = 'width 0.3s ease';
        
        for (let i = 0; i <= 100; i += 5) {
            elements.progressFill.style.width = `${i}%`;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Simulate AI processing (shorter total time since no messages)
        await new Promise(resolve => setTimeout(resolve, 1200)); // Reduced from 2400ms
        
        // Generate and show CV
        updateCVPreview();
        
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Step 7: Complete and Reset
    async function stepCompleteAndReset() {
        updateStatus("✅ Klar! Återställer...", "var(--color-accent)");
        
        // Brief pause to show completion
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reset progress bar with animation
        elements.progressFill.style.transition = 'width 0.5s ease';
        elements.progressFill.style.width = '0%';
        
        updateStatus("Redo", "var(--color-accent)");
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update status indicators
    function updateStatus(text, color) {
        
        // Update progress text but keep time
        const currentText = elements.progressText.textContent;
        if (currentText.includes('•')) {
            const timePart = currentText.split('•')[1];
            elements.progressText.textContent = `${text} •${timePart}`;
        }
    }

    // Initialize interactive elements
    function initInteractiveElements() {
        // Creativity slider
        elements.creativitySlider.addEventListener('input', function() {
            updateCreativity(this.value);
        });
        
        // Autosave checkbox
        elements.autosaveCheckbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            currentState.autosave = !currentState.autosave;
            
            // Add click animation
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
        
        // Form elements hover effects
        const formElements = document.querySelectorAll('.form-select, .form-textarea, .checkbox');
        formElements.forEach(el => {
            el.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            el.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // Main demo loop
    async function runDemoLoop() {
        if (!demoConfig.isRunning) return;
        
        const steps = [
            stepSelectProfile,
            stepSelectJob,
            stepSelectStyle,
            stepConfigureAI,
            stepConfigureOutput,
            stepGenerateCV,
            stepCompleteAndReset
        ];
        
        // Run through all steps
        for (let i = 0; i < steps.length; i++) {
            demoConfig.currentStep = i;
            const stepProgress = (i / steps.length) * 100;
            elements.progressFill.style.width = `${stepProgress}%`;
            
            await steps[i]();
            
            // Add step delay (shorter between steps)
            if (i < steps.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // Complete progress bar
        elements.progressFill.style.width = '100%';
        
        // Wait before resetting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Loop again
        runDemoLoop();
    }

    // Initialize demo
    function initDemo() {
        // Setup interactive elements
        initInteractiveElements();
        
        // Start demo loop after a brief delay
        setTimeout(() => runDemoLoop(), 1500);
        
        // Update time display
        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('sv-SE', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            
            const currentText = elements.progressText.textContent;
            if (currentText.includes('•')) {
                const statusPart = currentText.split('•')[0];
                elements.progressText.textContent = `${statusPart}• ${timeString}`;
            } else {
                elements.progressText.textContent = `Live CV-generering • ${timeString}`;
            }
        }, 1000);
    }

    // Start when page loads
    initDemo();
});