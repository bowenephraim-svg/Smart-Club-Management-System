/* ==========================================================================
   Victory School Smart Club Membership System V2 - Notification Management Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initNotificationInteractions();
});

/**
 * Initializes listeners for standard in-app notification center controls
 */
function initNotificationInteractions() {
    // 1. Mark Single Notification as Read
    const markReadButtons = document.querySelectorAll(".btn-mark-read");
    markReadButtons.forEach(button => {
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            const notificationItem = button.closest(".notification-item");
            const notificationId = button.dataset.id;

            if (!notificationItem || !notificationId) return;

            try {
                const response = await fetch(`/notifications/mark-read/${notificationId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                if (response.ok) {
                    // Visually update the unread visual state indicators
                    notificationItem.classList.remove("unread");
                    notificationItem.classList.add("read");
                    button.remove(); // Drop the button out of viewport since it's already updated
                    
                    // Decouple tracking counts badge value internally if it exists
                    decrementNotificationBadge();
                }
            } catch (err) {
                console.error("Failed to update system notification states:", err);
            }
        });
    });

    // 2. Delete Notification Immediately
    const deleteNotificationButtons = document.querySelectorAll(".btn-delete-notification");
    deleteNotificationButtons.forEach(button => {
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            const notificationItem = button.closest(".notification-item");
            const notificationId = button.dataset.id;

            if (!notificationItem || !notificationId) return;

            if (confirm("Are you sure you want to delete this notification?")) {
                try {
                    const response = await fetch(`/notifications/delete/${notificationId}`, {
                        method: "GET"
                    });

                    if (response.ok) {
                        // Smoothly animate dismissal before pulling element completely out of DOM
                        notificationItem.style.transition = "all 0.3s ease";
                        notificationItem.style.opacity = "0";
                        notificationItem.style.transform = "translateX(20px)";
                        
                        setTimeout(() => {
                            notificationItem.remove();
                            checkEmptyNotificationsState();
                        }, 300);
                    }
                } catch (err) {
                    console.error("Error executing notification clean workflows:", err);
                }
            }
        });
    });
}

/**
 * Automatically adjusts total notification badge indicator numbers down
 */
function decrementNotificationBadge() {
    const badge = document.querySelector(".navbar .badge");
    if (!badge) return;

    let currentCount = parseInt(badge.textContent, 10);
    if (!isNaN(currentCount) && currentCount > 0) {
        currentCount--;
        if (currentCount === 0) {
            badge.remove(); // Remove badge cleanly if no unread flags remain
        } else {
            badge.textContent = currentCount;
        }
    }
}

/**
 * Appends empty layout feedback containers if all items have been dropped out
 */
function checkEmptyNotificationsState() {
    const container = document.querySelector(".notification-list-container");
    if (!container) return;

    const activeItems = container.querySelectorAll(".notification-item");
    if (activeItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state-notice" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-bell-slash" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
                <p>Your notification tray is completely clean.</p>
            </div>
        `;
    }
}