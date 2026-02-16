document.addEventListener('DOMContentLoaded', function() {
    const demo = {
        isRunning: true,
        currentStep: 'filling',
        loopDuration: 15000,
        resetTimer: 5
    };
    
    const formView = document.getElementById('formView');
    const resultsView = document.getElementById('resultsView');
    const fields = {
        name: document.getElementById('nameField'),
        title: document.getElementById('titleField'),
        email: document.getElementById('emailField'),
        phone: document.getElementById('phoneField')
    };
    const summaryBox = document.getElementById('summaryBox');
    const formStatus = document.getElementById('formStatus');
    const searchStatus = document.getElementById('searchStatus');
    const jobCount = document.getElementById('jobCount');
    const jobsList = document.getElementById('jobsList');
    const taskbarDot = document.getElementById('taskbarDot');
    const taskbarStatus = document.getElementById('taskbarStatus');
    const progressText = document.getElementById('progressText');
    const resetTimerEl = document.getElementById('resetTimer');
    
    const userData = {
        name: 'Anna Svensson',
        title: 'Frontend Utvecklare',
        email: 'anna.svensson@example.com',
        phone: '073-123 45 67',
        summary: 'Erfaren Frontend-utvecklare med 5+ års erfarenhet av React, TypeScript och moderna webbtekniker. Passionerad för att skapa responsiva och tillgängliga användargränssnitt.'
    };
    
    const sampleJobs = [
        { id: 1, title: 'Frontend Utvecklare', location: 'Stockholm', salary: '45 000 kr/mån', company: 'TechCorp AB' },
        { id: 2, title: 'Fullstack Developer', location: 'Göteborg', salary: '52 000 kr/mån', company: 'InnovateIT' },
        { id: 3, title: 'DevOps Engineer', location: 'Remote', salary: '48 000 kr/mån', company: 'CloudSystems' },
        { id: 4, title: 'UX Designer', location: 'Malmö', salary: '42 000 kr/mån', company: 'DesignStudio' },
        { id: 5, title: 'Backend Utvecklare', location: 'Uppsala', salary: '47 000 kr/mån', company: 'DataLabs' },
        { id: 6, title: 'Python Developer', location: 'Stockholm', salary: '46 000 kr/mån', company: 'AI Solutions' },
        { id: 7, title: 'React Specialist', location: 'Remote', salary: '51 000 kr/mån', company: 'WebFactory' },
        { id: 8, title: 'Projektledare', location: 'Göteborg', salary: '55 000 kr/mån', company: 'ManagePro' }
    ];
    
    function typeText(element, text, speed = 30) {
        return new Promise(resolve => {
            let i = 0;
            element.textContent = '';
            element.classList.add('typing');
            
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(interval);
                    element.classList.remove('typing');
                    resolve();
                }
            }, speed);
        });
    }
    
    function clearText(element, speed = 20) {
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
    
    async function resetAllFields() {
        for (let field in fields) {
            await clearText(fields[field], 15);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        await clearText(summaryBox, 10);
        jobsList.innerHTML = '';
        jobCount.textContent = '0 jobb';
    }
    
    async function fillForm() {
        demo.currentStep = 'filling';
        formView.classList.add('active');
        resultsView.classList.remove('active');
        formStatus.textContent = 'Fyller formulär...';
        taskbarStatus.textContent = 'Fyller formulär...';
        taskbarDot.style.background = 'var(--color-warning)';
        
        // Type each field with delays
        await typeText(fields.name, userData.name, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await typeText(fields.title, userData.title, 40);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await typeText(fields.email, userData.email, 30);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await typeText(fields.phone, userData.phone, 40);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Type summary
        await typeText(summaryBox, userData.summary, 20);
        
        formStatus.textContent = 'Formulär ifyllt';
        taskbarStatus.textContent = 'Formulär klart';
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    async function searchAndShowJobs() {
        demo.currentStep = 'searching';
        formView.classList.remove('active');
        resultsView.classList.add('active');
        searchStatus.textContent = 'Söker i realtid...';
        taskbarStatus.textContent = 'Söker jobb...';
        taskbarDot.style.background = 'var(--color-primary)';
        jobsList.innerHTML = '';
        jobCount.textContent = '0 jobb';
        await new Promise(resolve => setTimeout(resolve, 1500));

        let count = 0;
        for (let i = 0; i < sampleJobs.length; i++) {
            const job = sampleJobs[i];
            await new Promise(resolve => setTimeout(resolve, 140));
            
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';
            jobCard.style.animationDelay = `${i * 0.1}s`;
            
            jobCard.innerHTML = `
                <div class="job-header">
                    <div class="job-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="job-details">
                        <div class="job-title">
                            <div class="job-name">${job.title}</div>
                            <div class="job-salary">${job.salary}</div>
                        </div>
                        <div class="job-meta">${job.company} • ${job.location}</div>
                    </div>
                </div>
            `;
            
            jobsList.appendChild(jobCard);
            count++;
            jobCount.textContent = `${count} jobb`;
        }
        
        searchStatus.textContent = 'Sökning slutförd!';
        taskbarStatus.textContent = 'Sökning klar';
        taskbarDot.style.background = 'var(--color-accent)';
    }
    
    // Countdown before reset
    async function startResetCountdown() {
        let countdown = demo.resetTimer;
        resetTimerEl.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            resetTimerEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        await new Promise(resolve => setTimeout(resolve, demo.resetTimer * 1000));
    }
    
    // Main demo loop
    async function runDemoLoop() {
        if (!demo.isRunning) return;
        await resetAllFields();
        await fillForm();
        await searchAndShowJobs();
        await startResetCountdown();
        runDemoLoop();
    }
    
    runDemoLoop();
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        progressText.textContent = `Live demo • ${timeString}`;
    }, 1000);
});