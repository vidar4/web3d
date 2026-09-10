// ==============================================================================
// 3D TECH - Native Client-Side Bilingual i18n System (TH / EN)
// Fast, zero-network, zero-reload translation engine
// ==============================================================================

const I18N_DICTIONARY = {
    th: {
        // --- Navbar & Navigation ---
        "nav_brand": "3D TECH",
        "nav_home": "หน้าแรก",
        "nav_store": "คลังโมเดล",
        "nav_status": "ติดตามสถานะ",
        "nav_to_pay": "ที่ต้องชำระ",
        "nav_cart": "ตะกร้าสินค้า",
        "nav_profile": "โปรไฟล์",
        "nav_admin": "ระบบแอดมิน",
        "nav_login": "เข้าสู่ระบบ",
        "nav_register": "สมัครสมาชิก",
        "nav_logout": "ออกจากระบบ",
        "btn_back_home": "กลับไปหน้าหลัก",
        "drawer_home": "หน้าแรก (Home)",
        "drawer_catalog": "คลังโมเดล 3D (Catalog)",
        "drawer_cart": "ตะกร้าสินค้า (Cart)",
        "drawer_to_pay": "ที่ต้องชำระ (To Pay)",
        "drawer_status": "ติดตามสถานะ (Orders)",
        "drawer_profile": "ข้อมูลส่วนตัว (Profile)",
        "drawer_admin": "ระบบแอดมิน (Backoffice)",
        "drawer_lang": "ภาษา (Language)",
        "guest_user": "ผู้เยี่ยมชม",

        // --- Index / Catalog Page ---
        "hero_badge": "มาใหม่: คอลเลกชัน MakerWorld 3D 2026",
        "hero_title_1": "เนรมิตโลก",
        "hero_title_2": "ในแบบ 3 มิติ",
        "hero_desc": "ศูนย์รวมโมเดล 3D คุณภาพสูงจาก MakerWorld ที่คัดสรรมาเพื่อคุณ <br class=\"hidden sm:inline\">ดาวน์โหลดไฟล์หรือสั่งพิมพ์ด้วยวัสดุเกรดพรีเมียม ส่งตรงถึงบ้านคุณ",
        "btn_shop_now": "เริ่มเลือกซื้อ",
        "category_title": "หมวดหมู่โมเดล 3D",
        "cat_all": "ทั้งหมด (All)",
        "cat_characters": "ฟิกเกอร์ & ตัวละคร",
        "cat_scifi": "ไซไฟ & ยานพาหนะ",
        "cat_architecture": "สถาปัตยกรรม",
        "cat_interior": "ของแต่งบ้าน & เฟอร์นิเจอร์",
        "cat_props": "อุปกรณ์ & แกดเจ็ต",
        "cat_nature": "ธรรมชาติ & สัตว์",
        "cat_art": "ศิลปะ & ประติมากรรม",
        "cat_other": "ทั่วไป",
        "search_placeholder": "ค้นหาชื่อโมเดล MakerWorld 3D...",
        "loading_models": "กำลังโหลดโมเดล 3D...",
        "no_models_found": "ไม่พบโมเดลที่คุณค้นหา",
        "no_models_hint": "ลองเปลี่ยนหมวดหมู่หรือคำค้นหาใหม่ดูนะ",
        "reset_filters": "กลับไปดูสินค้าทั้งหมด",
        "view_details": "ดูรายละเอียด",
        "starting_price": "เริ่มต้น",
        "currency": "฿",

        // --- Product Detail Page ---
        "detail_badge_hot": "โมเดลยอดนิยม MakerWorld",
        "detail_tab_3d": "มุมมอง 3 มิติ (3D)",
        "detail_tab_2d": "แกลเลอรีรูปภาพ (2D)",
        "detail_spec_title": "ข้อมูลจำเพาะของโมเดล",
        "detail_select_color": "เลือกสีเส้นพิมพ์ (Color Hunt):",
        "detail_select_material": "เลือกชนิดวัสดุ:",
        "detail_select_size": "เลือกขนาดพิมพ์:",
        "detail_custom_size": "กำหนดขนาดเอง (Custom cm)",
        "detail_dim_w": "กว้าง (cm)",
        "detail_dim_l": "ยาว (cm)",
        "detail_dim_h": "สูง (cm)",
        "detail_calc_price": "คำนวณราคา",
        "detail_qty": "จำนวน:",
        "detail_total_price": "ราคารวมสุทธิ:",
        "btn_add_cart": "ใส่ตะกร้า",
        "btn_buy_now": "สั่งพิมพ์ทันที",
        "detail_review_title": "รีวิวจากลูกค้า",
        "detail_no_review": "ยังไม่มีรีวิว เป็นคนแรกที่รีวิวโมเดลนี้!",

        // --- Cart Page ---
        "cart_title": "ตะกร้าสินค้าของคุณ",
        "cart_empty": "ตะกร้าของคุณยังว่างเปล่า",
        "btn_go_shop": "ไปเลือกซื้อโมเดล",
        "tb_product": "สินค้า",
        "tb_price": "ราคาต่อชิ้น",
        "tb_qty": "จำนวน",
        "tb_total": "ราคารวม",
        "tb_manage": "จัดการ",
        "select_all": "เลือกทั้งหมด",
        "summary_total": "ยอดรวมสินค้า",
        "summary_deposit": "ยอดมัดจำที่ต้องชำระ (50%):",
        "btn_checkout": "ดำเนินการชำระเงิน",

        // --- Payment & Checkout ---
        "pay_title": "ยืนยันการสั่งซื้อ & ชำระเงิน",
        "pay_shipping_info": "ที่อยู่สำหรับจัดส่ง",
        "pay_select_addr": "เปลี่ยนที่อยู่",
        "pay_items_summary": "สรุปรายการที่สั่งซื้อ",
        "pay_transfer_title": "โอนเงินผ่านพร้อมเพย์ (PromptPay)",
        "pay_scan_qr": "สแกน QR Code เพื่อชำระเงินมัดจำ 50%",
        "pay_upload_slip": "แนบสลิปหลักฐานการโอนเงิน",
        "btn_confirm_order": "ยืนยันการสั่งพิมพ์",

        // --- Status Page ---
        "status_title": "รายการสั่งซื้อของคุณ",
        "status_total_items": "ทั้งหมด",
        "status_unit": "รายการ",
        "order_id_label": "หมายเลขคำสั่งซื้อ:",
        "step_requested": "ส่งคำขอสั่งซื้อ<br>โมเดลแล้ว",
        "step_pending": "รอการอนุมัติ<br>และพิมพ์",
        "step_production": "กำลังพิมพ์<br>โมเดล 3D",
        "step_shipped": "จัดส่งแล้ว<br>(รอยืนยัน)",
        "step_rated": "สำเร็จแล้ว",
        "btn_rate": "ให้คะแนน",
        "btn_accept": "ยอมรับสินค้า",

        // --- To-Pay Page ---
        "topay_title": "รายการที่ต้องชำระเงิน",
        "topay_desc": "รายการคำสั่งซื้อที่รอการชำระมัดจำหรือชำระส่วนที่เหลือ",
        "topay_empty": "ไม่มีรายการที่ต้องชำระในขณะนี้",
        "btn_pay_deposit": "ชำระเงินมัดจำ",
        "btn_pay_balance": "ชำระเงินส่วนที่เหลือ",

        // --- Login Page ---
        "login_title": "ยินดีต้อนรับสู่ 3D TECH",
        "login_subtitle": "เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและข้อมูลของคุณ",
        "label_email": "อีเมล (Email)",
        "ph_email": "email@example.com",
        "label_password": "รหัสผ่าน (Password)",
        "ph_password": "กรอกรหัสผ่านของคุณ",
        "btn_login": "เข้าสู่ระบบ",
        "no_account": "ยังไม่มีบัญชีใช่หรือไม่?",
        "link_register": "สมัครสมาชิกใหม่ที่นี่",

        // --- Register Page ---
        "reg_title": "สร้างบัญชีใหม่",
        "reg_subtitle": "กรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการจัดส่ง",
        "reg_section_acc": "ข้อมูลบัญชี (Account)",
        "label_fullname": "ชื่อ-นามสกุล ผู้รับ *",
        "ph_fullname": "เช่น สมชาย ใจดี",
        "label_phone": "เบอร์โทรศัพท์ *",
        "ph_phone": "08xxxxxxxx",
        "label_confirm_pass": "ยืนยันรหัสผ่าน *",
        "ph_confirm_pass": "กรอกรหัสผ่านอีกครั้ง",
        "reg_section_ship": "ข้อมูลการจัดส่ง (Shipping Address)",
        "label_houseno": "บ้านเลขที่ / หมู่ / อาคาร / ชั้น *",
        "ph_houseno": "เช่น 123/45 หมู่ 1 อาคารสุขสันต์ ชั้น 3",
        "label_soi": "ซอย (ถ้ามี)",
        "ph_soi": "เช่น ซอยสุขุมวิท 1",
        "label_road": "ถนน (ถ้ามี)",
        "ph_road": "เช่น ถนนสุขุมวิท",
        "label_subdistrict": "ตำบล / แขวง *",
        "ph_subdistrict": "พิมพ์ชื่อตำบลเพื่อค้นหาอัตโนมัติ...",
        "label_district": "อำเภอ / เขต *",
        "ph_district": "ระบบจะกรอกให้อัตโนมัติ",
        "label_province": "จังหวัด *",
        "ph_province": "ระบบจะกรอกให้อัตโนมัติ",
        "label_zipcode": "รหัสไปรษณีย์ *",
        "ph_zipcode": "ระบบจะกรอกให้อัตโนมัติ",
        "btn_confirm_reg": "ยืนยันการสมัครสมาชิก",
        "has_account": "มีบัญชีอยู่แล้ว?",
        "link_login": "เข้าสู่ระบบที่นี่",

        // --- Profile Page ---
        "prof_menu_acc": "ข้อมูลบัญชี",
        "prof_menu_addr": "ที่อยู่จัดส่งของฉัน",
        "prof_menu_orders": "ประวัติการสั่งซื้อ",
        "prof_menu_logout": "ออกจากระบบ",
        "prof_acc_title": "ข้อมูลส่วนตัว",
        "label_username": "ชื่อผู้ใช้",
        "label_email_readonly": "อีเมล (แก้ไขไม่ได้)",
        "label_new_pass": "รหัสผ่านใหม่ (หากต้องการเปลี่ยน)",
        "btn_save_info": "บันทึกข้อมูล",
        "prof_addr_title": "ที่อยู่สำหรับจัดส่งสินค้า",
        "btn_add_new_addr": "+ เพิ่มที่อยู่ใหม่",
        "addr_default_badge": "ที่อยู่เริ่มต้น",
        "btn_set_default": "ตั้งเป็นค่าเริ่มต้น",
        "btn_edit": "แก้ไข",
        "btn_delete": "ลบ",

        // --- Admin Page ---
        "admin_title": "ระบบจัดการร้านค้า (Admin Backoffice)",
        "admin_orders": "ภาพรวมออเดอร์",
        "admin_add_model": "เพิ่มโมเดล",
        "admin_manage_models": "จัดการและแก้ไขโมเดล",
        "admin_reviews": "ดูรีวิวจากลูกค้า",
        "admin_badge_admin": "แอดมิน",
        "admin_tab_dashboard": "แดชบอร์ด",
        "admin_tab_orders": "รายการคำสั่งซื้อ",
        "admin_tab_models": "คลังโมเดล 3D",
        "admin_tab_add_model": "เพิ่มโมเดลใหม่",
        "admin_tab_reviews": "จัดการรีวิว",
        "admin_btn_add": "+ เพิ่มโมเดลใหม่",
        "admin_search_order": "ค้นหาเลขออเดอร์หรือชื่อผู้รับ...",
        "admin_model_name": "ชื่อโมเดล 3D *",
        "admin_model_cat": "หมวดหมู่สินค้า *",
        "admin_model_price": "ราคาพื้นฐาน (฿) *",
        "admin_color_hunt_title": "จานสีจาก Color Hunt (คลิกเพื่อเพิ่มด่วน):",
        "admin_upload_images": "รูปภาพโมเดล (รูปหลัก + รูปมุมมองเสริม):",
        "admin_model_3d_file": "ลิงก์ไฟล์โมเดล 3D (.glb / .gltf):",
        "btn_save_model": "บันทึกโมเดล 3D",
        "filter_all": "ทั้งหมด",
        "filter_pending": "รอการอนุมัติ",
        "filter_wait_pay": "รอชำระเงิน",
        "filter_wait_slip": "รอตรวจสลิป",
        "filter_producing": "กำลังผลิต",
        "filter_done": "เสร็จสิ้นแล้ว",
        "filter_cancelled": "ยกเลิกแล้ว",

        // --- Common Words ---
        "word_qty": "จำนวน",
        "word_piece": "ชิ้น",
        "word_color": "สี",
        "word_material": "วัสดุ",
        "word_size": "ขนาด",
        "word_status": "สถานะ",
        "word_date": "วันที่",
        "word_action": "การกระทำ",
        "word_deposit": "มัดจำ 50%",
        "word_balance": "ยอดคงเหลือ",
        "word_baht": "บาท",
        "word_cm": "ซม.",
        "msg_copied": "คัดลอกสำเร็จ!"
    },
    en: {
        // --- Navbar & Navigation ---
        "nav_brand": "3D TECH",
        "nav_home": "Home",
        "nav_store": "Catalog",
        "nav_status": "Orders",
        "nav_to_pay": "To Pay",
        "nav_cart": "Cart",
        "nav_profile": "Profile",
        "nav_admin": "Admin",
        "nav_login": "Login",
        "nav_register": "Register",
        "nav_logout": "Logout",
        "btn_back_home": "Back to Home",
        "drawer_home": "Home",
        "drawer_catalog": "3D Models Catalog",
        "drawer_cart": "Shopping Cart",
        "drawer_to_pay": "Pending Payments",
        "drawer_status": "Order Tracking",
        "drawer_profile": "My Profile",
        "drawer_admin": "Backoffice Admin",
        "drawer_lang": "Language",
        "guest_user": "Guest User",

        // --- Index / Catalog Page ---
        "hero_badge": "New Arrival: MakerWorld 3D Collection 2026",
        "hero_title_1": "Bring Your Ideas",
        "hero_title_2": "Into 3D Reality",
        "hero_desc": "Curated high-quality 3D printing models from MakerWorld. <br class=\"hidden sm:inline\">Download files or order on-demand printing with premium materials delivered directly to your door.",
        "btn_shop_now": "Explore Store",
        "category_title": "3D Model Categories",
        "cat_all": "All Models",
        "cat_characters": "Figures & Characters",
        "cat_scifi": "Sci-Fi & Vehicles",
        "cat_architecture": "Architecture",
        "cat_interior": "Home & Decor",
        "cat_props": "Props & Gadgets",
        "cat_nature": "Nature & Animals",
        "cat_art": "Art & Sculptures",
        "cat_other": "General",
        "search_placeholder": "Search MakerWorld 3D models...",
        "loading_models": "Loading 3D models...",
        "no_models_found": "No models match your search",
        "no_models_hint": "Try adjusting your category filter or search keywords",
        "reset_filters": "View All Models",
        "view_details": "View Details",
        "starting_price": "From",
        "currency": "฿",

        // --- Product Detail Page ---
        "detail_badge_hot": "MakerWorld Featured Model",
        "detail_tab_3d": "3D Interactive View",
        "detail_tab_2d": "Image Gallery (2D)",
        "detail_spec_title": "Model Specifications",
        "detail_select_color": "Select Filament Color (Color Hunt):",
        "detail_select_material": "Select Material:",
        "detail_select_size": "Select Print Size:",
        "detail_custom_size": "Custom Dimensions (cm)",
        "detail_dim_w": "Width (cm)",
        "detail_dim_l": "Length (cm)",
        "detail_dim_h": "Height (cm)",
        "detail_calc_price": "Calculate Price",
        "detail_qty": "Quantity:",
        "detail_total_price": "Total Price:",
        "btn_add_cart": "Add to Cart",
        "btn_buy_now": "Order Print Now",
        "detail_review_title": "Customer Reviews",
        "detail_no_review": "No reviews yet. Be the first to review this model!",

        // --- Cart Page ---
        "cart_title": "Your Shopping Cart",
        "cart_empty": "Your cart is currently empty",
        "btn_go_shop": "Browse 3D Catalog",
        "tb_product": "Product",
        "tb_price": "Unit Price",
        "tb_qty": "Quantity",
        "tb_total": "Total",
        "tb_manage": "Action",
        "select_all": "Select All",
        "summary_total": "Total Amount",
        "summary_deposit": "Deposit Due (50%):",
        "btn_checkout": "Proceed to Checkout",

        // --- Payment & Checkout ---
        "pay_title": "Confirm Order & Payment",
        "pay_shipping_info": "Shipping Address",
        "pay_select_addr": "Change Address",
        "pay_items_summary": "Order Summary",
        "pay_transfer_title": "PromptPay QR Payment",
        "pay_scan_qr": "Scan QR code to pay 50% initial deposit",
        "pay_upload_slip": "Upload Bank Payment Slip",
        "btn_confirm_order": "Confirm 3D Print Order",

        // --- Status Page ---
        "status_title": "Your Order Tracking",
        "status_total_items": "Total",
        "status_unit": "Orders",
        "order_id_label": "Order ID:",
        "step_requested": "Order<br>Submitted",
        "step_pending": "Approval &<br>Queued",
        "step_production": "3D Printing<br>In Progress",
        "step_shipped": "Dispatched<br>(Delivered)",
        "step_rated": "Completed",
        "btn_rate": "Leave Review",
        "btn_accept": "Accept Model",

        // --- To-Pay Page ---
        "topay_title": "Pending Payments",
        "topay_desc": "Orders awaiting initial deposit or final balance payment",
        "topay_empty": "No outstanding bills at this time",
        "btn_pay_deposit": "Pay 50% Deposit",
        "btn_pay_balance": "Pay Remaining Balance",

        // --- Login Page ---
        "login_title": "Welcome to 3D TECH",
        "login_subtitle": "Login to access your orders and customized 3D prints",
        "label_email": "Email Address",
        "ph_email": "email@example.com",
        "label_password": "Password",
        "ph_password": "Enter your password",
        "btn_login": "Sign In",
        "no_account": "Don't have an account yet?",
        "link_register": "Create an account",

        // --- Register Page ---
        "reg_title": "Create Account",
        "reg_subtitle": "Fill in your details for fast shipping and order tracking",
        "reg_section_acc": "Account Details",
        "label_fullname": "Recipient Full Name *",
        "ph_fullname": "e.g., John Smith",
        "label_phone": "Phone Number *",
        "ph_phone": "08xxxxxxxx",
        "label_confirm_pass": "Confirm Password *",
        "ph_confirm_pass": "Re-enter your password",
        "reg_section_ship": "Shipping Address",
        "label_houseno": "House No. / Building / Floor *",
        "ph_houseno": "e.g., 123/45 Sukhumvit Soi 1",
        "label_soi": "Alley / Soi (Optional)",
        "ph_soi": "e.g., Soi 1",
        "label_road": "Road (Optional)",
        "ph_road": "e.g., Sukhumvit Road",
        "label_subdistrict": "Sub-district (Tambon) *",
        "ph_subdistrict": "Type subdistrict to autocomplete...",
        "label_district": "District (Amphoe) *",
        "ph_district": "Auto-filled by system",
        "label_province": "Province (Changwat) *",
        "ph_province": "Auto-filled by system",
        "label_zipcode": "Postal Code *",
        "ph_zipcode": "Auto-filled by system",
        "btn_confirm_reg": "Complete Registration",
        "has_account": "Already have an account?",
        "link_login": "Sign in here",

        // --- Profile Page ---
        "prof_menu_acc": "Account Details",
        "prof_menu_addr": "Shipping Addresses",
        "prof_menu_orders": "Order History",
        "prof_menu_logout": "Sign Out",
        "prof_acc_title": "Personal Information",
        "label_username": "Full Name",
        "label_email_readonly": "Email (Permanent)",
        "label_new_pass": "New Password (Leave blank to keep)",
        "btn_save_info": "Save Changes",
        "prof_addr_title": "Saved Shipping Addresses",
        "btn_add_new_addr": "+ Add New Address",
        "addr_default_badge": "Default Address",
        "btn_set_default": "Set as Default",
        "btn_edit": "Edit",
        "btn_delete": "Delete",

        // --- Admin Page ---
        "admin_title": "Admin Backoffice Management",
        "admin_orders": "Orders Overview",
        "admin_add_model": "Add Model",
        "admin_manage_models": "Manage Models",
        "admin_reviews": "Customer Reviews",
        "admin_badge_admin": "Admin",
        "admin_tab_dashboard": "Dashboard",
        "admin_tab_orders": "Customer Orders",
        "admin_tab_models": "3D Models Catalog",
        "admin_tab_add_model": "Add New Model",
        "admin_tab_reviews": "Reviews",
        "admin_btn_add": "+ Add New Model",
        "admin_search_order": "Search order ID or customer name...",
        "admin_model_name": "3D Model Name *",
        "admin_model_cat": "Category *",
        "admin_model_price": "Base Price (฿) *",
        "admin_color_hunt_title": "Color Hunt Palettes (Quick Add):",
        "admin_upload_images": "Model Imagery (Main + Angles):",
        "admin_model_3d_file": "3D Model Asset URL (.glb / .gltf):",
        "btn_save_model": "Save 3D Model",
        "filter_all": "All",
        "filter_pending": "Pending Approval",
        "filter_wait_pay": "Awaiting Payment",
        "filter_wait_slip": "Verifying Slip",
        "filter_producing": "In Production",
        "filter_done": "Completed",
        "filter_cancelled": "Cancelled",

        // --- Common Words ---
        "word_qty": "Qty",
        "word_piece": "pcs",
        "word_color": "Color",
        "word_material": "Material",
        "word_size": "Size",
        "word_status": "Status",
        "word_date": "Date",
        "word_action": "Action",
        "word_deposit": "Deposit 50%",
        "word_balance": "Balance Due",
        "word_baht": "THB",
        "word_cm": "cm",
        "msg_copied": "Copied to clipboard!"
    }
};

