const urlForm = document.getElementById('url-form');
const urlInput = document.getElementById('url-input');
const previewFrame = document.getElementById('preview-frame');
const iframePlaceholder = document.getElementById('iframe-placeholder');
const loadingOverlay = document.getElementById('loading-overlay');
const selectionList = document.getElementById('selection-list');
const emptyMsg = document.getElementById('empty-msg');
const jsonContainer = document.getElementById('json-container');
const combinedJson = document.getElementById('combined-json');
const btnClear = document.getElementById('btn-clear');
const btnCopy = document.getElementById('btn-copy');
const selectionToggle = document.getElementById('selection-toggle');
const selectionSwitchContainer = document.getElementById('selection-switch-container');
const switchLabel = document.getElementById('switch-label');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');
const tabSelections = document.getElementById('tab-selections');
const tabJson = document.getElementById('tab-json');

// Seçilen verileri tutan dizi
let selectedItems = [];
let selectionModeActive = false; // Seçim modu başlangıçta kapalı (gezinti modu aktif)
let activeTab = 'selections'; // 'selections' veya 'json' sekmesi aktifliği

// Bildirim gösterme fonksiyonu
function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// URL doğrula ve Iframe içine yükle
urlForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let targetUrl = urlInput.value.trim();
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        alert('Hata: URL adresi "http://" veya "https://" protokolü ile başlamalıdır.');
        return;
    }

    loadingOverlay.style.display = 'flex';
    iframePlaceholder.style.display = 'none';
    previewFrame.style.display = 'none';
    selectionToggle.disabled = true; // Yüklenirken switch'i devre dışı bırak

    // /load endpoint'inden proxy yapılmış HTML al
    previewFrame.src = `/load?url=${encodeURIComponent(targetUrl)}`;
});

// Sayfa yüklendiğinde loading ekranını kaldır
previewFrame.addEventListener('load', function() {
    loadingOverlay.style.display = 'none';
    previewFrame.style.display = 'block';
    
    // Seçim switch'ini aktif et ve seçim modunu sıfırla (varsayılan: kapalı)
    selectionToggle.disabled = false;
    selectionModeActive = false;
    updateSelectModeUI();
});

// Seçim modu açma/kapama switch dinleyicisi
selectionToggle.addEventListener('change', function() {
    selectionModeActive = selectionToggle.checked;
    updateSelectModeUI();
    
    // Iframe içerisindeki picker.js scriptine durumu bildir
    if (previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage({
            type: 'setSelectMode',
            enabled: selectionModeActive
        }, '*');
    }
});

// Seçim modu switch stilini ve etiket metnini güncelle
function updateSelectModeUI() {
    selectionToggle.checked = selectionModeActive;
    if (selectionModeActive) {
        selectionSwitchContainer.classList.add('active');
        switchLabel.textContent = 'Seçim Modu';
        showToast('Seçim modu aktif. Elementleri tıklayarak seçebilirsiniz.');
    } else {
        selectionSwitchContainer.classList.remove('active');
        switchLabel.textContent = 'İzleme Modu';
        showToast('İzleme modu aktif. Sayfada gezinebilirsiniz.');
    }
}

// Iframe içindeki Javascript dosyasından gelen elementSelected mesajını dinle
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'elementSelected') {
        const { tag, selector, text, blocks, selectionType } = event.data;
        
        // Aynı metin veya seçiciye sahip nesneyi tekrar eklememek için kontrol
        const isAlreadySelected = selectedItems.some(item => item.selector === selector && item.text === text);
        if (isAlreadySelected) {
            showToast('Bu alan zaten seçilmiş!');
            return;
        }

        // Benzersiz ID ile diziye ekle (En son seçim en üstte olsun)
        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            tag: tag,
            selector: selector,
            text: text,
            blocks: blocks || [],
            selectionType: selectionType
        };
        
        selectedItems.unshift(newItem);
        renderSelections();
        showToast('Metin seçildi ve listeye eklendi.');
    }
});

