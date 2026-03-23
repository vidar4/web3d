// =========================================================
// 1. Config Supabase
// =========================================================
const { createClient } = supabase;
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 
const db = createClient(supabaseUrl, supabaseKey);

// =========================================================
// 2. Helper Functions
// =========================================================
function extractFilename(pathData) {
    if (!pathData || pathData === 'null' || pathData === '[]' || pathData === '""' || pathData === '') return null;
    let path = pathData;
    try {
        if (typeof path === 'string' && path.startsWith('[')) path = JSON.parse(path)[0];
        else if (Array.isArray(path) && path.length > 0) path = path[0];
    } catch(e){}
    if (!path || typeof path !== 'string') return null;
    return path.replace(/["'\[\]\\]/g, '').trim();
}

function getModelImageUrl(pathData) {
    const filename = extractFilename(pathData);
    if (!filename) return 'https://placehold.co/150x150/f8fafc/94a3b8?text=No+Image';
    if (filename.startsWith('http')) return filename;
    return `${supabaseUrl}/storage/v1/object/public/model_images/${filename}`;
}

function getSlipPublicUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace('payment_slips/', ''); 
    return `${supabaseUrl}/storage/v1/object/public/payment_slips/${cleanPath}`;
}

async function uploadSingleImage(file) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const fileName = `model-${Date.now()}-${Math.floor(Math.random()*10000)}.${ext}`;
    const { error } = await db.storage.from('model_images').upload(fileName, file);
    if (error) throw error;
    return fileName;
}

// =========================================================
// 3. Init & Menu Switch
// =========================================================
let allOrdersData = [];
window.currentOrderFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') { window.location.href = 'login.html'; return; }
    
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.innerText = localStorage.getItem('user_name') || 'Admin';
    
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(confirm('ออกจากระบบใช่หรือไม่?')) { localStorage.clear(); window.location.href='login.html'; }
        });
    });

    showSection('overview');
});

window.showSection = function(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    
    const targetSection = document.getElementById(sectionId);
    if(targetSection) targetSection.style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.remove('active', 'text-primary');
        if(item.getAttribute('data-target') === sectionId) item.classList.add('active', 'text-primary');
    });

    document.querySelectorAll('.menu-item-mobile').forEach(item => {
        item.classList.remove('bg-primary', 'text-white', 'shadow-md', 'active');
        item.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
        if(item.getAttribute('data-target') === sectionId) {
            item.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
            item.classList.add('bg-primary', 'text-white', 'shadow-md', 'active');
        }
    });

    if (sectionId === 'overview') loadOrderList();
    if (sectionId === 'edit-model') loadModelList();
    if (sectionId === 'view-reviews') loadAdminReviews(); 
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.setOrderFilter = function(filter, btnEl) {
    window.currentOrderFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');
    renderOrderTable(); 
}

