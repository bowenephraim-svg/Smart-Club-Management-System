/* ==========================================================================
   Victory School Smart Club Membership System V2 - QR Attendance Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initQRScanner();
});

let html5QrcodeScanner = null;

/**
 * Initializes the hardware camera stream layer to scan membership codes
 */
function initQRScanner() {
    const scannerContainer = document.getElementById("qr-reader");
    if (!scannerContainer) return; // Only boot up on modules configured with a scanner portal

    // Configure video rendering dimensions and frame processing rules
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    // Instantiate scanning element framework
    html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

/**
 * Success callback intercepting valid data inputs reads
 */
async function onScanSuccess(decodedText, decodedResult) {
    const feedbackBox = document.getElementById("qr-feedback-status");
    const meetingIdField = document.getElementById("activeMeetingId");
    
    if (!meetingIdField) return;

    // Temporarily pause reader processing arrays during transactional checks
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }

    if (feedbackBox) {
        feedbackBox.className = "status-badge status-pending";
        feedbackBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing scanned member...';
    }

    try {
        // Post transaction data parameters up to backend validation controllers
        const response = await fetch("/attendance/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                qr_data: decodedText,
                meeting_id: meetingIdField.value
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            if (feedbackBox) {
                feedbackBox.className = "status-badge status-active";
                feedbackBox.innerHTML = `&check; Access Granted: ${result.student_name}`;
            }
            // Trigger operational system sounds or alert banners if necessary
            playChimeSignal(true);
        } else {
            if (feedbackBox) {
                feedbackBox.className = "status-badge status-inactive";
                feedbackBox.innerHTML = `&#x2717; Access Rejected: ${result.message || "Invalid pass"}`;
            }
            playChimeSignal(false);
        }
    } catch (err) {
        console.error("Critical failure during QR network synchronization pipeline:", err);
        if (feedbackBox) {
            feedbackBox.className = "status-badge status-inactive";
            feedbackBox.innerHTML = "&#x2717; Processing or network synchronization error.";
        }
    } finally {
        // Automatically restart scanning array inputs loop after 3 seconds
        setTimeout(() => {
            if (document.getElementById("qr-reader")) {
                initQRScanner();
            }
        }, 3000);
    }
}

/**
 * Suppress standard frame matrix check warnings to preserve console health logs
 */
function onScanFailure(error) {
    // Parsing failures occur continuously whenever an active QR frame isn't visible.
    // We intentionally silence this loop to avoid polluting developer log outputs.
}

/**
 * Standard diagnostic accessibility helper to render user confirmation audios
 */
function playChimeSignal(success) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (success) {
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch check chime
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } else {
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // Low buzz failure note
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {
        // Gracefully ignore audio API exceptions on legacy client viewports
    }
}