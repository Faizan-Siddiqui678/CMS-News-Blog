// public/js/main.js

// ----- Like / unlike (one like per visitor, can be undone) -----
const likeBtn = document.getElementById("like-btn");
const likeCount = document.getElementById("like-count");

if (likeBtn) {
  const likeIcon = likeBtn.querySelector(".like-icon");
  const likeLabel = likeBtn.querySelector(".like-label");

  likeBtn.addEventListener("click", async () => {
    const postId = likeBtn.dataset.id;

    likeBtn.disabled = true; // prevent double-clicking while request is in flight

    try {
      const res = await fetch(`/post/like/${postId}`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        likeCount.textContent = data.likes;
        likeBtn.classList.toggle("liked", data.liked);
        likeBtn.setAttribute("aria-pressed", data.liked ? "true" : "false");
        if (likeIcon) likeIcon.textContent = data.liked ? "❤️" : "🤍";
        if (likeLabel) likeLabel.textContent = data.liked ? "Liked" : "Like";
      }
    } catch (err) {
      console.error("Failed to update like:", err);
    } finally {
      likeBtn.disabled = false;
    }
  });
}

// ----- Mobile category nav toggle -----
const navToggle = document.getElementById("navToggle");
const categoryNav = document.getElementById("categoryNav");

if (navToggle && categoryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = categoryNav.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the mobile menu after a category is chosen
  categoryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      categoryNav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}