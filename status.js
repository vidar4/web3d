// ===========================================
// 1. Config & Supabase Setup
// ===========================================
const { createClient } = supabase;
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 

const db = createClient(supabaseUrl, supabaseKey);

// ===========================================
// 2. Helper: URL รูปภาพ
// ===========================================
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

// ===========================================
// 3. Init
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');

    if (userId && userName) {
        document.getElementById('welcome-user').innerText = userName;
    } else {
        alert('กรุณาเข้าสู่ระบบเพื่อดูสถานะการสั่งซื้อ');
        window.location.href = 'login.html'; 
        return;
    }

    await fetchOrders(userId);
});

// ===========================================
// 4. Fetch Data & Render
// ===========================================
async function fetchOrders(userId) {
    const container = document.getElementById('orders-container');
    const countEl = document.getElementById('total-orders-count');

    try {
        const { data: rawOrders, error } = await db
            .from('order_model')
            .select('*, model(*), member(user_name, user_phone, user_address)')
            .eq('user_id', userId)
            .neq('order_status', 'ให้คะแนนแล้ว') 
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const groupedOrders = {};
        
        rawOrders.forEach(order => {
            const timeKey = order.created_at.substring(0, 16); 
            
            if (!groupedOrders[timeKey]) {
                groupedOrders[timeKey] = {
                    mainOrderId: order.order_id, 
                    created_at: order.created_at,
                    order_status: order.order_status,
                    total_price: 0,
                    shipping_address: order.shipping_address || null, // 💡 ดึงที่อยู่ของออเดอร์โดยตรง
                    member: order.member, 
                    items: []
                };
            }
            
            groupedOrders[timeKey].total_price += Number(order.order_total_price);
            
            let modelData = Array.isArray(order.model) ? order.model[0] : (order.model || {});
            groupedOrders[timeKey].items.push({
                name: modelData.model_name || 'สินค้านี้ถูกลบ',
                image: getModelImageUrl(modelData.model_image_1),
                qty: order.order_total_qty,
                color: order.selected_color || '-',
                material: order.selected_material || '-',
                size: (typeof order.selected_size === 'object' && order.selected_size !== null) ? order.selected_size.display : (order.selected_size || 'มาตรฐาน')
            });
            
            // 💡 อัปเดตสถานะเพิ่มเติมให้รองรับสถานะยกเลิก
            if (order.order_status === 'ไม่อนุมัติ') {
                groupedOrders[timeKey].order_status = 'ไม่อนุมัติ';
            } else if (order.order_status === 'รอชำระเงิน' || order.order_status === 'รอการชำระเงิน') {
                groupedOrders[timeKey].order_status = 'รอชำระเงิน';
            } else if (order.order_status === 'ยกเลิกคำสั่งซื้อ') {
                groupedOrders[timeKey].order_status = 'ยกเลิกคำสั่งซื้อ';
            }
        });

        const finalOrders = Object.values(groupedOrders);
        
        if(countEl) countEl.innerText = finalOrders.length;

        const pendingPaymentBills = finalOrders.filter(bill => bill.order_status === 'รอชำระเงิน').length;
        const toPayBadge = document.getElementById('to-pay-badge-status');
        if (toPayBadge) {
            if (pendingPaymentBills > 0) {
                toPayBadge.innerText = pendingPaymentBills;
                toPayBadge.classList.remove('hidden');
            } else {
                toPayBadge.classList.add('hidden');
            }
        }

        if (finalOrders.length === 0) {
            container.innerHTML = `
                <div class="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <i data-lucide="package-check" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                    <p class="text-slate-500 font-medium mb-4 text-lg">ไม่มีรายการสั่งซื้อที่กำลังดำเนินการ</p>
                    <a href="index.html" class="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 inline-block">ไปเลือกซื้อสินค้าต่อเลย</a>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = ''; 
        
        finalOrders.forEach(bill => {
            const orderDate = new Date(bill.created_at).toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            const stepperHTML = generateStepper(bill.order_status, bill.mainOrderId);
            // 💡 เพิ่มการตรวจสอบสถานะ "ยกเลิก"
            const isRejected = bill.order_status === 'ไม่อนุมัติ' || bill.order_status === 'ยกเลิกคำสั่งซื้อ';
            const cardBg = isRejected ? 'bg-red-50/30' : 'bg-white';
            const borderCol = isRejected ? 'border-red-200' : 'border-slate-100';

            // 💡 จัดการข้อมูลที่อยู่ (อ่านจาก shipping_address ของออเดอร์ก่อน)
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
                } catch(e) {
                    addressHTML = `<p class="text-xs text-slate-600">${bill.shipping_address}</p>`;
                }
            } 
            else if (bill.member) {
                // ถ้าออเดอร์เก่าๆ ไม่มี shipping_address ดึง Default มาโชว์
                const member = bill.member;
                let custName = member.user_name || 'ลูกค้าทั่วไป';
                let custPhone = member.user_phone || '-';
                
                if (member.user_address) {
                    try {
                        let addrArray = JSON.parse(member.user_address);
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
                        } else {
                            addressHTML = `<p class="text-xs text-slate-600">${member.user_address}</p>`;
                        }
                    } catch(e) {
                        addressHTML = `<p class="text-xs text-slate-600">${member.user_address}</p>`;
                    }
                }
            }

            let itemsHTML = '';
            bill.items.forEach((item, index) => {
                itemsHTML += `
                    <div class="flex items-center gap-4 ${index > 0 ? 'mt-4 pt-4 border-t border-slate-100/50' : ''}">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl shadow-sm bg-white" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-900 text-sm md:text-base mb-1 truncate">${item.name}</h4>
                            <p class="text-xs text-slate-500 mb-1">สี: ${item.color} | วัสดุ: ${item.material} | ไซส์: ${item.size}</p>
                            <span class="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-md">จำนวน: ${item.qty} ชิ้น</span>
                        </div>
                    </div>
                `;
            });

            const orderCard = document.createElement('div');
            // 💡 ถ้าเป็นบิลยกเลิก ให้โชว์เป็นสีเทาจางๆ
            orderCard.className = `${cardBg} p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border ${borderCol} mb-6 relative overflow-hidden transition-colors max-w-full ${isRejected ? 'opacity-60 grayscale-[0.8]' : ''}`;

            orderCard.innerHTML = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
                    <div>
                        <span class="text-slate-500 text-sm font-medium">รหัสอ้างอิงบิล:</span>
                        <span class="font-bold text-slate-900 text-lg ml-1">#${bill.mainOrderId}</span>
                        <span class="ml-2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">${bill.items.length} รายการ</span>
                    </div>
                    <div class="text-sm text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <i data-lucide="calendar" class="w-4 h-4"></i> ${orderDate}
                    </div>
                </div>

                <div class="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="map-pin" class="w-4 h-4 text-primary"></i>
                        <span class="font-bold text-slate-700 text-sm">ที่อยู่จัดส่ง</span>
                    </div>
                    ${addressHTML}
                </div>

                <div class="mb-8 bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
                    <div class="mb-5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        ${itemsHTML}
                    </div>

                    <div class="flex justify-between items-center w-full pt-4 border-t border-slate-200">
                        <span class="text-sm font-bold text-slate-700">ยอดรวมทั้งบิล:</span>
                        <span class="text-primary font-black text-xl md:text-2xl ${isRejected ? 'line-through text-slate-400' : ''}">${bill.total_price > 0 ? '฿' + bill.total_price.toLocaleString() : 'รอประเมินราคา'}</span>
                    </div>
                </div>

                <div class="w-full overflow-x-auto hide-scrollbar pb-4 pt-2 -mx-2 px-2 sm:mx-0 sm:px-0">
                    <div class="min-w-[480px] sm:min-w-[560px] md:min-w-full relative">
                        ${stepperHTML}
                    </div>
                </div>
            `;
            container.appendChild(orderCard);
        });
        lucide.createIcons();
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

// ===========================================
// 5. Progress Stepper Logic
// ===========================================
function generateStepper(currentStatus, orderId) {
    const steps = [
        { label: 'ส่งคำขอสั่งซื้อ', icon: 'file-text' },
        { label: 'ตรวจสอบ/ชำระเงิน', icon: 'wallet' },
        { label: 'กำลังผลิต', icon: 'cog' }, 
        { label: 'จัดส่งแล้ว', icon: 'package', btnText: 'ยอมรับโมเดล' },
        { label: 'เสร็จสิ้น', icon: 'star', btnText: 'ให้คะแนน' }
    ];

    let currentIdx = 0;
    let isRejected = false;
    let isPendingPayment = false;

    // 💡 รองรับสถานะ "ยกเลิกคำสั่งซื้อ"
    if (currentStatus === 'รอตรวจสอบ' || currentStatus === 'pending' || currentStatus === 'รอการอนุมัติ' || currentStatus === 'รอชำระเงิน' || currentStatus === 'รอการชำระเงิน') {
        currentIdx = 1;
        isPendingPayment = true; 

        if (currentStatus === 'รอตรวจสอบ') {
            steps[1].label = 'กำลังตรวจสอบ<br>การชำระเงิน';
            steps[1].icon = 'search';
        } else {
            steps[1].label = 'รอชำระเงิน<br>มัดจำ';
            steps[1].icon = 'wallet';
        }
    }
    else if (currentStatus === 'กำลังผลิต' || currentStatus === 'ผลิตโมเดล') {
        currentIdx = 2;
    }
    else if (currentStatus.includes('จัดส่งแล้ว') || currentStatus === 'รอการยอมรับ') {
        currentIdx = 3;
    }
    else if (currentStatus === 'เสร็จสิ้น') {
        currentIdx = 4;
    }
    // 💡 เพิ่มตรงนี้
    else if (currentStatus === 'ไม่อนุมัติ' || currentStatus === 'ยกเลิกคำสั่งซื้อ') {
        currentIdx = 1;
        isRejected = true;
        steps[1].label = currentStatus === 'ไม่อนุมัติ' ? 'ถูกปฏิเสธ' : 'ยกเลิกแล้ว';
        steps[1].icon = 'x-circle';
    }

    let html = `<div class="flex items-start justify-between relative z-10 w-full px-4 md:px-8">`;

    steps.forEach((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isFuture = idx > currentIdx;

        let bgColor = '';
        let borderCol = '';
        let iconColor = '';
        let textColor = '';

        if (isRejected && isActive) {
            bgColor = 'bg-red-500'; borderCol = 'border-4 border-red-200';
            iconColor = 'text-white'; textColor = 'text-red-600 font-extrabold';
        } else if (isPendingPayment && isActive) {
            bgColor = 'bg-amber-400'; borderCol = 'border-4 border-amber-100';
            iconColor = 'text-white'; textColor = 'text-amber-600 font-extrabold';
        } else if (isCompleted || isActive) {
            bgColor = 'bg-primary'; borderCol = 'border-4 border-primary';
            iconColor = 'text-white'; textColor = isActive ? 'text-primary font-bold' : 'text-slate-700 font-medium';
        } else {
            bgColor = 'bg-white'; borderCol = 'border-4 border-slate-200';
            iconColor = 'text-slate-300'; textColor = 'text-slate-400';
        }

        let buttonHTML = '';
        if (step.btnText && isActive && !isRejected && !isPendingPayment) {
            const btnColor = idx === 3 ? 'bg-[#84D857] hover:bg-[#72c249]' : 'bg-[#FBE07A] hover:bg-[#eed060] text-slate-800';
            buttonHTML = `<button onclick="handleOrderAction('${step.btnText}', ${orderId})" 
                            class="mt-3 text-[11px] md:text-sm px-4 py-2 rounded-lg font-bold w-full max-w-[120px] text-white shadow-sm ${btnColor} transition-transform active:scale-95">
                            ${step.btnText}
                          </button>`;
        }

        html += `
            <div class="flex flex-col items-center w-1/5 relative text-center">
                <div class="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full ${bgColor} ${borderCol} z-10 transition-colors shadow-sm">
                    <i data-lucide="${step.icon}" class="w-5 h-5 md:w-6 md:h-6 ${iconColor}"></i>
                </div>
                <div class="mt-3 h-10 flex items-start justify-center">
                    <span class="text-[10px] sm:text-[11px] md:text-sm ${textColor} leading-tight break-words max-w-[85px] sm:max-w-[100px] block">${step.label}</span>
                </div>
                ${buttonHTML}
            </div>
        `;
    });

    html += `</div>`;
    
    const progressWidth = (currentIdx / (steps.length - 1)) * 100;
    
    let barColor = 'bg-primary';
    if (isRejected) barColor = 'bg-red-200';
    if (isPendingPayment) barColor = 'bg-amber-400';

    html += `<div class="absolute top-6 md:top-7 left-[10%] right-[10%] h-1.5 md:h-2 bg-slate-200 rounded-full z-0 -translate-y-1/2">
                <div class="h-full ${barColor} rounded-full transition-all duration-700 ease-out" style="width: ${progressWidth}%"></div>
            </div>`;

    return html;
}

// 6. Action Handlers
window.acceptModel = async function(orderId) {
    const { data: targetOrder, error: fetchErr } = await db
        .from('order_model')
        .select('order_id, user_id, created_at, order_status')
        .eq('order_id', orderId)
        .single();
    if (fetchErr) throw fetchErr;

    if (targetOrder && targetOrder.created_at) {
        const { data: userOrders, error: listErr } = await db
            .from('order_model')
            .select('order_id, created_at, order_status')
            .eq('user_id', targetOrder.user_id);
        if (listErr) throw listErr;

        const targetMinute = targetOrder.created_at.substring(0, 16);
        const groupOrderIds = (userOrders || [])
            .filter(o => o.created_at && (o.created_at.substring(0, 16) === targetMinute || o.created_at === targetOrder.created_at) && o.order_status === 'จัดส่งแล้ว')
            .map(o => o.order_id);

        if (groupOrderIds.length > 0) {
            const { error: updateErr } = await db
                .from('order_model')
                .update({ order_status: 'เสร็จสิ้น' })
                .in('order_id', groupOrderIds);
            if (updateErr) throw updateErr;
            return groupOrderIds;
        }
    }

    const { error: fallbackErr } = await db
        .from('order_model')
        .update({ order_status: 'เสร็จสิ้น' })
        .eq('order_id', orderId);
    if (fallbackErr) throw fallbackErr;
    return [orderId];
};

window.handleOrderAction = async function(action, orderId) {
    if (action === 'ให้คะแนน') {
        window.location.href = `rate.html?id=${orderId}`;
        return;
    }
    
    const msg = action === 'ยอมรับโมเดล' ? 'คุณต้องการยืนยันการรับโมเดลใช่หรือไม่?' : 'ยืนยันสถานะนี้หรือไม่?';
    if (!confirm(msg)) return;
    
    try {
        if (action === 'ยอมรับโมเดล') {
            await window.acceptModel(orderId);
            alert('ยืนยันการรับสินค้าสำเร็จ! กรุณาให้คะแนนเพื่อเสร็จสิ้นกระบวนการ');
            location.reload(); 
        }
    } catch (err) { alert(err.message); }
};