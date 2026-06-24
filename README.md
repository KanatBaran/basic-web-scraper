# Görsel Web Scraper | Finansman Kampanya Metin Toplayıcı

Bu proje, katılım bankalarının web sitelerinden finansman, ürün ve kampanya metinlerini hızlı, yapılandırılmış ve kolay bir şekilde toplamak için geliştirilmiş interaktif bir görsel veri kazıma (web scraping) aracıdır.

Kullanıcıların karmaşık CSS seçicileri (CSS selectors) yazmasına gerek kalmadan, doğrudan entegre bir tarayıcı simülasyonu (iframe) üzerinde gezerek istedikleri metin alanlarını seçmelerini, etiketlemelerini ve yapılandırılmış JSON çıktısı almalarını sağlar.


## Özellikler

*   **İnteraktif Görsel Seçim (Visual Picker):** Web sayfalarındaki metinlerin üzerine fareyle gelindiğinde (`hover`) kırmızı kesikli çizgilerle vurgulanır ve tek bir tıklamayla kolayca seçilebilir.
*   **Çift Çalışma Modu (Dual Mode):**
    *   **İzleme Modu:** Hedef web sitesinde bağlantılara tıklayarak normal bir kullanıcı gibi gezinmenizi sağlar.
    *   **Seçim Modu:** Web sitesindeki metinleri seçip etiketlemenize izin verir.
*   **Anlamsal Blok Çıkarımı (Semantic Block Extraction):** Seçtiğiniz ana HTML elementinin altındaki tüm anlamlı alt blokları (başlıklar `h1-h6`, paragraflar `p`, listeler `li`, spanlar `span`, butonlar `button`, linkler `a`) belge sırasına göre otomatik olarak ayıklar.
*   **Gelişmiş Gürültü Filtresi (Junk Element Filter):** Menü, navbar, sidebar, footer, sosyal medya paylaşım butonları, çerez onay bannerları (cookie policy, GDPR, KVKK) gibi veri setini kirletebilecek gereksiz alanları otomatik olarak filtreleyerek temiz veri sunar.
*   **Otomatik URL Düzeltme & Varlık Koruma:** Göreceli (relative) CSS ve resim yollarının bozulmaması için dinamik `<base href="...">` etiketi ekler.
*   **Güvenlik & Kısıtlama Kaldırma (CORS & CSP Bypass):** Çekilen sayfadaki Content Security Policy (CSP) ve X-Frame-Options kısıtlamalarını temizleyerek sayfaların güvenli bir şekilde iframe içinde çalışmasını sağlar.
*   **Yapılandırılmış Sınıflandırma Etiketleri:** Seçilen her alanı `Tablo`, `Hesaplama Aracı`, `Header`, `Footer` veya `Metin` olarak etiketleme imkanı sağlar.
*   **Anlık JSON Çıktısı:** Seçilen alanları, CSS seçicilerini, etiketlerini ve ayıklanan alt blokları anlık olarak kopyalanabilir JSON formatında birleştirir.


## Teknoloji Yığını

*   **Backend:** Python 3.x, Flask (Web Sunucusu), Requests (HTTP İstekleri), BeautifulSoup 4 (HTML Ayrıştırma), Urllib3 (SSL Yapılandırması).
*   **Frontend:** HTML5, Vanilla CSS3 (Karanlık mod teması, modern tipografi ve geçiş efektleri), Vanilla JavaScript (PostMessage API tabanlı çift yönlü iletişim).


## Proje Yapısı

```text
├── app.py                   # Flask sunucusu ve web sayfası proxy/enjeksiyon mantığı
├── requirements.txt         # Gerekli Python kütüphaneleri
├── static/
│   ├── main.js              # Arayüz kontrolleri, veri yönetimi ve mesajlaşma
│   ├── picker.js            # Iframe içine enjekte edilen görsel seçim scripti
│   └── style.css            # Dark mode arayüz stilleri
├── templates/
│   └── index.html           # Ana uygulama şablonu (HTML5)
└── Katılım Bankaları Finansman Listesi.xlsx  # Hedef bankalar referans listesi
```


## Kurulum ve Çalıştırma

