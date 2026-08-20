/**
 * ALGORA Notification Center & Activity Feed
 * Handles:
 *  - Order / Inquiry Notifications with Interactive Thank You Cards
 *  - Email Notifications (Inbound, Outbound, and Admin Replies from Gourav)
 *  - Interactive Email Thread Reader & Live Quick Reply
 *  - Bell Icon Badges, Filters (All / Orders / Emails), and LocalStorage Persistence
 */

(function initNotificationCenter() {
    // Initial sample notifications if none exist
    const defaultNotifications = [
        {
            id: 'notif-email-reply-1',
            type: 'email_reply',
            title: 'Reply from Gourav (Algora Lead)',
            subtitle: 'RE: Web App Architecture & Contract Proposal',
            sender: 'Gourav • Lead Architect',
            senderEmail: 'gourav@algora.studio',
            preview: "Hi! I've reviewed your project blueprint for the Web App. We can initiate development this Monday. Here is the staging preview link...",
            fullMessage: `Hi,\n\nThank you for reaching out through Algora! I've thoroughly reviewed your project requirements for the Full-Stack Web Application.\n\nWe have prepared the system architecture, component design system, and deployment pipeline. We can kick off Sprint 1 this coming Monday.\n\nPlease review the scope and reply directly here or on WhatsApp (+91 98765 43210) if you'd like any custom feature additions.\n\nBest regards,\nGourav\nLead Architect & Founder, Algora Studio`,
            time: '10 mins ago',
            timestamp: Date.now() - 10 * 60 * 1000,
            read: false,
            replies: []
        },
        {
            id: 'notif-order-1',
            type: 'order',
            title: 'Order #AG-9421 Confirmed',
            subtitle: 'Full-Stack AI Platform & Web Application',
            clientName: 'Alex Rivera',
            service: 'Custom Web Development',
            budget: '$2,500 – $5,000',
            timeline: '2-3 Weeks',
            leadId: 'AG-9421',
            time: '25 mins ago',
            timestamp: Date.now() - 25 * 60 * 1000,
            read: false,
            thankYouData: {
                leadId: 'AG-9421',
                status: 'SUBMITTED',
                projectType: 'Full-Stack AI Platform',
                budget: '$2,500 – $5,000',
                timeline: '2-3 Weeks',
                date: 'Today'
            }
        },
        {
            id: 'notif-email-inbound-1',
            type: 'email_inbound',
            title: 'New Mail: Project Discovery & NDA',
            subtitle: 'Signed NDA & Asset Files Received',
            sender: 'Algora Automated Dispatch',
            senderEmail: 'dispatch@algora.studio',
            preview: 'Your project brief and reference media have been securely synced to our development vault.',
            fullMessage: `Your project submission and associated media assets have been securely synced with Algora's production vault. Our team will review within 24 hours.\n\nReference ID: #AG-9421\nStatus: Verified & Assigned to Lead Architect`,
            time: '1 hour ago',
            timestamp: Date.now() - 60 * 60 * 1000,
            read: false,
            replies: []
        },
        {
            id: 'notif-order-2',
            type: 'order',
            title: 'Order #AG-8812 Submitted',
            subtitle: 'Interactive 3D Motion Portfolio',
            clientName: 'Creative Lead',
            service: 'Motion Design & System',
            budget: '$1,500 – $3,000',
            timeline: '1-2 Weeks',
            leadId: 'AG-8812',
            time: 'Yesterday',
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
            read: true,
            thankYouData: {
                leadId: 'AG-8812',
                status: 'IN REVIEW',
                projectType: 'Interactive 3D Motion Portfolio',
                budget: '$1,500 – $3,000',
                timeline: '1-2 Weeks',
                date: 'Yesterday'
            }
        }
    ];

    function getStoredNotifications() {
        try {
            let stored = JSON.parse(localStorage.getItem('algora_notifications'));
            if (!stored || !Array.isArray(stored)) {
                stored = defaultNotifications;
                localStorage.setItem('algora_notifications', JSON.stringify(stored));
            }

            // Sync with any new inquiries from start-project.html
            const inquiries = JSON.parse(localStorage.getItem('algora_inquiries') || '[]');
            inquiries.forEach(inq => {
                const existingId = `notif-inq-${inq.referenceId || inq.leadId}`;
                const exists = stored.some(n => n.id === existingId || n.leadId === (inq.referenceId || inq.leadId));
                if (!exists && (inq.referenceId || inq.leadId)) {
                    const leadId = inq.referenceId || inq.leadId;
                    stored.unshift({
                        id: existingId,
                        type: 'order',
                        title: `Order #${leadId} Confirmed`,
                        subtitle: inq.service || inq.projectType || 'Custom Web Project',
                        clientName: inq.name || 'Client',
                        service: inq.service || 'Custom Web Development',
                        budget: inq.budget || 'Custom',
                        timeline: inq.timeline || 'Flexible',
                        leadId: leadId,
                        time: 'Just now',
                        timestamp: Date.now(),
                        read: false,
                        thankYouData: {
                            leadId: leadId,
                            status: 'SUBMITTED',
                            projectType: inq.service || inq.projectType || 'Web Project',
                            budget: inq.budget || 'Custom',
                            timeline: inq.timeline || 'Flexible',
                            date: 'Just now'
                        }
                    });
                }
            });

            return stored;
        } catch (e) {
            return defaultNotifications;
        }
    }

    function saveNotifications(notifs) {
        try {
            localStorage.setItem('algora_notifications', JSON.stringify(notifs));
        } catch (e) {}
    }

    // Inject UI HTML (Drawer, Thank You Modal, Email Modal)
    function injectUI() {
        if (document.getElementById('algora-notification-center-root')) return;

        const root = document.createElement('div');
        root.id = 'algora-notification-center-root';
        root.innerHTML = `
        <!-- Notification Dropdown / Drawer Popover -->
        <div id="algora-notification-drawer" class="fixed top-16 sm:top-20 right-3 sm:right-6 lg:right-10 z-[999999] w-[94vw] sm:w-[440px] max-h-[88vh] bg-[#0c101c]/95 backdrop-blur-2xl border border-white/18 rounded-[26px] shadow-[0_25px_80px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden transition-all duration-300 opacity-0 pointer-events-none translate-y-[-12px] scale-[0.97]" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;">
            
            <!-- Drawer Header -->
            <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">notifications_active</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm sm:text-[15px] font-bold text-white tracking-tight">Notifications</h3>
                            <span id="notif-unread-badge" class="px-2 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">0 NEW</span>
                        </div>
                        <p class="text-[11px] text-white/50 font-medium">Orders, thank-you cards & email replies</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <button id="notif-mark-all-read" title="Mark all as read" class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-[17px]">done_all</span>
                    </button>
                    <button id="notif-close-btn" class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-[19px]">close</span>
                    </button>
                </div>
            </div>

            <!-- Filter Tabs -->
            <div class="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 bg-white/[0.015]">
                <button class="notif-tab-btn active px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all bg-indigo-600 text-white cursor-pointer" data-filter="all">All (<span id="count-all">0</span>)</button>
                <button class="notif-tab-btn px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all text-white/70 hover:text-white hover:bg-white/10 cursor-pointer" data-filter="order">📦 Orders & Cards (<span id="count-order">0</span>)</button>
                <button class="notif-tab-btn px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all text-white/70 hover:text-white hover:bg-white/10 cursor-pointer" data-filter="email">✉️ Emails (<span id="count-email">0</span>)</button>
            </div>

            <!-- Notification Feed List -->
            <div id="notif-feed-list" class="p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-[58vh] custom-scrollbar">
                <!-- Dynamically populated -->
            </div>

            <!-- Drawer Footer -->
            <div class="p-3 px-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 font-medium">
                <span class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Sync Active
                </span>
                <a href="start-project.html" class="text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-0.5">
                    + New Project
                    <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
            </div>
        </div>

        <!-- THANK YOU CARD MODAL (Full High-Fidelity Preview matching thank-you.html) -->
        <div id="notif-thankyou-modal" class="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
            <div class="relative w-full max-w-[420px] sm:max-w-[460px] rounded-[32px] sm:rounded-[36px] overflow-hidden shadow-[0_32px_96px_-16px_rgba(99,102,241,0.5)] border border-white/80 p-5 sm:p-8 flex flex-col justify-between min-h-[520px] sm:min-h-[620px] transition-all transform scale-95" style="background: linear-gradient(165deg, #ffffff 0%, #f8fafc 18%, #e0e7ff 35%, #a855f7 55%, #6366f1 75%, #38bdf8 92%, #0284c7 100%);">
                
                <!-- Close Button -->
                <button id="close-thankyou-modal-btn" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/70 text-white flex items-center justify-center transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>

                <!-- TOP BAR -->
                <div class="relative z-10 flex items-center justify-between">
                    <div class="inline-flex items-center px-3 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 shadow-xs">
                        <span id="modal-ty-status" class="text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] text-emerald-900 uppercase">SUBMITTED</span>
                    </div>
                    <div>
                        <img src="assets/logo.png" alt="ALGORA" class="h-4.5 sm:h-5 w-auto object-contain mr-8" style="filter: brightness(0.12) contrast(1.4) opacity(0.9) !important;" />
                    </div>
                </div>

                <!-- MAIN HEADLINE BLOCK -->
                <div class="relative z-10 my-auto pt-2 pb-2">
                    <div class="relative inline-block">
                        <h1 class="text-5xl sm:text-6xl font-extrabold text-[#111625] tracking-tight font-['Outfit'] leading-none">
                            Thank
                        </h1>
                        <div class="absolute -top-1 -right-6 flex items-start gap-0.5 select-none">
                            <span class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#111625] via-[#475569] to-[#e2e8f0]">✦</span>
                            <span class="text-xs font-bold -mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-[#111625] via-[#475569] to-[#e2e8f0]">✦</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 mt-0.5">
                        <h1 class="text-5xl sm:text-6xl font-extrabold text-[#818cf8] tracking-tight font-['Outfit'] leading-none">
                            You!
                        </h1>
                        <div class="text-[9px] font-extrabold tracking-widest text-[#6366f1] uppercase leading-tight">
                            <div>WE'LL BE</div>
                            <div>IN TOUCH</div>
                        </div>
                    </div>

                    <div class="mt-4 sm:mt-6 space-y-0.5">
                        <p class="text-lg sm:text-2xl font-medium text-white/95 tracking-tight leading-tight">Crafting</p>
                        <p class="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight" id="modal-ty-project-type">High-Impact Digital Experience</p>
                        <p class="text-base sm:text-xl font-bold text-white/70 tracking-tight leading-tight" id="modal-ty-budget-timeline">Budget: $2,500 – $5,000</p>
                    </div>

                    <!-- COPYABLE LEAD ID BADGE -->
                    <button id="modal-copy-lead-id" class="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 shadow-sm text-xs font-semibold text-white transition-all cursor-pointer group active:scale-95">
                        <span class="w-4 h-4 rounded-full bg-white/40 flex items-center justify-center text-[10px] text-white">✦</span>
                        <span id="modal-ty-lead-id">ID: #AG-9421</span>
                        <span class="material-symbols-outlined text-[14px] text-white/80 group-hover:text-white transition-colors" id="modal-copy-icon">content_copy</span>
                    </button>
                </div>

                <!-- LOWER SECTION & ACTION BAR -->
                <div class="relative z-10 space-y-3 pt-3 border-t border-white/20">
                    <div class="flex items-center justify-between text-[10px] font-extrabold text-white tracking-wider uppercase">
                        <div>FOR YOUR NEXT PROJECT</div>
                        <div>WE'LL REACH OUT IN 24H</div>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                        <div class="text-[9px] font-bold text-white/80 tracking-wider uppercase leading-snug">
                            <span>ALGORA CREATIVE STUDIO</span>
                            <span class="block text-white/60 font-medium">EST. 2025</span>
                        </div>
                        <button id="modal-ty-close-btn" class="inline-flex items-center gap-1.5 bg-white text-[#1e293b] hover:bg-slate-900 hover:text-white px-4 py-2 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer">
                            <span>Done</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- EMAIL THREAD & REPLY MODAL -->
        <div id="notif-email-modal" class="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
            <div class="relative w-full max-w-[560px] max-h-[90vh] rounded-[28px] overflow-hidden bg-[#0e1322] border border-white/20 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.9)] flex flex-col transition-all transform scale-95" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;">
                
                <!-- Email Header -->
                <div class="p-4 sm:p-5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/40 p-0.5 bg-slate-800">
                            <img src="assets/alex_avatar.png" alt="Gourav" class="w-full h-full object-cover rounded-full" onerror="this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuBxTP3_ZPmr7Vwd2NA75mIR9am0JD8URecn8G_dAUZQRoF0roFM1j6qvfHvktU42aq7I_wlpRViLmBUxUSRPkUqRbfbnB0Jvx-sdBSv9bWCKeDzz301xf_CcGgaNBpnRgzMT-4HhpXF6o5ZsxeIH9VjY83fPKBe2Cq8VBw31yNq5TCeUpWt8xZxxBsl8_fScoSxTI6CmPXZkFuCW0bp8y-5tp1gtthlcwhgbJWZMhFjk5Iw5UP0fzNz5A'">
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <h3 class="text-sm font-bold text-white" id="email-modal-sender">Gourav</h3>
                                <span class="material-symbols-outlined text-sky-400 text-[16px]">verified</span>
                                <span class="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase">Lead Architect</span>
                            </div>
                            <p class="text-[11px] text-white/50" id="email-modal-email">gourav@algora.studio</p>
                        </div>
                    </div>
                    <button id="close-email-modal-btn" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <!-- Email Content Area -->
                <div class="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[50vh] custom-scrollbar bg-black/20">
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block mb-1">Subject</span>
                        <h4 class="text-base sm:text-lg font-bold text-white" id="email-modal-subject">RE: Project Architecture & Blueprint</h4>
                        <span class="text-[11px] text-white/40" id="email-modal-time">Today at 10:45 AM</span>
                    </div>

                    <!-- Email Message Body -->
                    <div class="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans" id="email-modal-body">
                        <!-- Content -->
                    </div>

                    <!-- Thread Replies Container -->
                    <div id="email-thread-replies" class="space-y-3 pt-2">
                        <!-- Dynamic user replies -->
                    </div>
                </div>

                <!-- Quick Reply Box -->
                <div class="p-4 border-t border-white/10 bg-white/[0.02]">
                    <div class="relative">
                        <textarea id="email-reply-input" rows="2" placeholder="Write a reply to Gourav..." class="w-full bg-white/10 border border-white/20 focus:border-indigo-400 rounded-xl p-3 pr-24 text-xs text-white placeholder-white/50 outline-none resize-none transition-all"></textarea>
                        <button id="email-send-reply-btn" class="absolute right-2.5 bottom-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm cursor-pointer active:scale-95">
                            <span>Send</span>
                            <span class="material-symbols-outlined text-[14px]">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.body.appendChild(root);
    }

    // Render Notifications Feed
    function renderFeed(filter = 'all') {
        const feedList = document.getElementById('notif-feed-list');
        if (!feedList) return;

        const notifs = getStoredNotifications();
        let filtered = notifs;

        if (filter === 'order') {
            filtered = notifs.filter(n => n.type === 'order');
        } else if (filter === 'email') {
            filtered = notifs.filter(n => n.type === 'email_reply' || n.type === 'email_inbound');
        }

        // Update counts
        const allCount = notifs.length;
        const orderCount = notifs.filter(n => n.type === 'order').length;
        const emailCount = notifs.filter(n => n.type === 'email_reply' || n.type === 'email_inbound').length;
        const unreadCount = notifs.filter(n => !n.read).length;

        const countAllEl = document.getElementById('count-all');
        const countOrderEl = document.getElementById('count-order');
        const countEmailEl = document.getElementById('count-email');
        const unreadBadgeEl = document.getElementById('notif-unread-badge');

        if (countAllEl) countAllEl.textContent = allCount;
        if (countOrderEl) countOrderEl.textContent = orderCount;
        if (countEmailEl) countEmailEl.textContent = emailCount;
        if (unreadBadgeEl) {
            unreadBadgeEl.textContent = unreadCount > 0 ? `${unreadCount} NEW` : '0 NEW';
            unreadBadgeEl.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
        }

        // Update bell icons on page
        updateBellBadges(unreadCount);

        if (filtered.length === 0) {
            feedList.innerHTML = `
                <div class="py-10 text-center text-white/50">
                    <span class="material-symbols-outlined text-4xl mb-2 text-white/30">notifications_off</span>
                    <p class="text-xs font-semibold">No notifications in this category.</p>
                </div>
            `;
            return;
        }

        feedList.innerHTML = filtered.map(item => {
            const isRead = item.read;
            const isOrder = item.type === 'order';
            const isReply = item.type === 'email_reply';

            let iconHtml = '';
            let badgeHtml = '';
            let actionBtnHtml = '';

            if (isOrder) {
                iconHtml = `
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-sm">
                        <span class="material-symbols-outlined text-[19px]">receipt_long</span>
                    </div>
                `;
                badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-extrabold uppercase tracking-wider">ORDER CONFIRMED</span>`;
                actionBtnHtml = `
                    <button onclick="window.viewThankYouModal('${item.id}')" class="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                        <span>✨ View Thank You Card</span>
                        <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                `;
            } else if (isReply) {
                iconHtml = `
                    <div class="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0 shadow-sm">
                        <span class="material-symbols-outlined text-[19px]">mark_email_read</span>
                    </div>
                `;
                badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[9px] font-extrabold uppercase tracking-wider">REPLY FROM GOURAV</span>`;
                actionBtnHtml = `
                    <button onclick="window.viewEmailModal('${item.id}')" class="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/25 to-purple-500/25 hover:from-indigo-500/40 hover:to-purple-500/40 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                        <span>✉️ Read Email Thread & Reply</span>
                        <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                `;
            } else {
                iconHtml = `
                    <div class="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-sm">
                        <span class="material-symbols-outlined text-[19px]">forward_to_inbox</span>
                    </div>
                `;
                badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[9px] font-extrabold uppercase tracking-wider">DISPATCHED</span>`;
                actionBtnHtml = `
                    <button onclick="window.viewEmailModal('${item.id}')" class="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                        <span>View Details</span>
                        <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                `;
            }

            return `
                <div class="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border ${isRead ? 'border-white/10' : 'border-indigo-500/40 bg-indigo-950/20'} transition-all group relative">
                    ${!isRead ? `<span class="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>` : ''}
                    <div class="flex items-start gap-3">
                        ${iconHtml}
                        <div class="flex-1 min-w-0 pr-4">
                            <div class="flex items-center gap-2 mb-1">
                                ${badgeHtml}
                                <span class="text-[10px] text-white/45 font-mono">${item.time}</span>
                            </div>
                            <h4 class="text-xs sm:text-[13px] font-bold text-white leading-snug">${item.title}</h4>
                            <p class="text-[11px] text-white/70 mt-0.5 line-clamp-2 leading-relaxed">${item.subtitle || item.preview || ''}</p>
                            ${isOrder && item.budget ? `<div class="mt-1.5 flex items-center gap-3 text-[10px] text-white/60 font-mono"><span>💰 ${item.budget}</span><span>⏱️ ${item.timeline}</span></div>` : ''}
                            ${actionBtnHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update unread badges on all bell buttons
    function updateBellBadges(count) {
        const bells = document.querySelectorAll('button[aria-label="Notifications"], #nav-notification-btn, #mobile-nav-notification-btn, #desktop-notification-btn');
        bells.forEach(btn => {
            let dot = btn.querySelector('.notif-live-badge');
            if (!dot) {
                dot = document.createElement('span');
                dot.className = 'notif-live-badge absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white animate-pulse shadow-sm pointer-events-none';
                btn.classList.add('relative');
                btn.appendChild(dot);
            }
            dot.style.display = count > 0 ? 'block' : 'none';
        });
    }

    // Modal view triggers
    window.viewThankYouModal = function(id) {
        const notifs = getStoredNotifications();
        const item = notifs.find(n => n.id === id);
        if (!item) return;

        // Mark as read
        item.read = true;
        saveNotifications(notifs);
        renderFeed(currentFilter);

        const modal = document.getElementById('notif-thankyou-modal');
        if (!modal) return;

        const data = item.thankYouData || {};
        document.getElementById('modal-ty-status').textContent = data.status || 'SUBMITTED';
        document.getElementById('modal-ty-project-type').textContent = data.projectType || item.subtitle || 'High-Impact Digital Experience';
        document.getElementById('modal-ty-budget-timeline').textContent = `Budget: ${data.budget || item.budget || '$2,500 – $5,000'} • ${data.timeline || item.timeline || '2-3 Weeks'}`;
        document.getElementById('modal-ty-lead-id').textContent = `ID: #${data.leadId || item.leadId || 'AG-9421'}`;

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
    };

    let activeEmailNotifId = null;

    window.viewEmailModal = function(id) {
        const notifs = getStoredNotifications();
        const item = notifs.find(n => n.id === id);
        if (!item) return;

        activeEmailNotifId = id;
        item.read = true;
        saveNotifications(notifs);
        renderFeed(currentFilter);

        const modal = document.getElementById('notif-email-modal');
        if (!modal) return;

        document.getElementById('email-modal-sender').textContent = item.sender || 'Gourav';
        document.getElementById('email-modal-email').textContent = item.senderEmail || 'gourav@algora.studio';
        document.getElementById('email-modal-subject').textContent = item.subject || item.title || 'Project Update';
        document.getElementById('email-modal-time').textContent = item.time || 'Today';
        document.getElementById('email-modal-body').textContent = item.fullMessage || item.preview || '';

        // Render past replies
        const repliesContainer = document.getElementById('email-thread-replies');
        if (repliesContainer) {
            const replies = item.replies || [];
            repliesContainer.innerHTML = replies.map(r => `
                <div class="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-3 text-xs text-white ml-6">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-indigo-300">You (Client)</span>
                        <span class="text-[10px] text-white/50">${r.time}</span>
                    </div>
                    <p class="leading-relaxed">${r.text}</p>
                </div>
            `).join('');
        }

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
    };

    let currentFilter = 'all';

    function setupEventListeners() {
        injectUI();
        renderFeed('all');

        const drawer = document.getElementById('algora-notification-drawer');
        const tyModal = document.getElementById('notif-thankyou-modal');
        const emailModal = document.getElementById('notif-email-modal');

        // Toggle Drawer on Bell Click
        function toggleDrawer(e) {
            if (e) e.stopPropagation();
            if (!drawer) return;
            const isOpen = drawer.classList.contains('opacity-100');
            if (isOpen) {
                drawer.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
                drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-12px]', 'scale-[0.97]');
            } else {
                renderFeed(currentFilter);
                drawer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-12px]', 'scale-[0.97]');
                drawer.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
            }
        }

        // Attach to all bell icons
        document.querySelectorAll('button[aria-label="Notifications"], #nav-notification-btn, #mobile-nav-notification-btn, #desktop-notification-btn').forEach(btn => {
            btn.addEventListener('click', toggleDrawer);
        });

        // Close Drawer
        const closeBtn = document.getElementById('notif-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (drawer) {
                    drawer.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
                    drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-12px]', 'scale-[0.97]');
                }
            });
        }

        // Outside Click to close drawer
        document.addEventListener('click', (e) => {
            if (drawer && drawer.classList.contains('opacity-100')) {
                if (!drawer.contains(e.target) && !e.target.closest('button[aria-label="Notifications"], #nav-notification-btn, #mobile-nav-notification-btn, #desktop-notification-btn')) {
                    drawer.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
                    drawer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-12px]', 'scale-[0.97]');
                }
            }
        });

        // Tab Filter Buttons
        document.querySelectorAll('.notif-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.notif-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-indigo-600', 'text-white');
                    b.classList.add('text-white/70');
                });
                btn.classList.add('active', 'bg-indigo-600', 'text-white');
                btn.classList.remove('text-white/70');
                currentFilter = btn.getAttribute('data-filter');
                renderFeed(currentFilter);
            });
        });

        // Mark all as read
        const markAllBtn = document.getElementById('notif-mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                const notifs = getStoredNotifications();
                notifs.forEach(n => n.read = true);
                saveNotifications(notifs);
                renderFeed(currentFilter);
            });
        }

        // Close Thank You Modal
        const closeTyBtns = [document.getElementById('close-thankyou-modal-btn'), document.getElementById('modal-ty-close-btn')];
        closeTyBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (tyModal) {
                        tyModal.classList.remove('opacity-100', 'pointer-events-auto');
                        tyModal.classList.add('opacity-0', 'pointer-events-none');
                    }
                });
            }
        });

        // Copy Lead ID in modal
        const copyLeadBtn = document.getElementById('modal-copy-lead-id');
        if (copyLeadBtn) {
            copyLeadBtn.addEventListener('click', () => {
                const text = document.getElementById('modal-ty-lead-id').textContent.replace('ID: #', '');
                navigator.clipboard.writeText(text).then(() => {
                    const icon = document.getElementById('modal-copy-icon');
                    if (icon) {
                        icon.textContent = 'check';
                        setTimeout(() => { icon.textContent = 'content_copy'; }, 2000);
                    }
                }).catch(() => {});
            });
        }

        // Close Email Modal
        const closeEmailBtn = document.getElementById('close-email-modal-btn');
        if (closeEmailBtn) {
            closeEmailBtn.addEventListener('click', () => {
                if (emailModal) {
                    emailModal.classList.remove('opacity-100', 'pointer-events-auto');
                    emailModal.classList.add('opacity-0', 'pointer-events-none');
                }
            });
        }

        // Send Quick Reply in Email Modal
        const sendReplyBtn = document.getElementById('email-send-reply-btn');
        const replyInput = document.getElementById('email-reply-input');
        if (sendReplyBtn && replyInput) {
            sendReplyBtn.addEventListener('click', () => {
                const text = replyInput.value.trim();
                if (!text || !activeEmailNotifId) return;

                const notifs = getStoredNotifications();
                const item = notifs.find(n => n.id === activeEmailNotifId);
                if (item) {
                    if (!item.replies) item.replies = [];
                    item.replies.push({
                        text: text,
                        time: 'Just now',
                        timestamp: Date.now()
                    });
                    saveNotifications(notifs);

                    // Add to UI immediately
                    const repliesContainer = document.getElementById('email-thread-replies');
                    if (repliesContainer) {
                        const newBubble = document.createElement('div');
                        newBubble.className = 'bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-3 text-xs text-white ml-6 animate-fadeIn';
                        newBubble.innerHTML = `
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-bold text-indigo-300">You (Client)</span>
                                <span class="text-[10px] text-white/50">Just now</span>
                            </div>
                            <p class="leading-relaxed">${text}</p>
                        `;
                        repliesContainer.appendChild(newBubble);
                    }

                    replyInput.value = '';
                    sendReplyBtn.innerHTML = `<span>Sent!</span><span class="material-symbols-outlined text-[14px]">check</span>`;
                    setTimeout(() => {
                        sendReplyBtn.innerHTML = `<span>Send</span><span class="material-symbols-outlined text-[14px]">send</span>`;
                    }, 2000);
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }
})();
