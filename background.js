// Configuration URL from GitHub (RAW)
const CONFIG_URL = 'https://raw.githubusercontent.com/haaah919-maker/EXTion/blob//main/config.json';
const MANIFEST_URL = 'https://raw.githubusercontent.com/haaah919-maker/EXTion/blob//main/manifest.json';

let currentVersion = '4.0.0';

// Check for forced update
async function checkForUpdate() {
    try {
        const response = await fetch(MANIFEST_URL + '?t=' + Date.now());
        const remoteManifest = await response.json();
        
        if (remoteManifest.version !== currentVersion) {
            console.log('Update available! Redirecting to download...');
            chrome.tabs.create({ url: 'https://github.com/haaah919-maker/EXTion/blob//releases/latest' });
        }
    } catch (e) {
        console.error('Update check failed:', e);
    }
}

// Get config and check for updates on startup
async function init() {
    const config = await fetchConfig();
    chrome.storage.local.set({ remoteConfig: config });
    await checkForUpdate();
    setInterval(checkForUpdate, 6 * 60 * 60 * 1000);
}

async function fetchConfig() {
    try {
        const response = await fetch(CONFIG_URL + '?t=' + Date.now());
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('Failed to fetch config', e);
        return {
            ad_key: "0a14f2d3838c1067127bd044f30bdd84",
            smart_link: "https://www.profitablecpmratenetwork.com/e3gps5kmvj?key=911ee19ed1bd0c121fd562fdccbb0c26"
        };
    }
}

setInterval(async () => {
    const config = await fetchConfig();
    chrome.storage.local.set({ remoteConfig: config });
}, 60 * 60 * 1000);

init();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "auto_inject") {
        const tabId = message.tabId;
        const listener = async (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                await init();
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["bundle_reader.js"]
                });
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    }
});
