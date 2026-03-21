// ==========================================
// ระบบเปลี่ยนภาษา (i18n) สำหรับทั้งเว็บ (อัปเดตครบทุกหน้า)
// ==========================================

const fallbackTranslations = {
    th: {
        // --- เมนูหลัก (Navbar) ---
        "nav_home": "หน้าแรก",
        "nav_store": "คลังโมเดล",
        "nav_status": "ติดตามสถานะ",
        "btn_back_home": "กลับไปหน้าหลัก",
        
        // --- หน้า Index ---
        "hero_badge": "มาใหม่: คอลเลกชัน Sci-Fi 2024",
        "hero_title_1": "เนรมิตโลก",
        "hero_title_2": "ในแบบ 3 มิติ",
        "hero_desc": "ศูนย์รวมโมเดล 3D คุณภาพสูงที่ถูกคัดสรรมาสำหรับนักสร้างสรรค์ <br>ดาวน์โหลดหรือสั่งพิมพ์ด้วยวัสดุเกรดพรีเมียม ส่งตรงถึงมือคุณ",
        "btn_shop_now": "เริ่มเลือกซื้อ",
        "category_title": "หมวดหมู่โมเดล",
        "cat_all": "ทั้งหมด",
        "cat_figure": "Figure (ฟิกเกอร์)",
        "cat_parts": "Parts (อะไหล่)",
        "cat_decor": "Decor (ของตกแต่ง)",
        "cat_other": "อื่นๆ",
        "search_placeholder": "ค้นหาชื่อโมเดล...",
        "loading_models": "กำลังโหลดโมเดล 3D...",
        
        // --- หน้า Cart ---
        "cart_title": "ตะกร้าสินค้าของคุณ",
        "cart_empty": "ตะกร้าของคุณยังว่างเปล่า",
        "btn_go_shop": "ไปช้อปเลย",
        "tb_product": "สินค้า",
        "tb_price": "ราคาต่อชิ้น",
        "tb_qty": "จำนวน",
        "tb_total": "ราคารวม",
        "tb_manage": "จัดการ",
        "select_all": "เลือกทั้งหมด",
        "summary_total": "รวมสั่งซื้อ",
        "summary_deposit": "ยอดมัดจำ (50%):",
        "btn_checkout": "ชำระเงิน",

        // --- หน้า Status ---
        "status_title": "รายการสั่งซื้อของคุณ",
        "status_total_items": "ทั้งหมด",
        "status_unit": "รายการ",
        "order_id_label": "หมายเลขคำสั่งซื้อ:",
        "step_requested": "ส่งคำขอสั่งซื้อ<br>โมเดลแล้ว",
        "step_pending": "รอการอนุมัติ",
        "step_production": "ผลิตโมเดล",
        "step_shipped": "จัดส่งแล้ว<br>(รอยืนยัน)",
        "step_rated": "ให้คะแนนแล้ว",
        "btn_rate": "ให้คะแนน",
        "btn_accept": "ยอมรับโมเดล",
        
        // --- หน้า Login ---
        "login_subtitle": "ระบบจัดการร้านค้า",
        "label_email": "อีเมล",
        "label_password": "รหัสผ่าน",
        "btn_login": "เข้าสู่ระบบ",
        "no_account": "ยังไม่มีบัญชีใช่หรือไม่?",
        "link_register": "สมัครสมาชิกที่นี่",

        // --- หน้า Register ---
        "reg_title": "สร้างบัญชีใหม่",
        "reg_subtitle": "กรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการจัดส่ง",
        "reg_section_acc": "ข้อมูลบัญชี (Account)",
        "label_confirm_pass": "ยืนยันรหัสผ่าน *",
        "ph_confirm_pass": "กรอกรหัสผ่านอีกครั้ง",
        "reg_section_ship": "ข้อมูลการจัดส่ง (Shipping Address)",
        "label_fullname": "ชื่อ-นามสกุล ผู้รับ *",
        "ph_fullname": "เช่น สมชาย ใจดี",
        "label_phone": "เบอร์โทรศัพท์ *",
        "ph_phone": "08xxxxxxxx",
        "btn_confirm_reg": "ยืนยันการสมัครสมาชิก",
        "has_account": "มีบัญชีอยู่แล้ว?",
        "link_login": "เข้าสู่ระบบที่นี่",

        // --- หน้า Profile (Sidebar) ---
        "prof_menu_acc": "บัญชีผู้ใช้",
        "prof_menu_addr": "ที่อยู่จัดส่ง",
        "prof_menu_orders": "การซื้อของฉัน",
        "prof_menu_logout": "ออกจากระบบ",

        // --- หน้า Profile (Account Tab) ---
        "prof_acc_title": "ข้อมูลส่วนตัว",
        "label_username": "ชื่อผู้ใช้",
        "label_email_readonly": "อีเมล (แก้ไขไม่ได้)",
        "label_new_pass": "รหัสผ่านใหม่",
        "btn_save_info": "บันทึกข้อมูล",

        // --- หน้า Profile (Address Tab) ---
        "prof_addr_title": "ที่อยู่สำหรับจัดส่งสินค้า",
        "prof_current_addr": "ที่อยู่ปัจจุบัน:",
        "label_province": "จังหวัด",
        "ph_province": "-- เลือกจังหวัด --",
        "label_district": "อำเภอ / เขต",
        "ph_district": "-- เลือกอำเภอ/เขต --",
        "label_subdistrict": "ตำบล / แขวง",
        "ph_subdistrict": "-- เลือกตำบล/แขวง --",
        "label_zipcode": "รหัสไปรษณีย์",
        "label_houseno": "บ้านเลขที่ / หมู่ / อาคาร / ชั้น",
        "ph_houseno": "เช่น 123/45 หมู่บ้านสุขสันต์ ชั้น 3",
        "label_soi": "ซอย (ถ้ามี)",
        "ph_soi": "เช่น ซอยสุขุมวิท 22",
        "label_road": "ถนน (ถ้ามี)",
        "ph_road": "เช่น ถนนสุขุมวิท",
        "btn_update_addr": "อัปเดตที่อยู่ใหม่",

        // --- หน้า Profile (Orders Tab) ---
        "prof_orders_title": "ประวัติการสั่งซื้อ",
        "status_processing": "กำลังดำเนินการ",
        "btn_buy_again": "ซื้ออีกครั้ง",

        // --- คำทั่วไป ---
        "word_qty": "จำนวน",
        "word_piece": "ชิ้น",
        "word_color": "สี",
        "word_material": "วัสดุ",
        "word_size": "ไซส์",
        "btn_delete": "ลบ"
    },
    en: {
        // --- Navbar ---
        "nav_home": "Home",
        "nav_store": "Model Store",
        "nav_status": "Track Status",
        "btn_back_home": "Back to Home",
        
        // --- Index Page ---
        "hero_badge": "New: Sci-Fi 2024 Collection",
        "hero_title_1": "Shape Your World",
        "hero_title_2": "In 3D Vision",
        "hero_desc": "Centralized marketplace for high-quality 3D models curated for creators. <br>Download or order premium-grade 3D prints delivered to you.",
        "btn_shop_now": "Shop Now",
        "category_title": "Categories",
        "cat_all": "All",
        "cat_figure": "Figures",
        "cat_parts": "Parts",
        "cat_decor": "Decor",
        "cat_other": "Others",
        "search_placeholder": "Search model names...",
        "loading_models": "Loading 3D Models...",
        
        // --- Cart Page ---
        "cart_title": "Your Shopping Cart",
        "cart_empty": "Your cart is empty",
        "btn_go_shop": "Go Shopping",
        "tb_product": "Product",
        "tb_price": "Unit Price",
        "tb_qty": "Quantity",
        "tb_total": "Total",
        "tb_manage": "Action",
        "select_all": "Select All",
        "summary_total": "Total Order",
        "summary_deposit": "Deposit Amount (50%):",
        "btn_checkout": "Proceed to Checkout",

        // --- Status Page ---
        "status_title": "Your Order History",
        "status_total_items": "Total",
        "status_unit": "Orders",
        "order_id_label": "Order ID:",
        "step_requested": "Order<br>Requested",
        "step_pending": "Pending<br>Approval",
        "step_production": "In<br>Production",
        "step_shipped": "Shipped<br>(Awaiting)",
        "step_rated": "Rated",
        "btn_rate": "Rate Us",
        "btn_accept": "Accept Item",
        
        // --- Login Page ---
        "login_subtitle": "Store Management System",
        "label_email": "Email",
        "label_password": "Password",
        "btn_login": "Login",
        "no_account": "Don't have an account?",
        "link_register": "Register here",

        // --- Register Page ---
        "reg_title": "Create New Account",
        "reg_subtitle": "Please fill in all details for faster shipping",
        "reg_section_acc": "Account Information",
        "label_confirm_pass": "Confirm Password *",
        "ph_confirm_pass": "Enter password again",
        "reg_section_ship": "Shipping Address",
        "label_fullname": "Full Name *",
        "ph_fullname": "e.g., John Doe",
        "label_phone": "Phone Number *",
        "ph_phone": "e.g., 0812345678",
        "btn_confirm_reg": "Confirm Registration",
        "has_account": "Already have an account?",
        "link_login": "Login here",

        // --- Profile Page (Sidebar) ---
        "prof_menu_acc": "My Account",
        "prof_menu_addr": "Shipping Address",
        "prof_menu_orders": "My Orders",
        "prof_menu_logout": "Logout",

        // --- Profile Page (Account Tab) ---
        "prof_acc_title": "Personal Information",
        "label_username": "Username",
        "label_email_readonly": "Email (Cannot be changed)",
        "label_new_pass": "New Password",
        "btn_save_info": "Save Changes",

        // --- Profile Page (Address Tab) ---
        "prof_addr_title": "Shipping Address Details",
        "prof_current_addr": "Current Address:",
        "label_province": "Province",
        "ph_province": "-- Select Province --",
        "label_district": "District",
        "ph_district": "-- Select District --",
        "label_subdistrict": "Sub-district",
        "ph_subdistrict": "-- Select Sub-district --",
        "label_zipcode": "Postal Code",
        "label_houseno": "House No. / Bldg / Floor",
        "ph_houseno": "e.g., 123/45 Suksan Village",
        "label_soi": "Alley / Soi (Optional)",
        "ph_soi": "e.g., Sukhumvit 22",
        "label_road": "Road (Optional)",
        "ph_road": "e.g., Sukhumvit Rd.",
        "btn_update_addr": "Update Address",

        // --- Profile Page (Orders Tab) ---
        "prof_orders_title": "Order History",
        "status_processing": "Processing",
        "btn_buy_again": "Buy Again",

        // --- Common Words ---
        "word_qty": "Qty",
        "word_piece": "pcs",
        "word_color": "Color",
        "word_material": "Material",
        "word_size": "Size",
        "btn_delete": "Delete"
    }
};

let translations = {};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) throw new Error("No JSON file");
        translations = await response.json();
    } catch (error) {
        // ใช้ Fallback หากหาไฟล์ JSON ไม่เจอ
        translations = fallbackTranslations[lang] || fallbackTranslations['th'];
    }
    
    applyTranslations();
    
    const langDisplays = document.querySelectorAll('#lang-display');
    langDisplays.forEach(el => {
        el.innerText = lang.toUpperCase();
    });
}

function applyTranslations() {
    // 1. แปล HTML ทั่วไป
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.innerHTML = translations[key];
        }
    });

    // 2. แปล Placeholder ในช่องกรอกข้อมูล
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            el.setAttribute('placeholder', translations[key]);
        }
    });
}

window.toggleLanguage = function() {
    let currentLang = localStorage.getItem('app_lang') || 'th';
    let newLang = currentLang === 'th' ? 'en' : 'th';
    
    localStorage.setItem('app_lang', newLang);
    loadTranslations(newLang);
}

// 💡 ฟังก์ชันสำหรับการแปลข้อความที่สร้างผ่าน JavaScript (เช่น ในไฟล์ .js ของคุณ)
window.t = function(key) {
    return translations[key] || key;
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('app_lang') || 'th';
    loadTranslations(savedLang);
});