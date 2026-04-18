document.addEventListener('DOMContentLoaded', () => {
    const activityFeed = document.getElementById('activity-feed');
    const totalOrdersCount = document.getElementById('total-orders-count');
    const activeCallsCount = document.getElementById('active-calls-count');
    const clearHistoryBtn = document.getElementById('clear-history');
    const notifSound = document.getElementById('notif-sound');
    const currentDateEl = document.getElementById('current-date');

    // Display current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

    function renderFeed() {
        const events = JSON.parse(localStorage.getItem('restaurant_events') || '[]');
        
        if (events.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-feed">
                    <p>Waiting for incoming customer requests...</p>
                </div>
            `;
            totalOrdersCount.textContent = '0';
            activeCallsCount.textContent = '0';
            return;
        }

        // Update Stats
        const ordersCount = events.filter(e => e.type === 'order').length;
        const callsCount = events.filter(e => e.type === 'assistance' && e.status === 'pending').length;
        totalOrdersCount.textContent = ordersCount;
        activeCallsCount.textContent = callsCount;

        // Render Cards
        activityFeed.innerHTML = '';
        events.forEach(event => {
            const card = document.createElement('div');
            const isOrder = event.type === 'order';
            card.className = `event-card ${event.status === 'completed' ? 'completed' : ''} ${!isOrder ? 'assistance-alert' : ''}`;
            
            const icon = isOrder ? '🛍️' : '🔔';
            const iconClass = isOrder ? 'icon-order' : 'icon-assistance';
            const title = isOrder ? 'New Order Received' : 'Assistance Requested';

            let detailsHtml = '';
            if (isOrder && event.content.items) {
                detailsHtml = `
                    <ul class="order-items-list">
                        ${event.content.items.map(item => `
                            <li>
                                <span>${item.name}</span>
                                <span>${item.price} SEK</span>
                            </li>
                        `).join('')}
                        <li style="border-top:1px solid rgba(255,255,255,0.1); margin-top:5px; padding-top:5px; font-weight:600;">
                            <span>Total</span>
                            <span>${event.content.total}</span>
                        </li>
                    </ul>
                `;
            } else {
                detailsHtml = `<p class="event-content">${event.content}</p>`;
            }

            card.innerHTML = `
                <div class="table-badge">${event.table}</div>
                <div class="event-details">
                    <h4><span class="${iconClass}">${icon}</span> ${title}</h4>
                    ${detailsHtml}
                    ${event.status === 'pending' ? `<button class="btn-complete" onclick="resolveEvent(${event.id})">Mark as Completed</button>` : ''}
                </div>
                <div class="event-time">${event.timestamp}</div>
            `;
            activityFeed.appendChild(card);
        });
    }

    // Resolve Event
    window.resolveEvent = function(id) {
        let events = JSON.parse(localStorage.getItem('restaurant_events') || '[]');
        events = events.map(e => {
            if (e.id === id) return { ...e, status: 'completed' };
            return e;
        });
        localStorage.setItem('restaurant_events', JSON.stringify(events));
        renderFeed();
    };

    // Clear History
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all demo data?')) {
            localStorage.removeItem('restaurant_events');
            renderFeed();
        }
    });

    // Listen for new events
    window.addEventListener('storage', () => {
        renderFeed();
        // Play sound if a new item was added (optional, browser may block initial play)
        try {
            notifSound.play();
        } catch (e) {}
    });

    // Initial render
    renderFeed();
});
