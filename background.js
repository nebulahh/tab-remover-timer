chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startTimer") {
        const { tabId, time } = request;
        const alarmName = `tabTimer_${tabId}`;
        const endTime = Date.now() + time * 1000;

        chrome.alarms.create(alarmName, { when: endTime });

        chrome.storage.local.set({ [alarmName]: { tabId, endTime } }, () => {
            sendResponse({ success: true });
        });

        return true;
    }

    if (request.action === "getTimerStatus") {
        const { tabId } = request;
        const alarmName = `tabTimer_${tabId}`;

        chrome.storage.local.get(alarmName, (result) => {
            if (result[alarmName]) {
                const timeRemaining = Math.max(0, Math.floor((result[alarmName].endTime - Date.now()) / 1000));
                sendResponse({ timeRemaining });
            } else {
                sendResponse({ timeRemaining: 0 });
            }
        });

        return true;
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('tabTimer_')) {
        const tabId = parseInt(alarm.name.split('_')[1]);
        closeTab(tabId);
    }
});

function closeTab(tabId) {
    chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
            console.error("Error closing tab:", chrome.runtime.lastError);
        } else {
            console.log("Tab closed successfully");
        }
        chrome.storage.local.remove(`tabTimer_${tabId}`);
    });
}

chrome.tabs.onRemoved.addListener((tabId) => {
    const alarmName = `tabTimer_${tabId}`;
    chrome.alarms.clear(alarmName);
    chrome.storage.local.remove(alarmName);
});