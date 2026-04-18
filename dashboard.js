document.addEventListener('DOMContentLoaded', async () => {
    const activityFeed = document.getElementById('activity-feed');
    const totalOrdersCount = document.getElementById('total-orders-count');
    const activeCallsCount = document.getElementById('active-calls-count');
    const clearHistoryBtn = document.getElementById('clear-history');
    const notifSound = document.getElementById('notif-sound');
    const currentDateEl = document.getElementById('current-date');
    const filterPills = document.querySelectorAll('.filter-pill');

    let currentFilter = 'all';

    // --- Supabase Config ---
    const supabaseUrl = 'https://cewfpbydcltdriveqklo.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld2ZwYnlkY2x0ZHJpdmVxa2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDAyMTMsImV4cCI6MjA5MjA3NjIxM30.-gI-eavwvItBFNfxgjQDMsyYYhsYGF938YudR9yiPmE';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Display current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);

    async function fetchEvents() {
        const { data: events, error } = await supabase
            .from('restaurant_events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        // Apply Filter
        const filteredEvents = currentFilter === 'all' 
            ? events 
            : events.filter(e => e.type === currentFilter);

        renderFeed(filteredEvents, events); // Send both to update stats correctly
    }

    function renderFeed(filteredEvents, allEvents) {
        // Update Stats using all events
        const ordersCount = allEvents.filter(e => e.type === 'order').length;
        const callsCount = allEvents.filter(e => e.type === 'assistance' && e.status === 'new').length;
        totalOrdersCount.textContent = ordersCount;
        activeCallsCount.textContent = callsCount;

        if (!filteredEvents || filteredEvents.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-feed">
                    <p>No incoming requests in this category...</p>
                </div>
            `;
            return;
        }

        // Render Cards
        activityFeed.innerHTML = '';
        filteredEvents.forEach(event => {
            const card = document.createElement('div');
            const isOrder = event.type === 'order';
            card.className = `event-card ${event.status === 'completed' ? 'completed' : ''} ${!isOrder ? 'assistance-alert' : ''}`;
            
            const icon = isOrder ? '🛍️' : '🔔';
            const iconClass = isOrder ? 'icon-order' : 'icon-assistance';
            const title = isOrder ? 'New Order Received' : 'Assistance Requested';

            let detailsHtml = '';
            let content;
            try {
                content = JSON.parse(event.content);
            } catch (e) {
                content = event.content;
            }

            if (isOrder && content.items) {
                detailsHtml = `
                    <ul class="order-items-list">
                        ${content.items.map(item => `
                            <li>
                                <span>${item.name}</span>
                                <span>${item.price} SEK</span>
                            </li>
                        `).join('')}
                        <li style="border-top:1px solid rgba(255,255,255,0.1); margin-top:5px; padding-top:5px; font-weight:600;">
                            <span>Total</span>
                            <span>${content.total}</span>
                        </li>
                    </ul>
                `;
            } else {
                detailsHtml = `<p class="event-content">${content}</p>`;
            }

            const timeString = new Date(event.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <div class="table-badge">${event.table_number || '??'}</div>
                <div class="event-details">
                    <h4><span class="${iconClass}">${icon}</span> ${title}</h4>
                    ${detailsHtml}
                    ${event.status === 'new' ? `<button class="btn-complete" onclick="window.resolveEvent(${event.id})">Mark as Completed</button>` : ''}
                </div>
                <div class="event-time">${timeString}</div>
            `;
            activityFeed.appendChild(card);
        });
    }

    // Filter Logic
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            fetchEvents();
        });
    });

    // Resolve Event
    window.resolveEvent = async function(id) {
        const { error } = await supabase
            .from('restaurant_events')
            .update({ status: 'completed' })
            .eq('id', id);

        if (error) console.error('Error resolving event:', error);
        fetchEvents();
    };

    // Clear History
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Clear all production data? This will delete from cloud.')) {
            const { error } = await supabase
                .from('restaurant_events')
                .delete()
                .neq('id', 0); // Delete all
            if (error) console.error('Error clearing history:', error);
            fetchEvents();
        }
    });

    // Realtime Subscription
    supabase
        .channel('public:restaurant_events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'restaurant_events' }, payload => {
            fetchEvents();
            // Play sound
            if (notifSound) {
                notifSound.currentTime = 0;
                notifSound.play().catch(e => console.log('Sound blocked by browser'));
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'restaurant_events' }, payload => {
            fetchEvents();
        })
        .subscribe();

    // Initial load
    fetchEvents();
});
