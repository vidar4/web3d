
function parseAddressesSafe(addrData) {
    if (!addrData) return [];
    if (Array.isArray(addrData)) return addrData;
    if (typeof addrData === 'object') return [addrData];
    if (typeof addrData === 'string') {
        const trimmed = addrData.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
                if (parsed && typeof parsed === 'object') return [parsed];
            } catch(e) {}
        }
        return [{ id: Date.now(), addressNumber: 1, fullText: trimmed, isDefault: true }];
    }
    return [];
}
// ===========================================
// 1. Config & Supabase Setup
// ===========================================
const { createClient } = supabase;
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 

const db = createClient(supabaseUrl, supabaseKey);

window.pendingBills = [];

function getModelImageUrl(pathData) {
    if (!pathData || pathData === 'undefined' || pathData === 'null') return 'https://via.placeholder.com/150?text=No+Image';
    let path = pathData;
    try {
        if (typeof path === 'string' && path.startsWith('[')) path = JSON.parse(path)[0];
        else if (Array.isArray(path) && path.length > 0) path = path[0];
    } catch (e) {}
    if (!path || path === 'undefined') return 'https://via.placeholder.com/150?text=No+Image';
    const cleanPath = String(path).replace(/["']/g, '').trim();
    return `${supabaseUrl}/storage/v1/object/public/model_images/${cleanPath}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');

    if (userId && userName) {
        document.getElementById('welcome-user').innerText = userName;
    } else {
        alert('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        window.location.href = 'login.html'; 
        return;
    }

    await fetchPendingPayments(userId);
});

// ===========================================
// 2. Fetch Data & Render
// ===========================================
async function fetchPendingPayments(userId) {
    const container = document.getElementById('pending-payments-container');

    try {
        const { data: rawOrders, error } = await db
            .from('order_model')
            .select('*, model(*), member(user_name, user_phone, user_address)')
            .eq('user_id', userId)
            .in('order_status', ['รอชำระเงิน', 'รอการชำระเงิน'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const groupedOrders = {};
        
        rawOrders.forEach(order => {
            const timeKey = order.created_at.substring(0, 16); 
            
            if (!groupedOrders[timeKey]) {
                groupedOrders[timeKey] = {
                    mainOrderId: order.order_id, 
                    created_at: order.created_at,
                    total_price: 0,
                    allOrderIds: [],
                    shipping_address: order.shipping_address || null,
                    member: order.member,
                    items: []
                };
            }
            
            groupedOrders[timeKey].total_price += Number(order.order_total_price);
            groupedOrders[timeKey].allOrderIds.push(order.order_id);
            
            let modelData = Array.isArray(order.model) ? order.model[0] : (order.model || {});
            
            groupedOrders[timeKey].items.push({
                name: modelData.model_name || 'สินค้านี้ถูกลบ',
                image: getModelImageUrl(modelData.model_image_1),
                qty: order.order_total_qty,
                price: Number(order.order_total_price),
                color: order.selected_color || '-',
                material: order.selected_material || '-',
                size: (typeof order.selected_size === 'object' && order.selected_size !== null) ? order.selected_size.display : (order.selected_size || 'มาตรฐาน')
            });
        });

        window.pendingBills = Object.values(groupedOrders);

        const toPayBadge = document.getElementById('to-pay-badge-status');
        if (toPayBadge) {
            if (window.pendingBills.length > 0) {
                toPayBadge.innerText = window.pendingBills.length;
                toPayBadge.classList.remove('hidden');
            } else {
                toPayBadge.classList.add('hidden');
            }
        }

        if (window.pendingBills.length === 0) {
            container.innerHTML = `
                <div class="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm lg:col-span-12">
                    <i data-lucide="check-circle" class="w-16 h-16 text-emerald-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-bold text-slate-800 mb-2">ยอดเยี่ยม!</h3>
                    <p class="text-slate-500 font-medium mb-6">คุณไม่มีบิลที่ค้างชำระในขณะนี้</p>
                    <a href="index.html" class="bg-slate-100 text-slate-700 hover:bg-slate-200 px-8 py-3 rounded-xl font-bold transition-colors inline-block">กลับไปหน้าแรก</a>
                </div>
            `;
            document.querySelector('.lg\\:col-span-4').style.display = 'none';
            document.querySelector('.lg\\:col-span-8').classList.replace('lg:col-span-8', 'lg:col-span-12');
            lucide.createIcons();
            return;
        }

        container.innerHTML = ''; 
        
        window.pendingBills.forEach((bill, billIdx) => {
            let itemsHTML = '';
            bill.items.forEach((item, index) => {
                itemsHTML += `
                    <div class="flex items-center gap-4 py-4 ${index > 0 ? 'border-t border-slate-100' : ''}">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-slate-200 shadow-sm bg-white shrink-0" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-900 text-sm md:text-base mb-1 truncate">${item.name}</h4>
                            <p class="text-[11px] md:text-xs text-slate-500 mb-2">สี: ${item.color} | วัสดุ: ${item.material} | ขนาด: ${item.size}</p>
                            <div class="flex items-center justify-between">
                                <span class="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">จำนวน: ${item.qty} ชิ้น</span>
                                <span class="font-bold text-slate-700 text-sm">฿${item.price.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            let addressHTML = '<span class="text-red-500 text-sm">ไม่พบข้อมูลที่อยู่จัดส่ง</span>';
            if (bill.shipping_address) {
                try {
                    let addrObj = typeof bill.shipping_address === 'string' ? JSON.parse(bill.shipping_address) : bill.shipping_address;
                    let cName = addrObj.fullname || addrObj.fname + ' ' + addrObj.lname || 'ลูกค้า';
                    let cPhone = addrObj.phone || '-';
                    let typeBadge = addrObj.type ? `<span class="bg-blue-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100 ml-1">${addrObj.type}</span>` : '';
                    
                    addressHTML = `
                        <div class="flex items-center flex-wrap gap-2 mb-1.5">
                            <span class="font-bold text-slate-800 text-sm">${cName}</span>
                            <span class="text-slate-300 font-normal">|</span>
                            <span class="text-slate-600 font-bold text-sm">${cPhone}</span>
                            ${typeBadge}
                        </div>
                        <p class="text-xs text-slate-600 leading-relaxed">${addrObj.fullText || bill.shipping_address}</p>
                    `;
                } catch(e) { addressHTML = `<p class="text-xs text-slate-600">${bill.shipping_address}</p>`; }
            } else if (bill.member) {
                const member = bill.member;
                let custName = member.user_name || 'ลูกค้าทั่วไป';
                let custPhone = member.user_phone || '-';
                if (member.user_address) {
                    try {
                        let addrArray = parseAddressesSafe(member.user_address);
                        if (Array.isArray(addrArray) && addrArray.length > 0) {
                            let defAddr = addrArray.find(a => a.isDefault) || addrArray[0];
                            custName = defAddr.fullname || defAddr.fname + ' ' + defAddr.lname || custName;
                            custPhone = defAddr.phone || custPhone;
                            let typeBadge = defAddr.type ? `<span class="bg-blue-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100 ml-1">${defAddr.type}</span>` : '';
                            
                            addressHTML = `
                                <div class="flex items-center flex-wrap gap-2 mb-1.5">
                                    <span class="font-bold text-slate-800 text-sm">${custName}</span>
                                    <span class="text-slate-300 font-normal">|</span>
                                    <span class="text-slate-600 font-bold text-sm">${custPhone}</span>
                                    ${typeBadge}
                                </div>
                                <p class="text-xs text-slate-600 leading-relaxed">${defAddr.fullText}</p>
                            `;
                        }
                    } catch(e) {}
                }
            }

            const billCard = document.createElement('div');
            const isChecked = billIdx === 0 ? 'checked' : ''; 
            const borderClass = billIdx === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200';

            billCard.className = `bill-card bg-white rounded-2xl shadow-sm border ${borderClass} overflow-hidden relative transition-all`;
            
            billCard.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                <div class="p-5 md:p-6 pl-7 md:pl-8">
                    
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <label class="flex items-center gap-3 cursor-pointer group w-full sm:w-auto">
                            <input type="checkbox" class="bill-checkbox w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer" value="${bill.mainOrderId}" ${isChecked} onchange="calculateMultiTotal(this)">
                            <span class="text-sm font-bold text-slate-700 uppercase tracking-wider">รหัสบิล: #${bill.mainOrderId}</span>
                        </label>
                        <div class="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i> รอชำระเงิน
                        </div>
                    </div>

                    <div class="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="map-pin" class="w-4 h-4 text-primary"></i>
                            <span class="font-bold text-slate-700 text-sm">ที่อยู่จัดส่ง</span>
                        </div>
                        ${addressHTML}
                    </div>

                    <div class="bg-white border border-slate-100 rounded-xl px-4 py-1 mb-4 shadow-sm">
                        ${itemsHTML}
                    </div>

                    <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center pt-4 border-t border-slate-100 gap-4">
                        <button type="button" onclick='cancelOrder("${bill.mainOrderId}", ${JSON.stringify(bill.allOrderIds)})' class="w-full sm:w-auto text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 px-4 py-2.5 rounded-xl border border-red-100 transition flex items-center justify-center gap-1.5 active:scale-95">
                            <i data-lucide="x-circle" class="w-4 h-4"></i> ยกเลิกคำสั่งซื้อนี้
                        </button>
                        <div class="text-right w-full sm:w-auto">
                            <span class="text-slate-500 font-bold text-sm">ยอดรวมบิลนี้</span>
                            <span class="text-xl font-black text-primary tracking-tight ml-2">฿${bill.total_price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(billCard);
        });

        lucide.createIcons();
        calculateMultiTotal(); 
    } catch (err) {
        console.error("Fetch Error:", err);
        container.innerHTML = `<div class="text-center py-10 text-red-500 font-medium">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
}

// ===========================================
// 3. ระบบคำนวณยอดรวม (Multi-Select)
// ===========================================
window.calculateMultiTotal = function(checkboxEl) {
    if (checkboxEl) {
        const card = checkboxEl.closest('.bill-card');
        if (checkboxEl.checked) {
            card.classList.replace('border-slate-200', 'border-primary');
            card.classList.add('ring-2', 'ring-primary/20');
        } else {
            card.classList.replace('border-primary', 'border-slate-200');
            card.classList.remove('ring-2', 'ring-primary/20');
        }
    }

    const checkboxes = document.querySelectorAll('.bill-checkbox:checked');
    let count = 0;
    let total = 0;

    checkboxes.forEach(cb => {
        const billId = cb.value;
        const bill = window.pendingBills.find(b => String(b.mainOrderId) === String(billId));
        if(bill) {
            count++;
            total += bill.total_price;
        }
    });

    document.getElementById('summary-count').innerText = count;
    document.getElementById('summary-subtotal').innerText = '฿' + total.toLocaleString();
    
    const deposit = total * 0.5;
    let formattedDeposit = deposit % 1 === 0 
        ? deposit.toLocaleString() 
        : deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
    document.getElementById('summary-deposit').innerText = '฿' + formattedDeposit;

    // 💡 เปิด/ปิด ปุ่มชำระเงิน และ ปุ่มยกเลิกทั้งหมด
    const btnPay = document.getElementById('btn-pay-multi');
    const btnCancel = document.getElementById('btn-cancel-multi');
    
    if(count > 0) {
        if(btnPay) btnPay.disabled = false;
        if(btnCancel) btnCancel.disabled = false;
    } else {
        if(btnPay) btnPay.disabled = true;
        if(btnCancel) btnCancel.disabled = true;
    }
}

// ===========================================
// 4. นำทางไปหน้าชำระเงิน (ส่งหลายบิล)
// ===========================================
window.proceedToMultiPayment = function() {
    const checkboxes = document.querySelectorAll('.bill-checkbox:checked');
    let ids = [];
    checkboxes.forEach(cb => ids.push(cb.value));
    
    if(ids.length > 0) {
        window.location.href = `pay-deposit.html?bills=${ids.join(',')}`;
    }
}

// ===========================================
// 5. ระบบยกเลิกคำสั่งซื้อ (Cancel Order)
// ===========================================
window.cancelOrder = async function(mainOrderId, allOrderIds) {
    if (!confirm(`⚠️ ยืนยันการยกเลิกคำสั่งซื้อรหัส #${mainOrderId}?\n(หากยกเลิกแล้วจะไม่สามารถกู้คืนได้)`)) {
        return;
    }

    try {
        const { error } = await db.from('order_model')
            .update({ order_status: 'ยกเลิกคำสั่งซื้อ' })
            .in('order_id', allOrderIds);

        if (error) throw error;

        alert('✅ ยกเลิกคำสั่งซื้อรหัส #' + mainOrderId + ' สำเร็จแล้ว');
        window.location.reload();
    } catch (err) {
        console.error("Cancel Order Error:", err);
        alert('❌ เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
    }
};

// 💡 ฟังก์ชันใหม่: ยกเลิกหลายบิลพร้อมกัน (Bulk Cancel)
window.cancelMultiOrders = async function() {
    const checkboxes = document.querySelectorAll('.bill-checkbox:checked');
    if (checkboxes.length === 0) return;

    if (!confirm(`⚠️ ยืนยันการยกเลิกคำสั่งซื้อที่เลือกทั้งหมด (${checkboxes.length} บิล)?\n(หากยกเลิกแล้วจะไม่สามารถกู้คืนได้)`)) {
        return;
    }

    let allIdsToCancel = [];
    checkboxes.forEach(cb => {
        const billId = cb.value;
        const bill = window.pendingBills.find(b => String(b.mainOrderId) === String(billId));
        if (bill && bill.allOrderIds) {
            allIdsToCancel = allIdsToCancel.concat(bill.allOrderIds);
        }
    });

    if (allIdsToCancel.length === 0) return;

    const btn = document.getElementById('btn-cancel-multi');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> กำลังยกเลิก...';
    btn.disabled = true;
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const { error } = await db.from('order_model')
            .update({ order_status: 'ยกเลิกคำสั่งซื้อ' })
            .in('order_id', allIdsToCancel);

        if (error) throw error;

        alert(`✅ ยกเลิกคำสั่งซื้อที่เลือกทั้งหมดสำเร็จแล้ว`);
        window.location.reload();
    } catch (err) {
        console.error("Cancel Multi Order Error:", err);
        alert('❌ เกิดข้อผิดพลาดในการยกเลิก: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};