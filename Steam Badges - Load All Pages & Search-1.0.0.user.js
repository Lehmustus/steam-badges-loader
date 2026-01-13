// ==UserScript==
// @name         Steam Badges - Load All Pages & Search
// @namespace    Steam Community Tools
// @match        https://steamcommunity.com/id/*/badges/*
// @match        https://steamcommunity.com/profiles/*/badges/*
// @grant        GM_xmlhttpRequest
// @connect      steamcommunity.com
// @run-at       document-idle
// @version      1.0.0
// @description  Loads all badge pages into one view and adds a search filter. Optimized for all Steam languages.
// @author       Lehmustus
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', () => {
        const pagingDiv = document.querySelector('.profile_paging');
        let totalBadges = 0;

        if (pagingDiv) {
            // Regex handles any language by looking for the pattern "Number / Number" or "Number of Number"
            const matches = pagingDiv.innerText.match(/(\d+)\s*(?:\/|of|z|sur|de|von|из|po|ko)\s*(\d+)/i);
            totalBadges = matches ? parseInt(matches[2].replace(/\D/g, '')) : 0;
        }

        if (!totalBadges) return;

        const maxPages = Math.ceil(totalBadges / 150);
        const header = document.querySelector('.profile_badges_header') || document.querySelector('.mainContents') || document.body;

        const container = document.createElement('div');
        container.style = "width: 95%; margin: 10px auto; text-align: center; font-family: Arial, sans-serif;";

        const btn = document.createElement('button');
        btn.id = "mass-load-btn";
        btn.innerText = `🚀 Load All ${totalBadges} Badges (${maxPages} Pages)`;
        btn.style = "background: #171a21; color: #66c0f4; border: 1px solid #66c0f4; padding: 15px; cursor: pointer; font-weight: bold; border-radius: 5px; width: 100%; transition: 0.3s; font-size: 14px;";

        const progressWrapper = document.createElement('div');
        progressWrapper.id = "progress-wrapper";
        progressWrapper.style = "display: none; width: 100%; height: 25px; background: #222; border-radius: 5px; margin-top: 10px; overflow: hidden; position: relative; border: 1px solid #444;";

        const progressBar = document.createElement('div');
        progressBar.id = "progress-bar";
        progressBar.style = "width: 0%; height: 100%; background: linear-gradient(90deg, #66c0f4, #1b2838); transition: width 0.3s ease;";

        const progressText = document.createElement('div');
        progressText.id = "progress-text";
        progressText.style = "position: absolute; width: 100%; top: 0; left: 0; line-height: 25px; color: #fff; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 2px #000;";

        progressWrapper.append(progressBar, progressText);
        container.append(btn, progressWrapper);
        header.prepend(container);

        btn.onclick = () => {
            btn.style.display = 'none';
            progressWrapper.style.display = 'block';
            startMassLoad(maxPages, progressBar, progressText);
        };
    });

    async function startMassLoad(maxPages, progressBar, progressText) {
        const firstRow = document.querySelector('.badge_row');
        const badgeContainer = firstRow?.parentElement;
        if (!badgeContainer) return;

        const searchInput = document.createElement('input');
        searchInput.placeholder = "🔍 Search by game title...";
        searchInput.style = "width: 100%; padding: 15px; background: #171a21; color: #fff; border: 2px solid #66c0f4; position: sticky; top: 0; z-index: 10001; box-sizing: border-box; margin-bottom: 15px; border-radius: 5px;";
        badgeContainer.parentNode.insertBefore(searchInput, badgeContainer);

        const baseUrl = window.location.href.split('?')[0];
        document.querySelectorAll('.badge_paged_controls, .profile_paging').forEach(p => p.style.display = 'none');

        for (let p = 2; p <= maxPages; p++) {
            const perc = Math.round((p / maxPages) * 100);
            progressText.innerText = `LOADING PAGE ${p} / ${maxPages} (${perc}%)`;
            progressBar.style.width = `${perc}%`;

            try {
                const response = await fetchPage(baseUrl + "?p=" + p);
                const parser = new DOMParser();
                const doc = parser.parseFromString(response, "text/html");
                const newRows = doc.querySelectorAll('.badge_row');

                if (newRows.length > 0) {
                    newRows.forEach(row => {
                        row.querySelectorAll('img').forEach(img => {
                            const realSrc = img.getAttribute('data-delayed-image');
                            if (realSrc) {
                                img.src = realSrc;
                                img.style.opacity = "1";
                            }
                            img.removeAttribute('loading');
                            img.classList.remove('lazy_mini_profile_img');
                        });
                        badgeContainer.appendChild(row);
                    });
                }
            } catch (e) { console.error("Error loading page:", e); }
        }

        progressText.innerText = "✅ ALL BADGES LOADED";
        progressBar.style.background = "#4CAF50";
        searchInput.focus();

        searchInput.oninput = function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('.badge_row').forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(term) ? "block" : "none";
            });
        };
    }

    function fetchPage(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: url,
                onload: (res) => resolve(res.responseText),
                onerror: (err) => reject(err)
            });
        });
    }
})();