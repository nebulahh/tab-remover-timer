document.addEventListener('DOMContentLoaded', function() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const startButton = document.getElementById('startTimer');
    const statusElement = document.getElementById('status');

    startButton.addEventListener('click', function() {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds <= 0) {
            statusElement.textContent = 'Please enter a valid time.';
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({
                action: "startTimer",
                tabId: activeTab.id,
                time: totalSeconds
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError);
                    statusElement.textContent = "Error: Could not start timer";
                    return;
                }
                if (response && response.success) {
                    statusElement.textContent = `Timer started for ${formatTime(totalSeconds)}`;
                    startButton.disabled = true;
                } else {
                    statusElement.textContent = 'Failed to start timer.';
                    console.error("Unexpected response:", response);
                }
            });
        });
    });

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        chrome.runtime.sendMessage({
            action: "getTimerStatus",
            tabId: activeTab.id
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error getting timer status:", chrome.runtime.lastError);
                statusElement.textContent = "Error: Could not get timer status";
                return;
            }
            if (response && response.timeRemaining) {
                statusElement.textContent = `Timer active: ${formatTime(response.timeRemaining)} remaining`;
                startButton.disabled = true;
            } else {
                statusElement.textContent = "No active timer";
            }
        });
    });

    function updateTimerStatus() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError || tabs.length === 0) return;
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({
                action: "getTimerStatus",
                tabId: activeTab.id
            }, function(response) {
                if (chrome.runtime.lastError) return;
                if (response && response.timeRemaining) {
                    statusElement.textContent = `Timer active: ${formatTime(response.timeRemaining)} remaining`;
                    startButton.disabled = true;
                } else {
                    statusElement.textContent = "No active timer";
                    startButton.disabled = false;
                }
            });
        });
    }
    
    updateTimerStatus();
    setInterval(updateTimerStatus, 1000);
});