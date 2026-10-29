document.addEventListener('DOMContentLoaded', () => {
    // Initialize Animations
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // Marquee Logic
    const track = document.getElementById('therapistTrack');
    if (track) {
        // Clone all cards and append them to the track to create a seamless infinite scroll
        const cards = Array.from(track.children);
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const btnNav = document.querySelector('.btn-nav');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (btnNav) btnNav.classList.toggle('active');
        });
    }

    // Interactive Mood Pills
    const moodPills = document.querySelectorAll('.mood-pill');
    moodPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Remove active class from all
            moodPills.forEach(p => {
                p.style.backgroundColor = 'white';
                p.style.color = 'inherit';
                p.style.borderColor = 'var(--border)';
            });
            // Add active style to clicked
            this.style.backgroundColor = 'var(--primary)';
            this.style.color = 'white';
            this.style.borderColor = 'var(--primary)';
        });
    });

    // Assessment wizard
    const wizard = document.querySelector('[data-assessment-wizard]');
    if (wizard) {
        const steps = Array.from(wizard.querySelectorAll('[data-step]'));
        const prevButton = wizard.querySelector('[data-prev-step]');
        const nextButton = wizard.querySelector('[data-next-step]');
        const stepLabel = wizard.querySelector('[data-step-label]');
        const stepProgress = wizard.querySelector('[data-step-progress]');
        const stepBar = wizard.querySelector('[data-step-bar]');
        const assessmentType = wizard.dataset.assessmentType || 'gad7';
        const questionCount = Number(wizard.dataset.questionCount || 0);
        let currentStep = 0;

        const stageTitles = {
            details: '1. Your Details',
            questions: '2. Clinical Questions',
            result: '3. Result Preview',
            matching: '4. Therapist Matching'
        };

        const stageOrder = ['details', 'questions', 'result', 'matching'];

        const requiredFields = step => Array.from(step.querySelectorAll('input, select, textarea')).filter(field => {
            if (!field.required) return false;
            if (field.type === 'radio') {
                const escapedName = window.CSS && CSS.escape ? CSS.escape(field.name) : field.name.replace(/"/g, '\\"');
                return !step.querySelector(`input[name="${escapedName}"]:checked`);
            }
            if (field.type === 'checkbox') return !field.checked;
            return !field.value.trim();
        });

        const scoreAssessment = () => {
            const answers = Array.from(wizard.querySelectorAll('input[name^="answers["]:checked')).map(input => Number(input.value || 0));
            const total = answers.reduce((sum, value) => sum + value, 0);
            const riskFlag = assessmentType === 'phq9' && Number(answers[8] || 0) > 0;
            let severity;
            let provisional;
            let guidance;

            if (assessmentType === 'gad7') {
                if (total >= 15) severity = 'Severe anxiety symptoms';
                else if (total >= 10) severity = 'Moderate anxiety symptoms';
                else if (total >= 8) severity = 'Probable anxiety disorder';
                else if (total >= 5) severity = 'Mild anxiety symptoms';
                else severity = 'Minimal anxiety symptoms';
                provisional = total >= 8 ? 'Probable anxiety disorder' : 'No probable anxiety disorder indicated';
                guidance = total >= 8 ? 'A therapist review is recommended. Save this result so admin and care teams can see it.' : 'You can still book a wellbeing consultation or save this as your baseline.';
            } else {
                if (total >= 20) severity = 'Severe depression';
                else if (total >= 15) severity = 'Moderately severe depression';
                else if (total >= 10) severity = 'Moderate depression';
                else if (total >= 5) severity = 'Mild depression';
                else if (total >= 1) severity = 'Minimal depression';
                else severity = 'No depression symptoms indicated';
                provisional = total >= 10 ? 'Clinical review recommended' : 'Monitor symptoms and wellbeing';
                guidance = total >= 10 ? 'A therapist review is recommended. Save this result so admin and care teams can see it.' : 'You can still book a wellbeing consultation or save this as your baseline.';
            }

            if (riskFlag) {
                guidance = 'Urgent clinical follow-up is recommended because self-harm thoughts were selected. If there is immediate danger, contact local emergency services now.';
            }

            return { total, severity, provisional, guidance, riskFlag };
        };

        const updatePreview = () => {
            const result = scoreAssessment();
            const preview = wizard.querySelector('.assessment-result-preview');
            const score = wizard.querySelector('[data-preview-score]');
            const severity = wizard.querySelector('[data-preview-severity]');
            const guidance = wizard.querySelector('[data-preview-guidance]');
            const provisional = wizard.querySelector('[data-preview-provisional]');
            if (score) score.textContent = result.total;
            if (severity) severity.textContent = result.severity;
            if (guidance) guidance.textContent = result.guidance;
            if (provisional) provisional.textContent = result.provisional;
            if (preview) preview.classList.toggle('urgent', result.riskFlag);
        };

        const showStep = index => {
            currentStep = Math.max(0, Math.min(index, steps.length - 1));
            steps.forEach((step, stepIndex) => {
                step.hidden = stepIndex !== currentStep;
            });
            if (steps[currentStep].dataset.stage === 'result') updatePreview();
            const isLast = currentStep === steps.length - 1;
            if (prevButton) prevButton.hidden = currentStep === 0;
            if (nextButton) nextButton.innerHTML = isLast ? 'Next <i class="ph ph-arrow-right"></i>' : 'Next <i class="ph ph-arrow-right"></i>';
            const stage = steps[currentStep].dataset.stage || 'details';
            const stageIndex = Math.max(0, stageOrder.indexOf(stage));
            const questionIndex = steps[currentStep].dataset.questionIndex;
            const questionProgress = stage === 'questions'
                ? (questionIndex === 'wrap' ? 'Impact and consent' : `Question ${questionIndex} of ${questionCount}`)
                : `${Math.round(((stageIndex + 1) / stageOrder.length) * 100)}% complete`;
            const questionOffset = stage === 'questions' && questionIndex && questionIndex !== 'wrap'
                ? 25 + ((Number(questionIndex) / Math.max(questionCount + 1, 1)) * 25)
                : (stage === 'questions' ? 50 : ((stageIndex + 1) / stageOrder.length) * 100);
            const progressWidth = stage === 'details' ? 25 : (stage === 'questions' ? questionOffset : ((stageIndex + 1) / stageOrder.length) * 100);
            if (stepLabel) stepLabel.textContent = stageTitles[stage] || `Step ${currentStep + 1}`;
            if (stepProgress) stepProgress.textContent = questionProgress;
            if (stepBar) stepBar.style.width = `${Math.min(100, progressWidth)}%`;
            steps[currentStep].scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const missing = requiredFields(steps[currentStep]);
                if (missing.length) {
                    missing[0].reportValidity();
                    return;
                }
                if (currentStep === steps.length - 1) {
                    wizard.requestSubmit();
                    return;
                }
                showStep(currentStep + 1);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => showStep(currentStep - 1));
        }

        showStep(0);
    }
});