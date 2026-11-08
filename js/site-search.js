document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  const searchInputField = document.getElementById("search-input-field");
  const statusEl = document.getElementById("search-status");
  const resultsContainer = document.getElementById("results-list");

  // Keep the current search term inside the search bar
  if (searchInputField && query) {
    searchInputField.value = query;
  }

  if (!query) {
    if (statusEl) statusEl.textContent = "Please enter a search term.";
    return;
  }

  // All pages to search across
  const sitePages = [
    { title: "Home", url: "index.html" },
    { title: "About Me", url: "about.html" },
    { title: "Portfolio", url: "portfolio.html" },
    { title: "Resume", url: "resume.html" }
  ];

  const lowerQuery = query.toLowerCase();

  Promise.all(
    sitePages.map(page =>
      fetch(page.url)
        .then(res => res.text())
        .then(html => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const mainArea = doc.querySelector("main") || doc.body;
          const contentNodes = mainArea.querySelectorAll("h1, h2, h3, h4, p, li");

          const matches = [];
          contentNodes.forEach(node => {
            const text = node.innerText.trim();
            if (text.toLowerCase().includes(lowerQuery)) {
              matches.push(text);
            }
          });

          return {
            title: page.title,
            url: page.url,
            matches: matches
          };
        })
        .catch(err => {
          console.error("Error crawling page:", page.url, err);
          return { title: page.title, url: page.url, matches: [] };
        })
    )
  ).then(pages => {
    const matchedPages = pages.filter(p => p.matches.length > 0);
    renderResults(matchedPages, query);
  });

  function renderResults(pagesWithMatches, term) {
    resultsContainer.innerHTML = "";

    const totalMatches = pagesWithMatches.reduce((acc, p) => acc + p.matches.length, 0);

    if (totalMatches === 0) {
      statusEl.textContent = `No results found for "${term}".`;
      return;
    }

    statusEl.innerHTML = `Found <b>${totalMatches}</b> result${totalMatches > 1 ? "s" : ""} across <b>${pagesWithMatches.length}</b> page${pagesWithMatches.length > 1 ? "s" : ""} for "<b>${escapeHtml(term)}</b>":`;

    const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");

    pagesWithMatches.forEach(page => {
      const card = document.createElement("article");
      card.className = "search-result-card";

      const titleLink = document.createElement("h2");
      titleLink.innerHTML = `<a href="${page.url}">${page.title}</a>`;
      card.appendChild(titleLink);

      const snippetsList = document.createElement("ul");
      snippetsList.className = "search-snippets";

      // Show top 3 matches per page to keep it clean
      page.matches.slice(0, 3).forEach(snippet => {
        const li = document.createElement("li");
        li.innerHTML = snippet.replace(regex, "<mark>$1</mark>");
        snippetsList.appendChild(li);
      });

      card.appendChild(snippetsList);

      const viewMore = document.createElement("a");
      viewMore.href = page.url;
      viewMore.className = "search-view-page-btn";
      viewMore.textContent = `Open ${page.title} →`;
      card.appendChild(viewMore);

      resultsContainer.appendChild(card);
    });
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});