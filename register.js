// ==========================================
// 1. ตั้งค่า Supabase
// ==========================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. ระบบจัดการภาษา (i18n) สำหรับข้อมูลที่อยู่
// ==========================================
const currentLang = localStorage.getItem('my_site_lang') || 'th';
const nameKey = currentLang === 'en' ? 'name_en' : 'name_th';

const uiTexts = {
    th: {
        loading: "กำลังเตรียมระบบค้นหา...",
        error: "❌ โหลดข้อมูลล้มเหลว",
        processing: "กำลังประมวลผล...",
        placeholder: "พิมพ์ชื่อตำบลเพื่อค้นหา..."
    },
    en: {
        loading: "Preparing search system...",
        error: "❌ Failed to load data",
        processing: "Processing...",
        placeholder: "Type sub-district name..."
    }
}[currentLang];

// ==========================================
// 3. ระบบค้นหาที่อยู่ประเทศไทย (Autocomplete)
// ==========================================
let flatThaiData = [];

document.addEventListener('DOMContentLoaded', async () => {
    
    // 💡 1. แปลง <select> ใน HTML ให้กลายเป็น <input> อัตโนมัติ (ไม่ต้องแก้ HTML)
    const subSelect = document.getElementById('reg-subdistrict');
    if (subSelect && subSelect.tagName === 'SELECT') {
        subSelect.outerHTML = `
            <div class="relative w-full">
                <input type="text" id="reg-subdistrict" class="reg-input notranslate" placeholder="${uiTexts.loading}" autocomplete="off" required>
                <div id="search-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto hidden custom-scrollbar"></div>
            </div>
        `;
    }

    const distSelect = document.getElementById('reg-district');
    if (distSelect && distSelect.tagName === 'SELECT') {
        distSelect.outerHTML = `<input type="text" id="reg-district" class="reg-input notranslate bg-slate-50" placeholder="ระบบจะกรอกให้อัตโนมัติอัตโนมัติ" readonly required>`;
    }

    const provSelect = document.getElementById('reg-province');
    if (provSelect && provSelect.tagName === 'SELECT') {
        provSelect.outerHTML = `<input type="text" id="reg-province" class="reg-input notranslate bg-slate-50" placeholder="ระบบจะกรอกให้อัตโนมัติ" readonly required>`;
    }

    // 💡 2. ดึงข้อมูล API และแผ่ข้อมูล (Flatten) สำหรับระบบค้นหา
    try {
        const apiUrl = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("API Connection Failed");

        const data = await response.json();
        
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

        // เปลี่ยน Placeholder เมื่อโหลดเสร็จ
        const subInput = document.getElementById('reg-subdistrict');
        if(subInput) subInput.placeholder = uiTexts.placeholder;

        setupAutocomplete();

    } catch (error) {
        console.error("Fetch Error:", error);
        const subInput = document.getElementById('reg-subdistrict');
        if(subInput) subInput.placeholder = uiTexts.error;
    }
});

// 💡 3. ฟังก์ชันจัดการค้นหาเมื่อพิมพ์
function setupAutocomplete() {
    const input = document.getElementById('reg-subdistrict');
    const resultsBox = document.getElementById('search-results');

    input.addEventListener('input', function() {
        const val = this.value.trim();
        resultsBox.innerHTML = '';
        
        // ถ้าพิมพ์น้อยกว่า 2 ตัว หรือลบข้อความออกหมด
        if (val.length < 2) {
            resultsBox.classList.add('hidden');
            if(val.length === 0) {
                document.getElementById('reg-district').value = '';
                document.getElementById('reg-province').value = '';
                document.getElementById('reg-zip').value = '';
            }
            return;
        }

        // ค้นหาจากชื่อตำบล (จำกัด 20 รายการ)
        const matches = flatThaiData.filter(item => item.subdistrict.includes(val)).slice(0, 20);

        if (matches.length > 0) {
            matches.forEach(item => {
                const div = document.createElement('div');
                div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm text-slate-700 transition-colors';
                div.innerHTML = `<span class="font-bold text-primary">${item.subdistrict}</span> > ${item.district} > ${item.province} <span class="text-slate-400 font-medium">(${item.zip})</span>`;
                
                // เมื่อคลิกเลือก
                div.onclick = () => {
                    document.getElementById('reg-subdistrict').value = item.subdistrict;
                    document.getElementById('reg-district').value = item.district;
                    document.getElementById('reg-province').value = item.province;
                    document.getElementById('reg-zip').value = item.zip;
                    resultsBox.classList.add('hidden');
                };
                resultsBox.appendChild(div);
            });
            resultsBox.classList.remove('hidden');
        } else {
            resultsBox.classList.add('hidden');
        }
    });

    // ปิดกล่องผลลัพธ์เมื่อคลิกที่อื่น
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.classList.add('hidden');
        }
    });
}

