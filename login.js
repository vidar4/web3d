// 1. ตั้งค่า Supabase
const { createClient } = supabase;

const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
// ⚠️ ใส่ KEY ที่ถูกต้องของคุณตรงนี้
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 

const db = createClient(supabaseUrl, supabaseKey);

// 2. ฟังก์ชันตรวจสอบแบบละเอียด
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    // รับค่าและตัดช่องว่างหน้าหลังออก (Trim)
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value.trim(); // รับค่าที่พิมพ์
    
    const btn = document.querySelector('.login-btn');
    btn.innerText = 'กำลังสืบสวน...';

    try {
        // ขั้นตอนที่ 1: ค้นหาแค่ "อีเมล" ก่อน (ยังไม่สนรหัสผ่าน)
        const { data, error } = await db
            .from('member')
            .select('*')
            .eq('user_email', emailInput)
            .single();

        if (error || !data) {
            alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            btn.innerText = 'เข้าสู่ระบบ';
            return;
        }

        // ขั้นตอนที่ 2: ถ้าเจออีเมลแล้ว มาเทียบรหัสผ่านกัน
        const dbPassword = data.user_password; // รหัสในฐานข้อมูล

        if (dbPassword === passwordInput) {
            // --- ถ้าตรงกันเป๊ะ ---
            alert(`✅ เข้าสู่ระบบสำเร็จ!\nกำลังพาไปหน้า ${data.role}`);
            
            // บันทึกและย้ายหน้า
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('user_name', data.user_name);
            localStorage.setItem('role', data.role);
            
            if (data.role === 'admin') window.location.assign('admin.html');
            else window.location.assign('index.html');

        } else {
            // --- ถ้าไม่ตรง ---
            alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    btn.innerText = 'เข้าสู่ระบบ';
});

// ===========================================
// 💡 3. ฟังก์ชันเปิด/ปิดตาเพื่อดูรหัสผ่าน (แก้บัคกดรัวๆ แล้วค้าง)
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // ตรวจสอบว่ามี element ครบก่อนเพิ่ม Event Listener
    if (passwordInput && togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function () {
            // สลับ type ระหว่าง password และ text
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // 💡 วิธีแก้บัค: เขียน HTML ของไอคอนใหม่ทับลงไปเลย
            if (type === 'text') {
                // กำลังดูรหัสผ่าน ให้ใส่ไอคอน "ตาเปิด"
                togglePasswordBtn.innerHTML = '<i data-lucide="eye" class="w-5 h-5"></i>';
            } else {
                // กำลังซ่อนรหัสผ่าน ให้ใส่ไอคอน "ตาปิด"
                togglePasswordBtn.innerHTML = '<i data-lucide="eye-off" class="w-5 h-5"></i>';
            }
            
            // สั่งให้ Lucide วาดไอคอนใหม่ที่เราเพิ่งใส่เข้าไป
            if(window.lucide) {
                window.lucide.createIcons();
            }
        });
    }
});