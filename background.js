chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copy-link-text",
    title: "Copy Link Text",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "copy-link-text" || !tab?.id) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      args: [info.linkUrl || "", info.selectionText || ""],
      func: (clickedUrl, selectedText) => {
        const clean = value => (value || "")
          .replace(/\u00a0/g, " ")
          .replace(/[ \t]+/g, " ")
          .replace(/\s*\n\s*/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        if (clean(selectedText)) return clean(selectedText);

        const normalizeUrl = value => {
          try {
            const u = new URL(value, location.href);
            u.hash = "";
            return u.href;
          } catch { return value || ""; }
        };

        const targetUrl = normalizeUrl(clickedUrl);
        const matches = [];

        for (const a of document.querySelectorAll("a[href], area[href]")) {
          let match = false;
          try {
            match = a.href === clickedUrl ||
              normalizeUrl(a.href) === targetUrl ||
              a.getAttribute("href") === clickedUrl;
          } catch {}
          if (!match) continue;

          const heading = a.querySelector(
            "h1, h2, h3, h4, h5, h6, [role='heading'], [data-testid*='title'], [class*='title']"
          );
          if (heading) {
            const headingText = clean(heading.innerText || heading.textContent);
            if (headingText) {
              matches.push({ text: headingText, score: 1000 + headingText.length });
              continue;
            }
          }

          const aria = clean(a.getAttribute("aria-label"));
          const title = clean(a.getAttribute("title"));
          if (aria) {
            matches.push({ text: aria, score: 800 + aria.length });
            continue;
          }
          if (title) {
            matches.push({ text: title, score: 700 + title.length });
            continue;
          }

          const clone = a.cloneNode(true);
          clone.querySelectorAll(
            "script, style, svg, img, picture, source, [aria-hidden='true'], [class*='breadcrumb'], [class*='url'], [class*='domain'], [class*='cite'], [class*='source'], [class*='metadata'], [class*='meta']"
          ).forEach(el => el.remove());

          const text = clean(clone.innerText || clone.textContent);
          const lines = text.split("\n").map(clean).filter(Boolean);
          const filtered = lines.filter(line => {
            if (/https?:\/\/|www\./i.test(line)) return false;
            if (line.includes("›") || line.includes("»")) return false;
            return true;
          });

          let chosen = filtered.sort((x, y) => {
            const score = s => {
              let n = Math.min(s.length, 180);
              if (s.length < 4) n -= 50;
              if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) n -= 100;
              if (/^(home|website|visit site|read more|click here)$/i.test(s)) n -= 25;
              return n;
            };
            return score(y) - score(x);
          })[0] || text;

          chosen = clean(chosen);
          if (chosen) matches.push({ text: chosen, score: chosen.length });
        }

        if (!matches.length) return "";
        matches.sort((a, b) => b.score - a.score);
        return matches[0].text;
      }
    });

    const text = (results || []).map(item => item.result || "").find(value => value.trim());

    if (!text) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const old = document.getElementById("__copy_link_text_notice");
          if (old) old.remove();
          const notice = document.createElement("div");
          notice.id = "__copy_link_text_notice";
          notice.textContent = "Could not find the main text for this link.";
          Object.assign(notice.style, {
            position: "fixed", zIndex: "2147483647", right: "16px", bottom: "16px",
            background: "#202124", color: "#fff", padding: "10px 14px",
            borderRadius: "8px", font: "13px system-ui, sans-serif",
            boxShadow: "0 3px 14px rgba(0,0,0,.25)"
          });
          document.documentElement.appendChild(notice);
          setTimeout(() => notice.remove(), 2800);
        }
      }).catch(() => {});
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [text],
      func: async value => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = value;
          Object.assign(textarea.style, {
            position: "fixed", left: "-9999px", top: "0", opacity: "0"
          });
          document.documentElement.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const ok = document.execCommand("copy");
          textarea.remove();
          if (!ok) throw new Error("Clipboard copy failed");
        }
      }
    });
  } catch (error) {
    console.warn("Copy Link Text failed:", error);
  }
});