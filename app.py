import urllib3
from flask import Flask, request, render_template, Response
import requests
from bs4 import BeautifulSoup

# SSL sertifikası uyarılarını engellemek için (bazı banka sayfalarındaki sertifika sorunlarında kolaylık sağlar)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

# Gerçekçi tarayıcı başlık bilgileri (User-Agent). Banka sitelerinin bot korumalarına takılmamak için.
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/load')
def load():
    url = request.args.get('url')
    if not url:
        return render_iframe_error("URL Eksik", "Herhangi bir web adresi gönderilmedi.", "")

    if not (url.startswith('http://') or url.startswith('https://')):
        return render_iframe_error("Geçersiz URL Formatı", "URL 'http://' veya 'https://' ile başlamalıdır.",
                                   f"Gönderilen değer: {url}")

    try:
        # Sayfayı çek. Zaman aşımı 15 saniye ve SSL doğrulaması devre dışı bırakıldı.
        response = requests.get(url, headers=HEADERS, timeout=15, verify=False)
        response.raise_for_status()
    except Exception as e:
        return render_iframe_error(
            "Sayfa Yüklenemedi",
            "Hedef web sitesine istek atılırken bir hata ile karşılaşıldı. Banka sitesi bot engelleyici kullanıyor olabilir veya geçici bir ağ sorunu vardır.",
            str(e)
        )

    # Karakter kodlamasını otomatik algıla veya utf-8 kullan
    encoding = response.apparent_encoding or 'utf-8'
    html_content = response.content.decode(encoding, errors='replace')

    soup = BeautifulSoup(html_content, 'html.parser')

    # 1. Göreceli (relative) CSS/resim yollarının bozulmaması için <base href="..."> etiketi ekle
    base_tag = soup.new_tag('base', href=url)
    if soup.head:
        soup.head.insert(0, base_tag)
    elif soup.html:
        head_tag = soup.new_tag('head')
        head_tag.append(base_tag)
        soup.html.insert(0, head_tag)
    else:
        soup.insert(0, base_tag)

    # 2. CSP (Content Security Policy) ve Frame sınırlandırmalarını kaldır ki iframe içinde çalışabilsin
    for meta in soup.find_all('meta'):
        http_equiv = meta.get('http-equiv', '').lower()
        if http_equiv in ['content-security-policy', 'x-frame-options']:
            meta.decompose()

    # 3. Görsel Seçici Picker JavaScript kodunu static/picker.js dosyasından oku ve enjekte et
    try:
        with open('static/picker.js', 'r', encoding='utf-8') as f:
            picker_code = f.read()
    except Exception as e:
        picker_code = f"console.error('Picker script load error: {str(e)}');"

    picker_script_tag = soup.new_tag('script')
    picker_script_tag.string = picker_code

    if soup.body:
        soup.body.append(picker_script_tag)
    else:
        soup.append(picker_script_tag)

    return Response(str(soup), mimetype='text/html')


def render_iframe_error(title, message, detail):
    """Iframe içinde şık ve anlaşılır bir hata sayfası gösterir."""
    error_html = f"""
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #1a0f0f;
                color: #fca5a5;
                padding: 40px 20px;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 80vh;
            }}
            .error-card {{
                background-color: #261313;
                border: 1px solid #7f1d1d;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                max-width: 550px;
                width: 100%;
            }}
            h2 {{
                margin-top: 0;
                color: #ef4444;
                font-size: 1.4rem;
                border-bottom: 1px solid #7f1d1d;
                padding-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }}
            p {{
                font-size: 0.95rem;
                line-height: 1.6;
                margin: 16px 0;
                color: #fecaca;
            }}
            .detail {{
                background-color: #180a0a;
                border: 1px solid #450a0a;
                color: #ef4444;
                font-family: monospace;
                padding: 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                word-break: break-all;
                overflow-x: auto;
                max-height: 120px;
            }}
        </style>
    </head>
    <body>
        <div class="error-card">
            <h2>⚠️ {title}</h2>
            <p>{message}</p>
            {f'<div class="detail">{detail}</div>' if detail else ''}
        </div>
    </body>
    </html>
    """
    return Response(error_html, mimetype='text/html'), 400


if __name__ == '__main__':
    print("*" * 60)
    print(" Görsel Web Scraper Yerel Sunucusu Başlatılıyor...")
    print(" Tarayıcınızdan şu adrese gidin: http://127.0.0.1:5000")
    print("*" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)
