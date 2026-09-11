// =========================================================
// 1. Config Supabase
// =========================================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// ตัวแปรส่วนกลางสำหรับกรองข้อมูล
let currentCategory = 'all';
let searchTimeout = null;

// =========================================================
// 2. Init & Event Listeners
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    checkUserLogin();
    loadProducts();
    updateCartBadge();
    
    // 💡 โหลดระบบแจ้งเตือนบิลที่ค้างชำระ
    checkPendingPayments();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadProducts(currentCategory, e.target.value);
            }, 300); 
        });
    }
});

// =========================================================
// 💡 3. ฟังก์ชันนับจำนวนบิล (แก้บัคการนับเกิน)
// =========================================================
async function checkPendingPayments() {
    const userId = localStorage.getItem('user_id');
    if(!userId) return;

    try {
        const { data, error } = await db
            .from('order_model')
            .select('created_at')
            .eq('user_id', userId)
            .in('order_status', ['รอชำระเงิน', 'รอการชำระเงิน']);

        if (error) throw error;
        
        if(data && data.length > 0) {
            // นับจำนวนบิล โดยรวบเอาอันที่สร้างเวลาเดียวกัน(ถึงหลักนาที) เป็น 1 บิล
            const uniqueBills = new Set(data.map(o => o.created_at.substring(0, 16)));
            const billCount = uniqueBills.size;

            const badge = document.getElementById('to-pay-badge-index');
            if(badge && billCount > 0) {
                badge.innerText = billCount;
                badge.classList.remove('hidden');
            }
        }
    } catch(e) { console.error('Error checking payments', e); }
}

