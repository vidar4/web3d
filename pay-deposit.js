// ===========================================
// 1. Config & Supabase Setup
// ===========================================
const { createClient } = supabase;
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 

const db = createClient(supabaseUrl, supabaseKey);

let globalBillOrderIds = [];
let globalDepositAmount = 0; 
let globalAddresses = []; 
let currentEditingOrderIds = []; // ตัวแปรบอกว่ากำลังเปลี่ยนที่อยู่ของบิลไหน
window.globalOrderItems = []; // 💡 ตัวแปรใหม่สำหรับเก็บยอดมัดจำแยกรายชิ้น

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name'); 

    if (userId && userName) {
        document.getElementById('welcome-user').innerText = userName;
        const nameInput = document.getElementById('pay-name');
        if(nameInput) nameInput.value = userName;
    } else {
        alert('กรุณาเข้าสู่ระบบก่อน');
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const billsParam = urlParams.get('bills') || urlParams.get('bill_id'); 

    if (!billsParam) {
        alert('ไม่พบข้อมูลบิล กรุณาลองใหม่');
        window.location.href = 'to-pay.html';
        return;
    }

    const orderIdsArray = billsParam.split(',');
    await loadBillDetail(orderIdsArray, userId);
    setDefaultDateTime();
});

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
// 2. Load Bill Data (แยกที่อยู่ตามบิล)
// ===========================================
async function loadBillDetail(orderIdsArray, userId) {
    try {
        const { data: refOrders, error: refErr } = await db
            .from('order_model')
            .select('created_at, user_id')
            .in('order_id', orderIdsArray);

        if (refErr || !refOrders || refOrders.length === 0) throw new Error("ไม่พบบิลอ้างอิง");
        
        const timePrefixes = [...new Set(refOrders.map(o => o.created_at.substring(0, 16)))];
        
        const { data: allPendingItems, error: billErr } = await db
            .from('order_model')
            .select('order_id, order_total_price, order_total_qty, selected_color, selected_material, selected_size, created_at, shipping_address, model(*), member(user_name, user_phone, user_address)')
            .eq('user_id', userId)
            .in('order_status', ['รอชำระเงิน', 'รอการชำระเงิน']);

        if (billErr || !allPendingItems || allPendingItems.length === 0) {
            alert('บิลนี้ถูกชำระเงินไปแล้ว หรือไม่พบรายการค้างชำระ');
            window.location.href = 'to-pay.html';
            return;
        }

        const billItems = allPendingItems.filter(item => timePrefixes.includes(item.created_at.substring(0, 16)));

        if (billItems.length === 0) {
            alert('บิลนี้ถูกชำระเงินไปแล้ว หรือไม่พบรายการค้างชำระ');
            window.location.href = 'to-pay.html';
            return;
        }

        // จัดกลุ่มตามบิล (เวลาที่สั่งซื้อ)
        const groupedOrders = {};
        billItems.forEach(item => {
            const timeKey = item.created_at.substring(0, 16);
            if (!groupedOrders[timeKey]) {
                groupedOrders[timeKey] = {
                    mainOrderId: item.order_id,
                    allOrderIds: [],
                    totalPrice: 0,
                    shipping_address: item.shipping_address,
                    member: item.member,
                    items: []
                };
            }
            groupedOrders[timeKey].totalPrice += Number(item.order_total_price);
            groupedOrders[timeKey].allOrderIds.push(item.order_id);
            groupedOrders[timeKey].items.push(item);
        });

        let totalBillAmount = 0;
        let itemsHTML = '';
        globalBillOrderIds = [];
        window.globalOrderItems = []; // 💡 รีเซ็ตค่าใหม่ทุกครั้งที่โหลด

        // วาดการ์ดแต่ละบิลให้มีที่อยู่ของตัวเอง
        Object.values(groupedOrders).forEach((group, index) => {
            totalBillAmount += group.totalPrice;
            globalBillOrderIds.push(...group.allOrderIds);
            
            let addressHTML = renderAddressBlock(group);
            
            let groupItemsHTML = '';
            group.items.forEach(item => {
                // 💡 เก็บข้อมูลมัดจำแยกรายชิ้น (50% ของราคาสินค้านั้นๆ)
                window.globalOrderItems.push({
                    order_id: item.order_id,
                    item_deposit: Number(item.order_total_price) * 0.5
                });

                let modelData = Array.isArray(item.model) ? item.model[0] : (item.model || {});
                let modelName = modelData.model_name || 'โมเดล 3D';
                let imgUrl = getModelImageUrl(modelData.model_image_1);
                let sizeDisplay = (typeof item.selected_size === 'object' && item.selected_size !== null) ? item.selected_size.display : (item.selected_size || 'มาตรฐาน');

                groupItemsHTML += `
                    <div class="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <img src="${imgUrl}" class="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white">
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-slate-800 text-[13px] truncate mb-0.5">${modelName}</p>
                            <p class="text-[10px] text-slate-500 line-clamp-1">สี: ${item.selected_color || '-'} | วัสดุ: ${item.selected_material || '-'}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5">${sizeDisplay}</p>
                        </div>
                        <div class="text-right shrink-0 ml-2">
                            <p class="text-sm font-black text-primary">฿${Number(item.order_total_price).toLocaleString()}</p>
                            <p class="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">x${item.order_total_qty}</p>
                        </div>
                    </div>
                `;
            });

            // สร้างการ์ดสำหรับ 1 บิล
            itemsHTML += `
                <div class="border border-slate-200 rounded-[20px] p-4 md:p-5 bg-white shadow-sm mb-5 last:mb-0 transition-all hover:border-primary/30">
                    
                    <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <span class="font-black text-slate-900 text-sm">
                            รหัสบิล #${group.mainOrderId}
                        </span>
                        <button type="button" onclick='openAddressModal(${JSON.stringify(group.allOrderIds)})' class="text-[11px] font-bold text-primary hover:text-primaryHover bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i> เปลี่ยนที่อยู่
                        </button>
                    </div>
                    
                    <div class="mb-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                        <div class="font-bold text-slate-700 text-xs mb-2 flex items-center gap-1.5">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-primary"></i> จัดส่งไปที่:
                        </div>
                        ${addressHTML}
                    </div>
                    
                    <div class="space-y-1">
                        ${groupItemsHTML}
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span class="text-xs font-bold text-slate-500">ยอดรวมบิลนี้</span>
                        <span class="text-lg font-black text-primary tracking-tight">฿${group.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });

        globalDepositAmount = totalBillAmount * 0.5;
        document.getElementById('display-items').innerHTML = itemsHTML;
        
        const numBills = Object.keys(groupedOrders).length;
        if(numBills > 1) {
            document.getElementById('display-order-id').innerText = `รวม ${numBills} บิล (${billItems.length} รายการ)`;
        } else {
            document.getElementById('display-order-id').innerText = `${billItems.length} รายการ`;
        }
        
        document.getElementById('display-total').innerText = '฿' + totalBillAmount.toLocaleString();
        document.getElementById('display-deposit').innerText = '฿' + globalDepositAmount.toLocaleString();
        lucide.createIcons();

    } catch (err) {
        console.error(err);
        alert(err.message);
        window.location.href = 'to-pay.html';
    }
}

// ฟังก์ชันสร้าง HTML ของที่อยู่สำหรับแต่ละบิล
function renderAddressBlock(group) {
    let addressHTML = '<span class="text-red-500 text-xs font-bold">ไม่พบข้อมูลที่อยู่จัดส่ง</span>';
    
    if (group.shipping_address) {
        try {
            let addrObj = typeof group.shipping_address === 'string' ? JSON.parse(group.shipping_address) : group.shipping_address;
            let cName = addrObj.fullname || addrObj.fname + ' ' + addrObj.lname || 'ลูกค้า';
            let typeBadge = addrObj.type ? `<span class="bg-blue-100 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase">${addrObj.type}</span>` : '';
            
            addressHTML = `
                <div class="flex items-center flex-wrap gap-1.5 mb-1.5">
                    <span class="font-bold text-slate-800 text-[13px]">${cName}</span>
                    <span class="text-slate-300 font-normal">|</span>
                    <span class="text-slate-600 font-bold text-xs">${addrObj.phone || '-'}</span>
                    ${typeBadge}
                </div>
                <p class="text-[11px] text-slate-500 leading-relaxed">${addrObj.fullText || group.shipping_address}</p>
            `;
        } catch(e) {
            addressHTML = `<p class="text-[11px] text-slate-500">${group.shipping_address}</p>`;
        }
    } 
    else if (group.member && group.member.user_address) {
        try {
            let addrArray = JSON.parse(group.member.user_address);
            if (Array.isArray(addrArray) && addrArray.length > 0) {
                let defAddr = addrArray.find(a => a.isDefault) || addrArray[0];
                let cName = defAddr.fullname || defAddr.fname + ' ' + defAddr.lname;
                let typeBadge = defAddr.type ? `<span class="bg-blue-100 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 uppercase">${defAddr.type}</span>` : '';
                
                addressHTML = `
                    <div class="flex items-center flex-wrap gap-1.5 mb-1.5">
                        <span class="font-bold text-slate-800 text-[13px]">${cName}</span>
                        <span class="text-slate-300 font-normal">|</span>
                        <span class="text-slate-600 font-bold text-xs">${defAddr.phone}</span>
                        ${typeBadge}
                    </div>
                    <p class="text-[11px] text-slate-500 leading-relaxed">${defAddr.fullText}</p>
                `;
            }
        } catch(e) {}
    }
    return addressHTML;
}

// ===========================================
// 3. Address Selection Modal Logic
// ===========================================
window.openAddressModal = function(orderIds) {
    currentEditingOrderIds = orderIds; 
    const modal = document.getElementById('addressModal');
    const modalBox = document.getElementById('addressModalBox');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        if(modalBox) modalBox.classList.remove('scale-95');
    }, 10);
    
    loadAddresses();
}

window.closeAddressModal = function() {
    const modal = document.getElementById('addressModal');
    const modalBox = document.getElementById('addressModalBox');
    
    modal.classList.add('opacity-0');
    if(modalBox) modalBox.classList.add('scale-95');
    
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function loadAddresses() {
    const container = document.getElementById('address-list-container');
    const userId = localStorage.getItem('user_id');
    try {
        container.innerHTML = '<p class="text-center py-8 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-primary"></i>กำลังโหลดที่อยู่...</p>';
        lucide.createIcons();

        const { data, error } = await db.from('member').select('user_address').eq('user_id', userId).single();
        if (error) throw error;
        
        let addresses = [];
        if (data.user_address) {
            try { addresses = JSON.parse(data.user_address); } catch(e) {}
        }

        if (addresses.length === 0) {
            container.innerHTML = '<p class="text-center py-8 text-slate-500">ไม่พบที่อยู่ที่บันทึกไว้</p>';
            return;
        }

        globalAddresses = addresses;
        let html = '';

        addresses.forEach((addr, idx) => {
            let cName = addr.fullname || addr.fname + ' ' + addr.lname;
            let typeBadge = addr.type ? `<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">${addr.type}</span>` : '';
            let defaultBadge = addr.isDefault ? `<span class="bg-blue-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">ค่าเริ่มต้น</span>` : '';
            let addrTitle = addr.title || `ที่อยู่ ${idx + 1}`;
            
            const borderClass = 'border-slate-200 bg-white hover:border-primary/50';
            const checkIcon = `<div class="w-5 h-5 rounded-full border border-slate-300 group-hover:border-primary/50 transition-colors"></div>`;

            html += `
                <div onclick="selectAddress(${idx})" class="cursor-pointer border rounded-2xl p-4 mb-3 transition-all group ${borderClass}">
                    <div class="flex items-start gap-3">
                        <div class="mt-0.5">
                            <i data-lucide="map-pin" class="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-bold text-slate-900 text-sm">${addrTitle}</span>
                                    ${typeBadge}
                                    ${defaultBadge}
                                </div>
                                <div class="shrink-0 ml-2">
                                    ${checkIcon}
                                </div>
                            </div>
                            <div class="flex items-center flex-wrap mb-1.5 text-sm gap-2">
                                <span class="font-bold text-slate-800">${cName}</span>
                                <span class="text-slate-300">|</span>
                                <span class="font-bold text-slate-600">${addr.phone}</span>
                            </div>
                            <p class="text-[13px] text-slate-500 leading-relaxed">${addr.fullText}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        lucide.createIcons();
    } catch(e) {
        container.innerHTML = '<p class="text-center py-4 text-red-500">โหลดข้อมูลไม่สำเร็จ</p>';
    }
}

window.selectAddress = async function(idx) {
    const selected = globalAddresses[idx];
    if (!selected) return;

    closeAddressModal();
    document.getElementById('display-items').innerHTML = '<p class="text-sm text-slate-400 animate-pulse text-center py-10">กำลังอัปเดตที่อยู่...</p>';

    try {
        const { error } = await db.from('order_model')
            .update({ shipping_address: JSON.stringify(selected) })
            .in('order_id', currentEditingOrderIds);
        
        if (error) throw error;
        
        const urlParams = new URLSearchParams(window.location.search);
        const billsParam = urlParams.get('bills') || urlParams.get('bill_id'); 
        const orderIdsArray = billsParam.split(',');
        const userId = localStorage.getItem('user_id');
        await loadBillDetail(orderIdsArray, userId);

    } catch(e) {
        alert('เปลี่ยนที่อยู่ไม่สำเร็จ: ' + e.message);
        window.location.reload();
    }
}

// ===========================================
// 4. Utils & Form Submit
// ===========================================
function setDefaultDateTime() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, -1);
    document.getElementById('pay-date').value = localISOTime.substring(0, 10); 
    document.getElementById('pay-time').value = localISOTime.substring(11, 16); 
}

window.previewSlipImage = function(input) {
    const box = document.getElementById('slip-preview-box');
    const img = document.getElementById('slip-img');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.classList.remove('hidden');
            box.classList.add('has-image');
        }
        reader.readAsDataURL(input.files[0]);
    }
};

const paymentForm = document.getElementById('paymentForm');
if(paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const originalBtnHtml = btn.innerHTML;

        if (globalBillOrderIds.length === 0) return alert('ไม่พบรายการสินค้า');

        const fileInput = document.getElementById('pay-slip-file');
        if (!fileInput.files || fileInput.files.length === 0) return alert('กรุณาอัปโหลดสลิป');

        const account = document.getElementById('pay-account').value.trim();
        if (!account || account.length < 10 || account.length > 12) {
            alert('กรุณากรอกเลขที่บัญชี 10-12 หลักให้ถูกต้อง (เฉพาะตัวเลข)');
            return;
        }

        const name = document.getElementById('pay-name').value.trim();
        if (!name) {
            alert('กรุณากรอกชื่อ-นามสกุลผู้โอน');
            return;
        }

        btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-6 h-6"></i> กำลังบันทึกข้อมูล...';
        btn.disabled = true;
        lucide.createIcons();

        try {
            const file = fileInput.files[0];
            const fileName = `slip_${globalBillOrderIds[0]}_${Date.now()}.jpg`;
            
            const { error: uploadErr } = await db.storage.from('payment_slips').upload(fileName, file);
            if (uploadErr) throw uploadErr;

            // 💡 ใช้งานตัวแปร window.globalOrderItems เพื่อบันทึกยอดมัดจำแยกตามบิล
            const depositRecords = window.globalOrderItems.map(item => ({
                order_id: item.order_id,
                payment_amount: item.item_deposit, // <-- ยอด 50% ของรายการนี้
                payment_slip: fileName,
                transfer_date: document.getElementById('pay-date').value,
                transfer_time: document.getElementById('pay-time').value,
                transfer_method: document.getElementById('pay-method').value,
                customer_bank: document.getElementById('pay-bank').value,
                customer_account: account, 
                customer_name: name,
                payment_status: 'รอตรวจสอบ'
            }));

            // 💡 บันทึกเข้าฐานข้อมูล
            await db.from('deposit_payment').insert(depositRecords);
            await db.from('order_model').update({ order_status: 'รอตรวจสอบ' }).in('order_id', globalBillOrderIds);

            alert('แจ้งชำระเงินสำเร็จ!');
            window.location.href = 'status.html'; 
        } catch (error) {
            alert(error.message);
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;
            lucide.createIcons();
        }
    });
}