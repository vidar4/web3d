// ==========================================
// 1. ตั้งค่า Supabase & Variables
// ==========================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const userId = localStorage.getItem('user_id');
const userName = localStorage.getItem('user_name');
let cartItems = [];
let userAddresses = [];
let selectedAddressId = null; // ล็อก ID ที่อยู่ที่จะใช้

document.addEventListener('DOMContentLoaded', async () => {
    if (!userId) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('welcomeUser').innerText = userName || 'ผู้ใช้';
    
    loadCart();
    await fetchAddresses();
});

// ==========================================
// 2. โหลดข้อมูลสินค้าจากตระกร้า
// ==========================================
function loadCart() {
    const selectedData = localStorage.getItem('selected_for_checkout');
    if (selectedData) {
        try {
            const parsed = JSON.parse(selectedData);
            if (Array.isArray(parsed) && parsed.length > 0) cartItems = parsed;
        } catch (e) {
            console.error("Parse selected_for_checkout error", e);
        }
    }
    if (cartItems.length === 0) {
        cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    }
    
    if (cartItems.length === 0) {
        alert("ไม่มีสินค้าในตะกร้า");
        window.location.href = 'cart.html';
        return;
    }

    const container = document.getElementById('checkout-items');
    let totalQty = 0;
    let totalPrice = 0;
    let html = '';

    cartItems.forEach(item => {
        const itemQty = parseInt(item.qty || item.order_total_qty || 1);
        const itemTotal = parseInt(item.total || item.order_total_price || ((item.price || item.price_at_order || 0) * itemQty));
        const itemName = item.name || item.model_name || 'สินค้า 3D';
        const itemImage = item.image || item.model_image || '';
        const itemColor = item.color || item.selected_color || '-';
        const itemMaterial = item.material || item.selected_material || '-';
        const itemSize = item.size || item.selected_size || '-';

        totalQty += itemQty;
        totalPrice += itemTotal;

        html += `
            <div class="flex gap-4 items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <img src="${itemImage}" class="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-white shadow-sm shrink-0">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-slate-800 truncate mb-1">${itemName}</h3>
                    <p class="text-xs text-slate-500 mb-1">สี: ${itemColor} | วัสดุ: ${itemMaterial}</p>
                    <p class="text-[11px] text-slate-400 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">${itemSize}</p>
                </div>
                <div class="text-right shrink-0">
                    <p class="font-black text-primary text-lg">฿${itemTotal.toLocaleString()}</p>
                    <p class="text-xs font-bold text-slate-400">x${itemQty} ชิ้น</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // อัปเดต Summary
    document.getElementById('summary-qty').innerText = totalQty;
    document.getElementById('summary-subtotal').innerText = `฿${totalPrice.toLocaleString()}`;
    document.getElementById('summary-total').innerText = `฿${totalPrice.toLocaleString()}`;
    
    lucide.createIcons();
}

// ==========================================
// 3. โหลดข้อมูลที่อยู่จัดส่ง
function parseAddressesSafe(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return [raw];
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch(e) {}
        }
        return [{
            id: 'legacy_1',
            title: 'ที่อยู่ปัจจุบัน',
            fullname: localStorage.getItem('user_name') || 'ผู้สั่งซื้อ',
            phone: localStorage.getItem('user_phone') || '',
            fullText: trimmed,
            isDefault: true
        }];
    }
    return [];
}

// ==========================================
async function fetchAddresses() {
    const displayContainer = document.getElementById('address-display');
    
    try {
        const { data, error } = await db.from('member').select('user_address').eq('user_id', userId).single();
        if (error) throw error;

        if (data && data.user_address) {
            userAddresses = parseAddressesSafe(data.user_address);
            
            if (userAddresses.length > 0) {
                // เลือกที่อยู่ Default เป็นอันดับแรก ถ้าไม่มีก็เอาอันแรกสุด
                let defAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
                selectAddress(defAddr.id); // ตั้งค่าให้แสดงผลบนหน้าจอ
            } else {
                showEmptyAddress(displayContainer);
            }
        } else {
            showEmptyAddress(displayContainer);
        }
    } catch(e) {
        console.error("Fetch Address Error", e);
        showEmptyAddress(displayContainer);
    }
}

function showEmptyAddress(container) {
    container.innerHTML = `
        <div class="text-center py-4">
            <i data-lucide="map-pin" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
            <p class="text-slate-500 font-medium mb-3">คุณยังไม่ได้เพิ่มที่อยู่จัดส่ง</p>
            <button onclick="window.location.href='profile.html'" class="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primaryHover transition">เพิ่มที่อยู่ใหม่</button>
        </div>
    `;
    lucide.createIcons();
}

// ==========================================
// 4. จัดการ Modal เลือกที่อยู่
// ==========================================
function openAddressModal() {
    if (userAddresses.length === 0) {
        window.location.href = 'profile.html';
        return;
    }

    const listContainer = document.getElementById('address-modal-list');
    let html = '';

    userAddresses.forEach(addr => {
        const isSelected = String(addr.id) === String(selectedAddressId);
        const nameDisplay = addr.fullname || (addr.fname && addr.lname ? `${addr.fname} ${addr.lname}` : 'ไม่ระบุชื่อ');
        const phoneDisplay = addr.phone || 'ไม่ระบุเบอร์';
        const typeBadge = addr.type ? `<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">${addr.type}</span>` : '';
        const safeAddrId = String(addr.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        html += `
            <div onclick="selectAddress('${safeAddrId}'); closeAddressModal();" class="p-4 border-2 rounded-2xl mb-3 cursor-pointer transition-all relative overflow-hidden group ${isSelected ? 'border-primary bg-blue-50/30 shadow-md' : 'border-slate-200 hover:border-blue-300'}">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-blue-500'}"></i>
                        <span class="font-bold text-slate-800 text-sm">ที่อยู่ ${addr.addressNumber || ''}</span>
                        ${typeBadge}
                    </div>
                    ${isSelected ? '<i data-lucide="check-circle-2" class="w-5 h-5 text-primary"></i>' : ''}
                </div>
                <div class="pl-7">
                    <p class="text-slate-800 font-bold text-sm mb-1">${nameDisplay} <span class="text-slate-300 mx-1">|</span> <span class="text-slate-600">${phoneDisplay}</span></p>
                    <p class="text-slate-500 text-xs leading-relaxed">${addr.fullText}</p>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    lucide.createIcons();

    const modal = document.getElementById('addressModal');
    const box = document.getElementById('addressModalBox');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);
}

function closeAddressModal() {
    const modal = document.getElementById('addressModal');
    const box = document.getElementById('addressModalBox');
    modal.classList.add('opacity-0'); box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function selectAddress(id) {
    selectedAddressId = id;
    const addr = userAddresses.find(a => String(a.id) === String(id));
    const displayContainer = document.getElementById('address-display');

    if (!addr) return;

    const nameDisplay = addr.fullname || (addr.fname && addr.lname ? `${addr.fname} ${addr.lname}` : 'ไม่ระบุชื่อ');
    const typeBadge = addr.type ? `<span class="bg-white text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">${addr.type}</span>` : '';

    displayContainer.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="mt-1 bg-white p-2 rounded-full shadow-sm shrink-0 text-primary border border-slate-100">
                <i data-lucide="map-pin" class="w-5 h-5"></i>
            </div>
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-slate-800">${nameDisplay}</span>
                    <span class="text-slate-400 font-bold">|</span>
                    <span class="font-bold text-slate-600">${addr.phone || '-'}</span>
                    ${typeBadge}
                </div>
                <p class="text-slate-500 text-sm leading-relaxed">${addr.fullText}</p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// ==========================================
// 5. ระบบบันทึกคำสั่งซื้อลง Database
// ==========================================
async function submitOrder() {
    if (cartItems.length === 0) return alert("ไม่มีสินค้าในตะกร้า");
    if (!selectedAddressId) return alert("กรุณาเลือกหรือเพิ่มที่อยู่จัดส่งก่อนสั่งซื้อครับ");

    const btn = document.getElementById('btn-submit-order');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="animate-spin w-5 h-5" data-lucide="loader-2"></i> กำลังส่งคำขอ...';
    lucide.createIcons();

    try {
        // 💡 ดึงข้อมูล Object ของที่อยู่ที่ลูกค้าเลือก เพื่อบันทึกลง Database
        const selectedAddressData = userAddresses.find(a => String(a.id) === String(selectedAddressId));

        // วนลูปเตรียมข้อมูลสินค้าทุกชิ้นในตะกร้า
        const orderInserts = cartItems.map(item => {
            const qty = parseInt(item.qty || item.order_total_qty || 1);
            const total = parseInt(item.total || item.order_total_price || ((item.price || item.price_at_order || 0) * qty));
            const unitPrice = item.price_at_order !== undefined ? parseInt(item.price_at_order) : Math.round(total / qty);
            return {
                user_id: userId,
                model_id: item.model_id,
                selected_color: item.color || item.selected_color || '-',
                selected_material: item.material || item.selected_material || '-',
                selected_size: item.size || item.selected_size || '-',
                order_total_qty: qty,
                price_at_order: unitPrice,
                order_total_price: total,
                order_status: 'รอการอนุมัติ',
                shipping_address: JSON.stringify(selectedAddressData)
            };
        });

        // ยิงข้อมูลเข้าตาราง order_model รวดเดียว
        const { error } = await db.from('order_model').insert(orderInserts);
        if (error) throw error;

        // Selective cart cleanup: ลบเฉพาะสินค้าที่สั่งซื้อ และลบ selected_for_checkout
        let currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItems.forEach(purchased => {
            const idx = currentCart.findIndex(item => {
                if (purchased.cart_id && item.cart_id) {
                    return item.cart_id === purchased.cart_id;
                }
                return item.model_id === purchased.model_id &&
                       (item.color || item.selected_color) === (purchased.color || purchased.selected_color) &&
                       (item.material || item.selected_material) === (purchased.material || purchased.selected_material) &&
                       (item.size || item.selected_size) === (purchased.size || purchased.selected_size);
            });
            if (idx !== -1) {
                currentCart.splice(idx, 1);
            }
        });
        localStorage.setItem('cart', JSON.stringify(currentCart));
        localStorage.removeItem('selected_for_checkout');

        // แจ้งเตือนลูกค้าแบบสวยงามแล้วโยนไปหน้าสถานะ
        btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> ส่งคำขอสำเร็จ!';
        btn.classList.replace('bg-primary', 'bg-emerald-500');
        btn.classList.replace('hover:bg-primaryHover', 'hover:bg-emerald-600');
        lucide.createIcons();

        setTimeout(() => {
            alert('✅ ส่งคำขอสั่งซื้อเรียบร้อยแล้ว กรุณารอแอดมินยืนยันรายการครับ');
            window.location.href = 'status.html';
        }, 800);

    } catch (err) {
        console.error("Submit Order Error:", err);
        alert('❌ เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
        btn.disabled = false;
        btn.innerHTML = originalText;
        lucide.createIcons();
    }
}