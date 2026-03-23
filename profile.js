// ==========================================
// 1. ตั้งค่า Supabase
// ==========================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);
const userId = localStorage.getItem('user_id');

let flatThaiData = []; 
let userAddressesList = []; 

const currentLang = localStorage.getItem('my_site_lang') || 'th';
const nameKey = currentLang === 'en' ? 'name_en' : 'name_th';

const ui = {
    th: { loading: "กำลังเตรียมระบบค้นหา...", noAddress: "ยังไม่มีข้อมูลที่อยู่", noOrders: "ยังไม่มีรายการสั่งซื้อ" },
    en: { loading: "Preparing search...", noAddress: "No address info", noOrders: "No order history" }
}[currentLang];

window.onload = async () => {
    if (!userId) { window.location.href = 'login.html'; return; }
    await loadUserProfile();
    await loadThaiAddressAPI();
    createReviewModal(); 
};

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

// ==========================================
// 3. ระบบจัดการ Tabs
// ==========================================
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById('tab-' + tabId).style.display = 'block';
    btn.classList.add('active');
    
    if (tabId === 'account') toggleAccountEditMode(false); 
    if (tabId === 'address') window.hideAddressForm(); 
    if (tabId === 'orders') loadOrderHistory();
}

// ==========================================
// 4. ระบบ API ที่อยู่ไทย (เปลี่ยนเป็นแบบค้นหา)
// ==========================================
async function loadThaiAddressAPI() {
    try {
        const res = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json');
        const data = await res.json();
        
        data.forEach(prov => {
            prov.districts.forEach(dist => {
                dist.sub_districts.forEach(sub => {
                    flatThaiData.push({
                        subdistrict: sub[nameKey] || sub.name_th,
                        district: dist[nameKey] || dist.name_th,
                        province: prov[nameKey] || prov.name_th,
                        zip: sub.zip_code
                    });
                });
            });
        });
        
        setupAddressAutocomplete();
    } catch (e) { console.error("Address API Error", e); }
}

function setupAddressAutocomplete() {
    const subSelect = document.getElementById('p-subdistrict');
    if (subSelect && subSelect.tagName === 'SELECT') {
        subSelect.outerHTML = `
            <div class="relative w-full">
                <input type="text" id="p-subdistrict" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all" placeholder="พิมพ์ชื่อตำบลเพื่อค้นหา..." autocomplete="off">
                <div id="p-search-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto hidden custom-scrollbar"></div>
            </div>`;
        
        document.getElementById('p-district').outerHTML = `<input type="text" id="p-district" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none" placeholder="ระบบจะกรอกให้อัตโนมัติ" readonly>`;
        document.getElementById('p-province').outerHTML = `<input type="text" id="p-province" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none" placeholder="ระบบจะกรอกให้อัตโนมัติ" readonly>`;
    }

    const input = document.getElementById('p-subdistrict');
    const resultsBox = document.getElementById('p-search-results');
    if(!input || !resultsBox) return;

    input.addEventListener('input', function() {
        const val = this.value.trim();
        resultsBox.innerHTML = '';
        
        if (val.length < 2) {
            resultsBox.style.display = 'none';
            if(val.length === 0) {
                document.getElementById('p-district').value = '';
                document.getElementById('p-province').value = '';
                document.getElementById('p-zip').value = '';
            }
            return;
        }

        const matches = flatThaiData.filter(item => item.subdistrict.includes(val)).slice(0, 20);

        if (matches.length > 0) {
            matches.forEach(item => {
                const div = document.createElement('div');
                div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm text-slate-700';
                div.innerHTML = `<span class="font-bold text-primary">${item.subdistrict}</span> > ${item.district} > ${item.province} <span class="text-slate-400">(${item.zip})</span>`;
                div.onclick = () => {
                    document.getElementById('p-subdistrict').value = item.subdistrict;
                    document.getElementById('p-district').value = item.district;
                    document.getElementById('p-province').value = item.province;
                    document.getElementById('p-zip').value = item.zip;
                    resultsBox.style.display = 'none';
                };
                resultsBox.appendChild(div);
            });
            resultsBox.style.display = 'block';
        } else {
            resultsBox.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.style.display = 'none';
        }
    });
}