// =========================================================
// 4. Order Logic (แบบรวบบิล)
// =========================================================
async function loadOrderList() {
    const tbody = document.getElementById('orderBillsContainer');
    tbody.innerHTML = '<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary"></i> กำลังโหลดข้อมูล...</div>';
    lucide.createIcons();

    try {
        const { data: orders, error } = await db
            .from('order_model')
            .select(`*, model ( model_name, model_image_1 ), deposit_payment (*), member ( user_name, user_address, user_phone )`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        allOrdersData = orders;
        
        document.getElementById('stTotal').innerText = orders.length;
        document.getElementById('stNew').innerText = orders.filter(o => o.order_status === 'รอการอนุมัติ' || o.order_status === 'pending').length;
        document.getElementById('stWaitPay').innerText = orders.filter(o => o.order_status === 'รอชำระเงิน' || o.order_status === 'รอการชำระเงิน').length;
        document.getElementById('stWaitSlip').innerText = orders.filter(o => o.order_status === 'รอตรวจสอบ').length;
        document.getElementById('stProducing').innerText = orders.filter(o => o.order_status === 'กำลังผลิต').length;
        
        document.getElementById('stDone').innerText = orders.filter(o => o.order_status.includes('เสร็จสิ้น') || o.order_status.includes('จัดส่งแล้ว') || o.order_status.includes('ให้คะแนนแล้ว')).length;

        renderOrderTable();
    } catch (err) {
        tbody.innerHTML = `<div class="text-center py-10 text-red-500">Error: ${err.message}</div>`;
    }
}

function renderOrderTable() {
    const container = document.getElementById('orderBillsContainer');
    
    let filteredOrders = allOrdersData;
    if (window.currentOrderFilter !== 'all') {
        if (window.currentOrderFilter === 'เสร็จสิ้น') {
            filteredOrders = allOrdersData.filter(o => o.order_status.includes('เสร็จสิ้น') || o.order_status.includes('จัดส่งแล้ว') || o.order_status.includes('ให้คะแนนแล้ว'));
        } else {
            filteredOrders = allOrdersData.filter(o => o.order_status === window.currentOrderFilter || (window.currentOrderFilter==='รอการอนุมัติ' && o.order_status==='pending') || (window.currentOrderFilter==='รอชำระเงิน' && o.order_status==='รอการชำระเงิน'));
        }
    }

    if (filteredOrders.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">ไม่พบรายการในหมวดหมู่นี้</div>';
        return;
    }

    const groupedOrders = {};
    
    filteredOrders.forEach(o => {
        const timeKey = o.created_at.substring(0, 16) + "_" + o.user_id + "_" + o.order_status; 
        if (!groupedOrders[timeKey]) {
            groupedOrders[timeKey] = {
                mainOrderId: o.order_id,
                allOrderIds: [],
                created_at: o.created_at,
                order_status: o.order_status,
                total_price: 0,
                shipping_address: o.shipping_address || null, 
                member: o.member,
                deposit_payment: o.deposit_payment,
                items: []
            };
        }
        groupedOrders[timeKey].total_price += Number(o.order_total_price);
        groupedOrders[timeKey].allOrderIds.push(o.order_id);
        groupedOrders[timeKey].items.push(o);
    });

    const finalOrders = Object.values(groupedOrders);
    let html = '';

    finalOrders.forEach(group => {
        let custName = group.member?.user_name || 'ลูกค้าทั่วไป';
        let custPhone = group.member?.user_phone || '-';
        let custAddrText = '<span style="color:#ef4444; font-size:12px;">ลูกค้ายังไม่ระบุที่อยู่</span>';

        if (group.shipping_address) {
            try {
                let addrObj = typeof group.shipping_address === 'string' ? JSON.parse(group.shipping_address) : group.shipping_address;
                custName = addrObj.fullname || addrObj.fname + ' ' + addrObj.lname || custName;
                custPhone = addrObj.phone || custPhone;
                custAddrText = addrObj.fullText || group.shipping_address;
            } catch(e) {
                custAddrText = group.shipping_address;
            }
        } 
        else if (group.member && group.member.user_address) {
            try {
                let addrArray = JSON.parse(group.member.user_address);
                if (Array.isArray(addrArray) && addrArray.length > 0) {
                    let defAddr = addrArray.find(a => a.isDefault) || addrArray[0];
                    custName = defAddr.fullname || defAddr.fname + ' ' + defAddr.lname || custName;
                    custPhone = defAddr.phone || custPhone;
                    custAddrText = defAddr.fullText || group.member.user_address;
                }
            } catch(e) {
                custAddrText = group.member.user_address;
            }
        }

        let isPaidIcon = '<span style="color:#EF4444; font-size:12px; font-weight:700; display:flex; align-items:center; gap:4px;"><i data-lucide="x-circle" style="width:14px; height:14px;"></i> ยังไม่จ่ายเงิน</span>';
        let slipBtn = '';

        if (group.deposit_payment && group.deposit_payment.length > 0) {
            const paymentInfo = { ...group.deposit_payment[0] }; 
            
            let totalDeposit = 0;
            group.deposit_payment.forEach(dp => {
                totalDeposit += Number(dp.payment_amount || 0);
            });
            paymentInfo.payment_amount = totalDeposit;

            const slipPath = paymentInfo.payment_slip;
            const safeJsonStr = encodeURIComponent(JSON.stringify(paymentInfo)); 
            
            if(slipPath) {
                isPaidIcon = '<span style="color:#10B981; font-size:12px; font-weight:700; display:flex; align-items:center; gap:4px;"><i data-lucide="check-circle" style="width:14px; height:14px;"></i> แนบสลิปแล้ว</span>';
                slipBtn = `<button style="background:white; border:1px solid #E2E8F0; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; color:#2563EB; cursor:pointer; transition:0.2s; display:flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='white'" onclick="openSlipModal('${getSlipPublicUrl(slipPath)}', '${safeJsonStr}')"><i data-lucide="image" style="width:14px; height:14px;"></i> ดูหลักฐานการโอนเงิน</button>`;
            }
        }

        let statusBadge = '';
        let actionButtons = '-';
        const idsStr = JSON.stringify(group.allOrderIds);
        
        // 💡 ตรวจสอบว่าในบิลนี้ มีรายการที่ต้องการ "ประเมินราคา" หรือไม่ (ราคา = 0)
        const isNeedsEvaluation = group.items.some(item => Number(item.order_total_price) === 0);

        if(group.order_status === 'รอการอนุมัติ' || group.order_status === 'pending') {
            if (isNeedsEvaluation) {
                // 💡 ถ้ามีรายการรอประเมินราคา ให้แสดงปุ่มพิเศษ
                statusBadge = `<div style="background:#FEF3C7; color:#D97706; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">รอประเมินราคางานสั่งทำ</div>`;
                actionButtons = `
                    <div style="display:flex; gap:8px;">
                        <button style="background:#F59E0B; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:1; box-shadow:0 2px 4px rgba(245,158,11,0.2);" onclick='openEvalModal(${JSON.stringify(group.items)})'>กดเพื่อประเมินราคางาน</button> 
                        <button style="background:#EF4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:0.3; box-shadow:0 2px 4px rgba(239,68,68,0.2);" onclick='updateOrderBillStatus(${idsStr}, "ไม่อนุมัติ")'>ปฏิเสธ</button>
                    </div>
                `;
            } else {
                // 💡 บิลปกติ ที่มีราคาครบถ้วนแล้ว
                statusBadge = `<div style="background:#FFEDD5; color:#EA580C; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">รออนุมัติคำสั่งซื้อ</div>`;
                actionButtons = `
                    <div style="display:flex; gap:8px;">
                        <button style="background:#10B981; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:1; box-shadow:0 2px 4px rgba(16,185,129,0.2);" onclick='updateOrderBillStatus(${idsStr}, "รอชำระเงิน")'>อนุมัติให้โอนเงิน</button> 
                        <button style="background:#EF4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:1; box-shadow:0 2px 4px rgba(239,68,68,0.2);" onclick='updateOrderBillStatus(${idsStr}, "ไม่อนุมัติ")'>ปฏิเสธ</button>
                    </div>
                `;
            }
        } else if(group.order_status === 'รอชำระเงิน' || group.order_status === 'รอการชำระเงิน') {
            statusBadge = `<div style="background:#F1F5F9; color:#64748B; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">รอลูกค้าโอนเงิน</div>`;
            actionButtons = `<span style="font-size:12px; color:#94A3B8; font-weight:500;">รอการโอนเงินจากลูกค้า</span>`;
        } else if(group.order_status === 'รอตรวจสอบ') {
            statusBadge = `<div style="background:#DBEAFE; color:#2563EB; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">รอตรวจสอบสลิป</div>`;
            actionButtons = `
                <div style="display:flex; gap:8px;">
                    <button style="background:#8B5CF6; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:1;" onclick='updateOrderBillStatus(${idsStr}, "กำลังผลิต")'>สลิปถูกต้อง (เริ่มผลิต)</button> 
                    <button style="background:#EF4444; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; flex:1;" onclick='updateOrderBillStatus(${idsStr}, "รอชำระเงิน")'>สลิปไม่ถูก (ให้โอนใหม่)</button>
                </div>
            `;
        } else if(group.order_status === 'กำลังผลิต') {
            statusBadge = `<div style="background:#EDE9FE; color:#8B5CF6; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">กำลังผลิต</div>`;
            actionButtons = `<button style="background:#0F172A; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; width:100%;" onclick='updateOrderBillStatus(${idsStr}, "จัดส่งแล้ว")'>กดเพื่อจัดส่งสินค้า</button>`;
        } else if(group.order_status.includes('จัดส่งแล้ว')) { 
            statusBadge = `<div style="background:#F1F5F9; color:#0F172A; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">${group.order_status}</div>`;
            actionButtons = `<button style="background:#10B981; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; font-size:12px; width:100%;" onclick='updateOrderBillStatus(${idsStr}, "เสร็จสิ้น")'>จบงาน (ลูกค้าได้รับแล้ว)</button>`;
        } else if(group.order_status === 'เสร็จสิ้น' || group.order_status === 'ให้คะแนนแล้ว') {
            statusBadge = `<div style="background:#D1FAE5; color:#10B981; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">สำเร็จแล้ว</div>`;
        } else if(group.order_status === 'ไม่อนุมัติ') {
            statusBadge = `<div style="background:#FEE2E2; color:#EF4444; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; display:inline-block;">ยกเลิกแล้ว</div>`;
        }

        let itemsHTML = '';
        group.items.forEach((item, index) => {
            let modelData = item.model;
            if (Array.isArray(modelData)) modelData = modelData.length > 0 ? modelData[0] : null;
            const model = modelData || {};
            let modelImg = getModelImageUrl(model.model_image_1);
            let modelName = model.model_name || 'ไม่พบข้อมูลโมเดล';
            let sizeText = typeof item.selected_size === 'object' && item.selected_size !== null ? item.selected_size.display : (item.selected_size || 'มาตรฐาน');
            
            let priceDisplay = `฿${item.order_total_price.toLocaleString()}`;
            if (Number(item.order_total_price) === 0 && (group.order_status === 'รอการอนุมัติ' || group.order_status === 'pending')) {
                priceDisplay = `<span style="color:#D97706; font-size:12px; background:#FEF3C7; padding:2px 6px; border-radius:4px;">รอประเมินราคา</span>`;
            }

            itemsHTML += `
                <div style="display:flex; gap:15px; padding: 12px 0; ${index > 0 ? 'border-top: 1px dashed #E2E8F0;' : ''}">
                    <img src="${modelImg}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid #E2E8F0; flex-shrink:0;">
                    <div style="flex:1;">
                        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:2px;">${modelName}</strong>
                        <div style="font-size:12px; color:#64748B;">สี: ${item.selected_color || '-'} | วัสดุ: ${item.selected_material || '-'} | ขนาด: ${sizeText}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800; color:#0F172A;">${priceDisplay}</div>
                        <div style="font-size:12px; color:#64748B; font-weight:600;">${item.order_total_qty} ชิ้น</div>
                    </div>
                </div>
            `;
        });

        const orderDate = new Date(group.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let totalDisplay = `฿${group.total_price.toLocaleString()}`;
        if (group.total_price === 0 && isNeedsEvaluation) totalDisplay = `<span style="font-size:16px; color:#D97706;">รอประเมินราคา</span>`;

        html += `
            <div style="background:white; border:1px solid #E2E8F0; border-radius:16px; padding:24px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                            ${statusBadge}
                            ${isPaidIcon}
                        </div>
                        <div style="color:#64748B; font-size:13px;">รหัสอ้างอิงบิล: <b style="color:#0F172A;">#${group.mainOrderId}</b> | วันที่: ${orderDate}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:24px; font-weight:900; color:#2563EB;">${totalDisplay}</div>
                        <div style="font-size:12px; font-weight:600; color:#64748B;">ยอดรวมทั้งบิล (${group.items.length} รายการ)</div>
                    </div>
                </div>

                <div style="background:#F8FAFC; border:1px solid #F1F5F9; border-radius:12px; padding:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px; sm:flex-row sm:justify-between sm:items-center;">
                    <div>
                        <div style="font-size:14px; color:#0F172A; font-weight:700; margin-bottom:4px;"><i data-lucide="user" style="width:14px; display:inline-block;"></i> ${custName} <span style="color:#64748B; font-weight:500;">(${custPhone})</span></div>
                        <div style="font-size:12px; color:#64748B;">${custAddrText}</div>
                    </div>
                    <div style="flex-shrink:0;">
                        ${slipBtn}
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    ${itemsHTML}
                </div>

                <div style="border-top:1px solid #E2E8F0; padding-top:16px;">
                    ${actionButtons}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

window.updateOrderBillStatus = async function(orderIdsArray, status) {
    let finalStatus = status;

    if (status === 'จัดส่งแล้ว') {
        const trackingNum = prompt('📦 กรุณากรอก "บริษัทขนส่ง และ เลขพัสดุ" (เช่น Flash: TH123456) \n*หากยังไม่มีให้กดตกลงข้ามไปก่อนได้');
        if (trackingNum === null) return; 
        
        if (trackingNum.trim() !== '') {
            finalStatus = `จัดส่งแล้ว (เลขพัสดุ: ${trackingNum})`; 
        }
    } else {
        if (!confirm(`ยืนยันเปลี่ยนสถานะทั้งบิลเป็น "${status}"?`)) return;
    }

    try {
        const { error: orderError } = await db.from('order_model').update({ order_status: finalStatus }).in('order_id', orderIdsArray);
        if (orderError) throw orderError;

        if (status === 'กำลังผลิต') {
            await db.from('deposit_payment').update({ payment_status: 'ชำระแล้ว' }).in('order_id', orderIdsArray);
        } else if (status === 'รอชำระเงิน') {
            await db.from('deposit_payment').update({ payment_status: 'สลิปไม่ถูกต้อง' }).in('order_id', orderIdsArray);
        }
        alert(`✅ อัปเดตสถานะสำเร็จ`);
        loadOrderList(); 
    } catch (err) { alert('❌ เกิดข้อผิดพลาด: ' + err.message); }
};

// 💡 3. ฟังก์ชันใหม่: แสดงหน้าต่างประเมินราคา
window.openEvalModal = function(items) {
    let html = `<div style="padding: 20px; font-family: 'Prompt', sans-serif;">
        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #0F172A;">ประเมินราคางานสั่งทำ (ขนาดกำหนดเอง)</h3>
        <p style="font-size: 12px; color: #64748B; margin-bottom: 20px;">กรุณาระบุ "ราคาต่อชิ้น" สำหรับรายการที่รอประเมินราคา เมื่อบันทึกแล้วบิลนี้จะถูกอนุมัติทันที</p>
    `;
    
    // สร้างฟอร์มให้กรอกเฉพาะชิ้นที่ราคาเป็น 0
    items.forEach(item => {
        if (Number(item.order_total_price) === 0) {
            let modelData = item.model;
            if (Array.isArray(modelData)) modelData = modelData.length > 0 ? modelData[0] : null;
            const modelName = (modelData || {}).model_name || 'โมเดล 3D';
            
            html += `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">${modelName}</div>
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 10px;">ขนาด: ${item.selected_size} | จำนวน: ${item.order_total_qty} ชิ้น</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-size: 12px; font-weight: bold;">ระบุราคา (ต่อชิ้น):</label>
                        <input type="number" id="eval_price_${item.order_id}" style="border: 1px solid #CBD5E1; padding: 8px; border-radius: 6px; width: 100px; outline: none;" placeholder="0" min="1">
                        <span style="font-size: 12px; font-weight: bold; color: #64748B;">บาท</span>
                    </div>
                </div>
            `;
        }
    });

    html += `
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button onclick="document.body.removeChild(this.parentElement.parentElement.parentElement)" style="background: #F1F5F9; color: #475569; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">ยกเลิก</button>
            <button onclick='saveEvalPrice(${JSON.stringify(items)})' style="background: #F59E0B; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 4px rgba(245,158,11,0.2);">บันทึกและอนุมัติบิล</button>
        </div>
    </div>`;

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = "position: fixed; inset: 0; background: rgba(15,23,42,0.6); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;";
    
    const modalBox = document.createElement('div');
    modalBox.style.cssText = "background: white; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);";
    modalBox.innerHTML = html;
    
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);
};

// 💡 4. ฟังก์ชันบันทึกราคาและอัปเดตบิล
window.saveEvalPrice = async function(items) {
    try {
        const updatePromises = [];
        let allIds = [];

        for (const item of items) {
            allIds.push(item.order_id);
            if (Number(item.order_total_price) === 0) {
                const inputEl = document.getElementById(`eval_price_${item.order_id}`);
                const pricePerUnit = Number(inputEl.value);
                
                if (!pricePerUnit || pricePerUnit <= 0) {
                    alert("กรุณาระบุราคาประเมินให้ครบถ้วนและมากกว่า 0 บาท");
                    return;
                }

                // ราคาลง Database = ราคาต่อชิ้น * จำนวนชิ้น
                const totalCalculated = pricePerUnit * item.order_total_qty;

                // เตรียมคำสั่งอัปเดตราคาของสินค้านั้น
                updatePromises.push(
                    db.from('order_model').update({
                        price_at_order: pricePerUnit,
                        order_total_price: totalCalculated
                    }).eq('order_id', item.order_id)
                );
            }
        }

        if(updatePromises.length > 0) {
            // ยิงอัปเดตราคา
            await Promise.all(updatePromises);
            // เปลี่ยนสถานะบิลเป็นรอชำระเงิน
            await db.from('order_model').update({ order_status: 'รอชำระเงิน' }).in('order_id', allIds);
            
            alert('✅ บันทึกราคาและอนุมัติบิลเรียบร้อยแล้ว');
            location.reload();
        }
    } catch (err) {
        alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
};

// =========================================================
// 5. Model Management 
// =========================================================

window.previewImage = function(input, boxId) {
    const box = document.getElementById(boxId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            box.style.backgroundImage = `url('${e.target.result}')`;
            box.style.backgroundSize = 'cover';
            box.style.backgroundPosition = 'center';
            box.classList.add('has-image'); 
        }
        reader.readAsDataURL(input.files[0]);
    }
};

function setPreviewBox(boxId, pathData) {
    const box = document.getElementById(boxId);
    if(!box) return;

    const filename = extractFilename(pathData);
    if (filename) {
        box.style.backgroundImage = `url('${getModelImageUrl(filename)}')`;
        box.style.backgroundSize = 'cover';
        box.style.backgroundPosition = 'center';
        box.classList.add('has-image');
    } else {
        box.style.backgroundImage = 'none';
        box.classList.remove('has-image');
    }
}

function createColorRowHTML(name = '', price = '', imgPath = null) {
    let imgHtml = `<img src="" class="color-img-preview absolute inset-0 w-full h-full object-cover hidden pointer-events-none">`;
    let hasImageClass = '';
    let cleanPath = '';
    
    if (imgPath && imgPath !== 'null' && imgPath !== '') {
        cleanPath = extractFilename(imgPath) || '';
        if(cleanPath) {
            imgHtml = `<img src="${getModelImageUrl(cleanPath)}" class="color-img-preview absolute inset-0 w-full h-full object-cover pointer-events-none" style="display:block;">`;
            hasImageClass = 'has-image';
        }
    }

    return `
        <div class="flex flex-wrap sm:flex-nowrap items-stretch gap-2 w-full color-row-group">
            <div class="flex flex-1 border border-slate-300 rounded-lg overflow-hidden bg-white w-full sm:max-w-[450px]">
                <label class="color-upload-box ${hasImageClass} w-12 bg-slate-50 border-r border-slate-300 flex items-center justify-center relative shrink-0 overflow-hidden group hover:bg-slate-100 cursor-pointer">
                    <input type="file" accept="image/*" class="color-img-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onchange="previewColorImage(this)">
                    <input type="hidden" class="color-img-old" value="${cleanPath}">
                    <i data-lucide="image" class="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors"></i>
                    ${imgHtml}
                </label>
                <input type="text" class="color-name-input flex-1 p-3 border-none outline-none min-w-[80px]" placeholder="ชื่อสี (ขาวมุกอาร์กติก)" value="${name}">
                <input type="number" class="color-price-input w-28 sm:w-32 p-3 border-none border-l border-slate-300 outline-none text-center shrink-0" placeholder="+ราคา (4)" value="${price}">
            </div>
            <div class="flex gap-2 shrink-0">
                <button type="button" onclick="addColorField(this)" class="w-[50px] h-[50px] bg-white border border-slate-300 rounded-lg flex items-center justify-center text-primary hover:bg-blue-50 transition"><i data-lucide="plus"></i></button>
                <button type="button" onclick="removeColorField(this)" class="w-[50px] h-[50px] bg-white border border-slate-300 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `;
}

window.addColorField = function(btnObj) {
    const container = btnObj ? btnObj.closest('div[id$="ColorContainer"]') || document.getElementById('color-container') : document.getElementById('color-container');
    const div = document.createElement('div');
    div.innerHTML = createColorRowHTML();
    container.appendChild(div.firstElementChild); 
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.addEditColorField = function(name, price, imgPath) {
    const container = document.getElementById('editColorContainer');
    const div = document.createElement('div');
    div.innerHTML = createColorRowHTML(name, price, imgPath);
    container.appendChild(div.firstElementChild);
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.removeColorField = function(btn) {
    const container = btn.closest('.color-row-group').parentElement;
    const rows = container.querySelectorAll('.color-row-group');
    if (rows.length > 1) {
        btn.closest('.color-row-group').remove();
    } else {
        alert('⚠️ ต้องมีตัวเลือกสีอย่างน้อย 1 รายการ');
    }
};

window.previewColorImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const box = input.closest('.color-upload-box');
            if(box) {
                const img = box.querySelector('.color-img-preview');
                img.src = e.target.result;
                img.style.display = 'block';
                box.classList.add('has-image');
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
};

async function loadModelList() {
    const container = document.getElementById('modelListContainer');
    container.innerHTML = '<p style="text-align:center; padding: 40px; color:#64748B;"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary"></i> กำลังโหลดข้อมูล...</p>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const { data: models, error } = await db.from('model').select('*').order('model_id', { ascending: false });
        if(error) throw error;
        
        if(!models || models.length === 0) { 
            container.innerHTML = '<p style="text-align:center; padding: 40px; color:#64748B;">ไม่มีข้อมูลโมเดล</p>'; 
            return; 
        }

        let html = '';
        models.forEach(m => {
            let img = getModelImageUrl(m.model_image_1);
            
            let matNames = '-';
            try {
                if (m.model_material && m.model_material !== 'null') {
                    let mats = typeof m.model_material === 'string' ? JSON.parse(m.model_material) : m.model_material;
                    if (Array.isArray(mats) && mats.length > 0) {
                        matNames = mats.map(mat => mat.name).join(', ');
                    }
                }
            } catch (e) {}

            html += `<div style="background:white; padding:15px; border-radius:12px; margin-bottom:12px; display:flex; flex-wrap:wrap; gap:15px; align-items:center; border: 1px solid #E2E8F0;">
                <div style="width: 60px; flex-shrink:0;"><img src="${img}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #eee;"></div>
                <div style="flex: 2; min-width: 200px;">
                    <strong style="color:#0F172A; font-size:14px;">${m.model_name || 'ไม่มีชื่อ'}</strong>
                    <div style="font-size:12px; color:#888;">หมวดหมู่: <span style="background:#F1F5F9; padding:2px 6px; border-radius:4px; color:#475569; font-weight:600;">${m.parent_id || 'ทั่วไป'}</span> | ID: #${m.model_id}</div>
                </div>
                <div style="width: 80px; color:#2563EB; font-weight:800;">฿${m.model_price || 0}</div>
                <div style="flex: 1.5; min-width:120px; font-size:12px; color:#64748B; font-weight:600;">${m.model_width || 0}x${m.model_length || 0}x${m.model_height || 0} cm</div>
                <div style="flex: 1; min-width:100px; font-size:12px; color:#475569; font-weight: 600;">${matNames}</div>
                
                <div style="width: 140px; display:flex; gap:8px;">
                    <button onclick="openEditModal(${m.model_id})" style="background:#EFF6FF; color:#2563EB; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; flex:1; transition:0.2s;" onmouseover="this.style.background='#DBEAFE'" onmouseout="this.style.background='#EFF6FF'">แก้ไข</button> 
                    <button onclick="deleteModel(${m.model_id})" style="background:#FEF2F2; color:#EF4444; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; flex:1; transition:0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">ลบ</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="text-align:center; padding: 40px; color:red;">เกิดข้อผิดพลาด: ${err.message}</p>`;
    }
}

window.deleteModel = async function(id) {
    if(!confirm('คุณแน่ใจหรือไม่ที่จะลบโมเดลนี้?')) return;
    const { error } = await db.from('model').delete().eq('model_id', id);
    if(!error) { alert('✅ ลบโมเดลสำเร็จ'); loadModelList(); }
    else alert('❌ ลบไม่สำเร็จ: ' + error.message);
};

const addForm = document.getElementById('addModelForm');
if(addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = addForm.querySelector('button[type="submit"]');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-5 h-5"></i> กำลังบันทึก...'; btn.disabled = true;
        if(typeof lucide !== 'undefined') lucide.createIcons();

        try {
            let img1 = await uploadSingleImage(document.getElementById('imgInput1')?.files[0]);
            let img2 = await uploadSingleImage(document.getElementById('imgInput2')?.files[0]);
            let img3 = await uploadSingleImage(document.getElementById('imgInput3')?.files[0]);
            let img4 = await uploadSingleImage(document.getElementById('imgInput4')?.files[0]);

            const colorRows = document.querySelectorAll('#color-container .color-row-group');
            const colors = [];
            for(let row of colorRows) {
                const name = row.querySelector('.color-name-input').value.trim();
                const price = Number(row.querySelector('.color-price-input').value || 0);
                const fileInput = row.querySelector('.color-img-input');
                let imgPath = null;
                if(name) {
                    if(fileInput.files && fileInput.files.length > 0) imgPath = await uploadSingleImage(fileInput.files[0]);
                    colors.push({ name, price, image: imgPath });
                }
            }

            const { error } = await db.from('model').insert([{
                model_name: document.getElementById('modelName').value,
                parent_id: document.getElementById('modelCategory').value,
                model_price: Number(document.getElementById('modelPrice').value),
                model_image_1: img1 ? JSON.stringify([img1]) : null,
                model_image_2: img2 ? JSON.stringify([img2]) : null,
                model_image_3: img3 ? JSON.stringify([img3]) : null,
                model_image_4: img4 ? JSON.stringify([img4]) : null,
                model_color: JSON.stringify(colors),
                model_material: JSON.stringify([
                    {name:'PLA', price: Number(document.getElementById('pricePLA').value)},
                    {name:'PETG', price: Number(document.getElementById('pricePETG').value)}
                ]),
                model_width: Number(document.getElementById('dimW').value),
                model_length: Number(document.getElementById('dimL').value),
                model_height: Number(document.getElementById('dimH').value)
            }]);

            if(error) throw error;
            alert('✅ เพิ่มโมเดลสำเร็จ');
            location.reload();
        } catch(err) { alert('❌ Error: ' + err.message); btn.innerHTML = originalHtml; btn.disabled = false; if(typeof lucide !== 'undefined') lucide.createIcons(); }
    });
}

window.openEditModal = async function(id) {
    const { data: m, error } = await db.from('model').select('*').eq('model_id', id).single();
    if (error) return alert('ไม่พบข้อมูล');

    document.getElementById('editModelId').value = m.model_id;
    document.getElementById('editModelName').value = m.model_name;
    document.getElementById('editModelCategory').value = m.parent_id || '';
    document.getElementById('editModelPrice').value = m.model_price;
    document.getElementById('editDimW').value = m.model_width;
    document.getElementById('editDimL').value = m.model_length;
    document.getElementById('editDimH').value = m.model_height;

    document.getElementById('editOldImg1').value = extractFilename(m.model_image_1) || '';
    document.getElementById('editOldImg2').value = extractFilename(m.model_image_2) || '';
    document.getElementById('editOldImg3').value = extractFilename(m.model_image_3) || '';
    document.getElementById('editOldImg4').value = extractFilename(m.model_image_4) || '';

    setPreviewBox('editPreviewBox1', m.model_image_1);
    setPreviewBox('editPreviewBox2', m.model_image_2);
    setPreviewBox('editPreviewBox3', m.model_image_3);
    setPreviewBox('editPreviewBox4', m.model_image_4);

    const colorContainer = document.getElementById('editColorContainer');
    colorContainer.innerHTML = '';
    let colors = [];
    try { colors = typeof m.model_color === 'string' ? JSON.parse(m.model_color) : m.model_color; } catch(e){}
    if (Array.isArray(colors) && colors.length > 0) {
        colors.forEach(c => addEditColorField(c.name, c.price, c.image));
    } else {
        addEditColorField();
    }

    let mats = [];
    try { mats = typeof m.model_material === 'string' ? JSON.parse(m.model_material) : m.model_material; } catch(e){}
    const pla = mats.find(x => x.name === 'PLA');
    const petg = mats.find(x => x.name === 'PETG');
    if(pla) document.getElementById('editPricePLA').value = pla.price;
    if(petg) document.getElementById('editPricePETG').value = petg.price;

    document.getElementById('editModalWrapper').classList.remove('hidden');
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

document.getElementById('editModelFormDynamic')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editModelId').value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-5 h-5"></i> กำลังอัปเดต...'; btn.disabled = true;
    lucide.createIcons();

    try {
        let img1 = document.getElementById('editOldImg1').value;
        let img2 = document.getElementById('editOldImg2').value;
        let img3 = document.getElementById('editOldImg3').value;
        let img4 = document.getElementById('editOldImg4').value;

        const file1 = document.getElementById('editImgInput1')?.files[0];
        const file2 = document.getElementById('editImgInput2')?.files[0];
        const file3 = document.getElementById('editImgInput3')?.files[0];
        const file4 = document.getElementById('editImgInput4')?.files[0];

        if(file1) img1 = await uploadSingleImage(file1);
        if(file2) img2 = await uploadSingleImage(file2);
        if(file3) img3 = await uploadSingleImage(file3);
        if(file4) img4 = await uploadSingleImage(file4);

        const colorRows = document.querySelectorAll('#editColorContainer .color-row-group');
        const colors = [];
        for(let row of colorRows) {
            const name = row.querySelector('.color-name-input').value.trim();
            const price = Number(row.querySelector('.color-price-input').value || 0);
            const fileInput = row.querySelector('.color-img-input');
            const oldImgInput = row.querySelector('.color-img-old');
            
            let imgPath = oldImgInput ? oldImgInput.value : null;

            if(name) {
                if(fileInput.files && fileInput.files.length > 0) imgPath = await uploadSingleImage(fileInput.files[0]);
                colors.push({ name, price, image: imgPath });
            }
        }

        const { error } = await db.from('model').update({
            model_name: document.getElementById('editModelName').value,
            parent_id: document.getElementById('editModelCategory').value,
            model_price: Number(document.getElementById('editModelPrice').value),
            model_image_1: img1 ? JSON.stringify([img1]) : null,
            model_image_2: img2 ? JSON.stringify([img2]) : null,
            model_image_3: img3 ? JSON.stringify([img3]) : null,
            model_image_4: img4 ? JSON.stringify([img4]) : null,
            model_color: JSON.stringify(colors),
            model_material: JSON.stringify([
                {name:'PLA', price: Number(document.getElementById('editPricePLA').value)},
                {name:'PETG', price: Number(document.getElementById('editPricePETG').value)}
            ]),
            model_width: Number(document.getElementById('editDimW').value),
            model_length: Number(document.getElementById('editDimL').value),
            model_height: Number(document.getElementById('editDimH').value)
        }).eq('model_id', id);

        if(error) throw error;
        alert('✅ อัปเดตข้อมูลสำเร็จ');
        location.reload();
    } catch(err) { alert('❌ Error: ' + err.message); btn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> ยืนยันการแก้ไข'; btn.disabled = false; lucide.createIcons(); }
});

window.closeEditModal = function() { 
    if(document.getElementById('editModalWrapper')) document.getElementById('editModalWrapper').classList.add('hidden'); 
};

// =========================================================
// 9. Utility Modals (Slip)
// =========================================================
window.openSlipModal = function(url, paymentJsonStr) {
    document.getElementById('slipImagePreview').src = url;
    document.getElementById('slipDownloadLink').href = url;
    
    try {
        if (paymentJsonStr && paymentJsonStr !== 'undefined') {
            const payment = JSON.parse(decodeURIComponent(paymentJsonStr));
            document.getElementById('slipModalAmount').innerText = payment.payment_amount ? '฿' + Number(payment.payment_amount).toLocaleString() : '-';
            document.getElementById('slipModalMethod').innerText = payment.transfer_method || 'ไม่ระบุ';
            document.getElementById('slipModalBank').innerText = payment.customer_bank || 'ไม่ระบุ';
            document.getElementById('slipModalAccount').innerText = payment.customer_account || 'ไม่ระบุ';
            
            let dateTimeText = '-';
            if (payment.transfer_date && payment.transfer_time) {
                const d = new Date(payment.transfer_date);
                const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
                dateTimeText = `${dateStr} เวลา ${payment.transfer_time} น.`;
            }
            document.getElementById('slipModalDateTime').innerText = dateTimeText;
        }
    } catch (e) {}

    document.getElementById('slipModal').style.display = 'flex';
};

// =========================================================
// 10. Load Reviews Logic
// =========================================================
async function loadAdminReviews() {
    const container = document.getElementById('reviewsListContainer');
    container.innerHTML = '<div style="text-align:center; padding: 40px; color:#64748B;"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-primary"></i> กำลังโหลดรีวิว...</div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const { data: reviews, error } = await db
            .from('reviews')
            .select(`*, member(user_name), model(model_name)`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 40px; color:#64748B;">ยังไม่มีข้อมูลรีวิวในขณะนี้</div>';
            return;
        }

        let html = '';
        reviews.forEach(r => {
            const userName = r.member?.user_name || 'ลูกค้าทั่วไป';
            const modelName = r.model?.model_name || 'โมเดล 3D';
            const dateStr = new Date(r.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let starsHtml = '';
            const rating = parseInt(r.rating) || 5;
            for(let i=1; i<=5; i++) {
                if (i <= rating) {
                    starsHtml += `<svg style="width:16px; height:16px; fill:#FBBF24; color:#FBBF24;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
                } else {
                    starsHtml += `<svg style="width:16px; height:16px; fill:#E2E8F0; color:#E2E8F0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
                }
            }

            let imgHtml = '';
            if (r.review_image && r.review_image !== 'null' && r.review_image !== '') {
                let parsedImgs = [];
                try {
                    parsedImgs = JSON.parse(r.review_image);
                } catch(e) {
                    parsedImgs = [r.review_image];
                }
                
                if(Array.isArray(parsedImgs) && parsedImgs.length > 0) {
                    imgHtml = `<div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">`;
                    parsedImgs.forEach(img => {
                        const url = getModelImageUrl(img);
                        imgHtml += `<img src="${url}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0; cursor:pointer;" onclick="window.open('${url}', '_blank')">`;
                    });
                    imgHtml += `</div>`;
                } else if(typeof r.review_image === 'string') {
                    const url = getModelImageUrl(r.review_image);
                    imgHtml = `<div style="display:flex; gap:10px; margin-top:12px;"><img src="${url}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0; cursor:pointer;" onclick="window.open('${url}', '_blank')"></div>`;
                }
            }

            html += `
            <div style="background:white; border:1px solid #E2E8F0; border-radius:12px; padding:20px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; flex-shrink:0;">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong style="color:#0F172A; font-size:15px; display:block;">${userName}</strong>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="display:flex; gap:2px;">${starsHtml}</div>
                                <span style="font-size:12px; color:#64748B;">${dateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:11px; font-weight:600; color:#64748B; background:#F8FAFC; padding:4px 8px; border-radius:6px; border:1px solid #E2E8F0;">ออเดอร์: #${r.order_id}</span>
                        <div style="font-size:12px; color:#475569; margin-top:4px; font-weight:500;">สินค้า: ${modelName}</div>
                    </div>
                </div>
                <div style="background:#F8FAFC; padding:15px; border-radius:8px; color:#334155; font-size:14px; line-height:1.6; border:1px solid #F1F5F9;">
                    ${r.comment ? r.comment : '<span style="color:#94A3B8; font-style:italic;">ไม่มีข้อความรีวิว</span>'}
                    ${imgHtml}
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:#EF4444;">เกิดข้อผิดพลาดในการโหลดรีวิว: ${err.message}</div>`;
    }
}