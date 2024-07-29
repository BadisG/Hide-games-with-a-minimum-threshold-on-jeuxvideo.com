// ==UserScript==
// @name Hide games with a rating threshold
// @namespace http://tampermonkey.net/
// @version 0.7
// @description Hides games with a rating lower than the chosen rating or without a rating on jeuxvideo.com
// @match https://www.jeuxvideo.com/tous-les-jeux/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    let minRating = parseFloat(localStorage.getItem('minRating')) || 16.0;

    function createRatingInput() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.left = '10px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.alignItems = 'center';

        const leftArrow = document.createElement('button');
        leftArrow.innerHTML = '←';
        leftArrow.style.marginRight = '10px';
        leftArrow.style.backgroundColor = 'lightgray';
        leftArrow.style.border = 'none';
        leftArrow.style.padding = '3px';
        leftArrow.style.color = 'black';
        leftArrow.style.cursor = 'pointer';
        leftArrow.style.fontSize = '25px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = minRating;
        input.style.width = '50px';
        input.style.textAlign = 'center';

        // Remove increment arrows
        input.style.appearance = 'textfield';
        input.style.MozAppearance = 'textfield';
        input.style.webkitAppearance = 'none';
        input.style.margin = '0';

        const rightArrow = document.createElement('button');
        rightArrow.innerHTML = '→';
        rightArrow.style.marginLeft = '10px';
        rightArrow.style.backgroundColor = 'lightgray';
        rightArrow.style.border = 'none';
        rightArrow.style.padding = '3px';
        rightArrow.style.color = 'black';
        rightArrow.style.cursor = 'pointer';
        rightArrow.style.fontSize = '25px';

        const label = document.createElement('label');
        label.textContent = 'Min rating: ';
        label.style.margin = '0 10px';
        label.appendChild(input);

        container.appendChild(leftArrow);
        container.appendChild(label);
        container.appendChild(rightArrow);

        const menuContainer = document.querySelector('.containerMenu__3ouCRR');
        if (menuContainer) {
            menuContainer.parentNode.insertBefore(container, menuContainer);
        } else {
            document.body.appendChild(container);
        }

        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value >= 0 && value <= 20) {
                minRating = value;
                localStorage.setItem('minRating', value);
                hideGamesWithLowRatingOrNoRating();
            }
        });

        leftArrow.addEventListener('click', function() {
            navigatePages('prev');
        });

        rightArrow.addEventListener('click', function() {
            navigatePages('next');
        });
    }

    function hideGamesWithLowRatingOrNoRating() {
        const gameItems = document.querySelectorAll('li .container__3Ow3zD');
        let hasVisibleGames = false;

        gameItems.forEach(item => {
            const ratingSpan = item.querySelector('.userRating__1y96su');
            if (ratingSpan) {
                const ratingText = ratingSpan.textContent.trim();
                if (ratingText === '- -/20') {
                    item.closest('li').style.display = 'none';
                } else {
                    const rating = parseFloat(ratingText.split('/')[0]);
                    if (isNaN(rating) || rating < minRating) {
                        item.closest('li').style.display = 'none';
                    } else {
                        item.closest('li').style.display = '';
                        hasVisibleGames = true;
                    }
                }
            } else {
                item.closest('li').style.display = 'none';
            }
        });

        return hasVisibleGames;
    }

    function navigatePages(direction) {
        const currentPageMatch = window.location.href.match(/p=(\d+)/);
        let currentPage = currentPageMatch ? parseInt(currentPageMatch[1], 10) : 1;
        const baseUrl = window.location.href.split('?')[0];
        const params = new URLSearchParams(window.location.search);
        const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

        function loadPage(page) {
            params.set('p', page);
            const url = `${baseUrl}?${params.toString()}`;
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const gameItems = doc.querySelectorAll('li .container__3Ow3zD');
                    let hasVisibleGames = false;

                    gameItems.forEach(item => {
                        const ratingSpan = item.querySelector('.userRating__1y96su');
                        if (ratingSpan) {
                            const ratingText = ratingSpan.textContent.trim();
                            if (ratingText !== '- -/20') {
                                const rating = parseFloat(ratingText.split('/')[0]);
                                if (!isNaN(rating) && rating >= minRating) {
                                    hasVisibleGames = true;
                                }
                            }
                        }
                    });

                    if (hasVisibleGames) {
                        window.location.href = url;
                    } else {
                        const newPage = direction === 'next' ? page + 1 : page - 1;
                        if (newPage > 0) {
                            loadPage(newPage);
                        }
                    }
                });
        }

        loadPage(nextPage);
    }

    // Create the input for the minimum rating
    createRatingInput();

    // Execute the initial function
    hideGamesWithLowRatingOrNoRating();

    // Observe changes in the DOM (useful if the site uses dynamic loading)
    const observer = new MutationObserver(hideGamesWithLowRatingOrNoRating);
    observer.observe(document.body, { childList: true, subtree: true });
})();