// Current active language: default 'th'
let currentLanguage = localStorage.getItem('my_site_lang') || localStorage.getItem('app_lang') || 'th';

function getTranslation(key) {
    const dict = I18N_DICTIONARY[currentLanguage] || I18N_DICTIONARY['th'];
    return dict[key] || I18N_DICTIONARY['th'][key] || key;
}

function applyAllTranslations(lang) {
    if (lang) currentLanguage = lang;
    document.documentElement.lang = currentLanguage;

    // 1. Text content replacement for data-i18n
    const textEls = document.querySelectorAll('[data-i18n]');
    textEls.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = getTranslation(key);
        if (translated) {
            el.innerHTML = translated;
        }
    });

    // 2. Placeholder replacement for data-i18n-placeholder
    const placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderEls.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = getTranslation(key);
        if (translated) {
            el.setAttribute('placeholder', translated);
        }
    });

    // 3. Title attribute replacement
    const titleEls = document.querySelectorAll('[data-i18n-title]');
    titleEls.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = getTranslation(key);
        if (translated) {
            el.setAttribute('title', translated);
        }
    });

    // 4. Update all language indicator badges across headers and drawers
    const displays = document.querySelectorAll('#lang-display, #drawer-lang-display, .lang-display-text');
    displays.forEach(d => {
        d.innerText = currentLanguage.toUpperCase();
    });
}

function toggleLanguage() {
    const nextLang = currentLanguage === 'th' ? 'en' : 'th';
    setLanguage(nextLang);
}

function setLanguage(lang) {
    currentLanguage = (lang === 'en' ? 'en' : 'th');
    localStorage.setItem('my_site_lang', currentLanguage);
    localStorage.setItem('app_lang', currentLanguage);

    applyAllTranslations(currentLanguage);

    // Notify other components via custom event
    try {
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLanguage } }));
    } catch(e) {}
}

// Global exposure
window.t = getTranslation;
window.toggleLanguage = toggleLanguage;
window.setLanguage = setLanguage;
window.applyTranslations = applyAllTranslations;
window.getCurrentLanguage = () => currentLanguage;

document.addEventListener('DOMContentLoaded', () => {
    applyAllTranslations(currentLanguage);
});