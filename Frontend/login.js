(() => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  const passwordInput = form.password;

  // Toggle password visibility
  const toggleBtn = form.querySelector('.toggle-password');
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
    toggleBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
  });

  // Login submit
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.className = 'message';

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      message.textContent = 'Please enter both email and password.';
      message.classList.add('error');
      return;
    }

    form.querySelector('button[type="submit"]').disabled = true;

    try {
      const response = await fetch('https://bid-it-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMsg = 'Login failed';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      message.textContent = 'Login successful! Redirecting...';
      message.classList.add('success');

      localStorage.setItem('token', data.token);

      setTimeout(() => {
        window.location.href = 'sellerPage.html';
      }, 2000);
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
      console.error('Login error:', error);
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });

  // ===== Forgot Password Modal =====
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const resetModal = document.getElementById('resetModal');
  const closeModal = document.querySelector('.close-modal');
  const resetForm = document.getElementById('resetForm');
  const resetMessage = document.getElementById('resetMessage');

  // Open modal
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetModal.style.display = 'block';
    resetModal.setAttribute('aria-hidden', 'false');
  });

  // Close modal on close button
  closeModal.addEventListener('click', () => {
    resetModal.style.display = 'none';
    resetModal.setAttribute('aria-hidden', 'true');
  });

  // Close modal by clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === resetModal) {
      resetModal.style.display = 'none';
      resetModal.setAttribute('aria-hidden', 'true');
    }
  });

  // Handle reset password form
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetMessage.textContent = '';
    resetMessage.className = 'message';

    const email = resetForm.resetEmail.value.trim();

    if (!email) {
      resetMessage.textContent = 'Please enter your email.';
      resetMessage.classList.add('error');
      return;
    }

    resetForm.querySelector('button[type="submit"]').disabled = true;

    try {
      const response = await fetch('https://bid-it-backend.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to send reset email.';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      resetMessage.style.color = 'green';
      resetMessage.textContent = 'Reset link sent! Check your email.';
    } catch (error) {
      resetMessage.style.color = 'red';
      resetMessage.textContent = error.message;
      console.error('Reset error:', error);
    } finally {
      resetForm.querySelector('button[type="submit"]').disabled = false;
    }
  });
})();


