// Global Error Logging
window.onerror = function(msg, url, line, col, error) {
    alert("Error: " + msg + "\nLine: " + line);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Premium Menu Script v3 Initialized');

    // Selectors
    const homeScreen = document.getElementById('home-screen');
    const menuScreen = document.getElementById('menu-screen');
    const viewMenuBtn = document.getElementById('view-menu-btn');
    const categoryPills = document.querySelectorAll('.category-pill');
    const previewModal = document.getElementById('preview-modal');
    const closeModal = document.querySelector('.close-modal');
    const previewButtons = document.querySelectorAll('.preview-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const langToggle = document.getElementById('lang-toggle');
    const menuHeader = document.querySelector('.menu-header');
    const menuToggle = document.getElementById('menu-toggle');
    const callWaiterBtn = document.getElementById('call-waiter-top');
    const bookTableBtn = document.getElementById('book-table');
    const askAllergensBtn = document.getElementById('ask-allergens');

    // --- Table Identification ---
    // In a real scenario, this comes from QR URL: ?table=5
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table') || 'Table 14'; // Default for demo

    // --- Language Logic (Swedish Primary) ---
    let currentLang = localStorage.getItem('preferred_lang') || 'sv';

    function updateLanguageUI() {
        console.log('Switching to:', currentLang);
        // We only target elements that have the language attributes
        // and we use innerHTML or textContent appropriately
        // Update dynamic text (buttons, footer, etc.)
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${currentLang}`);
        });

        if (langToggle) {
            langToggle.textContent = currentLang === 'en' ? 'SV' : 'EN';
        }
        document.documentElement.lang = currentLang;
        
        // Update document title for SEO
        document.title = currentLang === 'en' ? 'Scandinavian | Premium Menu' : 'Scandinavian | Premium Meny';
    }

    if (langToggle) {
        langToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Lang switch clicked');
            currentLang = currentLang === 'en' ? 'sv' : 'en';
            localStorage.setItem('preferred_lang', currentLang);
            updateLanguageUI();
        });
    }

    updateLanguageUI();

    // --- Menu Toggle Logic ---
    if (menuToggle && menuHeader) {
        menuToggle.addEventListener('click', () => {
            menuHeader.classList.toggle('expanded');
            
            // Toggle Icon with robust re-injection
            const newState = menuHeader.classList.contains('expanded') ? 'x' : 'menu';
            menuToggle.innerHTML = `<i data-lucide="${newState}"></i>`;
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    }

    // --- Page Transition ---
    if (viewMenuBtn) {
        viewMenuBtn.addEventListener('click', () => {
            homeScreen.style.opacity = '0';
            setTimeout(() => {
                homeScreen.style.display = 'none';
                menuScreen.style.display = 'block';
                setTimeout(() => {
                    menuScreen.style.opacity = '1';
                    revealCards();
                }, 50);
            }, 500);
        });
    }

    function revealCards() {
        const cards = document.querySelectorAll('.menu-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 80);
        });
    }

    // --- Category Filtering ---
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            if (pill.classList.contains('active')) return;
            const category = pill.getAttribute('data-category');
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const sections = document.querySelectorAll('.menu-section');
            sections.forEach(section => {
                const sectionId = section.id.replace('section-', '');
                if (category === 'all' || category === sectionId) {
                    section.style.display = 'block';
                    section.style.opacity = '1';
                } else {
                    section.style.display = 'none';
                }
            });
            // Close menu if expanded after selecting category
            if (menuHeader.classList.contains('expanded')) {
                menuHeader.classList.remove('expanded');
                // Reset icon to menu
                if (menuToggle) {
                    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    });

    // --- Modal Logic ---
    const modalHeroImg = document.querySelector('.modal-hero-image');
    const modalName = document.getElementById('modal-item-name');
    const modalPrice = document.getElementById('modal-item-price');
    const modalDesc = document.getElementById('modal-item-desc');
    const modalIngredients = document.getElementById('modal-item-ingredients');
    const modalCalories = document.getElementById('modal-item-calories');
    const modalRecImg = document.getElementById('modal-rec-img');
    const modalRecName = document.getElementById('modal-rec-name');

    previewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const data = {
                img: btn.getAttribute('data-img'),
                name: currentLang === 'en' ? btn.getAttribute('data-name-en') : btn.getAttribute('data-name-sv'),
                price: btn.getAttribute('data-price'),
                desc: currentLang === 'en' ? btn.getAttribute('data-desc-en') : btn.getAttribute('data-desc-sv'),
                ingredients: currentLang === 'en' ? btn.getAttribute('data-ingredients-en') : btn.getAttribute('data-ingredients-sv'),
                calories: btn.getAttribute('data-calories'),
                recName: btn.getAttribute('data-rec-name'),
                recImg: btn.getAttribute('data-rec-img')
            };

            if (modalHeroImg) modalHeroImg.src = data.img;
            if (modalName) modalName.textContent = data.name;
            if (modalPrice) modalPrice.textContent = data.price;
            if (modalCalories) modalCalories.textContent = `${data.calories} KCAL`;
            if (modalDesc) modalDesc.textContent = data.desc;
            if (modalIngredients) modalIngredients.textContent = data.ingredients;
            if (modalRecName) modalRecName.textContent = data.recName;
            if (modalRecImg) modalRecImg.src = data.recImg;

            previewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closePreview = () => {
        previewModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (closeModal) closeModal.addEventListener('click', closePreview);
    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) closePreview();
        });
    }

    // --- Cart Logic ---
    let cart = [];
    const cartPanel = document.getElementById('cart-panel');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartTotalCalories = document.getElementById('cart-total-calories');
    const cartTrigger = document.getElementById('cart-trigger');
    const closeCart = document.getElementById('close-cart');
    const sendOrderBtn = document.getElementById('send-order');
    const modalAddBtn = document.getElementById('modal-add-btn');
    const successToast = document.getElementById('success-toast');

    // --- Event Emitter (Local Storage for Demo) ---
    function emitEvent(type, content) {
        const events = JSON.parse(localStorage.getItem('restaurant_events') || '[]');
        const newEvent = {
            id: Date.now(),
            table: tableNumber,
            type: type, // 'order' or 'assistance'
            content: content,
            status: 'pending',
            timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
        };
        events.unshift(newEvent);
        localStorage.setItem('restaurant_events', JSON.stringify(events));
        
        // Trigger storage event manually for same-window testing if needed
        window.dispatchEvent(new Event('storage'));
    }

    function updateCartUI() {
        if (cartCount) cartCount.textContent = cart.length;
        if (!cartItemsContainer) return;

        // Group items by name
        const grouped = cart.reduce((acc, item) => {
            if (!acc[item.name]) acc[item.name] = { ...item, qty: 0 };
            acc[item.name].qty++;
            return acc;
        }, {});

        if (Object.keys(grouped).length === 0) {
            cartItemsContainer.innerHTML = `<p class="empty-msg" data-en="Your basket is empty" data-sv="Din korg är tom">${currentLang === 'en' ? 'Your basket is empty' : 'Din korg är tom'}</p>`;
            if (cartTotal) cartTotal.textContent = '0 SEK';
        } else {
            cartItemsContainer.innerHTML = Object.values(grouped).map(item => `
                <div class="cart-item">
                    <div class="item-meta">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">${parseInt(item.price) * item.qty} SEK</span>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn minus" data-name="${item.name}">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn plus" data-name="${item.name}">+</button>
                    </div>
                </div>
            `).join('');
            
            // Add Event Listeners for +/- buttons
            document.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.getAttribute('data-name');
                    if (btn.classList.contains('plus')) {
                        const originalItem = cart.find(i => i.name === name);
                        cart.push({ ...originalItem });
                    } else {
                        const idx = cart.findIndex(i => i.name === name);
                        if (idx > -1) cart.splice(idx, 1);
                    }
                    updateCartUI();
                });
            });
        }
        
        let total = 0;
        let calories = 0;
        cart.forEach(item => {
            total += parseInt(item.price);
            calories += parseInt(item.calories || 0);
        });
        
        if (cartTotal) cartTotal.textContent = `${total} SEK`;
        if (cartTotalCalories) cartTotalCalories.textContent = `${calories} kcal`;
    }

    function addToCart(name, price, calories, stayInModal = false) {
        cart.push({ name, price, calories });
        updateCartUI();
        
        // Success Toast
        if (successToast) {
            successToast.classList.add('active');
            setTimeout(() => successToast.classList.remove('active'), 2500);
        }

        // --- Cart Bubble Animation (Global Hub) ---
        if (menuHeader) {
            menuHeader.classList.add('pop-pulse');
            setTimeout(() => menuHeader.classList.remove('pop-pulse'), 500);
        }

        if (cartTrigger) {
            cartTrigger.classList.add('pop-pulse');
            setTimeout(() => cartTrigger.classList.remove('pop-pulse'), 500);
        }
        if (cartCount) {
            cartCount.classList.add('count-up');
            setTimeout(() => cartCount.classList.remove('count-up'), 400);
        }

        if (!stayInModal && previewModal.classList.contains('active')) {
            closePreview();
        }
    }

    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.menu-card');
            const previewBtn = card.querySelector('.preview-btn');
            
            if (previewBtn) {
                const name = currentLang === 'en' ? previewBtn.getAttribute('data-name-en') : previewBtn.getAttribute('data-name-sv');
                const priceValue = btn.getAttribute('data-price') || previewBtn.getAttribute('data-price').replace(' SEK', '');
                const calories = previewBtn.getAttribute('data-calories');
                
                addToCart(name, priceValue, calories);
            }
        });
    });

    if (modalAddBtn) {
        modalAddBtn.addEventListener('click', () => {
            const price = modalPrice.textContent.replace(' SEK', '');
            const calories = modalCalories.textContent.replace(' KCAL', '');
            addToCart(modalName.textContent, price, calories);
        });
    }

    // --- Recommendation Add Button ---
    document.querySelectorAll('.btn-add-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = document.getElementById('modal-rec-name').textContent;
            // Dummy price for recommendations (usually drinks) if not provided, or set a default
            const price = "45"; 
            addToCart(name, price, "0", true); // true = stay in modal
            
            // Temporary visual feedback on the button
            const originalText = btn.textContent;
            btn.textContent = currentLang === 'en' ? 'Added ✓' : 'Tillagd ✓';
            btn.style.borderColor = '#2ecc71';
            btn.style.color = '#2ecc71';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.borderColor = '#f39c12';
                btn.style.color = '#f39c12';
            }, 2000);
        });
    });

    // --- Help Buttons Logic ---
    if (callWaiterBtn) {
        callWaiterBtn.addEventListener('click', () => {
            emitEvent('assistance', currentLang === 'en' ? 'Customer needs assistance' : 'Kunden behöver hjälp');
            showToast(currentLang === 'en' ? 'Staff notified!' : 'Personalen har meddelats!');
            
            callWaiterBtn.style.pointerEvents = 'none';
            callWaiterBtn.style.opacity = '0.7';
            setTimeout(() => {
                callWaiterBtn.style.pointerEvents = 'all';
                callWaiterBtn.style.opacity = '1';
            }, 30000);
        });
    }

    if (askAllergensBtn) {
        askAllergensBtn.addEventListener('click', () => {
            emitEvent('assistance', currentLang === 'en' ? 'Allergen Information Requested' : 'Fråga om allergener');
            showToast(currentLang === 'en' ? 'We are coming to help' : 'Vi kommer och hjälper dig');
        });
    }

    if (bookTableBtn) {
        bookTableBtn.addEventListener('click', () => {
            emitEvent('assistance', currentLang === 'en' ? 'Table Reservation Inquiry' : 'Förfrågan om bordsbokning');
            showToast(currentLang === 'en' ? 'Support notified' : 'Support meddelad');
        });
    }

    function showToast(message) {
        if (!successToast) return;
        const originalText = successToast.textContent;
        successToast.textContent = message;
        successToast.classList.add('active');
        setTimeout(() => {
            successToast.classList.remove('active');
            setTimeout(() => { successToast.textContent = originalText; }, 300);
        }, 3000);
    }

    // --- Image Click to Details ---
    document.querySelectorAll('.card-image-container').forEach(container => {
        container.style.cursor = 'pointer';
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            const previewBtn = container.closest('.menu-card').querySelector('.preview-btn');
            if (previewBtn) previewBtn.click();
        });
    });

    if (cartTrigger) {
        cartTrigger.addEventListener('click', () => {
            cartPanel.style.display = 'block';
            if (menuHeader) menuHeader.classList.remove('expanded');
        });
    }
    if (closeCart) closeCart.addEventListener('click', () => cartPanel.style.display = 'none');
    
    if (sendOrderBtn) {
        sendOrderBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            // Emit to Dashboard
            const orderData = {
                items: cart.map(i => ({ name: i.name, price: i.price })),
                total: cartTotal.textContent
            };
            emitEvent('order', orderData);

            // Show Premium Toast
            showToast(currentLang === 'en' ? 'Order Sent Successfully!' : 'Beställning skickad!');

            cart = [];
            updateCartUI();
            cartPanel.style.display = 'none';
        });
    }

    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.style.display = 'none', 500);
        }, 800);
    }
});
