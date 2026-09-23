/* ==========================================================================
   Victory School Smart Club System - UI Interactions
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initSidebarToggle();
    initDropdowns();
    initQuickAdd();
    initAlertDismissals();
    initModalDismissals();
    initNotificationInteractions();
});

function initSidebarToggle() {
    const sidebar = document.querySelector(".sidebar");
    const toggleButtons = document.querySelectorAll("#mobileMenuBtn, #sidebarToggle");

    toggleButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            sidebar?.classList.toggle("show");
            sidebar?.classList.toggle("active");
        });
    });

    document.addEventListener("click", (event) => {
        if (!sidebar || window.innerWidth > 900) return;
        const clickedToggle = event.target.closest("#mobileMenuBtn, #sidebarToggle");
        if (!clickedToggle && !sidebar.contains(event.target)) {
            sidebar.classList.remove("show", "active");
        }
    });
}

function initDropdowns() {
    document.querySelectorAll(".dropdown-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const current = button.closest(".dropdown");
            document.querySelectorAll(".dropdown.active").forEach((dropdown) => {
                if (dropdown !== current) dropdown.classList.remove("active");
            });
            current?.classList.toggle("active");
        });
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".dropdown.active").forEach((dropdown) => {
            dropdown.classList.remove("active");
        });
    });
}

function initQuickAdd() {
    document.querySelectorAll(".quick-btn").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = "/students/add";
        });
    });
}

function initAlertDismissals() {
    document.querySelectorAll(".alert-dismissible").forEach((alert) => {
        const closeButton = alert.querySelector(".alert-close-btn");
        closeButton?.addEventListener("click", () => dismissElement(alert));

        setTimeout(() => {
            if (document.body.contains(alert)) dismissElement(alert);
        }, 5000);
    });
}

function initModalDismissals() {
    document.querySelectorAll("[data-dismiss-modal]").forEach((button) => {
        button.addEventListener("click", () => {
            const modal = button.closest(".modal, [id$='Modal']");
            if (modal) modal.style.display = "none";
        });
    });
}

function dismissElement(element) {
    element.style.transition = "opacity .25s ease, transform .25s ease";
    element.style.opacity = "0";
    element.style.transform = "translateY(-8px)";

    setTimeout(() => {
        element.remove();
    }, 260);
}

/* ==========================================================================
   Notification Interactions (mark as read, mark all read)
   ========================================================================== */

function initNotificationInteractions() {
    // Mark a single notification as read when clicked
    document.querySelectorAll(".notification-item").forEach((item) => {
        item.addEventListener("click", (event) => {
            // Don't trigger when clicking the mark-all button
            if (event.target.closest(".notification-mark-all")) return;

            const id = item.dataset.id;
            if (!id) return;

            // Only mark unread items
            if (!item.classList.contains("unread")) return;

            fetch(`/notifications/read/${id}`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    item.classList.remove("unread");
                    const dot = item.querySelector(".notification-dot");
                    if (dot) dot.remove();
                    updateNotificationBadge(-1);
                }
            })
            .catch((err) => console.error("Failed to mark notification as read:", err));
        });
    });

    // Mark all notifications as read
    const markAllBtn = document.getElementById("markAllReadBtn");
    if (markAllBtn) {
        markAllBtn.addEventListener("click", (event) => {
            event.stopPropagation();

            fetch("/notifications/read-all", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    document.querySelectorAll(".notification-item.unread").forEach((item) => {
                        item.classList.remove("unread");
                        const dot = item.querySelector(".notification-dot");
                        if (dot) dot.remove();
                    });
                    updateNotificationBadge(0);
                    markAllBtn.remove();
                }
            })
            .catch((err) => console.error("Failed to mark all notifications as read:", err));
        });
    }
}

function updateNotificationBadge(newCount) {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    const current = parseInt(badge.textContent, 10) || 0;
    const updated = Math.max(0, current + newCount);

    if (updated <= 0) {
        badge.remove();
    } else {
        badge.textContent = updated;
    }
}
