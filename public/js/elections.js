/* ==========================================================================
   Victory School Smart Club System V2 - Elections Module UI Engine
   Handles: DataTables init, candidate selection, vote confirmation,
            and election results charts.
   NOTE: Server-side validation remains the security layer. This script
         only enhances the user experience.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initElectionDataTables();
    initStatusFilter();
    initCandidateSelection();
    initVoteConfirmation();
    initResultsCharts();
});

/* ==========================================================================
   1. DATATABLES INITIALIZATION
   ========================================================================== */
function initElectionDataTables() {
    const tableSelectors = [
        "#electionsTable",
        "#studentElectionsTable",
        "#electionCandidatesTable"
    ];

    tableSelectors.forEach((selector) => {
        const table = document.querySelector(selector);
        if (!table || typeof $ === "undefined") return;

        try {
            const dt = $(table).DataTable({
                pageLength: 10,
                lengthMenu: [5, 10, 25, 50],
                autoWidth: false,
                ordering: true,
                language: {
                    search: '<i class="fas fa-search"></i>',
                    searchPlaceholder: "Search records...",
                    emptyTable: "No records available.",
                    zeroRecords: "No matching records found."
                }
            });

            if (selector === "#electionsTable") {
                table.dataset.dtInstance = "ready";
                table._dataTable = dt;
            }
        } catch (err) {
            console.error("DataTables init failed:", err);
        }
    });
}

/* ==========================================================================
   1b. STATUS FILTER (Admin elections list)
   ========================================================================== */
function initStatusFilter() {
    const filter = document.getElementById("statusFilter");
    const table = document.querySelector("#electionsTable");
    if (!filter || !table || typeof $ === "undefined") return;

    const dt = $(table).DataTable();

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        if (settings.nTable.id !== "electionsTable") return true;

        const selected = filter.value;
        if (!selected) return true;

        const row = table.querySelector("tbody tr:nth-child(" + (dataIndex + 1) + ")");
        if (!row) return true;

        return row.getAttribute("data-status") === selected;
    });

    filter.addEventListener("change", () => {
        dt.draw();
    });
}

/* ==========================================================================
   2. CANDIDATE SELECTION (Vote Page)
   - Selecting one candidate highlights it and disables its position siblings
   - Updates the hidden candidate_id field and enables the submit button
   ========================================================================== */
function initCandidateSelection() {
    const voteForm = document.getElementById("voteForm");
    if (!voteForm) return;

    const hiddenInput = document.getElementById("selectedCandidateId");
    const submitBtn = document.getElementById("submitVoteBtn");
    const candidateCards = document.querySelectorAll(".candidate-select-card");

    candidateCards.forEach((card) => {
        card.addEventListener("click", () => {
            if (card.classList.contains("selected")) {
                card.classList.remove("selected");
                hiddenInput.value = "";
                submitBtn.disabled = true;
                updateSubmitNote(null);
                return;
            }

            document.querySelectorAll(".candidate-select-card.selected").forEach((other) => other.classList.remove("selected"));

            card.classList.add("selected");
            card.classList.add("animate__animated", "animate__pulse");

            hiddenInput.value = card.dataset.candidateId;
            submitBtn.disabled = false;
            updateSubmitNote({
                name: card.dataset.candidateName,
                position: card.dataset.position
            });

            setTimeout(() => {
                card.classList.remove("animate__animated", "animate__pulse");
            }, 600);
        });
    });

    function updateSubmitNote(selection) {
        const noteText = document.querySelector(".vote-submit-note span");
        if (!noteText) return;

        if (selection) {
            noteText.textContent =
                `You have selected ${selection.name} for ${selection.position}. ` +
                "Your vote is private and secure. Once submitted it cannot be changed.";
        } else {
            noteText.textContent =
                "Your vote is private and secure. You can only vote once in this election.";
        }
    }
}

/* ==========================================================================
   3. VOTE CONFIRMATION
   - Adds a final "Are you sure?" confirmation layer on top of server checks
   ========================================================================== */
function initVoteConfirmation() {
    const voteForm = document.getElementById("voteForm");
    if (!voteForm) return;

    voteForm.addEventListener("submit", (event) => {
        const candidateId = document.getElementById("selectedCandidateId");
        const confirmMessage =
            "Are you sure you want to submit your vote? " +
            "Your vote cannot be changed after submission.";

        if (!candidateId || !candidateId.value) {
            event.preventDefault();
            alert("Please select a candidate before submitting your vote.");
            return;
        }

        if (!window.confirm(confirmMessage)) {
            event.preventDefault();
        }
    });
}

/* ==========================================================================
   4. RESULTS CHARTS
   - Reads chart data from a JSON script tag rendered by the server
   - Renders "Votes by Candidate" bar chart and "Vote Share by Position" pie
   ========================================================================== */
function initResultsCharts() {
    const dataEl = document.getElementById("electionResultsData");
    if (dataEl) {
        try {
            const chartData = JSON.parse(dataEl.textContent || "{}");
            renderVotesBarChart(chartData);
            renderPositionShareChart(chartData);
            renderTurnoutChart(chartData);
        } catch (err) {
            console.error("Failed to parse election results data:", err);
        }
    }
}

function renderVotesBarChart(data) {
    const canvas = document.getElementById("electionResultsChart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = (data.candidates || []).map((c) => c.name);
    const values = (data.candidates || []).map((c) => c.votes);

    new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Votes",
                data: values,
                backgroundColor: [
                    "#2563eb", "#f59e0b", "#10b981", "#3b82f6",
                    "#ef4444", "#7c3aed", "#0f766e", "#38bdf8"
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function renderTurnoutChart(data) {
    const canvas = document.getElementById("turnoutChart");
    if (!canvas || typeof Chart === "undefined") return;

    const turnout = data.turnout || {};
    const voted = Number(turnout.voted || 0);
    const eligible = Number(turnout.eligible || 0);
    const notVoted = Math.max(eligible - voted, 0);

    if (eligible === 0) return;

    new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Voted", "Did Not Vote"],
            datasets: [{
                data: [voted, notVoted],
                backgroundColor: ["#10b981", "#e2e8f0"],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 14, padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const value = context.raw;
                            const pct = eligible > 0 ? Math.round((value / eligible) * 100) : 0;
                            return `${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderPositionShareChart(data) {
    const canvas = document.getElementById("positionShareChart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = (data.positions || []).map((p) => p.position);
    const values = (data.positions || []).map((p) => p.votes);

    if (labels.length === 0) return;

    new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#2563eb", "#f59e0b", "#10b981", "#3b82f6",
                    "#ef4444", "#7c3aed", "#0f766e", "#38bdf8"
                ],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 14, padding: 12 }
                }
            }
        }
    });
}