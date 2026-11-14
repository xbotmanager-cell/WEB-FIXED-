document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const forms = {
    personalForm: document.getElementById("personalForm"),
    businessForm: document.getElementById("businessForm")
  };
  const heroImage = document.getElementById("heroImage");

  if (tabs.length && forms.personalForm && forms.businessForm) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        Object.values(forms).forEach((form) => {
          if (form) form.classList.add("hidden");
        });

        const target = tab.dataset.target;
        if (target && forms[target]) {
          forms[target].classList.remove("hidden");
        }

        if (heroImage) {
          if (target === "personalForm") {
            heroImage.src = "/assets/images/pic2.jpg";
            heroImage.alt = "Happy people outdoors";
          } else {
            heroImage.src = "/assets/images/pic.jpg";
            heroImage.alt = "Small business workspace";
          }
        }
      });
    });
  }

  const bindSocial = (selector, url) => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = url;
      });
    });
  };

  bindSocial("#googleLogin, .google-btn", "/auth/google");
  bindSocial("#appleLogin, .apple-btn", "/auth/apple");
  bindSocial("#facebookLogin, .facebook-btn", "/auth/facebook");

  const signinForm = document.getElementById("signinForm");
  if (signinForm) {
    signinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("email");
      const staySignedInInput = document.getElementById("staySignedIn");
      const identifier = emailInput ? emailInput.value.trim() : "";
      if (!identifier) return;

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: identifier,
            staySignedIn: Boolean(staySignedInInput && staySignedInInput.checked)
          })
        });
        if (res.ok) {
          window.location.href = "/home.html";
        }
      } catch (err) {
        console.error("Sign-in request failed:", err);
      }
    });
  }
});