// ==========================================
// 4. ระบบบันทึกข้อมูลเข้า Supabase
// ==========================================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const btn = document.getElementById('btn-submit');
    const originalText = btn.innerText;

    const email = document.getElementById('reg-email').value.trim();
    const name = document.getElementById('reg-name').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();

    const province = document.getElementById('reg-province').value;
    const district = document.getElementById('reg-district').value;
    const subdistrict = document.getElementById('reg-subdistrict').value;
    const zip = document.getElementById('reg-zip').value;
    
    const houseNo = document.getElementById('reg-house-no').value.trim();
    const soi = document.getElementById('reg-soi').value.trim();
    const road = document.getElementById('reg-road').value.trim();

    // เช็คว่าเลือกจากรายการค้นหาครบถ้วนแล้วหรือยัง
    if(!province || !district || !subdistrict || !zip) {
        const errorMsg = currentLang === 'en' ? "Please select a valid sub-district from the search list." : "กรุณาเลือก ตำบล/แขวง จากรายการค้นหาให้ถูกต้อง";
        alert(errorMsg);
        return;
    }

    if (password !== confirmPassword) {
        const errorMsg = currentLang === 'en' ? "❌ Passwords do not match" : "❌ รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
        alert(errorMsg);
        document.getElementById('reg-confirm-password').focus();
        return;
    }

    // สร้างตัวแปรข้อความที่อยู่
    let fullAddress = "";
    if (currentLang === 'th') {
        fullAddress = `${houseNo}`;
        if (soi) fullAddress += ` ซอย${soi}`;
        if (road) fullAddress += ` ถนน${road}`;
        fullAddress += ` ต.${subdistrict} อ.${district} จ.${province} ${zip}`;
    } else {
        fullAddress = `${houseNo}`;
        if (soi) fullAddress += `, Soi ${soi}`;
        if (road) fullAddress += `, ${road} Rd.`;
        fullAddress += `, ${subdistrict}, ${district}, ${province} ${zip}`;
    }

    // แพ็คที่อยู่ให้เป็น JSON Array แบบเดียวกับระบบจัดการโปรไฟล์
    const addressData = [
        {
            id: 'addr_' + Date.now(),
            title: 'ที่อยู่เริ่มต้น',
            fullname: name,
            phone: phone,
            fullText: fullAddress,
            type: 'บ้าน',
            isDefault: true
        }
    ];

    btn.innerText = uiTexts.processing;
    btn.disabled = true;

    try {
        const { data: existingUser, error: checkErr } = await db
            .from('member')
            .select('user_email')
            .eq('user_email', email)
            .maybeSingle(); 

        if (existingUser) {
            const errorMsg = currentLang === 'en' ? "⚠️ Email already exists. Please login." : "⚠️ อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น หรือทำการเข้าสู่ระบบ";
            alert(errorMsg);
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        const { error: insertErr } = await db
            .from('member')
            .insert([{
                user_email: email,
                user_name: name,
                user_password: password,
                user_phone: phone,
                user_address: JSON.stringify(addressData), 
                role: 'user'
            }]);

        if (insertErr) throw insertErr;

        const successMsg = currentLang === 'en' ? "✅ Registration Successful! Redirecting to login..." : "✅ สมัครสมาชิกสำเร็จ! ระบบจะพาคุณไปหน้าเข้าสู่ระบบ";
        alert(successMsg);
        window.location.href = 'login.html'; 

    } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
});