// Seçimleri sağ panelde kartlar olarak çiz
function renderSelections() {
    // Mevcut kartları temizle (placeholder mesajı hariç)
    selectionList.querySelectorAll('.selection-card').forEach(el => el.remove());

    if (selectedItems.length === 0) {
        emptyMsg.style.display = 'block';
        combinedJson.value = '';
        return;
    }

    emptyMsg.style.display = 'none';

    selectedItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'selection-card';
        
        // Blok sayısını hesapla ve badge hazırla
        const blockCount = item.blocks ? item.blocks.length : 0;
        const blockBadge = blockCount > 0 
            ? `<span class="block-badge" title="${blockCount} adet anlamlı HTML bloğu çıkarıldı">${blockCount} blok</span>` 
            : '';

        // Sınıflandırma etiketini (Tablo, Hesaplama Aracı, Header, Footer, Metin) hazırla
        let typeBadge = '';
        if (item.selectionType === 'table') {
            typeBadge = `<span class="block-badge" style="background-color: #1e3a8a; color: #dbeafe; border: 1px solid #3b82f6;" title="Tablo etiketli alan">Tablo</span>`;
        } else if (item.selectionType === 'calculator') {
            typeBadge = `<span class="block-badge" style="background-color: #78350f; color: #fde047; border: 1px solid #eab308;" title="Hesaplama Aracı etiketli alan">Hesaplama Aracı</span>`;
        } else if (item.selectionType === 'header') {
            typeBadge = `<span class="block-badge" style="background-color: #065f46; color: #a7f3d0; border: 1px solid #059669;" title="Header etiketli alan">Header</span>`;
        } else if (item.selectionType === 'footer') {
            typeBadge = `<span class="block-badge" style="background-color: #374151; color: #f3f4f6; border: 1px solid #4b5563;" title="Footer etiketli alan">Footer</span>`;
        } else if (item.selectionType === 'metin') {
            typeBadge = `<span class="block-badge" style="background-color: #5b21b6; color: #ddd6fe; border: 1px solid #7c3aed;" title="Metin etiketli alan">Metin</span>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="tag-badge">&lt;${item.tag}&gt;</span>
                    ${typeBadge}
                    ${blockBadge}
                </div>
                <div class="card-actions">
                    <button type="button" class="card-btn" title="Metni Kopyala" onclick="copyToClipboard('${item.text.replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "")}', 'Metin kopyalandı!')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button type="button" class="card-btn card-btn-danger" title="Seçimi Kaldır" onclick="removeSelection('${item.id}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div class="card-selector" title="${item.selector}">${item.selector}</div>
            <div class="card-text">${escapeHtml(item.text)}</div>
        `;
        selectionList.appendChild(card);
    });

    const textParts = selectedItems.map(item => item.text);

    // Birleştirilmiş JSON çıktısını güncelle
    const allBlocks = [];
    let orderCounter = 1;
    selectedItems.forEach(item => {
        if (item.blocks) {
            item.blocks.forEach(block => {
                allBlocks.push({
                    order: orderCounter++,
                    tag: block.tag,
                    text: block.text,
                    href: block.href,
                    class: block.class,
                    label: item.selectionType
                });
            });
        }
    });

    const finalJSON = {
        selected_text: textParts.join('\n\n'),
        selections: selectedItems.map(item => ({
            tag: item.tag,
            selector: item.selector,
            text: item.text,
            label: item.selectionType
        })),
        blocks: allBlocks
    };
    combinedJson.value = JSON.stringify(finalJSON, null, 2);
}

// Seçim elemanını kaldırma
window.removeSelection = function(id) {
    const removedItem = selectedItems.find(item => item.id === id);
    if (removedItem && previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage({
            type: 'removeConfirmedHighlight',
            selector: removedItem.selector
        }, '*');
    }
    selectedItems = selectedItems.filter(item => item.id !== id);
    renderSelections();
    showToast('Seçim kaldırıldı.');
};

// Panoya kopyalama yardımcısı
window.copyToClipboard = function(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg || 'Panoya kopyalandı!');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        // Fallback kopyalama yöntemi
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = text;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        showToast(successMsg || 'Panoya kopyalandı!');
    });
};

// JSON metnini kopyalama
btnCopy.addEventListener('click', function() {
    const textToCopy = combinedJson.value;
    if (textToCopy.trim() === '') {
        showToast('Kopyalanacak içerik bulunmuyor!');
        return;
    }
    copyToClipboard(textToCopy, 'JSON çıktısı kopyalandı!');
});

// Tab (Sekme) geçiş kontrolleri
tabSelections.addEventListener('click', function() {
    activeTab = 'selections';
    tabSelections.classList.add('active');
    tabJson.classList.remove('active');
    selectionList.style.display = 'block';
    jsonContainer.style.display = 'none';
    btnCopy.style.display = 'none';
});

tabJson.addEventListener('click', function() {
    activeTab = 'json';
    tabJson.classList.add('active');
    tabSelections.classList.remove('active');
    selectionList.style.display = 'none';
    jsonContainer.style.display = 'flex';
    btnCopy.style.display = 'inline-flex';
});

// Tüm seçimleri temizleme
btnClear.addEventListener('click', function() {
    if (selectedItems.length === 0) return;
    if (previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage({
            type: 'clearAllHighlights'
        }, '*');
    }
    selectedItems = [];
    renderSelections();
    showToast('Tüm seçimler temizlendi.');
});

// HTML karakterlerini kaçırma
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