// ==========================================
// 5. จัดการ ข้อมูลโปรไฟล์
// ==========================================
async function loadUserProfile() {
    const { data } = await db.from('member').select('*').eq('user_id', userId).single();
    if (data) {
        document.getElementById('header-username').innerText = data.user_name;
        document.getElementById('view-name').innerText = data.user_name || '-';
        document.getElementById('view-email').innerText = data.user_email || '-';
        document.getElementById('view-phone').innerText = data.user_phone || '-';

        document.getElementById('p-name').value = data.user_name;
        document.getElementById('p-email').value = data.user_email;
        document.getElementById('p-phone').value = data.user_phone || '';

        try {
            userAddressesList = JSON.parse(data.user_address || "[]");
            if (userAddressesList.length > 0 && userAddressesList[0].isDefault === undefined) {
                userAddressesList[0].isDefault = true; 
            }
        } catch(e) {
            if(data.user_address) {
                userAddressesList = [{ id: Date.now(), addressNumber: 1, fullText: data.user_address, isDefault: true }];
            } else {
                userAddressesList = [];
            }
        }
        
        let maxAddrNum = 0;
        userAddressesList.forEach(a => {
            if (!a.addressNumber) {
                maxAddrNum++;
                a.addressNumber = maxAddrNum;
            } else {
                maxAddrNum = Math.max(maxAddrNum, a.addressNumber);
            }
        });

        renderAddressList();
    }
}

window.toggleAccountEditMode = function(isEdit) {
    document.getElementById('account-view-mode').style.display = isEdit ? 'none' : 'block';
    document.getElementById('account-edit-mode').style.display = isEdit ? 'block' : 'none';
    if (!isEdit) {
        document.getElementById('p-password').value = '';
        document.getElementById('p-confirm-password').value = '';
    }
}

window.saveProfile = async function() {
    const updateData = { user_name: document.getElementById('p-name').value, user_phone: document.getElementById('p-phone').value };
    const pass = document.getElementById('p-password').value;
    const confirmPass = document.getElementById('p-confirm-password').value;
    
    if (pass) {
        if (pass !== confirmPass) {
            alert("⚠️ รหัสผ่านใหม่ และ ยืนยันรหัสผ่าน ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง!");
            return;
        }
        updateData.user_password = pass;
    }

    const { error } = await db.from('member').update(updateData).eq('user_id', userId);
    if (!error) {
        alert("✅ บันทึกข้อมูลส่วนตัวสำเร็จ!");
        toggleAccountEditMode(false);
        loadUserProfile();
    } else {
        alert("Error saving profile.");
    }
}

