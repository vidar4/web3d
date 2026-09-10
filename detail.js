// =========================================================
// 1. Config & State
// =========================================================
const supabaseUrl = 'https://ucvxitvclmcsnktfrbvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnhpdHZjbG1jc25rdGZyYnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjI5MDQsImV4cCI6MjA3NzczODkwNH0.yD8Fyo-66vUb3K1XFVjIFraYlN4NBWo3RCKfqQYThvI'; 
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentModel = null;
let selectedColor = null;
let selectedMaterial = null;
let selectedSize = '100%'; 
let quantity = 1;
let extraColorPrice = 0;
let extraMaterialPrice = 0;
let sizeMultiplier = 1.0; 

document.addEventListener('DOMContentLoaded', async () => {
    checkUser();
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { window.location.href = 'index.html'; return; }
    
    await loadModelDetail(id);
    await loadReviews(id); 
    
    updateCartBadge();
    document.getElementById('add-to-cart-btn')?.addEventListener('click', addToCart);
});

function checkUser() {
    const user = localStorage.getItem('user_name');
    const welcomeEl = document.getElementById('welcomeUser');
    if (user && welcomeEl) {
        welcomeEl.innerText = user;
        welcomeEl.classList.remove('hidden');
        if (welcomeEl.parentElement && welcomeEl.parentElement.tagName === 'A') {
            welcomeEl.parentElement.href = 'profile.html';
        }
    }
}

function getModelImageUrl(fileName) {
    if (!fileName) return 'https://placehold.co/600x600/f8fafc/94a3b8?text=No+Image';
    if (fileName.startsWith('http')) return fileName;
    return `${supabaseUrl}/storage/v1/object/public/model_images/${fileName}`;
}

// =========================================================
// 2. Load Data & Render UI
// =========================================================
async function loadModelDetail(id) {
    try {
        const { data: model, error } = await db.from('model').select('*').eq('model_id', id).single();
        if (error) throw error;
        currentModel = model;
        renderUI(model);
    } catch(err) {
        console.error("Fetch Error:", err);
        alert("ไม่พบข้อมูลสินค้านี้");
        window.location.href = 'index.html';
    }
}


let currentMediaView = '3d';
let model3dUrl = null;