// =========================================================
// 4. Load Products Logic (ดึงข้อมูลโมเดล + คะแนนรีวิวจริง)
// =========================================================
async function loadProducts(category = 'all', searchQuery = '') {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = Array(8).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="w-full aspect-square skeleton-shimmer rounded-2xl"></div>
            <div class="h-4 skeleton-shimmer w-3/4 rounded mt-3"></div>
            <div class="h-4 skeleton-shimmer w-1/2 rounded mt-2"></div>
            <div class="flex justify-between items-center mt-4 pt-2 border-t border-slate-100">
                <div class="h-6 skeleton-shimmer w-1/3 rounded"></div>
                <div class="h-9 w-9 skeleton-shimmer rounded-xl"></div>
            </div>
        </div>
    `).join('');

    try {
        let query = db.from('model').select('*').order('model_id', { ascending: false });

        if (category !== 'all') {
            query = query.eq('parent_id', category);
        }

        if (searchQuery.trim() !== '') {
            query = query.ilike('model_name', `%${searchQuery.trim()}%`);
        }

        const { data: models, error } = await query;
        if (error) throw error;

        const { data: reviewsData, error: reviewError } = await db.from('reviews').select('model_id, rating');
        
        const reviewStats = {};
        if (reviewsData && !reviewError) {
            reviewsData.forEach(r => {
                if (!reviewStats[r.model_id]) {
                    reviewStats[r.model_id] = { totalScore: 0, count: 0 };
                }
                reviewStats[r.model_id].totalScore += Number(r.rating);
                reviewStats[r.model_id].count += 1;
            });
        }

        if (!models || models.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <i data-lucide="package-search" class="mx-auto mb-4 text-slate-400" size="48"></i>
                    <p class="text-slate-600 font-bold text-lg mb-1">ไม่พบโมเดลที่คุณค้นหา</p>
                    <p class="text-slate-500 text-sm mb-4">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาใหม่ดูนะ</p>
                    <button onclick="resetFilters()" class="text-primary hover:text-primaryHover font-semibold underline underline-offset-4">
                        กลับไปดูสินค้าทั้งหมด
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = '';

        models.forEach(item => {
            let imgPath = '';
            let rawImg = item.model_image_1;

            if (Array.isArray(rawImg) && rawImg.length > 0) {
                imgPath = rawImg[0];
            } else if (typeof rawImg === 'string') {
                if (rawImg.startsWith('[')) {
                    try { imgPath = JSON.parse(rawImg)[0]; } catch(e) { imgPath = rawImg; }
                } else {
                    imgPath = rawImg;
                }
            }
            
            const fullImgUrl = getModelImageUrl(imgPath);

            let avgRating = 0;
            let reviewCount = 0;
            
            if (reviewStats[item.model_id]) {
                reviewCount = reviewStats[item.model_id].count;
                avgRating = Number((reviewStats[item.model_id].totalScore / reviewCount).toFixed(1));
            }

            let starHtml = '<div class="flex items-center gap-[2px]">';
            
            for (let i = 1; i <= 5; i++) {
                if (reviewCount === 0) {
                    starHtml += `<svg class="w-3.5 h-3.5 text-slate-200 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
                } else {
                    let fillPercent = 0;
                    if (avgRating >= i) {
                        fillPercent = 100; 
                    } else if (avgRating > i - 1) {
                        fillPercent = (avgRating - (i - 1)) * 100; 
                    }
                    
                    starHtml += `
                    <div class="relative w-3.5 h-3.5">
                        <svg class="absolute top-0 left-0 w-3.5 h-3.5 text-slate-200 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        
                        <div class="absolute top-0 left-0 h-full overflow-hidden" style="width: ${fillPercent}%;">
                            <svg class="w-3.5 h-3.5 text-amber-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                    </div>`;
                }
            }
            starHtml += '</div>';

            let ratingText = reviewCount > 0 
                ? `<span class="text-[10px] text-slate-500 ml-1 font-bold">${avgRating} <span class="text-slate-400 font-normal">(${reviewCount} รีวิว)</span></span>` 
                : `<span class="text-[9px] text-slate-400 ml-1">ยังไม่มีรีวิว</span>`;

            const tagline = window.getModelTagline ? window.getModelTagline(item) : '⚡ งานพิมพ์ 3 มิติคุณภาพพรีเมียม';

            const card = document.createElement('div');
            card.className = 'group relative bg-white p-4 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden';
            card.onclick = () => window.location.href = `product-detail.html?id=${item.model_id}`;

            card.innerHTML = `
                <div class="relative aspect-square w-full mb-5 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src="${fullImgUrl}" 
                         class="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
                         alt="${item.model_name}" 
                         onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex items-center gap-1">
                        ${starHtml}
                        ${ratingText}
                    </div>
                    
                    <h3 class="font-bold text-lg leading-tight group-hover:text-primary transition line-clamp-2" style="color: #0F172A;">${item.model_name}</h3>
                    <p class="text-xs text-slate-500 font-medium line-clamp-1 italic flex items-center gap-1.5 pt-0.5" title="${tagline}">
                        <span class="truncate">${tagline}</span>
                    </p>
                    
                    <div class="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${window.t ? window.t('starting_price') : 'ราคาเริ่มต้น'}</span>
                            <span class="text-primary font-black text-xl leading-none">฿${Number(item.model_price).toLocaleString()}</span>
                        </div>
                        <button class="w-10 h-10 bg-blue-50 hover:bg-primary rounded-xl flex items-center justify-center transition-all group-hover:shadow-lg group-hover:shadow-blue-500/20" title="${window.t ? window.t('view_details') : 'ดูรายละเอียด'}">
                            <i data-lucide="shopping-bag" class="text-primary group-hover:text-white transition" size="18"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        lucide.createIcons();

    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="col-span-full text-center text-red-500 font-medium p-10 bg-red-50 rounded-2xl border border-red-100">เกิดข้อผิดพลาดในการโหลดสินค้า กรุณาลองใหม่ภายหลัง</div>';
    }
}

// =========================================================
// 5. Helper Functions
// =========================================================
function getModelImageUrl(path) {
    if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (path.startsWith('http')) return path;
    return `${supabaseUrl}/storage/v1/object/public/model_images/${path}`;
}

window.filterCategory = function(cat, element) {
    currentCategory = cat;
    
    if (element) {
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(t => {
            t.classList.remove('text-primary', 'bg-blue-50', 'active');
            t.classList.add('text-slate-500', 'hover:bg-slate-100');
        });
        element.classList.remove('text-slate-500', 'hover:bg-slate-100');
        element.classList.add('text-primary', 'bg-blue-50', 'active');
    }

    const searchVal = document.getElementById('searchInput')?.value || '';
    loadProducts(currentCategory, searchVal);
}

window.resetFilters = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const allTab = document.querySelector('.category-tab'); 
    if (allTab) {
        filterCategory('all', allTab);
    } else {
        currentCategory = 'all';
        loadProducts();
    }
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || []; 
    const badge = document.getElementById('cartBadge');
    if(badge) {
        if(cart.length > 0) {
            badge.innerText = cart.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function checkUserLogin() {
    const welcomeUserSpan = document.getElementById('welcomeUser');
    const userName = localStorage.getItem('user_name'); 

    if (!welcomeUserSpan) return;

    if (userName) {
        welcomeUserSpan.textContent = userName;
        welcomeUserSpan.parentElement.href = "profile.html";
        welcomeUserSpan.classList.remove('hidden');
        welcomeUserSpan.classList.add('sm:inline');
    } else {
        welcomeUserSpan.textContent = window.t ? window.t('nav_login') : "เข้าสู่ระบบ";
        welcomeUserSpan.parentElement.href = "login.html"; 
        welcomeUserSpan.classList.remove('hidden');
        welcomeUserSpan.classList.add('sm:inline');
    }
}

window.addEventListener('languageChanged', () => {
    checkUserLogin();
    if (typeof loadProducts === 'function') {
        const searchVal = document.getElementById('searchInput')?.value || '';
        loadProducts(currentCategory, searchVal);
    }
});