async function deleteMedia(url, username, elementId) {
  if (!url || !elementId) return;
  if (!confirm("Are you sure you want to delete this media file from server?"))
    return;

  try {
    const response = await fetch("/delete-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    });
    const data = await response.json();

    if (data.success) {
      console.log(
        "Successfully deleted archive key from database:",
        data.archive_key,
      );

      const targetWrapper = document.getElementById(elementId);
      if (!targetWrapper) return;

      const parentGrid = targetWrapper.parentNode;
      targetWrapper.remove();

      if (parentGrid) {
        const remainingCards = parentGrid.querySelectorAll(
          ".media-card-wrapper",
        ).length;
        const countSpan = document.getElementById(`count-${username}`);

        if (countSpan) {
          countSpan.innerText = `${remainingCards} items`;
        }

        if (remainingCards === 0) {
          const userBlock = document.getElementById(`user-block-${username}`);
          if (userBlock) userBlock.remove();

          const remainingBlocks = document.querySelectorAll(
            '[id^="user-block-"]',
          ).length;
          if (remainingBlocks === 0) {
            location.reload();
          }
        }
      }
    } else {
      alert("Delete failed: " + data.error);
    }
  } catch (err) {
    alert("Server error during deletion.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (event) => {
    const toggleHeader = event.target.closest(".toggle-btn");
    if (!toggleHeader) return;

    const username = toggleHeader.getAttribute("data-username");
    const userBlock = document.getElementById(`user-block-${username}`);
    const arrow = toggleHeader.querySelector(".toggle-arrow");

    if (!userBlock || !arrow) return;

    // Toggle the structural state class
    const isCollapsed = userBlock.classList.toggle("collapsed");

    // Update the visual indicator icon instantly
    arrow.innerText = isCollapsed ? "▼" : "▲";

    // On-demand Loading Engine: Run only if we just opened the block
    if (!isCollapsed) {
      const lazyMediaElements = userBlock.querySelectorAll(
        ".lazy-media[data-src]",
      );

      lazyMediaElements.forEach((media) => {
        // 將 data-src 移入 src 觸發下載
        media.src = media.getAttribute("data-src");
        media.removeAttribute("data-src");

        // 【核心相容修正】：如果是影片標籤，強迫瀏覽器執行加載，才能在 PC 順暢顯示縮圖
        if (media.tagName === "VIDEO") {
          media.load();
        }
      });
    }
  });
});
