/* ==========================================================================
   Victory School Smart Club Membership System V2 - Attendance Tracking Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initAttendanceActions();
    initDateFilters();
});

/**
 * Attaches interactive change listeners to attendance status controls
 * Submits immediate status modifications to the backend via Fetch API
 */
function initAttendanceActions() {
    const statusSelectors = document.querySelectorAll(".attendance-status-select");

    statusSelectors.forEach(select => {
        select.addEventListener("change", async (e) => {
            const selectElement = e.target;
            const attendanceId = selectElement.dataset.attendanceId;
            const studentId = selectElement.dataset.studentId;
            const meetingId = selectElement.dataset.meetingId;
            const newStatus = selectElement.value;

            // Visual feedback indicator: Apply loading state style
            selectElement.style.opacity = "0.5";
            selectElement.disabled = true;

            try {
                const response = await fetch("/attendance/update-status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        attendance_id: attendanceId,
                        student_id: studentId,
                        meeting_id: meetingId,
                        status: newStatus
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Update visual contextual state class on parent row if applicable
                    updateRowBadgeFeedback(selectElement, newStatus);
                } else {
                    alert("❌ Failed to update attendance: " + (result.message || "Unknown error"));
                    // Reset to previous value on failure
                    selectElement.value = selectElement.dataset.currentStatus || "";
                }
            } catch (error) {
                console.error("Error updating attendance status:", error);
                alert("❌ A network connection error occurred while syncing attendance.");
            } finally {
                // Restore interactivity parameters
                selectElement.style.opacity = "1";
                selectElement.disabled = false;
            }
        });
    });
}

/**
 * Updates contextual UI badge highlights based on target attendance selection state
 */
function updateRowBadgeFeedback(selectElement, status) {
    const parentCell = selectElement.closest("td");
    if (!parentCell) return;

    const badge = parentCell.querySelector(".status-badge");
    if (!badge) return;

    // Flush current modifiers
    badge.className = "status-badge";
    
    // Inject accurate structural modifier classes
    if (status === "Present") {
        badge.classList.add("status-active");
        badge.textContent = "Present";
    } else if (status === "Absent") {
        badge.classList.add("status-inactive");
        badge.textContent = "Absent";
    } else if (status === "Late") {
        badge.classList.add("status-pending");
        badge.textContent = "Late";
    }
    
    // Cache the updated selection status on the dataset element
    selectElement.dataset.currentStatus = status;
}

/**
 * Monitors meeting dates filter parameters to dynamically adjust window state routes
 */
function initDateFilters() {
    const meetingDatePicker = document.getElementById("attendanceFilterDate");
    if (!meetingDatePicker) return;

    meetingDatePicker.addEventListener("change", () => {
        const selectedDate = meetingDatePicker.value;
        if (selectedDate) {
            window.location.href = `/attendance?date=${selectedDate}`;
        }
    });
}