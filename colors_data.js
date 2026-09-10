// ==============================================================================
// 3D TECH - Curated 3D Printing Filament Colors from Color Hunt (colorhunt.co)
// Single Colors extracted from top-rated palettes with Thai & English naming
// ==============================================================================

const COLOR_HUNT_FILAMENTS = [
    // --- Neutral & Monochromatic ---
    { id: 'c_white', name_th: 'ขาวมุกอาร์กติก', name_en: 'Arctic Pearl White', hex: '#F8FAFC', price: 0, category: 'neutral' },
    { id: 'c_black', name_th: 'ดำด้านสเตลท์', name_en: 'Matte Stealth Black', hex: '#18181B', price: 0, category: 'neutral' },
    { id: 'c_silver', name_th: 'เงินเมทัลลิก', name_en: 'Metallic Silver', hex: '#94A3B8', price: 15, category: 'neutral' },
    { id: 'c_titanium', name_th: 'เทาไททาเนียมชาร์โคล', name_en: 'Charcoal Titanium', hex: '#334155', price: 10, category: 'neutral' },

    // --- Pastel Collection (Color Hunt Top Picks) ---
    { id: 'c_pastel_blue', name_th: 'ฟ้าพาสเทลสกาย', name_en: 'Pastel Sky Blue', hex: '#66A3BF', price: 10, category: 'pastel' },
    { id: 'c_mint', name_th: 'เขียวมินต์เซจ', name_en: 'Sage Mint Green', hex: '#A3D9C9', price: 10, category: 'pastel' },
    { id: 'c_sakura', name_th: 'ชมพูซากุระ', name_en: 'Sakura Blossom Pink', hex: '#F8B2B2', price: 10, category: 'pastel' },
    { id: 'c_lavender', name_th: 'ม่วงพาสเทลลาเวนเดอร์', name_en: 'Pastel Lavender', hex: '#C4B5FD', price: 10, category: 'pastel' },
    { id: 'c_cream', name_th: 'ครีมวานิลลาบัตเตอร์', name_en: 'Vanilla Cream Butter', hex: '#FFF1D1', price: 5, category: 'pastel' },
    { id: 'c_peach', name_th: 'พีชอบอุ่น', name_en: 'Warm Peach', hex: '#F9D2BA', price: 10, category: 'pastel' },

    // --- Vibrant & Cyber Neon ---
    { id: 'c_cyan', name_th: 'นีออนไซเบอร์ไซยาน', name_en: 'Cyber Neon Cyan', hex: '#00B7CD', price: 15, category: 'vibrant' },
    { id: 'c_orange', name_th: 'ส้มซันเซ็ตสดใส', name_en: 'Vibrant Sunset Orange', hex: '#FF9100', price: 15, category: 'vibrant' },
    { id: 'c_crimson', name_th: 'แดงคริมสันเชอร์รี่', name_en: 'Crimson Cherry Red', hex: '#DF301C', price: 15, category: 'vibrant' },
    { id: 'c_yellow', name_th: 'เหลืองมัสตาร์ดสว่าง', name_en: 'Bright Mustard Yellow', hex: '#FFD166', price: 10, category: 'vibrant' },
    { id: 'c_purple', name_th: 'ม่วงนีออนไซเบอร์พังค์', name_en: 'Cyberpunk Neon Purple', hex: '#8B639B', price: 20, category: 'vibrant' },
    { id: 'c_electric_blue', name_th: 'น้ำเงินอิเล็กทริก', name_en: 'Electric Royal Blue', hex: '#2563EB', price: 15, category: 'vibrant' },

    // --- Nature & Earthy Tones ---
    { id: 'c_forest', name_th: 'เขียวมรกตไพร', name_en: 'Deep Forest Jade', hex: '#1D4533', price: 15, category: 'nature' },
    { id: 'c_olive', name_th: 'เขียวมะกอกมอสส์', name_en: 'Moss Olive Green', hex: '#708238', price: 10, category: 'nature' },
    { id: 'c_ocean', name_th: 'น้ำเงินดีพโอเชียน', name_en: 'Deep Ocean Navy', hex: '#1E3A8A', price: 15, category: 'nature' },
    { id: 'c_terracotta', name_th: 'ดินเผาเทอราคอตตา', name_en: 'Warm Terracotta', hex: '#8C432A', price: 15, category: 'nature' },
    { id: 'c_chocolate', name_th: 'น้ำตาลมอคค่าเข้ม', name_en: 'Rich Mocha Brown', hex: '#4A2C1D', price: 10, category: 'nature' }
];

if (typeof window !== 'undefined') {
    window.COLOR_HUNT_FILAMENTS = COLOR_HUNT_FILAMENTS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COLOR_HUNT_FILAMENTS };
}