// ==========================================
// 6. จัดการ ที่อยู่ของฉัน (อัปเดตสไตล์ใหม่)
// ==========================================
function renderAddressList() {
    const container = document.getElementById('address-container');
    container.innerHTML = '';

    const displayList = [...userAddressesList].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    if(displayList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl w-full">
                <i data-lucide="map" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
                <p class="text-slate-500 font-medium">ยังไม่มีข้อมูลที่อยู่จัดส่ง</p>
            </div>
        `;
    } else {
        displayList.forEach((addr) => {
            const isDef = addr.isDefault === true;
            
            const typeBadge = addr.type ? `<span class="bg-blue-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100 uppercase">${addr.type}</span>` : '';
            
            const badgeHTML = isDef 
                ? `<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">ค่าเริ่มต้น</span>` 
                : `<button onclick="setDefaultAddress(${addr.id})" class="text-[10px] text-slate-400 hover:text-primary hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 transition">ตั้งเป็นค่าเริ่มต้น</button>`;
            
            const addrNumDisplay = addr.addressNumber || '?';

            const nameDisplay = addr.fullname || (addr.fname && addr.lname ? `${addr.fname} ${addr.lname}` : 'ไม่ระบุชื่อผู้รับ');
            const phoneDisplay = addr.phone ? addr.phone : 'ไม่ระบุเบอร์โทร';

            const borderClass = isDef ? 'border-primary ring-1 ring-primary/20 bg-blue-50/10' : 'border-slate-200 bg-white hover:border-primary/50';

            container.innerHTML += `
                <div class="border rounded-2xl p-5 mb-4 transition-all relative ${borderClass} group">
                    <div class="flex items-start gap-4">
                        <div class="mt-1">
                            <i data-lucide="map-pin" class="w-6 h-6 ${isDef ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap mb-1">
                                        <span class="font-bold text-slate-900 text-base">ที่อยู่ ${addrNumDisplay}</span>
                                        ${typeBadge}
                                        ${badgeHTML}
                                    </div>
                                </div>
                                <div class="flex gap-2 shrink-0 ml-2">
                                    <button onclick="editAddress(${addr.id})" class="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition" title="แก้ไขที่อยู่"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                    <button onclick="deleteAddress(${addr.id})" class="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition" title="ลบที่อยู่นี้"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                            
                            <div class="flex items-center flex-wrap mb-2 text-[15px] gap-2">
                                <span class="font-bold text-slate-800">${nameDisplay}</span>
                                <span class="text-slate-300">|</span>
                                <span class="font-bold text-slate-600">${phoneDisplay}</span>
                            </div>
                            <p class="text-[13px] text-slate-500 leading-relaxed">${addr.fullText}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    lucide.createIcons();
}

window.showAddressForm = function() {
    document.getElementById('address-list-mode').style.display = 'none';
    document.getElementById('btn-add-address').style.display = 'none';
    document.getElementById('address-form-mode').style.display = 'block';
    
    document.getElementById('address-form-title').innerHTML = '<i data-lucide="map-pin"></i> เพิ่มที่อยู่จัดส่งใหม่';
    document.getElementById('edit-addr-id').value = '';
    
    document.getElementById('p-fullname').value = '';
    document.getElementById('p-addr-phone').value = '';

    document.getElementById('p-type').value = 'บ้าน';
    document.getElementById('p-house-no').value = '';
    document.getElementById('p-soi').value = '';
    document.getElementById('p-road').value = '';
    
    document.getElementById('p-province').value = '';
    document.getElementById('p-district').value = '';
    document.getElementById('p-subdistrict').value = '';
    document.getElementById('p-zip').value = '';
    lucide.createIcons();
}

window.hideAddressForm = function() {
    document.getElementById('address-list-mode').style.display = 'block';
    document.getElementById('btn-add-address').style.display = 'inline-flex';
    document.getElementById('address-form-mode').style.display = 'none';
}

window.editAddress = function(id) {
    const addr = userAddressesList.find(a => a.id === id);
    if(!addr) return;

    document.getElementById('address-list-mode').style.display = 'none';
    document.getElementById('btn-add-address').style.display = 'none';
    document.getElementById('address-form-mode').style.display = 'block';
    document.getElementById('address-form-title').innerHTML = '<i data-lucide="edit"></i> แก้ไขที่อยู่จัดส่ง';
    
    document.getElementById('edit-addr-id').value = addr.id;
    
    let loadedFullName = addr.fullname;
    if (!loadedFullName && addr.fname && addr.lname) {
        loadedFullName = `${addr.fname} ${addr.lname}`;
    }
    document.getElementById('p-fullname').value = loadedFullName || '';
    document.getElementById('p-addr-phone').value = addr.phone || '';

    let tHouse = '', tSoi = '', tRoad = '', tProv = '', tDist = '', tSub = '', tZip = '';
    
    if (!addr.province && addr.fullText) {
        const txt = addr.fullText;
        const zipMatch = txt.match(/\b\d{5}\b/);
        if (zipMatch) tZip = zipMatch[0];
        const provMatch = txt.match(/(?:จ\.|จังหวัด)\s*([^\s]+)/);
        if (provMatch) tProv = provMatch[1];
        const distMatch = txt.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s]+)/);
        if (distMatch) tDist = distMatch[1];
        const subMatch = txt.match(/(?:ต\.|ตำบล|แขวง)\s*([^\s]+)/);
        if (subMatch) tSub = subMatch[1];
        const houseMatch = txt.match(/(?:บ้านเลขที่)?\s*([\d\/\-]+)/);
        if (houseMatch) tHouse = houseMatch[1];
        const soiMatch = txt.match(/ซอย\s*([^\s]+)/);
        if (soiMatch) tSoi = soiMatch[1];
        const roadMatch = txt.match(/ถนน\s*([^\s]+)/);
        if (roadMatch) tRoad = roadMatch[1];
    }
    
    document.getElementById('p-type').value = addr.type || 'บ้าน';
    document.getElementById('p-house-no').value = addr.house || tHouse;
    
    // Fallback สำหรับฟิลด์เก่า (moo, building) ให้รวมเข้าไปในบ้านเลขที่ตอนแก้ไข เพื่อความง่ายของฟอร์มใหม่
    let oldExtra = [];
    if(addr.moo) oldExtra.push(`หมู่ ${addr.moo}`);
    if(addr.building) oldExtra.push(`${addr.building}`);
    if(oldExtra.length > 0 && !document.getElementById('p-house-no').value.includes('หมู่')) {
        document.getElementById('p-house-no').value += ' ' + oldExtra.join(' ');
    }

    document.getElementById('p-soi').value = addr.soi || tSoi;
    document.getElementById('p-road').value = addr.road || tRoad;
    
    document.getElementById('p-province').value = addr.province || tProv;
    document.getElementById('p-district').value = addr.district || tDist;
    document.getElementById('p-subdistrict').value = addr.subdistrict || tSub;
    document.getElementById('p-zip').value = addr.zip || tZip;
    
    lucide.createIcons();
}

window.saveAddress = async function() {
    const addrId = document.getElementById('edit-addr-id').value;

    const fullname = document.getElementById('p-fullname').value.trim();
    const addrPhone = document.getElementById('p-addr-phone').value.trim();
    const type = document.getElementById('p-type').value;
    const house = document.getElementById('p-house-no').value.trim();
    const soi = document.getElementById('p-soi').value.trim();
    const road = document.getElementById('p-road').value.trim();
    
    const prov = document.getElementById('p-province').value;
    const dist = document.getElementById('p-district').value;
    const sub = document.getElementById('p-subdistrict').value;
    const zip = document.getElementById('p-zip').value;

    if (!fullname || !addrPhone || !house || !prov || !dist || !sub) { 
        alert("⚠️ กรุณากรอก ชื่อ-นามสกุล, เบอร์โทร, บ้านเลขที่, และเลือก ตำบล อำเภอ จังหวัด ให้ครบถ้วน"); 
        return; 
    }

    let addrParts = [];
    addrParts.push(`บ้านเลขที่ ${house}`);
    if (soi) addrParts.push(`ซอย${soi}`);
    if (road) addrParts.push(`ถนน${road}`);
    addrParts.push(`ต.${sub}`);
    addrParts.push(`อ.${dist}`);
    addrParts.push(`จ.${prov}`);
    addrParts.push(`${zip}`);

    const fullAddr = addrParts.join(' '); 

    if (addrId) {
        const index = userAddressesList.findIndex(a => a.id == addrId);
        if(index !== -1) {
            userAddressesList[index].fullname = fullname;
            delete userAddressesList[index].fname;
            delete userAddressesList[index].lname;
            
            userAddressesList[index].phone = addrPhone;
            userAddressesList[index].type = type;
            userAddressesList[index].house = house;
            
            // ล้างฟิลด์เก่าทิ้งเพื่อป้องกันการซ้ำซ้อน
            delete userAddressesList[index].moo;
            delete userAddressesList[index].building;

            userAddressesList[index].soi = soi;
            userAddressesList[index].road = road;
            userAddressesList[index].province = prov;
            userAddressesList[index].district = dist;
            userAddressesList[index].subdistrict = sub;
            userAddressesList[index].zip = zip;
            userAddressesList[index].fullText = fullAddr;
        }
    } else {
        let maxNum = 0;
        userAddressesList.forEach(a => { if(a.addressNumber > maxNum) maxNum = a.addressNumber; });
        
        const newAddrObj = {
            id: Date.now(),
            addressNumber: maxNum + 1,
            fullname, 
            phone: addrPhone,
            type, house, soi, road, province: prov, district: dist, subdistrict: sub, zip,
            fullText: fullAddr,
            isDefault: userAddressesList.length === 0
        };
        userAddressesList.push(newAddrObj);
    }

    const { error } = await db.from('member').update({ user_address: JSON.stringify(userAddressesList) }).eq('user_id', userId);
    if (!error) { 
        alert(addrId ? "✅ อัปเดตที่อยู่สำเร็จ!" : "✅ เพิ่มที่อยู่ใหม่สำเร็จ!"); 
        window.hideAddressForm();
        renderAddressList(); 
    } else {
        alert("Error saving address");
    }
}

window.setDefaultAddress = async function(id) {
    userAddressesList = userAddressesList.map(addr => ({
        ...addr,
        isDefault: addr.id === id 
    }));

    const { error } = await db.from('member').update({ user_address: JSON.stringify(userAddressesList) }).eq('user_id', userId);
    if (!error) {
        renderAddressList();
    }
};

window.deleteAddress = async function(id) {
    if(!confirm("คุณต้องการลบที่อยู่นี้ใช่หรือไม่?")) return;
    
    userAddressesList = userAddressesList.filter(addr => addr.id !== id);
    
    if (userAddressesList.length > 0 && !userAddressesList.some(a => a.isDefault)) {
        userAddressesList[0].isDefault = true;
    }

    const { error } = await db.from('member').update({ user_address: JSON.stringify(userAddressesList) }).eq('user_id', userId);
    if (!error) renderAddressList();
}

// ==========================================
// 7. โหลดประวัติการสั่งซื้อ (Order History)
// ==========================================
async function loadOrderHistory() {
    const container = document.getElementById('order-history-list');
    container.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-weight:500;">${ui.loading}</div>`;
    
    const { data: rawOrders, error } = await db.from('order_model')
        .select('*, model(model_name, model_image_1), reviews(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); 

    if (error || !rawOrders || rawOrders.length === 0) { 
        container.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-weight:500;">${ui.noOrders}</div>`; 
        return; 
    }

    const groupedOrders = {};
    
    rawOrders.forEach(o => {
        const timeKey = o.created_at.substring(0, 16); 
        if (!groupedOrders[timeKey]) {
            groupedOrders[timeKey] = {
                mainOrderId: o.order_id,
                created_at: o.created_at,
                order_status: o.order_status,
                total_price: 0,
                items: []
            };
        }
        
        groupedOrders[timeKey].total_price += Number(o.order_total_price);

        // 💡 ตรวจสอบและอัปเดตสถานะสำหรับกลุ่มบิล
        if (o.order_status === 'ไม่อนุมัติ') {
            groupedOrders[timeKey].order_status = 'ไม่อนุมัติ';
        } else if (o.order_status === 'ยกเลิกคำสั่งซื้อ') {
            groupedOrders[timeKey].order_status = 'ยกเลิกคำสั่งซื้อ'; // รองรับสถานะยกเลิก
        } else if (o.order_status === 'รอชำระเงิน' || o.order_status === 'รอการชำระเงิน') {
            groupedOrders[timeKey].order_status = 'รอชำระเงิน';
        } else if (o.order_status === 'รอการอนุมัติ' && groupedOrders[timeKey].order_status !== 'รอชำระเงิน') {
            groupedOrders[timeKey].order_status = 'รอการอนุมัติ';
        }
        
        groupedOrders[timeKey].items.push(o);
    });

    const finalOrders = Object.values(groupedOrders);
    container.innerHTML = '';

    finalOrders.forEach(group => {
        const isDone = group.order_status === 'completed' || group.order_status === 'ให้คะแนนแล้ว' || group.order_status === 'เสร็จสิ้น';
        const isCanceled = group.order_status === 'ยกเลิกคำสั่งซื้อ' || group.order_status === 'ไม่อนุมัติ';
        
        let displayStatus = isDone ? 'สำเร็จแล้ว' : 'กำลังดำเนินการ';
        let statusColor = isDone ? '#10b981' : '#f59e0b';
        let statusIcon = isDone ? 'check-circle-2' : 'clock';

        if (group.order_status === 'รอการอนุมัติ') {
            displayStatus = 'รอแอดมินยืนยันคำสั่งซื้อ';
            statusColor = '#f59e0b'; 
            statusIcon = 'clock';
        } else if (group.order_status === 'รอชำระเงิน' || group.order_status === 'รอการชำระเงิน') {
            displayStatus = 'รอการชำระเงิน (ดูที่เมนู "ที่ต้องชำระ" ด้านบน)'; 
            statusColor = '#f59e0b';
            statusIcon = 'wallet';
        } else if (group.order_status === 'รอตรวจสอบ') {
            displayStatus = 'กำลังตรวจสอบการโอนเงิน';
            statusColor = '#3b82f6';
            statusIcon = 'search';
        } else if (group.order_status === 'ไม่อนุมัติ') {
            displayStatus = 'คำสั่งซื้อถูกปฏิเสธ / มีปัญหา';
            statusColor = '#ef4444'; 
            statusIcon = 'x-circle';
        } else if (group.order_status === 'ยกเลิกคำสั่งซื้อ') { // 💡 อัปเดต UI เมื่อโดนยกเลิก
            displayStatus = 'ยกเลิกคำสั่งซื้อแล้ว';
            statusColor = '#ef4444'; 
            statusIcon = 'x-circle';
        }

        let itemsHTML = '';
        group.items.forEach((o, index) => {
            let imgUrl = 'https://via.placeholder.com/85';
            if (o.model && o.model.model_image_1) imgUrl = getModelImageUrl(o.model.model_image_1);

            let sizeDisplay = o.selected_size || "มาตรฐาน";

            // 💡 ถ้าเป็นงานรอประเมิน (ราคา 0) ให้โชว์คำว่า รอประเมิน
            let priceDisplay = `฿${Number(o.order_total_price).toLocaleString()}`;
            let pricePerUnitDisplay = `฿${o.order_total_qty > 0 ? (o.order_total_price / o.order_total_qty).toFixed(0) : 0}`;
            
            if (Number(o.order_total_price) === 0 && group.order_status === 'รอการอนุมัติ') {
                priceDisplay = `<span style="font-size: 13px; color: #D97706; background: #FEF3C7; padding: 2px 6px; border-radius: 4px;">รอประเมินราคา</span>`;
                pricePerUnitDisplay = '-';
            }

            let itemActionsHTML = '';
            if (o.order_status === 'ให้คะแนนแล้ว' && o.reviews && o.reviews.length > 0) {
                const r = o.reviews[0];
                const ratingValue = parseInt(r.rating, 10) || 5; 
                const safeComment = encodeURIComponent(r.comment || '');
                const safeImage = encodeURIComponent(r.review_image || '');
                itemActionsHTML += `
                    <button onclick="openReviewModal(this)" data-rating="${ratingValue}" data-comment="${safeComment}" data-img="${safeImage}" style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #FFF9E6; color: #D97706; border: 1px solid #FDE68A; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;">
                        <svg style="width: 14px; height: 14px; fill: #FBBF24;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> รีวิว
                    </button>`;
            }
            itemActionsHTML += `
                <button onclick="window.location.href='product-detail.html?id=${o.model_id}'" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;">
                    ซื้ออีกครั้ง
                </button>`;

            itemsHTML += `
                <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 15px; width: 100%; padding: 15px 0; ${index > 0 ? 'border-top: 1px dashed #e2e8f0;' : ''}">
                    <img src="${imgUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; background: white; flex-shrink: 0;" onerror="this.src='https://via.placeholder.com/70'">
                    
                    <div style="flex: 1; min-width: 150px;">
                        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #1e293b; font-weight: 700;">${o.model?.model_name || '3D Model'}</h3>
                        <p style="margin: 0; font-size: 12px; color: #64748b;">สี: <b>${o.selected_color || '-'}</b> | วัสดุ: <b>${o.selected_material || '-'}</b></p>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${sizeDisplay}</div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: flex-end; min-width: 100px;">
                        <div style="font-weight: 700; color: #475569; font-size: 13px;">${pricePerUnitDisplay} <span style="font-weight:400">x${o.order_total_qty}</span></div>
                        <div style="font-weight: 800; color: #1e293b; font-size: 15px; margin-bottom: 6px;">${priceDisplay}</div>
                        <div style="display: flex; gap: 6px;">${itemActionsHTML}</div>
                    </div>
                </div>`;
        });

        const orderDate = new Date(group.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let totalDisplay = `฿${group.total_price.toLocaleString()}`;
        if (group.total_price === 0 && group.order_status === 'รอการอนุมัติ') totalDisplay = `<span style="font-size:16px; color:#D97706;">รอประเมินราคา</span>`;

        container.innerHTML += `
            <div class="notranslate" style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); ${isCanceled ? 'opacity: 0.7; filter: grayscale(1);' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f8fafc;">
                    <div style="color: #64748b; font-size: 13px;">
                        รหัสอ้างอิงบิล: <b style="color:#1e293b; font-size:15px;">#${group.mainOrderId}</b> 
                        <span style="margin-left:8px; background:#f1f5f9; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:bold; color:#475569;">${group.items.length} รายการ</span>
                    </div>
                    <div style="font-size: 13px; color: #94a3b8; font-weight:500;">${orderDate}</div>
                </div>

                <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 15px; color: ${statusColor};">
                        <i data-lucide="${statusIcon}" style="width: 18px; height: 18px;"></i>
                        ${displayStatus}
                    </div>
                </div>

                <div style="background: #f8fafc; border-radius: 12px; padding: 0 20px; border: 1px solid #f1f5f9;">
                    ${itemsHTML}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                    <div>
                        <span style="font-size: 14px; color: #64748b; font-weight: 500;">ยอดรวมทั้งบิล:</span>
                        <span style="font-size: 22px; font-weight: 800; color: #2563eb; margin-left: 8px;">${isCanceled ? '<span style="text-decoration: line-through; color: #94A3B8;">'+totalDisplay+'</span>' : totalDisplay}</span>
                    </div>
                </div>
            </div>`;
    });
    
    setTimeout(() => { lucide.createIcons(); }, 50);
}

// ==========================================
// 💡 8. ระบบหน้าต่างดูรีวิว (รองรับหลายรูป)
// ==========================================
function createReviewModal() {
    if (document.getElementById('reviewViewModal')) return;
    const modalHtml = `
    <div id="reviewViewModal" style="display: none; position: fixed; inset: 0; z-index: 100; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); align-items: center; justify-content: center; padding: 16px; opacity: 0; transition: opacity 0.3s;">
        <div id="reviewModalBox" style="background: white; border-radius: 32px; width: 100%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; transform: scale(0.92); transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <div style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9; background: #fff; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
                    <svg style="width: 24px; height: 24px; fill: #FBBF24; color: #D97706;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span id="review-modal-title">รีวิวของคุณ</span>
                </h3>
                <button onclick="closeReviewModal()" style="background: #f1f5f9; border: none; cursor: pointer; color: #64748b; padding: 8px; border-radius: 14px; transition: 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div style="padding: 32px; text-align: center; max-height: 75vh; overflow-y: auto;">
                <div id="review-modal-stars" style="display: flex; justify-content: center; gap: 6px; margin-bottom: 12px;"></div>
                <div id="review-modal-text" style="font-size: 18px; font-weight: 800; color: #D97706; margin-bottom: 28px; letter-spacing: -0.5px;"></div>
                <div style="background: #FDFBEE; padding: 22px; border-radius: 20px; border: 1.5px solid #FEF3C7; text-align: left; position: relative;">
                    <p id="review-modal-comment" style="font-size: 15.5px; color: #78350F; margin: 0; white-space: pre-wrap; line-height: 1.65; font-weight: 500;"></p>
                </div>
                
                <div id="review-modal-img-wrapper" style="display:none; margin-top: 20px;"></div>

            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openReviewModal = function(btn) {
    const rating = parseInt(btn.dataset.rating, 10) || 0; 
    const comment = decodeURIComponent(btn.dataset.comment || '');
    const imageFileName = decodeURIComponent(btn.dataset.img || '');
    const ratingTexts = ['', 'แย่มาก 😢', 'พอใช้ 😕', 'ปานกลาง 😐', 'ดี 🙂', 'ยอดเยี่ยม! 🤩'];
    
    document.getElementById('review-modal-title').innerText = 'รีวิวของคุณ';

    let starsHtml = '';
    for(let i=1; i<=5; i++) {
        const isActive = i <= rating;
        starsHtml += `<svg style="width: 38px; height: 38px; fill: ${isActive ? '#FBBF24' : '#E2E8F0'}; color: ${isActive ? '#D97706' : '#CBD5E1'};" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
    
    document.getElementById('review-modal-stars').innerHTML = starsHtml;
    document.getElementById('review-modal-text').innerText = ratingTexts[rating] || '';
    document.getElementById('review-modal-comment').innerText = comment || 'ไม่มีข้อความอธิบาย';

    const imgWrapper = document.getElementById('review-modal-img-wrapper');
    imgWrapper.innerHTML = ''; 

    if (imageFileName && imageFileName.trim() !== '' && imageFileName !== 'null') {
        let parsedImgs = [];
        try {
            parsedImgs = JSON.parse(imageFileName);
        } catch(e) {
            parsedImgs = [imageFileName]; 
        }
        
        if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
            let html = `<div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">`;
            parsedImgs.forEach(img => {
                const url = getModelImageUrl(img);
                html += `<img src="${url}" style="width:80px; height:80px; object-fit:cover; border-radius:12px; border:2px solid #E2E8F0; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('${url}', '_blank')">`;
            });
            html += `</div>`;
            imgWrapper.innerHTML = html;
            imgWrapper.style.display = 'block';
        } else if (typeof imageFileName === 'string') {
            const url = getModelImageUrl(imageFileName);
            imgWrapper.innerHTML = `<img src="${url}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 12px; border:2px solid #E2E8F0; cursor: pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('${url}', '_blank')">`;
            imgWrapper.style.display = 'block';
        } else {
            imgWrapper.style.display = 'none';
        }
    } else {
        imgWrapper.style.display = 'none'; 
    }

    const modal = document.getElementById('reviewViewModal');
    const box = document.getElementById('reviewModalBox');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    setTimeout(() => { modal.style.opacity = '1'; box.style.transform = 'scale(1)'; }, 10);
};

// 💡 9. แก้ไขปุ่ม Logout: เคลียร์เฉพาะข้อมูลบัญชีและตะกร้า แต่เก็บค่าภาษาเอาไว้
window.logout = function() { 
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('role');
    localStorage.removeItem('cart'); 
    window.location.href = 'login.html'; 
}