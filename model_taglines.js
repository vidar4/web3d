// ==============================================================================
// 3D TECH - Model Taglines & Marketing Highlights (TH / EN)
// Provides compelling, professional 3D printing taglines for cards and details
// ==============================================================================

(function() {
    'use strict';

    const CATEGORY_TAGLINES = {
        characters: {
            th: "✨ งานพิมพ์ละเอียด 0.12mm รายละเอียดคมชัดระดับสะสม คัดเลือกสีเส้นพิมพ์ได้ตามใจ",
            en: "✨ Ultra-fine 0.12mm layer print, collector-grade sharp details, custom filament colors."
        },
        scifi: {
            th: "🚀 โมเดลกลไกไซไฟ โครงสร้างแข็งแกร่งพิเศษ ทนความร้อนสูงด้วยเนื้อ PETG/PLA+",
            en: "🚀 Sci-fi mechanical precision, reinforced structural infill, heat-resistant PETG/PLA+."
        },
        architecture: {
            th: "🏛️ ย่อส่วนสมจริงตามไฟล์สถาปัตย์ CAD มิติแม่นยำ เหมาะกับงานจัดแสดงและโต๊ะทำงาน",
            en: "🏛️ True-to-scale CAD architectural replica, high-precision print for showcases and desks."
        },
        interior: {
            th: "🛋️ ดีไซน์มินิมอลโมเดิร์น สไตล์ Japandi ผิวสัมผัสเรียบเนียน เข้าได้กับทุกมุมห้อง",
            en: "🛋️ Modern Japandi minimalist decor, smooth layer lines, matches any interior space."
        },
        props: {
            th: "🛠️ จัดระเบียบสายไฟและแกดเจ็ตได้ลงตัว ออกแบบตามหลักสรีรศาสตร์ แข็งแรงใช้งานจริง",
            en: "🛠️ Ergonomic workspace organizer, tidy cable routing, sturdy functional engineering."
        },
        nature: {
            th: "🐾 ข้อต่อขยับได้ลื่นไหล (Print-in-Place) ไร้รอยต่อ ไม่ต้องทากาว ประกอบเสร็จในตัว",
            en: "🐾 Seamless Print-in-Place articulated joints, fluid movement with no glue required."
        },
        art: {
            th: "🎨 ประติมากรรมเรขาคณิตสามมิติ เส้นสาย Voronoi พริ้วไหว ยกระดับมุมมองทางศิลปะ",
            en: "🎨 Parametric Voronoi geometric sculpture, fluid contours, striking aesthetic centerpiece."
        },
        "ของเล่น": {
            th: "🦖 ของเล่นกลไกข้อต่อขยับดัดได้อิสระ ปลอดภัย ไร้สารเคมีตกค้าง สนุกคลายเครียด",
            en: "🦖 Articulated sensory desk toy, non-toxic eco filament, great for stress relief."
        },
        "กล่อง": {
            th: "📦 กล่องเก็บของฝาเกลียวล็อกแน่นหนา ลวดลายมีสไตล์ ป้องกันฝุ่นละออง",
            en: "📦 Precision threaded storage container, airtight twist cap, dustproof stylish finish."
        },
        "กระถางต้นไม้": {
            th: "🌱 กระถางต้นไม้ระบายน้ำได้ดี กันน้ำซึม ดีไซน์เกลียวสไปรัลสุดโมเดิร์น",
            en: "🌱 Self-draining waterproof planter, contemporary spiral geometry, lightweight."
        },
        "กรวย": {
            th: "⚡ ชุดกรวยกรองความแม่นยำสูง ปากเรียวบาง ไหลลื่นไม่หกเลอะเทอะ",
            en: "⚡ High-accuracy laboratory funnel set, smooth internal wall, non-spill pouring."
        },
        "พวงกุญแจ": {
            th: "🔑 พวงกุญแจ 3 มิติสีสันสดใส น้ำหนักเบา ทนทานต่อการขีดข่วน พกพาสะดวก",
            en: "🔑 Vibrant 3D printed keychain, ultralight, scratch-resistant everyday carry."
        },
        "พาเหลด": {
            th: "🪵 พาเลทจำลองสเกล 1:20 แข็งแรงทนทาน ใช้เป็นที่วางของและพร็อพจัดฉาก",
            en: "🪵 1:20 scale miniature pallet, strong grid infill, great desk coaster and photo prop."
        }
    };

    const SPECIFIC_TAGLINES = {
        "Flexi Rex": {
            th: "🦖 ข้อต่อไดโนเสาร์ขยับดัดได้รอบทิศ โมเดลยอดนิยมตลอดกาลจาก Thingiverse",
            en: "🦖 Fully articulated dinosaur joints, legendary 3D printing classic from Thingiverse."
        },
        "Charizard pokemon Skeleton Figure Dragon Fossil": {
            th: "🔥 โครงกระดูกมังกรฟอสซิลความละเอียดสูง รายละเอียดข้อต่อกระดูกคมชัดระดับมิวเซียม",
            en: "🔥 High-detail dragon fossil skeleton, museum-quality articulated bone structure."
        },
        "Japandi easter eggs (container)": {
            th: "🥚 ไข่เปิดฝาเกลียวสไตล์ญี่ปุ่น-สแกนดิเนเวีย ผิวสัมผัสแมตต์มินิมอล ใส่ของกระจุกกระจิกได้",
            en: "🥚 Japandi screw-top egg capsule, matte minimal texture, stores small trinkets."
        },
        "Mini Monster Truck": {
            th: "🚙 รถบิ๊กฟุตล้อหมุนได้อิสระ สปริงข้อต่อรับแรงกระแทกได้จริง แข็งแรงทนทาน",
            en: "🚙 Free-rolling monster truck with compliant spring suspension, impact-resistant."
        },
        "Self Watering Planter Pot": {
            th: "🌿 กระถางระบบจ่ายน้ำอัตโนมัติ ไม่ต้องรดน้ำบ่อย เหมาะสำหรับวางบนโต๊ะทำงาน",
            en: "🌿 Self-watering reservoir planter, low maintenance, perfect for work desks."
        },
        "Nest Planter": {
            th: "🪹 กระถางทรงรังนกเส้นสานสามมิติ โปร่งสบาย รากหายใจได้ดี ดีไซน์โดดเด่น",
            en: "🪹 3D woven nest planter, high breathability for roots, striking organic design."
        }
    };

    window.getModelTagline = function(model, lang) {
        if (!model) return '';
        const currentLang = lang || localStorage.getItem('my_site_lang') || 'th';
        const name = model.model_name || '';

        // 1. Specific match
        for (const [key, val] of Object.entries(SPECIFIC_TAGLINES)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return currentLang === 'en' ? val.en : val.th;
            }
        }

        // 2. Category match
        const cat = model.parent_id;
        if (cat && CATEGORY_TAGLINES[cat]) {
            return currentLang === 'en' ? CATEGORY_TAGLINES[cat].en : CATEGORY_TAGLINES[cat].th;
        }

        // 3. Keyword matching
        const lower = name.toLowerCase();
        if (lower.includes('dragon') || lower.includes('มังกร') || lower.includes('flexi')) {
            return currentLang === 'en' 
                ? "✨ Smooth print-in-place articulation, no glue needed, flexible desk buddy."
                : "✨ ข้อต่อปริ้นท์สำเร็จในตัว ขยับดัดได้ลื่นไหล ไม่ต้องใช้กาว สนุกทุกการสัมผัส";
        }
        if (lower.includes('vase') || lower.includes('แจกัน') || lower.includes('planter') || lower.includes('กระถาง')) {
            return currentLang === 'en'
                ? "🌱 Waterproof spiral vase design, crisp filament layer sheen, modern home aesthetic."
                : "🌱 กันน้ำซึม ลวดลายเกลียวสไปรัลโมเดิร์น เส้นเลเยอร์เงางาม เพิ่มสีสันให้บ้าน";
        }
        if (lower.includes('holder') || lower.includes('stand') || lower.includes('organizer') || lower.includes('จัดโต๊ะ')) {
            return currentLang === 'en'
                ? "🛠️ Precision desk gear organizer, robust infill density, fits standard tech accessories."
                : "🛠️ อุปกรณ์จัดโต๊ะทำงานความเที่ยงตรงสูง แข็งแรงแน่นหนา รองรับแกดเจ็ตได้ลงตัว";
        }

        // 4. Default fallback
        return currentLang === 'en'
            ? "⚡ Premium 3D printed piece, top-grade filament, fully customizable colors and sizes."
            : "⚡ ชิ้นงานพิมพ์ 3 มิติเกรดพรีเมียม คัดเกรดเส้นพิมพ์ ปรับแต่งขนาดและสีได้อิสระ";
    };
})();
