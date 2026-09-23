/* ==========================================================================
   Victory School Smart Club Membership System V2 - Data Visualizations Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Render charts if their respective canvas containers exist on the DOM viewport
    initMembershipTrendChart();
    initClubDistributionChart();
});

/**
 * Renders a Line Chart tracking membership trends across recent months
 */
function initMembershipTrendChart() {
    const ctx = document.getElementById("membershipTrendChart");
    if (!ctx) return;

    new Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: "Registered Members",
                data: [30, 72, 90, 65, 145, 196, 225, 269, 301, 299, 340, 355],
                borderColor: "#0de9f9ff", // Primary Victory Navy
                backgroundColor: "rgba(62, 220, 238, 0.23)",
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: "#1e3a8a",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "#e2e8f0" },
                    ticks: { color: "#64748b" }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: "#64748b" }
                }
            }
        }
    });
}

/**
 * Renders a Bar Chart illustrating member counts distributed across core clubs
 */
function initClubDistributionChart() {
    const ctx = document.getElementById("clubDistributionChart");
    if (!ctx) return;

    new Chart(ctx.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["ICT", "Debate", "Science", "Music", "Drama", "Sports", "wildlife"],
            datasets: [{
                label: "Active Members",
                data: [65, 48, 42, 38, 56, 72, 30],
                backgroundColor: [
                    "#1e3a8a", // Primary Navy
                    "#d97706", // Accent Gold
                    "#10b981", // Emerald Success
                    "#3b82f6", // Info Blue
                    "#f59e0b", // Amber Warning
                    "#ef4444",// Danger Red
                    "#e567"
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "#e2e8f0" },
                    ticks: { color: "#64748b" }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: "#64748b" }
                }
            }
        }
    });
}