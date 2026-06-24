(function() {
    if (window.HasVisualScraperPicker) return;
    window.HasVisualScraperPicker = true;

    // Elementin hover durumundaki kırmızı çizgisi ve crosshair imleci
    const style = document.createElement('style');
    style.innerHTML = `
        .scraper-hovered {
            outline: 2px dashed #ef4444 !important;
            outline-offset: -2px !important;
            cursor: crosshair !important;
            background-color: rgba(239, 68, 68, 0.05) !important;
        }
        .scraper-active-selected {
            outline: 3px solid #fbbf24 !important; /* Sarı renkli çerçeve */
            outline-offset: -3px !important;
            background-color: rgba(251, 191, 36, 0.1) !important;
        }
        .scraper-confirmed-selected {
            outline: 3px solid #10b981 !important; /* Yeşil renkli çerçeve */
            outline-offset: -3px !important;
            background-color: rgba(16, 185, 129, 0.08) !important;
        }
        .scraper-popup {
            position: absolute;
            z-index: 2147483647 !important;
            background-color: #1c1c21 !important;
            border: 1px solid #3f3f46 !important;
            border-radius: 8px !important;
            padding: 6px 10px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.25) !important;
            font-family: 'Inter', -apple-system, sans-serif !important;
            color: #f3f4f6 !important;
            pointer-events: auto !important;
        }
        .scraper-popup-btn {
            background-color: #ef4444 !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            padding: 5px 10px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: background-color 0.2s !important;
        }
        .scraper-popup-btn:hover {
            background-color: #dc2626 !important;
        }
        .scraper-popup-select {
            background-color: #27272a !important;
            color: #f3f4f6 !important;
            border: 1px solid #3f3f46 !important;
            border-radius: 4px !important;
            padding: 4px 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            outline: none !important;
        }
    `;
    document.head.appendChild(style);

    let currentHovered = null;
    let selectionModeActive = false; // Başlangıçta seçim modu pasif (normal gezinme modu)
    let activeSelectedElement = null;
    let activePopup = null;

    function clearActiveSelection() {
        if (activeSelectedElement) {
            activeSelectedElement.classList.remove('scraper-active-selected');
            activeSelectedElement = null;
        }
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
        }
    }

    // Ana pencereden gelen seçim modu durum güncellemelerini dinle
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'setSelectMode') {
            selectionModeActive = event.data.enabled;
            // Seçim modu kapatıldıysa kalan hover işaretlerini ve aktif seçimi temizle
            if (!selectionModeActive) {
                if (currentHovered) {
                    currentHovered.classList.remove('scraper-hovered');
                    currentHovered = null;
                }
                clearActiveSelection();
            }
        }
        if (event.data && event.data.type === 'removeConfirmedHighlight') {
            const selector = event.data.selector;
            try {
                const el = document.querySelector(selector);
                if (el) {
                    el.classList.remove('scraper-confirmed-selected');
                }
            } catch (e) {
                console.error('Selector query error:', e);
            }
        }
        if (event.data && event.data.type === 'clearAllHighlights') {
            document.querySelectorAll('.scraper-confirmed-selected').forEach(el => {
                el.classList.remove('scraper-confirmed-selected');
            });
            clearActiveSelection();
        }
    });

    // Hover olayını dinle
    document.addEventListener('mouseover', function(e) {
        if (!selectionModeActive) return; // Seçim modu pasifse hover işlemi yapma
        let el = e.target;
        // Yapısal elementleri ve gereksiz picker/kod elementlerini yoksay
        if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'PATH'].includes(el.tagName)) {
            return;
        }
        if (currentHovered && currentHovered !== el) {
            currentHovered.classList.remove('scraper-hovered');
        }
        currentHovered = el;
        el.classList.add('scraper-hovered');
    }, true);

    // Hover'dan çıkış
    document.addEventListener('mouseout', function(e) {
        if (!selectionModeActive) return; // Seçim modu pasifse işlem yapma
        if (e.target.classList.contains('scraper-hovered')) {
            e.target.classList.remove('scraper-hovered');
        }
        if (currentHovered === e.target) {
            currentHovered = null;
        }
    }, true);

    // Hiyerarşik CSS Seçici (CSS Selector) üreten yardımcı fonksiyon
    function getCssSelector(el) {
        if (!(el instanceof Element)) return '';
        let path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break; // ID varsa hiyerarşiyi bitirebiliriz, benzersizdir.
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == el.nodeName.toLowerCase()) nth++;
                }
                if (nth > 1 || (el.nextElementSibling && el.nextElementSibling.nodeName.toLowerCase() == el.nodeName.toLowerCase())) {
                    selector += ":nth-of-type(" + nth + ")";
                }
            }
            path.unshift(selector);
            el = el.parentElement;
        }
        return path.join(' > ');
    }

    // Menü, footer, çerez, sosyal medya gibi gereksiz alanları tespit eden yardımcı fonksiyon
    function isJunkElement(el, rootEl) {
        const junkKeywords = [
            'menu', 'nav', 'navbar', 'navigation', 'sidebar',
            'footer', 'bottom', 'copyright', 'copylink',
            'cookie', 'consent', 'cerez', 'çerez', 'gdpr', 'kvkk', 'cookie-consent',
            'social', 'share', 'paylas', 'paylaş', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest',
            'comment', 'feedback', 'chat', 'support', 'popup', 'modal', 'banner', 'ad', 'advertisement'
        ];
        
        let current = el;
        // Seçilen ana element (rootEl) hariç olmak üzere, ebeveyn hiyerarşisinde junk araması yapar
        while (current && current !== rootEl) {
            const id = (current.id || '').toLowerCase();
            const className = (typeof current.className === 'string' ? current.className : current.getAttribute('class') || '').toLowerCase();
            const tagName = current.tagName.toLowerCase();
            
            if (['nav', 'footer', 'aside'].includes(tagName)) {
                return true;
            }
            
            for (const kw of junkKeywords) {
                if (id.includes(kw) || className.includes(kw)) {
                    return true;
                }
            }
            current = current.parentElement;
        }
        return false;
    }

    // Seçilen HTML elementinin kendisi ve altındaki anlamlı tag'leri gezen fonksiyon
    function extractBlocks(rootEl) {
        const targetTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span', 'strong', 'b', 'td', 'th', 'button', 'a'];
        const elements = [];
        
        // Seçilen elementin kendisi de anlamlı tag'ler arasındaysa ekle
        if (targetTags.includes(rootEl.tagName.toLowerCase())) {
            elements.push(rootEl);
        }
        
        // Altındaki tüm anlamlı tag'leri döküman sırasıyla (DFS) al
        const descendants = rootEl.querySelectorAll(targetTags.join(', '));
        descendants.forEach(desc => {
            elements.push(desc);
        });
        
        const blocks = [];
        const seenTexts = new Set();
        let order = 1;
        
        elements.forEach(item => {
            // Menü, footer, çerez vb. filtrele
            if (isJunkElement(item, rootEl)) {
                return;
            }
            
            // Metni al ve temizle
            let text = item.innerText || item.textContent || "";
            text = text.replace(/\s+/g, ' ').trim();
            
            // Boş metin içeren elementler JSON'a eklenmesin
            if (!text) {
                return;
            }
            
            // Aynı text tekrar ediyorsa tekrarları azalt
            if (seenTexts.has(text)) {
                return;
            }
            seenTexts.add(text);
            
            const tagName = item.tagName.toLowerCase();
            const href = item.getAttribute('href') || null;
            
            let className = item.className;
            if (typeof className !== 'string') {
                className = item.getAttribute('class') || null;
            }
            className = className ? className.trim() : null;
            
            blocks.push({
                order: order++,
                tag: tagName,
                text: text,
                href: href,
                class: className
            });
        });
        
        return blocks;
    }

    // Tıklamaları yakala ve engelle
    document.addEventListener('click', function(e) {
        if (!selectionModeActive) return; // Seçim modu pasifse normal link tıklamalarına ve form elemanlarına müdahale etme
        
        let el = e.target;
        // Eğer popup içindeki buton veya select tıklandıysa, olayları engelleme ki çalışabilsinler
        if (el.closest('.scraper-popup')) {
            return; 
        }

        if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'PATH'].includes(el.tagName)) {
            return;
        }
        
        // Sayfa yönlenmesini veya buton form gönderimlerini engelle
        e.preventDefault();
        e.stopPropagation();

        // Daha önceki aktif seçimi temizle
        clearActiveSelection();

        // Metni al ve temizle
        let text = el.innerText || el.textContent || "";
        text = text.replace(/\s+/g, ' ').trim();

        if (!text) return; // Boş alanları ekleme

        // Aktif olarak seçili olan elemanı işaretle
        activeSelectedElement = el;
        el.classList.add('scraper-active-selected');

        // Popup kutusu oluştur ve konumlandır
        const rect = el.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'scraper-popup';
        
        // Konum hesaplama (scrollbar hesaba katılır)
        let popupTop = rect.top + window.scrollY - 45;
        if (popupTop < window.scrollY) {
            popupTop = rect.bottom + window.scrollY + 5;
        }
        popup.style.top = popupTop + 'px';
        popup.style.left = (rect.left + window.scrollX) + 'px';

        // Popup içeriği: İptal butonu ve Tür açılır menüsü
        popup.innerHTML = `
            <button class="scraper-popup-btn" type="button">İptal</button>
            <select class="scraper-popup-select">
                <option value="" disabled selected>Tür Seçin...</option>
                <option value="table">Tablo</option>
                <option value="calculator">Hesaplama Aracı</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="metin">Metin</option>
            </select>
        `;
        document.body.appendChild(popup);
        activePopup = popup;

        // İptal butonu olayı
        const cancelBtn = popup.querySelector('.scraper-popup-btn');
        cancelBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            clearActiveSelection();
        });

        // Seçim olayı
        const selectEl = popup.querySelector('.scraper-popup-select');
        selectEl.addEventListener('change', function(event) {
            const selectedType = event.target.value;
            if (!selectedType) return;

            let tag = el.tagName.toLowerCase();
            let selector = getCssSelector(el);
            let blocks = extractBlocks(el);

            // Onaylanan elemanı yeşil yap ve aktifliği kaldır
            el.classList.remove('scraper-active-selected');
            el.classList.add('scraper-confirmed-selected');

            // Ana Flask sayfasına mesaj gönder
            window.parent.postMessage({
                type: 'elementSelected',
                tag: tag,
                selector: selector,
                text: text,
                blocks: blocks,
                selectionType: selectedType // table veya calculator
            }, '*');

            // Popup'ı temizle
            clearActiveSelection();
        });

    }, true);
})();
