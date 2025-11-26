// dashboard.js - Funcionalidades JavaScript para o Sistema CARA

document.addEventListener('DOMContentLoaded', function() {
    
    // Animação de entrada dos cards
    animateCards();
    
    // Contadores animados
    animateCounters();
    
    // Progress bars animadas
    animateProgressBars();
    
    // Tooltips
    initializeTooltips();
    
    // Modais
    initializeModals();
    
    // Busca em tempo real
    initializeSearch();
    
    // Auto-dismiss de alertas
    autoDismissAlerts();
    
    // Validação de formulários
    initializeFormValidation();
});

// Animação de entrada dos cards
function animateCards() {
    const cards = document.querySelectorAll('.card, .stat-card, .aluno-card, .turma-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(20px)';
                    entry.target.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 50);
                }, index * 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => observer.observe(card));
}

// Animação de contadores
function animateCounters() {
    const counters = document.querySelectorAll('.stat-info h3, .stat-card h3');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.textContent);
        
        if (isNaN(target)) return;
        
        let current = 0;
        const increment = target / 50;
        const isDecimal = target % 1 !== 0;
        
        const updateCounter = () => {
            current += increment;
            
            if (current < target) {
                counter.textContent = isDecimal ? current.toFixed(2) : Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = isDecimal ? target.toFixed(2) : target;
            }
        };
        
        // Inicia animação quando visível
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Animação de progress bars
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetWidth = entry.target.style.width;
                entry.target.style.width = '0';
                
                setTimeout(() => {
                    entry.target.style.width = targetWidth;
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// Sistema de tooltips
function initializeTooltips() {
    const elements = document.querySelectorAll('[data-tooltip]');
    
    elements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 0.8rem 1.2rem;
                border-radius: 0.6rem;
                font-size: 1.3rem;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                delete this._tooltip;
            }
        });
    });
}

// Sistema de modais
function initializeModals() {
    // Abrir modal
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Fechar modal
    document.querySelectorAll('[data-modal-close]').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Fechar ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
}

// Busca em tempo real
function initializeSearch() {
    const searchInputs = document.querySelectorAll('[data-search]');
    
    searchInputs.forEach(input => {
        const target = input.getAttribute('data-search');
        const items = document.querySelectorAll(target);
        
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                
                if (text.includes(searchTerm)) {
                    item.style.display = '';
                    item.style.animation = 'fadeIn 0.3s ease';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Mostrar mensagem se nenhum resultado
            const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
            const container = items[0]?.parentElement;
            
            if (container) {
                let noResultsMsg = container.querySelector('.no-results');
                
                if (visibleItems.length === 0 && searchTerm) {
                    if (!noResultsMsg) {
                        noResultsMsg = document.createElement('div');
                        noResultsMsg.className = 'no-results empty-state';
                        noResultsMsg.innerHTML = '<p>Nenhum resultado encontrado para "' + searchTerm + '"</p>';
                        container.appendChild(noResultsMsg);
                    }
                } else if (noResultsMsg) {
                    noResultsMsg.remove();
                }
            }
        });
    });
}

// Auto-dismiss de alertas
function autoDismissAlerts() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        // Adicionar botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 2.5rem;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
            transition: opacity 0.3s;
        `;
        
        closeBtn.addEventListener('mouseover', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.opacity = '0.7');
        closeBtn.addEventListener('click', () => {
            alert.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        });
        
        alert.style.position = 'relative';
        alert.appendChild(closeBtn);
        
        // Auto-dismiss após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    });
}

// Validação de formulários
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Validar campos obrigatórios
            const requiredFields = this.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    showFieldError(field, 'Este campo é obrigatório');
                } else {
                    clearFieldError(field);
                }
            });
            
            // Validar números
            const numberFields = this.querySelectorAll('input[type="number"]');
            
            numberFields.forEach(field => {
                const value = parseFloat(field.value);
                const min = parseFloat(field.getAttribute('min'));
                const max = parseFloat(field.getAttribute('max'));
                
                if (field.value && (value < min || value > max)) {
                    isValid = false;
                    showFieldError(field, `Valor deve estar entre ${min} e ${max}`);
                } else if (field.value) {
                    clearFieldError(field);
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                
                // Scroll para o primeiro erro
                const firstError = this.querySelector('.field-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
        
        // Validação em tempo real
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    showFieldError(this, 'Este campo é obrigatório');
                } else {
                    clearFieldError(this);
                }
            });
            
            input.addEventListener('input', function() {
                if (this.value.trim()) {
                    clearFieldError(this);
                }
            });
        });
    });
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#e74c3c';
    
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    error.style.cssText = `
        color: #e74c3c;
        font-size: 1.3rem;
        margin-top: 0.5rem;
        animation: fadeIn 0.3s ease;
    `;
    
    field.parentElement.appendChild(error);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    
    const error = field.parentElement.querySelector('.field-error');
    if (error) {
        error.remove();
    }
}

// Função para confirmar ações
window.confirmAction = function(message, callback) {
    if (confirm(message)) {
        callback();
    }
};

// Função para copiar texto
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado para a área de transferência!', 'success');
    });
};

// Sistema de notificações
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1.5rem 2rem;
        border-radius: 1.2rem;
        background: white;
        box-shadow: 0 0.4rem 1.5rem rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 1.5rem;
        font-weight: 500;
    `;
    
    if (type === 'success') {
        notification.style.borderLeft = '4px solid #27ae60';
        notification.style.color = '#27ae60';
    } else if (type === 'error') {
        notification.style.borderLeft = '4px solid #e74c3c';
        notification.style.color = '#e74c3c';
    } else {
        notification.style.borderLeft = '4px solid #3498db';
        notification.style.color = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Animações CSS adicionais
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);