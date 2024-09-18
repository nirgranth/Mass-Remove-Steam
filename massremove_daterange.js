// ==UserScript==
// @name        Mass Remove Free License Steam Dates
// @namespace   Violentmonkey Scripts
// @match       https://store.steampowered.com/account/licenses/*
// @grant       none
// @version     1.0
// @author      Nixos
// @description 09/09/2024, 10:04:03
// ==/UserScript==
(function() {
    var appIds = [];
    var rows = document.getElementsByClassName("account_table")[0].rows;

    // Set the start and end date range for filtering (format: 'DD MMM, YYYY')
    const startDate = new Date("21 Aug, 2023");  // Example: 1st Jan 2023
    const endDate = new Date("9 Mar, 2024");    // Example: 31st Dec 2024

    let i = 0;

    for (let row of rows) {
        var dateCell = row.cells[0]; // The first cell contains the date
        var cell = row.cells[1];     // The second cell contains the package details

        // Extract the license date and convert it to a JavaScript Date object
        var licenseDateStr = dateCell.textContent.trim();
        var licenseDate = new Date(licenseDateStr);

        // Check if the license date is within the specified date range
        if (licenseDate >= startDate && licenseDate <= endDate) {
            // Extract the packageId for licenses within the date range
            let packageId = /javascript:\s*RemoveFreeLicense\s*\(\s*(\d+)/.exec(cell.innerHTML);

            if (packageId !== null) {
                i++;
                console.log(`[${i}] Removing: ${packageId[1]} - ${cell.innerHTML.split("</div>")[1].trim()} (Date: ${licenseDateStr})`);
                if (!appIds.includes(packageId[1])) appIds.push(packageId[1]);
            }
        }
    }

    function removeNextPackage(appIds, i) {
        if (i >= appIds.length) {
            console.log("Removed all AppIds from account.");
            return;
        }

        fetch("https://store.steampowered.com/account/removelicense", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://store.steampowered.com/account/licenses/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `sessionid=${encodeURIComponent(window.g_sessionID)}&packageid=${appIds[i]}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }).then(response => {
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }).then(data => {
            if (data && data.success === 84) {
                console.log(`Rate limit exceeded. Retrying after delay...`);
                setTimeout(() => removeNextPackage(appIds, i), 600000); // Retry after 10 mins
            } else {
                console.log(`Removed: ${appIds[i]} (${i + 1}/${appIds.length})`);
                removeNextPackage(appIds, i + 1);
            }
        }).catch(error => {
            console.error(`Network or parsing error: ${error}`);
            setTimeout(() => removeNextPackage(appIds, i), 60000); // Retry after 60 seconds on network error
        });
    }

    removeNextPackage(appIds, 0);
})();
