document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userEmail = document.getElementById("user-email");
  const loginSubmit = document.getElementById("login-submit");
  const signupSubmit = document.getElementById("signup-submit");

  if (!loginBtn || !signupBtn || !logoutBtn || !userEmail) {
    return;
  }

  const storageKeys = {
    users: "debtFreedomUsers",
    session: "debtFreedomSession"
  };

  function readUsers() {
    try {
      return JSON.parse(localStorage.getItem(storageKeys.users)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeUsers(users) {
    localStorage.setItem(storageKeys.users, JSON.stringify(users));
  }

  function readSession() {
    return localStorage.getItem(storageKeys.session) || "";
  }

  function writeSession(email) {
    if (email) {
      localStorage.setItem(storageKeys.session, email);
    } else {
      localStorage.removeItem(storageKeys.session);
    }
  }

  function normalizeEmail(value) {
    return (value || "").trim().toLowerCase();
  }

  function hideModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement || !window.bootstrap) {
      return;
    }

    const modalInstance = window.bootstrap.Modal.getInstance(modalElement)
      || window.bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.hide();
  }

  function clearAuthInputs() {
    const fields = [
      "login-email",
      "login-password",
      "signup-email",
      "signup-password"
    ];

    fields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = "";
      }
    });
  }

  function updateAuthUI() {
    const activeSession = readSession();
    const isLoggedIn = Boolean(activeSession);

    loginBtn.classList.toggle("d-none", isLoggedIn);
    signupBtn.classList.toggle("d-none", isLoggedIn);
    logoutBtn.classList.toggle("d-none", !isLoggedIn);
    userEmail.classList.toggle("d-none", !isLoggedIn);
    userEmail.textContent = isLoggedIn ? activeSession : "";
  }

  if (loginSubmit) {
    loginSubmit.addEventListener("click", () => {
      const emailField = document.getElementById("login-email");
      const passwordField = document.getElementById("login-password");
      const email = normalizeEmail(emailField?.value);
      const password = passwordField?.value || "";
      const users = readUsers();

      if (!email || !password) {
        alert("Enter your email and password to log in.");
        return;
      }

      if (!users[email] || users[email] !== password) {
        alert("That email/password combination was not found.");
        return;
      }

      writeSession(email);
      updateAuthUI();
      clearAuthInputs();
      hideModal("loginModal");
    });
  }

  if (signupSubmit) {
    signupSubmit.addEventListener("click", () => {
      const emailField = document.getElementById("signup-email");
      const passwordField = document.getElementById("signup-password");
      const email = normalizeEmail(emailField?.value);
      const password = passwordField?.value || "";
      const users = readUsers();

      if (!email || !password) {
        alert("Enter an email and password to create an account.");
        return;
      }

      if (password.length < 6) {
        alert("Use at least 6 characters for your password.");
        return;
      }

      if (users[email]) {
        alert("That email is already registered. Try logging in instead.");
        return;
      }

      users[email] = password;
      writeUsers(users);
      writeSession(email);
      updateAuthUI();
      clearAuthInputs();
      hideModal("signupModal");
    });
  }

  logoutBtn.addEventListener("click", () => {
    writeSession("");
    updateAuthUI();
  });

  updateAuthUI();
});
