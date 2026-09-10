// =========================================================
// 1. Config Supabase
// =========================================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 
const db = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// =========================================================
// 2. โหลดข้อมูลเริ่มต้น
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    
    if (userId && userName) {
        const welcomeEl = document.getElementById('welcome-user');
        if(welcomeEl) welcomeEl.innerText = userName;
    } else {
        alert('กรุณาเข้าสู่ระบบก่อน');
        window.location.href = 'login.html';
        return;
    }

    loadCartItems();
    updateCartBadge();
    if(db) checkPendingPayments(userId);
});

async function checkPendingPayments(userId) {
    try {
        const { data, error } = await db
            .from('order_model')
            .select('created_at')
            .eq('user_id', userId)
            .in('order_status', ['รอชำระเงิน', 'รอการชำระเงิน']);

        if (error) throw error;
        
        if(data && data.length > 0) {
            const uniqueBills = new Set(data.map(o => o.created_at.substring(0, 16)));
            const badge = document.getElementById('to-pay-badge-index');
            if(badge) {
                badge.innerText = uniqueBills.size;
                badge.classList.remove('hidden');
            }
        }
    } catch(e) { console.error('Error', e); }
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

// =========================================================
// 3. ดึงข้อมูลสินค้าและวาดลงหน้าจอ (ดีไซน์ใหม่ตรงปก)
// =========================================================
function loadCartItems() {
    // 💡 แก้บัคตรงนี้: ใช้ id ให้ตรงกับ HTML
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm lg:col-span-12">
                <i data-lucide="shopping-cart" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold text-slate-800 mb-2">ไม่มีสินค้าในรถเข็น</h3>
                <p class="text-slate-500 font-medium mb-6">ลองหาโมเดล 3D ที่ถูกใจแล้วเพิ่มลงรถเข็นดูสิ</p>
                <a href="index.html#store" class="bg-primary text-white hover:bg-primaryHover px-8 py-3 rounded-xl font-bold transition-colors inline-block shadow-md shadow-blue-500/20">ไปเลือกสินค้าเลย</a>
            </div>
        `;
        
        const btn = document.getElementById('checkout-btn');
        if(btn) btn.disabled = true;

        const rightCol = document.getElementById('summary-section');
        if (rightCol) rightCol.style.display = 'none';
        cartContainer.classList.replace('lg:col-span-8', 'lg:col-span-12');

        updateGrandTotal(); 
        if(typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const rightCol = document.getElementById('summary-section');
    if (rightCol) rightCol.style.display = 'block';
    cartContainer.classList.replace('lg:col-span-12', 'lg:col-span-8');

    cartContainer.innerHTML = '';
    
    // กล่องส่วนหัว "เลือกทั้งหมด"
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm mb-4';
    headerDiv.innerHTML = `
        <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="select-all" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-colors" checked>
            <span class="font-black text-slate-800">เลือกสินค้าทั้งหมดในรถเข็น</span>
        </label>
        <span class="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">${cart.length} รายการ</span>
    `;
    cartContainer.appendChild(headerDiv);

    const itemsWrapper = document.createElement('div');
    itemsWrapper.className = 'space-y-4';

    // 💡 วาดการ์ดสินค้าตามดีไซน์รูปตัวอย่าง
    cart.forEach((item, index) => {
        const rowTotal = Number(item.price) * Number(item.qty);
        const itemCard = document.createElement('div');
        
        // CSS หลักของการ์ด
        itemCard.className = `cart-item-card relative bg-white border border-primary ring-1 ring-primary/20 rounded-[32px] p-5 md:p-6 flex flex-col md:flex-row gap-5 transition-all shadow-sm group overflow-hidden`;
        
        itemCard.innerHTML = `
            <div class="indicator-bar absolute left-0 top-0 bottom-0 w-2 bg-primary transition-colors"></div>

            <div class="flex items-center gap-4 shrink-0 pl-1">
                <input type="checkbox" class="item-checkbox w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-colors" checked data-index="${index}" onchange="calculateMultiTotal(this)">
                <img src="${item.image}" alt="${item.name}" class="w-24 h-24 md:w-36 md:h-36 object-cover rounded-[24px] bg-slate-80 shrink-0" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
            </div>

            <div class="flex-1 flex flex-col justify-between min-w-0 w-full mt-2 md:mt-0">
                
                <div class="flex justify-between items-start gap-4 mb-4">
                    <div class="min-w-0">
                        <h4 class="font-black text-slate-900 text-lg md:text-xl truncate leading-tight">${item.name}</h4>
                        <p class="text-xs font-bold text-slate-400 mt-1">ราคา: ฿${Number(item.price).toLocaleString()} / ชิ้น</p>
                    </div>
                    <button onclick="removeItem(${index})" class="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0" title="ลบสินค้า">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="flex flex-wrap gap-2 md:gap-3 mb-5">
                    <div class="bg-slate-50/80 px-3 py-1.5 md:py-2 rounded-[14px] flex flex-col justify-center">
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ขนาด</span>
                        <span class="text-xs md:text-sm font-bold text-slate-700">${item.size}</span>
                    </div>
                    <div class="bg-slate-50/80 px-3 py-1.5 md:py-2 rounded-[14px] flex flex-col justify-center">
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">สี และ วัสดุ</span>
                        <span class="text-xs md:text-sm font-bold text-slate-700">${item.color} | ${item.material}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between mt-auto">
                    
                    <div class="flex items-center bg-slate-50 rounded-full h-10 px-1 border border-slate-100">
                        <button onclick="updateItemQty(${index}, -1)" class="w-8 h-full flex items-center justify-center text-slate-500 hover:text-primary font-black transition-colors">-</button>
                        <input type="text" value="${item.qty}" readonly class="w-10 text-center font-bold text-sm text-slate-800 bg-transparent outline-none pointer-events-none">
                        <button onclick="updateItemQty(${index}, 1)" class="w-8 h-full flex items-center justify-center text-slate-500 hover:text-primary font-black transition-colors">+</button>
                    </div>

                    <div class="text-right">
                        <span class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">฿${rowTotal.toLocaleString()}</span>
                    </div>
                </div>

            </div>
        `;
        itemsWrapper.appendChild(itemCard);
    });

    cartContainer.appendChild(itemsWrapper);

    // Event เลือกทั้งหมด
    document.getElementById('select-all')?.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = isChecked;
            calculateMultiTotal(cb);
        });
        updateGrandTotal();
    });

    if(typeof lucide !== 'undefined') lucide.createIcons();
    updateGrandTotal(); 
}

// =========================================================
// 4. ฟังก์ชันคำนวณและควบคุมข้อมูล
// =========================================================

window.calculateMultiTotal = function(checkboxEl) {
    if (checkboxEl) {
        const card = checkboxEl.closest('.cart-item-card');
        const bar = card.querySelector('.indicator-bar');
        
        if (checkboxEl.checked) {
            // สไตล์ตอนถูกเลือก
            card.classList.replace('border-slate-200', 'border-primary');
            card.classList.add('ring-1', 'ring-primary/20');
            bar.classList.replace('bg-transparent', 'bg-primary');
        } else {
            // สไตล์ตอนไม่ถูกเลือก
            card.classList.replace('border-primary', 'border-slate-200');
            card.classList.remove('ring-1', 'ring-primary/20');
            bar.classList.replace('bg-primary', 'bg-transparent');
            
            const selectAll = document.getElementById('select-all');
            if(selectAll) selectAll.checked = false;
        }
    }
    updateGrandTotal();
}

window.updateItemQty = function(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        cart[index].qty = Math.max(1, Number(cart[index].qty) + change);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
        updateCartBadge();
    }
};

window.removeItem = function(index) {
    if (confirm('ยืนยันการลบสินค้านี้ออกจากตะกร้า?')) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
        updateCartBadge();
    }
};

window.updateGrandTotal = function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkboxes = document.querySelectorAll('.item-checkbox');
    let grandTotal = 0;
    let selectedCount = 0;
    
    checkboxes.forEach((cb) => {
        if (cb.checked) {
            const index = cb.getAttribute('data-index');
            if (cart[index]) {
                grandTotal += (Number(cart[index].price) * Number(cart[index].qty));
                selectedCount++;
            }
        }
    });

    const depositTotal = grandTotal * 0.5;

    document.getElementById('summary-count').innerText = selectedCount;
    document.getElementById('grand-total').innerText = `฿${grandTotal.toLocaleString()}`;
    
    let formattedDeposit = depositTotal % 1 === 0 
        ? depositTotal.toLocaleString() 
        : depositTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
    document.getElementById('deposit-total').innerText = `฿${formattedDeposit}`;
    
    const btn = document.getElementById('checkout-btn');
    if(btn) {
        btn.disabled = (selectedCount === 0);
    }

    localStorage.setItem('checkout_total', grandTotal);
};

// =========================================================
// 5. ส่งข้อมูลไปหน้า สรุปคำสั่งซื้อ (payment.html)
// =========================================================
window.handleCheckout = function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการก่อนดำเนินการ');
        return;
    }
    
    let selectedItems = [];
    checkboxes.forEach(cb => {
        const index = cb.getAttribute('data-index');
        const item = cart[index];
        if (item) {
            const qty = Number(item.qty || item.order_total_qty || 1);
            const unitPrice = Number(item.price || item.price_at_order || 0);
            const totalPrice = Number(item.total || item.order_total_price || (unitPrice * qty));
            selectedItems.push({
                ...item,
                cart_id: item.cart_id || Date.now(),
                model_id: item.model_id,
                model_name: item.name || item.model_name,
                name: item.name || item.model_name,
                selected_material: item.material || item.selected_material || 'PLA',
                material: item.material || item.selected_material || 'PLA',
                selected_color: item.color || item.selected_color || 'มาตรฐาน',
                color: item.color || item.selected_color || 'มาตรฐาน',
                selected_size: item.size || item.selected_size || 'มาตรฐาน',
                size: item.size || item.selected_size || 'มาตรฐาน',
                order_total_qty: qty,
                qty: qty,
                price_at_order: unitPrice,
                price: unitPrice,
                order_total_price: totalPrice,
                total: totalPrice,
                image: item.image || item.model_image || '',
                model_image: item.image || item.model_image || ''
            });
        }
    });
    
    // เซฟของที่เลือกลง LocalStorage แล้วเปลี่ยนหน้า
    localStorage.setItem('selected_for_checkout', JSON.stringify(selectedItems));
    window.location.href = 'payment.html'; 
};