// ===========================================
// 1. Config & Supabase Setup
// ===========================================
const { createClient } = supabase;
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 

const db = createClient(supabaseUrl, supabaseKey);

let currentOrderId = null;
let currentModelId = null; // 💡 เพิ่มตัวแปรสำหรับเก็บรหัสโมเดลเพื่อลงตารางรีวิว
let selectedRating = 0;

// ===========================================
// 2. Helper: ฟังก์ชันแกะ URL รูปภาพ (แก้ลิงก์ล่ม)
// ===========================================
function getModelImageUrl(pathData) {
    const fallbackImage = 'https://placehold.co/150x150/f8fafc/94a3b8?text=No+Image';
    
    if (!pathData || pathData === 'undefined' || pathData === 'null') return fallbackImage;
    let path = pathData;
    try {
        if (typeof path === 'string' && path.startsWith('[')) path = JSON.parse(path)[0];
        else if (Array.isArray(path) && path.length > 0) path = path[0];
    } catch (e) {}
    
    if (!path || path === 'undefined') return fallbackImage;
    if (typeof path === 'string' && path.startsWith('http')) return path;
    
    const cleanPath = String(path).replace(/["']/g, '').trim();
    return `${supabaseUrl}/storage/v1/object/public/model_images/${cleanPath}`;
}

// ===========================================
// 3. Init & Load Data
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    const userName = localStorage.getItem('user_name');
    if (userName) document.getElementById('welcome-user').innerText = userName;

    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId = urlParams.get('id');

    if (!currentOrderId) {
        alert('ไม่พบข้อมูลคำสั่งซื้อ');
        window.location.href = 'status.html';
        return;
    }

    await loadOrderDetails();
    setupStarRating();

    document.getElementById('review-form').addEventListener('submit', submitReview);
});

// ===========================================
// 4. Load Order Details
// ===========================================
async function loadOrderDetails() {
    try {
        const { data: order, error } = await db
            .from('order_model')
            .select('*, model(*)')
            .eq('order_id', currentOrderId)
            .single();

        if (error || !order) throw new Error('ดึงข้อมูลไม่สำเร็จ');

        // 💡 เก็บ model_id ไว้สำหรับบันทึกลงตารางรีวิว
        currentModelId = order.model_id;

        let modelData = order.model;
        let model = {};
        if (Array.isArray(modelData) && modelData.length > 0) model = modelData[0];
        else if (modelData && typeof modelData === 'object' && !Array.isArray(modelData)) model = modelData;

        document.getElementById('order-id-display').innerText = `#${order.order_id}`;
        document.getElementById('product-name').innerText = model.model_name || 'สินค้านี้ถูกยกเลิก/ลบออกจากระบบ';
        document.getElementById('product-options').innerText = `สี: ${order.selected_color || '-'} | วัสดุ: ${order.selected_material || '-'} | ไซส์: ${order.selected_size || '-'}`;
        document.getElementById('product-image').src = getModelImageUrl(model.model_image_1);

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
    }
}

// ===========================================
// 5. Star Rating Logic
// ===========================================
function setupStarRating() {
    const stars = document.querySelectorAll('.star-icon');
    const ratingText = document.getElementById('rating-text');
    const texts = ['', 'แย่มาก 😢', 'พอใช้ 😕', 'ปานกลาง 😐', 'ดี 🙂', 'ยอดเยี่ยม! 🤩'];

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            highlightStars(val, 'hovered');
            ratingText.innerText = texts[val];
        });

        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hovered'));
            highlightStars(selectedRating, 'active');
            ratingText.innerText = selectedRating > 0 ? texts[selectedRating] : '';
        });

        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-value'));
            highlightStars(selectedRating, 'active');
            ratingText.innerText = texts[selectedRating];
        });
    });

    function highlightStars(val, className) {
        stars.forEach(s => {
            const starVal = parseInt(s.getAttribute('data-value'));
            if (className === 'active') s.classList.remove('active');
            if (starVal <= val) {
                s.classList.add(className);
            }
        });
    }
}

// ===========================================
// 💡 6. Submit Review (อัปเดตรองรับอัปโหลด "หลายรูป")
// ===========================================
async function submitReview(e) {
    e.preventDefault();

    if (selectedRating === 0) {
        return alert('กรุณาให้คะแนนดาวก่อนส่งรีวิวครับ ⭐');
    }

    const btn = document.getElementById('submit-review-btn');
    btn.innerHTML = '<i data-lucide="loader" class="animate-spin inline w-5 h-5 mr-2"></i> กำลังส่ง...';
    btn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const commentEl = document.getElementById('review-text') || document.querySelector('textarea');
        const commentText = commentEl ? commentEl.value.trim() : '';
        const userId = localStorage.getItem('user_id') || null;

        // 💡 1. จัดการอัปโหลดรูปภาพแบบ Multiple (ถ้ามี)
        let reviewImgFileName = null;
        let uploadedFileNames = []; // Array เก็บรายชื่อไฟล์ที่อัปโหลดสำเร็จ
        const fileInput = document.querySelector('input[type="file"]');
        
        if (fileInput && fileInput.files.length > 0) {
            
            // วนลูปอัปโหลดทุกไฟล์ที่ลูกค้าเลือก
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                const fileExt = file.name.split('.').pop();
                
                // ใส่ Index (i) ต่อท้ายเวลาเพื่อป้องกันชื่อซ้ำกันเป๊ะๆ หากอัปโหลดไวมาก
                const fileName = `review_${currentOrderId}_${Date.now()}_${i}.${fileExt}`;
                
                const { error: uploadError } = await db.storage
                    .from('model_images') // เก็บไว้ใน bucket 'model_images' 
                    .upload(fileName, file);
                    
                if (uploadError) throw uploadError;
                
                uploadedFileNames.push(fileName);
            }
            
            // เมื่ออัปโหลดครบทุกรูป ให้นำ Array มาแปลงเป็น JSON String เพื่อเก็บลง Database
            if (uploadedFileNames.length > 0) {
                reviewImgFileName = JSON.stringify(uploadedFileNames);
            }
        }

        // 💡 2. บันทึกข้อมูลลงตาราง reviews
        const { error: reviewError } = await db.from('reviews').insert([{
            model_id: currentModelId,
            order_id: currentOrderId,
            user_id: userId,
            rating: selectedRating,
            comment: commentText,
            review_image: reviewImgFileName // เก็บเป็น JSON Array (เช่น '["img1.jpg", "img2.jpg"]')
        }]);

        if (reviewError) throw reviewError;

        // 3. อัปเดตสถานะออเดอร์ให้เป็น 'ให้คะแนนแล้ว'
        const { error: orderError } = await db
            .from('order_model')
            .update({ order_status: 'ให้คะแนนแล้ว' })
            .eq('order_id', currentOrderId);

        if (orderError) throw orderError;

        alert('ขอบคุณสำหรับคะแนนและรีวิวครับ! 🥰');
        window.location.href = 'status.html';

    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาด: ' + err.message);
        btn.innerHTML = 'ส่งรีวิว';
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}