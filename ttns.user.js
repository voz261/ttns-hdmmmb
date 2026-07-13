// ==UserScript==
// @name         TTNS Quick Search + Auto Check
// @match        https://ttns.winmart.vn/tai-khoan-ad
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let nextCompany = null;
    let autoCheck = false;
    let activeButton = null;

    //==================================================
    // Hook XMLHttpRequest
    //==================================================

    const oldOpen = XMLHttpRequest.prototype.open;
    const oldSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._method = method;
        this._url = url;
        return oldOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {

        try {

            if (
                nextCompany &&
                this._method === "POST" &&
                this._url.includes("/AD/GetListData")
            ) {

                const p = new URLSearchParams(body);

                p.set("length", "500");
                p.set("Company", nextCompany);
                p.set("EmailStatus", "False");

                body = p.toString();

                autoCheck = true;
                nextCompany = null;

                this.addEventListener("load", () => {
                    if (!autoCheck) return;
                    // Đợi DataTable render
                    setTimeout(checkRows, 500);
                });
            }

        } catch (e) {
            console.error(e);
        }

        return oldSend.call(this, body);
    };

    function checkRows() {
        const regex = /MiniMart.*Miền Bắc/i;
        let matchedCount = 0;
        let checkedCount = 0;
        document.querySelectorAll("table tbody tr").forEach(row => {
            const tds = row.querySelectorAll("td");
            if (tds.length < 7) return;
            const company = tds[6].innerText.trim();
            if (!regex.test(company))
                return;
            matchedCount++;
            const checkbox = row.querySelector("input.check-staff");
            if (checkbox && !checkbox.checked) {
                checkbox.click();
                checkedCount++;
            }
        });

        autoCheck = false;

        if (activeButton) {

            if (matchedCount === 0) {
                activeButton.style.background = "#d32f2f";
            } else {
                activeButton.style.background = "#2e7d32";
            }

            activeButton.innerText =
                `${activeButton.dataset.title} (${matchedCount}/${checkedCount})`;
        }
    }

    function createButton(text, color, bottom, company) {

        const btn = document.createElement("button");

        btn.dataset.title = text;
        btn.dataset.color = color;

        btn.innerText = text;

        btn.style.cssText = `
    position:fixed;
    left:20px;
    bottom:${bottom}px;
    z-index:999999;
    padding:8px 14px;
    border:none;
    border-radius:6px;
    color:white;
    background:${color};
    cursor:pointer;
    font-weight:bold;
    min-width:190px;
    text-align:left;
`;

        btn.onclick = () => {

            activeButton = btn;

            nextCompany = company;

            btn.style.background = "#ff9800";
            btn.innerText = `${btn.dataset.title} ⏳`;

            document.querySelector("#submit-button")?.click();

        };

        document.body.appendChild(btn);

    }

    //==================================================
    // Buttons
    //==================================================

    createButton("WinLife", "#1976d2", 540, "45037556");
    createButton("WinUrban", "#1976d2", 500, "45011136");
    createButton("WinRural", "#1976d2", 460, "45040082");

})();