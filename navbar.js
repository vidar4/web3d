// =========================================================================
// Web3D Responsive Navigation & Mobile Drawer Controller
// Standardized across all 12 platform pages (<768px Drawer & Badges)
// =========================================================================

(function() {
    'use strict';

    function initMobileNavigation() {
        // 1. Ensure Drawer HTML exists in the DOM
        let backdrop = document.getElementById('mobile-drawer-backdrop');
        let drawer = document.getElementById('mobile-drawer');

        if (!drawer) {
            const drawerHTML = `
            <div id="mobile-drawer-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] opacity-0 pointer-events-none transition-opacity duration-300"></div>
            <aside id="mobile-drawer" class="fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl z-[999] transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col font-prompt">
                <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <a href="index.html" class="flex items-center gap-2.5">
                        <div class="bg-primary p-2 rounded-xl text-white shadow-md shadow-blue-500/20 flex items-center justify-center">
                            <i data-lucide="box" class="w-5 h-5"></i>
                        </div>
                        <span class="font-black text-lg tracking-tight text-slate-900">3D TECH</span>
                    </a>
                    <button id="mobile-drawer-close" aria-label="ปิดเมนู" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="p-4 border-b border-slate-100 bg-blue-50/40">
                    <div id="drawer-user-info" class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                            <i data-lucide="user" class="w-5 h-5"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p id="drawer-user-name" class="font-bold text-slate-800 text-sm truncate">ผู้เยี่ยมชม</p>
                            <a id="drawer-auth-link" href="login.html" class="text-xs text-primary font-semibold hover:underline">เข้าสู่ระบบ / สมัคร</a>
                        </div>
                    </div>
                </div>

                <nav id="drawer-nav-links" class="flex-1 overflow-y-auto p-4 space-y-1.5 hide-scrollbar">
                    <a href="index.html" class="drawer-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <i data-lucide="home" class="w-5 h-5 text-slate-400"></i>
                        <span data-i18n="drawer_home">หน้าแรก (Home)</span>
                    </a>
                    <a href="index.html#store" class="drawer-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <i data-lucide="layers" class="w-5 h-5 text-slate-400"></i>
                        <span data-i18n="drawer_catalog">คลังโมเดล 3D (Catalog)</span>
                    </a>
                    <a href="cart.html" class="drawer-nav-item flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <div class="flex items-center gap-3">
                            <i data-lucide="shopping-cart" class="w-5 h-5 text-slate-400"></i>
                            <span data-i18n="drawer_cart">ตะกร้าสินค้า (Cart)</span>
                        </div>
                        <span id="drawer-cart-badge" class="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-bold hidden">0</span>
                    </a>
                    <a href="to-pay.html" class="drawer-nav-item flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <div class="flex items-center gap-3">
                            <i data-lucide="credit-card" class="w-5 h-5 text-slate-400"></i>
                            <span data-i18n="drawer_to_pay">ที่ต้องชำระ (To Pay)</span>
                        </div>
                        <span id="drawer-to-pay-badge" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold hidden">0</span>
                    </a>
                    <a href="status.html" class="drawer-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <i data-lucide="truck" class="w-5 h-5 text-slate-400"></i>
                        <span data-i18n="drawer_status">ติดตามสถานะ (Orders)</span>
                    </a>
                    <a href="profile.html" class="drawer-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-primary font-semibold transition text-sm">
                        <i data-lucide="user-check" class="w-5 h-5 text-slate-400"></i>
                        <span data-i18n="drawer_profile">ข้อมูลส่วนตัว (Profile)</span>
                    </a>
                    <div id="drawer-admin-link-wrapper" class="hidden pt-1">
                        <a href="admin.html" class="drawer-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold transition text-sm border border-amber-200">
                            <i data-lucide="shield" class="w-5 h-5 text-amber-600"></i>
                            <span data-i18n="drawer_admin">ระบบแอดมิน (Backoffice)</span>
                        </a>
                    </div>
                </nav>

                <div class="p-4 border-t border-slate-100 space-y-3 bg-slate-50/60">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-slate-500" data-i18n="drawer_lang">ภาษา (Language)</span>
                        <button onclick="window.toggleLanguage()" class="lang-btn group" title="Change Language">
                            <i data-lucide="globe" class="w-4 h-4 text-slate-400 group-hover:text-primary"></i>
                            <span id="drawer-lang-display">TH</span>
                        </button>
                    </div>
                    <button id="drawer-logout-btn" class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold transition hidden">
                        <i data-lucide="log-out" class="w-4 h-4"></i>
                        <span data-i18n="nav_logout">ออกจากระบบ</span>
                    </button>
                </div>
            </aside>
            `;
            document.body.insertAdjacentHTML('beforeend', drawerHTML);
            backdrop = document.getElementById('mobile-drawer-backdrop');
            drawer = document.getElementById('mobile-drawer');
        }

        // 2. Open / Close Logic
        function openDrawer() {
            if (!drawer || !backdrop) return;
            backdrop.classList.remove('opacity-0', 'pointer-events-none');
            backdrop.classList.add('opacity-100', 'pointer-events-auto');
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
            document.body.style.overflow = 'hidden';
            if (window.lucide) window.lucide.createIcons();
        }

        function closeDrawer() {
            if (!drawer || !backdrop) return;
            backdrop.classList.remove('opacity-100', 'pointer-events-auto');
            backdrop.classList.add('opacity-0', 'pointer-events-none');
            drawer.classList.remove('translate-x-0');
            drawer.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }

        // Expose to window
        window.openMobileDrawer = openDrawer;
        window.closeMobileDrawer = closeDrawer;

        // Hook trigger buttons
        document.querySelectorAll('#mobile-menu-btn, .mobile-menu-toggle, [data-mobile-menu]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                openDrawer();
            };
        });

        const closeBtn = document.getElementById('mobile-drawer-close');
        if (closeBtn) closeBtn.onclick = closeDrawer;

        if (backdrop) backdrop.onclick = closeDrawer;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDrawer();
        });

        // Close on link click
        document.querySelectorAll('#mobile-drawer a').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeDrawer, 100);
            });
        });

        // 3. Sync User Session in Drawer
        const userName = localStorage.getItem('user_name');
        const userRole = localStorage.getItem('user_role');
        const drawerUserName = document.getElementById('drawer-user-name');
        const drawerAuthLink = document.getElementById('drawer-auth-link');
        const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
        const adminWrapper = document.getElementById('drawer-admin-link-wrapper');

        if (userName) {
            if (drawerUserName) drawerUserName.textContent = userName;
            if (drawerAuthLink) {
                drawerAuthLink.textContent = 'จัดการโปรไฟล์';
                drawerAuthLink.href = 'profile.html';
            }
            if (drawerLogoutBtn) {
                drawerLogoutBtn.classList.remove('hidden');
                drawerLogoutBtn.onclick = () => {
                    if (window.logout) {
                        window.logout();
                    } else {
                        localStorage.removeItem('user_id');
                        localStorage.removeItem('user_name');
                        localStorage.removeItem('user_role');
                        localStorage.removeItem('user_email');
                        window.location.href = 'login.html';
                    }
                };
            }
        } else {
            if (drawerUserName) drawerUserName.textContent = 'ผู้เยี่ยมชม';
            if (drawerAuthLink) {
                drawerAuthLink.textContent = 'เข้าสู่ระบบ / สมัครสมาชิก';
                drawerAuthLink.href = 'login.html';
            }
            if (drawerLogoutBtn) drawerLogoutBtn.classList.add('hidden');
        }

        if (userRole === 'admin' && adminWrapper) {
            adminWrapper.classList.remove('hidden');
        }

        // 4. Sync Badges
        try {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const drawerCartBadge = document.getElementById('drawer-cart-badge');
            if (drawerCartBadge) {
                if (cart.length > 0) {
                    drawerCartBadge.textContent = cart.length;
                    drawerCartBadge.classList.remove('hidden');
                } else {
                    drawerCartBadge.classList.add('hidden');
                }
            }
        } catch (e) {}

        // Check if there is already a to-pay badge on page
        const existingToPay = document.querySelector('[id^="to-pay-badge"]');
        const drawerToPay = document.getElementById('drawer-to-pay-badge');
        if (existingToPay && drawerToPay) {
            const val = parseInt(existingToPay.textContent || '0', 10);
            if (val > 0 && !existingToPay.classList.contains('hidden')) {
                drawerToPay.textContent = val;
                drawerToPay.classList.remove('hidden');
            }
        }

        // 5. Sync Language
        const savedLang = localStorage.getItem('my_site_lang') || 'th';
        const drawerLangDisplay = document.getElementById('drawer-lang-display');
        if (drawerLangDisplay) drawerLangDisplay.textContent = savedLang.toUpperCase();

        // 6. Highlight active item
        const curPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('#drawer-nav-links a.drawer-nav-item').forEach(link => {
            const href = link.getAttribute('href');
            if (href === curPath || (curPath === '' && href === 'index.html')) {
                link.classList.add('bg-blue-50', 'text-primary', 'font-bold');
                link.classList.remove('text-slate-700');
            }
        });

        // 7. Render Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNavigation);
    } else {
        initMobileNavigation();
    }
})();
