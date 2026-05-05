document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.url.includes("/chapter-")) {
        app.innerHTML = `
            <button id="runBtn" class="reader-btn">
                🚀 Launch Reading Mode
            </button>
        `;
        document.getElementById('runBtn').onclick = () => {
            showSmartAd();
            chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bundle_reader.js"] });
            window.close();
        };
        return;
    }

    if (tab.url.includes("/manga/")) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const title = document.querySelector('.post-title h1')?.innerText || "Manga";
                    const mUrl = window.location.origin + window.location.pathname.replace(/\/$/, "");
                    const chs = Array.from(document.querySelectorAll('.wp-manga-chapter a')).map(a => {
                        let url = a.href;
                        if (url.includes("#") || url === "" || !url.includes("/chapter-")) {
                            const m = a.innerText.match(/\d+/);
                            if (m) url = `${mUrl}/chapter-${m[0]}/`;
                        }
                        return { title: a.innerText.trim(), url: url.split('#')[0] };
                    });
                    return { title, chs };
                }
            });

            const data = results[0].result;
            app.innerHTML = `
                <div class="manga-title">${escapeHtml(data.title)}</div>
                <div class="chapter-list">
                    ${data.chs.map((ch, index) => `
                        <div class="chapter-item" data-url="${escapeHtml(ch.url)}" data-index="${index}">
                            <span class="chapter-title">${escapeHtml(ch.title)}</span>
                            <span class="chapter-number">Chapter ${index + 1}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            document.querySelectorAll('.chapter-item').forEach(item => {
                item.onclick = async () => {
                    const url = item.getAttribute('data-url');
                    showSmartAd();
                    chrome.runtime.sendMessage({ action: "auto_inject", tabId: tab.id });
                    await chrome.tabs.update(tab.id, { url: url });
                    window.close();
                };
            });
        } catch (err) {
            app.innerHTML = `<div class="empty-state">⚠️ Could not load chapters. Please refresh the page.</div>`;
        }
        return;
    }

    app.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6H20V18H4V6Z"/><path d="M8 6V18"/><path d="M12 6V18"/><path d="M16 6V18"/><path d="M4 12H20"/></svg><p>Please open utoon.net first</p></div>';
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showSmartAd() {
    chrome.storage.local.get("remoteConfig", (storage) => {
        const config = storage.remoteConfig || {};
        if (config.smart_link) {
            chrome.tabs.create({ url: config.smart_link, active: false });
        }
    });
}
