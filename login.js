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
            alert(`❌ หาอีเมลไม่เจอ!\nสิ่งที่คุณพิมพ์: "${emailInput}"\nลองเช็คตัวสะกดดีๆ ครับ`);
            btn.innerText = 'เข้าสู่ระบบ';
            return;
        }

        // ขั้นตอนที่ 2: ถ้าเจออีเมลแล้ว มาเทียบรหัสผ่านกันให้เห็นจะจะ
        const dbPassword = data.user_password; // รหัสในฐานข้อมูล
        
        console.log("รหัสใน DB:", dbPassword);
        console.log("รหัสที่พิมพ์:", passwordInput);

        if (dbPassword === passwordInput) {
            // --- ถ้าตรงกันเป๊ะ ---
            alert(`✅ เย้! รหัสผ่านถูกต้องแล้ว\nกำลังพาไปหน้า ${data.role}`);
            
            // บันทึกและย้ายหน้า
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('user_name', data.user_name);
            localStorage.setItem('role', data.role);
            
            if (data.role === 'admin') window.location.assign('admin.html');
            else window.location.assign('index.html');

        } else {
            // --- ถ้าไม่ตรง (จุดพีคอยู่ตรงนี้) ---
            alert(
                `⚠️ เจออีเมลแล้ว.. แต่รหัสผ่านไม่ตรง!\n\n` +
                `🔐 ในฐานข้อมูลคือ: "${dbPassword}" (ยาว ${dbPassword.length} ตัว)\n` +
                `⌨️ ที่คุณพิมพ์มาคือ: "${passwordInput}" (ยาว ${passwordInput.length} ตัว)\n\n` +
                `สังเกตดูดีๆ ว่ามีช่องว่างเกินมาไหม หรือตัวพิมพ์เล็ก/ใหญ่ต่างกัน?`
            );
        }

    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    btn.innerText = 'เข้าสู่ระบบ';
});