Uygulamayı yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/KanatBaran/basic-web-scraper.git
cd basic-web-scraper
```

### 2. Bağımlılıkları Yükleyin

Öncelikle gerekli kütüphanelerin yüklü olduğundan emin olun:

```bash
pip install -r requirements.txt
```

### 3. Uygulamayı Başlatın

Flask yerel geliştirme sunucusunu başlatın:

```bash
python app.py
```

Konsolda sunucunun başarılı şekilde başladığını doğruladıktan sonra tarayıcınızdan şu adrese gidin:
```text
http://127.0.0.1:5000
```


## Kullanım Kılavuzu

1.  **Hedef URL Girin:** En üstteki adres çubuğuna veri toplamak istediğiniz katılım bankası kampanya veya ürün sayfasının URL'sini yazın ve **"Sayfayı Aç"** butonuna basın.
2.  **Gezinti Yapın (İzleme Modu):** Sayfa yüklendiğinde varsayılan olarak **İzleme Modu** aktiftir. Metinlerini toplamak istediğiniz alt sayfalara gitmek için web sitesini normal şekilde kullanabilirsiniz.
3.  **Seçim Modunu Aktif Edin:** Sayfa istediğiniz konuma geldiğinde üst menüdeki switch'i **"Seçim Modu"** durumuna getirin.
4.  **Elementleri Seçin ve Sınıflandırın:** 
    *   Fare imlecini metinlerin üzerinde gezdirin. Kırmızı çerçeveyle işaretlenen alanların üzerine tıklayın.
    *   Açılan küçük pencereden ilgili alanın türünü seçin (`Tablo`, `Hesaplama Aracı`, `Header`, `Footer`, `Metin`).
    *   Seçtiğiniz eleman yeşil çerçeveye dönüşecek ve sağdaki **"Seçilen Metinler"** listesine eklenecektir.
5.  **Veriyi İnceleyin ve Kopyalayın:**
    *   **"JSON Çıktısı"** sekmesine geçerek toplanan verilerin hiyerarşik JSON yapısını inceleyebilirsiniz.
    *   **"Kopyala"** butonuna basarak tüm çıktıyı panoya kopyalayabilir, veri setinize dahil edebilirsiniz.
    *   İstediğiniz kartlardaki silme butonuna tıklayarak seçimlerinizi güncelleyebilirsiniz.


## Örnek Çıktı Formatı (JSON)

Seçimler yapıldıktan sonra üretilen JSON verisi şu yapıdadır:

```json
{
  "selected_text": "Kâr Payı Oranları ve Hesaplama Detayları\n\nKatılım Bankası finansman desteği...",
  "selections": [
    {
      "tag": "h2",
      "selector": "div#main-content > div.hero-section > h2",
      "text": "Kâr Payı Oranları ve Hesaplama Detayları",
      "label": "header"
    },
    {
      "tag": "div",
      "selector": "div#main-content > div.details-block",
      "text": "Katılım Bankası finansman desteği...",
      "label": "metin"
    }
  ],
  "blocks": [
    {
      "order": 1,
      "tag": "h2",
      "text": "Kâr Payı Oranları ve Hesaplama Detayları",
      "href": null,
      "class": "title-primary",
      "label": "header"
    },
    {
      "order": 2,
      "tag": "p",
      "text": "Katılım Bankası finansman desteğiyle hayallerinizdeki eve kavuşun. Detaylar ve oranlar için tabloyu inceleyebilirsiniz.",
      "href": null,
      "class": "description-text",
      "label": "metin"
    },
    {
      "order": 3,
      "tag": "a",
      "text": "Hemen Başvur",
      "href": "https://example.com/basvuru",
      "class": "btn-apply",
      "label": "metin"
    }
  ]
}
```

## Teknik Detaylar & Güvenlik Çözümleri

### SSL Doğrulaması Devre Dışı Bırakma
Bazı katılım bankalarının sayfalarında görülebilen geçici veya yerel SSL sertifikası hatalarını (`InsecureRequestWarning`) aşmak için `requests.get` çağrılarında SSL doğrulaması kapatılmıştır (`verify=False`). Bu sayede veri çekme işlemi kesintiye uğramaz.

### Çift Yönlü İletişim (Cross-Origin PostMessage)
Güvenlik nedeniyle tarayıcılar farklı kaynaklardan (CORS) gelen iframe içeriklerine JavaScript ile doğrudan erişilmesini engeller. Bu engel, parent pencere ile iframe içindeki `picker.js` arasında **HTML5 PostMessage API** kullanılarak güvenli bir mesajlaşma köprüsüyle aşılmıştır.

