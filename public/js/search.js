/* ==========================================================================
   Victory School Smart Club Membership System V2 - Instant Table Search Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initTableSearch();
});

/**
 * Attaches real-time keyup event listeners to target search inputs
 * Filters rows within the viewable data table instantly
 */
function initTableSearch() {
    const searchInput = document.getElementById("tableSearch");
    const targetTable = document.getElementById("searchableTable");

    if (!searchInput || !targetTable) return;

    searchInput.addEventListener("keyup", () => {
        const filterText = searchInput.value.toLowerCase().trim();
        const tableBody = targetTable.getElementsByTagName("tbody")[0];
        
        if (!tableBody) return;
        
        const rows = tableBody.getElementsByTagName("tr");

        for (let i = 0; i < rows.length; i++) {
            const currentRow = rows[i];
            let rowContainsText = false;
            
            // Extract all cells within the current row to query against text string
            const cells = currentRow.getElementsByTagName("td");

            for (let j = 0; j < cells.length; j++) {
                const cellText = cells[j].textContent || cells[j].innerText;
                
                if (cellText.toLowerCase().indexOf(filterText) > -1) {
                    rowContainsText = true;
                    break; // Matched a cell, no need to inspect remaining columns
                }
            }

            // Toggle element visibility cleanly using display block properties
            if (rowContainsText) {
                currentRow.style.display = "";
            } else {
                currentRow.style.display = "none";
            }
        }
        
        // Optional: Check if all columns are hidden to display a "No Records Found" block
        checkEmptySearchResults(tableBody, rows);
    });
}

/**
 * Append or pull down placeholder notice row if filter matches zero system rows
 */
function checkEmptySearchResults(tableBody, rows) {
    let visibleCount = 0;
    let existingNoResultRow = document.getElementById("no-results-row");

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].id !== "no-results-row" && rows[i].style.display !== "none") {
            visibleCount++;
        }
    }

    if (visibleCount === 0) {
        if (!existingNoResultRow) {
            // Find column count to dynamically create an accurate colspan layout bridge
            const colCount = tableBody.closest("table").getElementsByTagName("th").length || 5;
            
            const noResultRow = document.createElement("tr");
            noResultRow.id = "no-results-row";
            
            const noResultCell = document.createElement("td");
            noResultCell.setAttribute("colspan", colCount.toString());
            noResultCell.style.textAlign = "center";
            noResultCell.style.color = "var(--text-muted)";
            noResultCell.style.padding = "2rem";
            noResultCell.innerHTML = '<i class="fas fa-search-minus" style="margin-right:8px;"></i> No matching records found.';
            
            noResultRow.appendChild(noResultCell);
            tableBody.appendChild(noResultRow);
        }
    } else {
        if (existingNoResultRow) {
            existingNoResultRow.remove();
        }
    }
}

// instant row filtering:
const patronSearch = document.getElementById('patronSearchInput');
if (patronSearch) {
    patronSearch.addEventListener('keyup', function() {
        const value = this.value.toLowerCase();
        const rows = document.querySelectorAll('#patronsTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(value) ? '' : 'none';
        });
    });
}