window.switchMediaView = function(mode) {
    currentMediaView = mode;
    const btn3d = document.getElementById('btn-view-3d');
    const btn2d = document.getElementById('btn-view-2d');
    const mvContainer = document.getElementById('model-viewer-container');
    const imgContainer = document.getElementById('image-viewer-container');

    if (mode === '3d' && model3dUrl) {
        if (mvContainer) mvContainer.classList.remove('hidden');
        if (imgContainer) imgContainer.classList.add('hidden');
        if (btn3d) {
            btn3d.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-primary shadow-sm";
        }
        if (btn2d) {
            btn2d.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900";
        }
    } else {
        if (mvContainer) mvContainer.classList.add('hidden');
        if (imgContainer) imgContainer.classList.remove('hidden');
        if (btn3d) {
            btn3d.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900";
        }
        if (btn2d) {
            btn2d.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-primary shadow-sm";
        }
    }
    if (window.lucide) window.lucide.createIcons();
};
function renderUI(model) {
    const categoryMap = {
        'characters': 'ฟิกเกอร์ & ตัวละคร (Characters)',
        'scifi': 'ไซไฟ & ยานพาหนะ (Sci-Fi & Vehicles)',
        'architecture': 'สถาปัตยกรรม (Architecture)',
        'interior': 'ตกแต่งภายใน & เฟอร์นิเจอร์ (Interior & Decor)',
        'props': 'อุปกรณ์ & แกดเจ็ต (Props & Gadgets)',
        'nature': 'ธรรมชาติ & สัตว์ (Nature & Animals)',
        'art': 'ศิลปะ & ประติมากรรม (Art & Sculptures)',
        'all': 'ทั้งหมด'
    };

    document.getElementById('detail-name').innerText = model.model_name || 'ชื่อโมเดล';
    document.getElementById('detail-category').innerText = categoryMap[model.parent_id] || model.parent_id || 'หมวดหมู่ทั่วไป';
    
    const imgCols = ['model_image_1', 'model_image_2', 'model_image_3', 'model_image_4'];
    let validImages = [];
    model3dUrl = null;

    imgCols.forEach(col => {
        let rawData = model[col];
        if (!rawData) return;
        let strData = String(rawData).trim();
        if (strData === 'null' || strData === '[]' || strData === '""' || strData === '') return;
        
        let candidate = null;
        try {
            let parsed = JSON.parse(strData);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                candidate = String(parsed[0]).trim();
            } else if (typeof parsed === 'string' && parsed !== '') {
                candidate = parsed.trim();
            }
        } catch (e) {
            let cleanStr = strData.replace(/["'[]\]/g, '').trim(); 
            if (cleanStr) candidate = cleanStr;
        }

        if (candidate) {
            if (candidate.toLowerCase().includes('.glb') || candidate.toLowerCase().includes('.gltf')) {
                model3dUrl = candidate;
            } else {
                validImages.push(candidate);
            }
        }
    });

    if (!model3dUrl && model.model_image_4) {
        let raw4 = String(model.model_image_4);
        let m = raw4.match(/https?:\/\/[^\s"',\]]+(?:\.glb|\.gltf)/i);
        if (m) model3dUrl = m[0];
    }

    let finalImages = [...new Set(validImages)].slice(0, 4);

    const subContainer = document.getElementById('sub-images-container');
    const mainImg = document.getElementById('detail-main-image');
    const loader = document.getElementById('image-loader');

    subContainer.innerHTML = ''; 

    if (finalImages.length > 0) {
        mainImg.src = getModelImageUrl(finalImages[0]);
        mainImg.onload = () => {
            if (loader) loader.style.display = 'none';
            mainImg.classList.remove('opacity-0');
        };

        finalImages.forEach((imgName, index) => {
            const thumbUrl = getModelImageUrl(imgName);
            const thumb = document.createElement('img');
            const baseClass = "w-20 h-20 lg:w-24 lg:h-24 aspect-square object-cover rounded-xl border-2 cursor-pointer transition-all duration-300 flex-shrink-0";
            const activeClass = "border-primary shadow-[0_4px_12px_rgba(37,99,235,0.2)] opacity-100 scale-[1.02]";
            const inactiveClass = "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300";

            thumb.src = thumbUrl;
            thumb.className = `${baseClass} ${index === 0 ? activeClass : inactiveClass}`;

            thumb.onclick = () => {
                mainImg.src = thumbUrl;
                Array.from(subContainer.children).forEach(child => child.className = `${baseClass} ${inactiveClass}`);
                thumb.className = `${baseClass} ${activeClass}`;
                window.switchMediaView('2d');
            };
            subContainer.appendChild(thumb);
        });
    } else {
        mainImg.src = 'https://placehold.co/600x600/f8fafc/94a3b8?text=No+Image';
        mainImg.onload = () => { if (loader) loader.style.display = 'none'; mainImg.classList.remove('opacity-0'); };
    }

    // Initialize 3D Viewer if asset exists
    const mv = document.getElementById('detail-model-viewer');
    const viewSelector = document.getElementById('view-mode-selector');

    if (model3dUrl && mv) {
        mv.src = model3dUrl;
        if (finalImages.length > 0) {
            mv.setAttribute('poster', getModelImageUrl(finalImages[0]));
        }
        mv.addEventListener('error', (err) => {
            console.warn('3D Model failed to load, falling back to 2D view:', err);
            window.switchMediaView('2d');
        });

        const rotateBtn = document.getElementById('mv-rotate-btn');
        if (rotateBtn) {
            rotateBtn.onclick = () => {
                mv.autoRotate = !mv.autoRotate;
            };
        }

        const resetBtn = document.getElementById('mv-reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                mv.cameraOrbit = 'auto auto auto';
                mv.cameraTarget = 'auto auto auto';
                if (typeof mv.resetTurntableRotation === 'function') mv.resetTurntableRotation();
            };
        }

        const fullBtn = document.getElementById('mv-fullscreen-btn');
        if (fullBtn) {
            fullBtn.onclick = () => {
                const container = document.getElementById('model-viewer-container');
                if (container) {
                    if (!document.fullscreenElement) {
                        container.requestFullscreen().catch(err => console.log(err));
                    } else {
                        document.exitFullscreen().catch(err => console.log(err));
                    }
                }
            };
        }

        if (viewSelector) viewSelector.classList.remove('hidden');
        window.switchMediaView('3d');
    } else {
        if (viewSelector) viewSelector.classList.add('hidden');
        window.switchMediaView('2d');
    }

    renderOptions('color-options-container', model.model_color, 'color');
    renderOptions('material-options-container', model.model_material, 'material');
    
    renderSizeOptions(model);
    updateTotalPrice();
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// =========================================================
function renderOptions(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    let items = [];
    try { items = (typeof data === 'string') ? JSON.parse(data) : (data || []); } catch(e){}

    if (Array.isArray(items) && items.length > 0) {
        items.forEach((item, index) => {
            const btn = document.createElement('button');
            const isActive = index === 0;
            
            const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-[13px] md:text-sm font-bold text-left w-full";
            const unselected = "border-slate-200 text-slate-600 bg-white hover:border-primary hover:text-primary hover:bg-blue-50";
            const selected = "border-primary bg-blue-50 text-primary shadow-[0_2px_10px_rgba(37,99,235,0.15)] ring-1 ring-primary";

            btn.className = `${baseClass} ${isActive ? selected : unselected}`;

            let innerHTML = '';
            if (type === 'color') {
                if (item.image && item.image !== 'null' && item.image !== '' && item.image !== '[]') {
                    innerHTML += `<img src="${getModelImageUrl(item.image)}" class="w-6 h-6 rounded-full object-cover border border-slate-300 shadow-sm shrink-0">`;
                } else {
                    innerHTML += `<div class="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 shadow-sm shrink-0 flex items-center justify-center text-[8px] text-slate-400">สี</div>`;
                }
            }
            
            innerHTML += `<span class="truncate">${item.name}${item.price > 0 ? ' <span class="text-[11px] font-normal opacity-80">(+฿'+item.price+')</span>' : ''}</span>`;
            btn.innerHTML = innerHTML;

            if (isActive) {
                if (type === 'color') { selectedColor = item.name; extraColorPrice = Number(item.price) || 0; }
                if (type === 'material') { selectedMaterial = item.name; extraMaterialPrice = Number(item.price) || 0; }
            }

            btn.onclick = (e) => {
                e.preventDefault();
                Array.from(container.children).forEach(b => b.className = `${baseClass} ${unselected}`);
                btn.className = `${baseClass} ${selected}`;
                
                if (type === 'color') { selectedColor = item.name; extraColorPrice = Number(item.price) || 0; }
                if (type === 'material') { selectedMaterial = item.name; extraMaterialPrice = Number(item.price) || 0; }
                updateTotalPrice();
            };
            container.appendChild(btn);
        });
    }
}

function renderSizeOptions(model) {
    const sizeContainer = document.getElementById('size-options-container');
    if (!sizeContainer) return;
    
    const baseW = Number(model.model_width) || 0;
    const baseL = Number(model.model_length) || 0;
    const baseH = Number(model.model_height) || 0;

    const sizes = [
        { label: '75%', ratio: 0.75, active: false },
        { label: '100%', ratio: 1.00, active: true },
        { label: '200%', ratio: 2.00, active: false }
    ];

    let html = '';
    sizes.forEach(s => {
        const w = Number((baseW * s.ratio).toFixed(1));
        const l = Number((baseL * s.ratio).toFixed(1));
        const h = Number((baseH * s.ratio).toFixed(1));
        
        const formatNum = (num) => String(num).replace('.', '<span class="mx-[2px] font-black">.</span>');

        const dimensionText = (baseW > 0 && baseL > 0 && baseH > 0) 
            ? `<span class="font-normal opacity-75">ก.</span> <span class="font-black text-[13px]">${formatNum(w)}</span> <span class="mx-1 text-[10px] opacity-40">✖</span> <span class="font-normal opacity-75">ย.</span> <span class="font-black text-[13px]">${formatNum(l)}</span> <span class="mx-1 text-[10px] opacity-40">✖</span> <span class="font-normal opacity-75">ส.</span> <span class="font-black text-[13px]">${formatNum(h)}</span> <span class="font-normal opacity-75 ml-0.5">cm</span>` 
            : 'ขนาดมาตรฐาน';

        const baseClass = "size-btn group flex-1 min-w-[130px] flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer shadow-sm relative overflow-hidden";
        const inactiveClass = "border-slate-300 bg-white hover:border-primary hover:bg-blue-50";
        const activeClass = "border-2 border-primary bg-primary shadow-[0_4px_12px_rgba(37,99,235,0.2)]";
        
        const mainTextCol = s.active ? 'text-white' : 'text-slate-600 group-hover:text-primary';
        const subTextCol = s.active ? 'text-blue-50' : 'text-slate-500 group-hover:text-blue-600';

        // 💡 แก้ไขป้ายราคาให้เป็น Badge สีเด่นๆ ชัดเจน
        let priceTag = '';
        if (s.ratio !== 1.0) {
            const tagStyle = s.active 
                ? 'bg-white/20 text-white' 
                : 'bg-amber-100 text-amber-700 border border-amber-200';
            priceTag = `<span class="price-tag absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md ${tagStyle}">ราคา x${s.ratio}</span>`;
        }

        html += `
            <button type="button" onclick="selectSize('${s.label}', ${s.ratio}, this)" class="${baseClass} ${s.active ? activeClass : inactiveClass}">
                ${priceTag}
                <span class="size-main-text font-black text-sm mb-1 transition-colors ${mainTextCol}">${s.label}</span>
                <span class="size-sub-text text-xs tracking-wide mt-0.5 transition-colors ${subTextCol}">${dimensionText}</span>
            </button>
        `;
    });

    sizeContainer.innerHTML = html;
    selectedSize = '100%'; 
    sizeMultiplier = 1.0;
}

window.selectSize = (label, ratio, el) => {
    if (window.currentSizeMode === 'custom') {
        if(typeof window.toggleSizeMode === 'function') window.toggleSizeMode('standard');
    }
    selectedSize = label;
    sizeMultiplier = ratio;

    const baseClass = "size-btn group flex-1 min-w-[130px] flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer shadow-sm relative overflow-hidden";
    const inactiveClass = "border-slate-300 bg-white hover:border-primary hover:bg-blue-50";
    const activeClass = "border-2 border-primary bg-primary shadow-[0_4px_12px_rgba(37,99,235,0.2)]";
    
    // รีเซ็ตปุ่มทั้งหมด
    document.querySelectorAll('.size-btn').forEach(b => {
        b.className = `${baseClass} ${inactiveClass}`;
        const mainText = b.querySelector('.size-main-text');
        if(mainText) mainText.className = `size-main-text font-black text-sm mb-1 transition-colors text-slate-600 group-hover:text-primary`;
        const subText = b.querySelector('.size-sub-text');
        if(subText) subText.className = `size-sub-text text-xs tracking-wide mt-0.5 transition-colors text-slate-500 group-hover:text-blue-600`;
        
        // 💡 รีเซ็ตสีป้ายราคา
        const priceTag = b.querySelector('.price-tag');
        if(priceTag) priceTag.className = `price-tag absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200`;
    });
    
    // ตั้งค่าปุ่มที่ถูกเลือก
    el.className = `${baseClass} ${activeClass}`;
    const activeMainText = el.querySelector('.size-main-text');
    if(activeMainText) activeMainText.className = `size-main-text font-black text-sm mb-1 transition-colors text-white`;
    const activeSubText = el.querySelector('.size-sub-text');
    if(activeSubText) activeSubText.className = `size-sub-text text-xs tracking-wide mt-0.5 transition-colors text-blue-50`;
    
    // 💡 ตั้งค่าสีป้ายราคาของปุ่มที่ถูกเลือก
    const activePriceTag = el.querySelector('.price-tag');
    if(activePriceTag) activePriceTag.className = `price-tag absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-white/20 text-white`;

    updateTotalPrice(); 
};

const originalToggleSizeMode = window.toggleSizeMode;
window.toggleSizeMode = function(mode) {
    if (originalToggleSizeMode) originalToggleSizeMode(mode);
    updateTotalPrice();
};

// =========================================================
// 4. คำนวณราคา & ตะกร้า
// =========================================================
window.updateQty = (change) => {
    quantity = Math.max(1, quantity + change);
    document.getElementById('qty-input').value = quantity;
    updateTotalPrice();
};

function updateTotalPrice() {
    if(!currentModel) return;
    
    const wrapperEl = document.getElementById('detail-price-wrapper');
    const evalEl = document.getElementById('detail-price-eval');
    
    if (window.currentSizeMode === 'custom') {
        if(wrapperEl) wrapperEl.style.display = 'none';
        if(evalEl) evalEl.style.display = 'block';
        return;
    }

    if(wrapperEl) wrapperEl.style.display = 'flex';
    if(evalEl) evalEl.style.display = 'none';

    const basePrice = Number(currentModel.model_price) || 0;
    const scaledBasePrice = basePrice * sizeMultiplier; 
    
    const totalOptionsPrice = extraColorPrice + extraMaterialPrice;
    const unitPrice = scaledBasePrice + totalOptionsPrice;
    const finalTotal = unitPrice * quantity;
    
    let priceHtml = `
        <div class="flex items-end gap-2">
            <span class="text-3xl lg:text-4xl font-black text-primary tracking-tight">฿${finalTotal.toLocaleString()}</span>
        </div>
    `;

    if (totalOptionsPrice > 0 || quantity > 1 || sizeMultiplier !== 1.0) {
        priceHtml += `
            <div class="mt-1 text-sm font-medium text-slate-500 bg-slate-50 p-2 rounded-lg inline-block border border-slate-100">
                ราคาขนาด ${selectedSize} <span class="text-slate-700">฿${scaledBasePrice.toLocaleString()}</span> 
        `;
        if (totalOptionsPrice > 0) priceHtml += ` + ออปชั่น <span class="text-amber-500">฿${totalOptionsPrice.toLocaleString()}</span>`;
        if (quantity > 1) priceHtml += ` <span class="mx-1 text-slate-300">|</span> <span class="text-primary">${quantity} ชิ้น</span>`;
        priceHtml += `</div>`;
    }
    
    const priceContainer = document.getElementById('detail-price');
    if(priceContainer) {
        priceContainer.innerHTML = priceHtml;
        const unit = document.getElementById('detail-price-unit');
        if(unit) unit.style.display = 'none'; 
    }
}

function addToCart() {
    if(!currentModel) return;

    let finalSizeString = selectedSize;
    let finalPrice = 0;
    let isWaitEval = false;

    if (window.currentSizeMode === 'custom') {
        const cw = document.getElementById('custom-w').value;
        const cl = document.getElementById('custom-l').value;
        const ch = document.getElementById('custom-h').value;

        if (!cw || !cl || !ch) {
            alert("⚠️ กรุณาระบุ กว้าง x ยาว x สูง ให้ครบถ้วนก่อนสั่งซื้อครับ");
            return;
        }
        finalSizeString = `กำหนดเอง (ก.${cw} × ย.${cl} × ส.${ch} cm)`;
        finalPrice = 0; 
        isWaitEval = true;
    } else {
        const baseW = Number(currentModel.model_width) || 0;
        const baseL = Number(currentModel.model_length) || 0;
        const baseH = Number(currentModel.model_height) || 0;
        
        if (baseW > 0) {
            const w = Number((baseW * sizeMultiplier).toFixed(1));
            const l = Number((baseL * sizeMultiplier).toFixed(1));
            const h = Number((baseH * sizeMultiplier).toFixed(1));
            finalSizeString = `ขนาด ${selectedSize} (ก.${w} × ย.${l} × ส.${h} cm)`;
        } else {
            finalSizeString = `ขนาด ${selectedSize}`;
        }
        
        const scaledBasePrice = (Number(currentModel.model_price) || 0) * sizeMultiplier;
        finalPrice = (scaledBasePrice + extraColorPrice + extraMaterialPrice) * quantity;
    }

    const item = {
        cart_id: Date.now(),
        model_id: currentModel.model_id,
        name: currentModel.model_name + (isWaitEval ? " (รอประเมินราคา)" : ""),
        price: isWaitEval ? 0 : (finalPrice / quantity),
        color: selectedColor || 'มาตรฐาน', 
        material: selectedMaterial || 'PLA', 
        size: finalSizeString,
        qty: quantity,
        total: finalPrice,
        image: document.getElementById('detail-main-image').src,
        isWaitEval: isWaitEval 
    };
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    
    const btn = document.getElementById('add-to-cart-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check-circle" class="w-6 h-6"></i> เพิ่มลงรถเข็นเรียบร้อย!';
    btn.classList.replace('bg-primary', 'bg-emerald-500');
    btn.classList.replace('hover:bg-primaryHover', 'hover:bg-emerald-600');
    btn.classList.replace('shadow-blue-500/30', 'shadow-emerald-500/30');
    if(typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.replace('bg-emerald-500', 'bg-primary');
        btn.classList.replace('hover:bg-emerald-600', 'hover:bg-primaryHover');
        btn.classList.replace('shadow-emerald-500/30', 'shadow-blue-500/30');
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.getElementById('cartBadge');
    if(badge) {
        badge.innerText = cart.length;
        badge.classList.toggle('hidden', cart.length === 0);
    }
}

// =========================================================
// 5. ระบบรีวิว
// =========================================================

function getStarsHtml(rating, sizeClass = "w-4 h-4") {
    const percent = Math.min(Math.max((rating / 5) * 100, 0), 100);
    let bgStars = '';
    let fgStars = '';
    
    for(let i=0; i<5; i++) {
        bgStars += `<svg class="${sizeClass} text-slate-200 fill-slate-200 drop-shadow-sm shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        fgStars += `<svg class="${sizeClass} text-amber-400 fill-amber-400 drop-shadow-sm shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
    
    return `
    <div class="relative inline-flex items-center" title="${rating} ดาว">
        <div class="flex gap-1">${bgStars}</div>
        <div class="flex gap-1 absolute top-0 left-0 overflow-hidden whitespace-nowrap" style="width: ${percent}%;">${fgStars}</div>
    </div>
    `;
}

async function loadReviews(modelId) {
    try {
        const { data: reviews, error } = await db
            .from('reviews')
            .select('*, member(user_name)') 
            .eq('model_id', modelId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderReviews(reviews);
    } catch (err) {
        console.error("Fetch Reviews Error:", err);
        document.getElementById('reviews-container').innerHTML = '<p class="text-center text-red-500 py-8">เกิดข้อผิดพลาดในการโหลดรีวิว</p>';
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    const summary = document.getElementById('reviews-summary');

    if (!reviews || reviews.length === 0) {
        summary.innerHTML = '<span class="text-slate-400 font-medium text-sm">ยังไม่มีรีวิว</span>';
        container.innerHTML = `
            <div class="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div class="w-14 h-14 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <i data-lucide="star" class="w-6 h-6 text-slate-300"></i>
                </div>
                <p class="text-slate-500 font-bold text-lg">สินค้านี้ยังไม่มีรีวิว</p>
                <p class="text-sm text-slate-400 mt-1">สั่งซื้อและเป็นคนแรกที่รีวิวสินค้านี้สิ!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    summary.innerHTML = `
        <div class="flex items-center gap-3 justify-start md:justify-end">
            <span class="text-5xl font-black text-slate-900 tracking-tighter">${avgRating}</span>
            <div class="flex flex-col items-start gap-1">
                ${getStarsHtml(Number(avgRating), "w-4 h-4 md:w-5 md:h-5")}
                <span class="text-xs text-slate-500 font-bold uppercase tracking-wide">จาก ${reviews.length} รีวิว</span>
            </div>
        </div>
    `;

    let html = '';
    reviews.forEach(r => {
        const userName = r.member?.user_name || 'ลูกค้าผู้ไม่ประสงค์ออกนาม';
        const userInitial = userName.charAt(0).toUpperCase();
        const date = new Date(r.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        
        let imagesHtml = '';
        if (r.review_image) {
            try {
                let images = JSON.parse(r.review_image);
                if (Array.isArray(images) && images.length > 0) {
                    imagesHtml = '<div class="flex flex-wrap gap-2 mt-4">';
                    images.forEach(img => {
                        const url = getModelImageUrl(img);
                        imagesHtml += `<img src="${url}" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 hover:shadow-md transition-all" onclick="window.open('${url}', '_blank')">`;
                    });
                    imagesHtml += '</div>';
                }
            } catch(e) {
                if (typeof r.review_image === 'string' && r.review_image.trim() !== '') {
                    const url = getModelImageUrl(r.review_image);
                    imagesHtml = `<div class="flex flex-wrap gap-2 mt-4"><img src="${url}" class="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 hover:shadow-md transition-all" onclick="window.open('${url}', '_blank')"></div>`;
                }
            }
        }

        html += `
            <div class="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-primary flex items-center justify-center font-black text-lg shrink-0 border border-blue-200 shadow-sm">
                            ${userInitial}
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800">${userName}</h4>
                            <div class="mt-1">
                                ${getStarsHtml(r.rating, "w-3.5 h-3.5")}
                            </div>
                        </div>
                    </div>
                    <span class="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">${date}</span>
                </div>
                <p class="text-slate-600 text-sm md:text-[15px] leading-relaxed mt-3 whitespace-pre-wrap">${r.comment || '<span class="text-slate-400 italic">ไม่มีข้อความอธิบาย</span>'}</p>
                ${imagesHtml}
            </div>
        `;
    });

    container.innerHTML = html;
}

// =========================================================
// Modal Functions
// =========================================================
window.openMaterialModal = function() {
    const modal = document.getElementById('materialModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
};

window.closeMaterialModal = function() {
    const modal = document.getElementById('materialModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }, 300);
};