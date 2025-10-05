const form = document.getElementById('signupForm');
const message = document.getElementById('formMessage');

// Helper functions
function lettersOnly(str) {
  return /^[A-Za-z]+$/.test(str);
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.className = 'message';

  if (!form.checkValidity()) {
    message.textContent = 'Please fill out all fields correctly.';
    message.classList.add('error');
    return;
  }

  const firstname = form.firstname.value.trim();
  const surname = form.surname.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const institution = form.institution.value;

  if (!lettersOnly(firstname)) {
    message.textContent = 'First name should contain letters only.';
    message.classList.add('error');
    form.firstname.focus();
    return;
  }

  if (!lettersOnly(surname)) {
    message.textContent = 'Surname should contain letters only.';
    message.classList.add('error');
    form.surname.focus();
    return;
  }

  if (!isValidEmail(email)) {
    message.textContent = 'Please enter a valid email address.';
    message.classList.add('error');
    form.email.focus();
    return;
  }

  if (password !== confirmPassword) {
    message.textContent = 'Passwords do not match.';
    message.classList.add('error');
    form.confirmPassword.focus();
    return;
  }

  // Disable submit button to prevent double submissions
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    // Send signup data to your backend API
    const response = await fetch('https://bid-it-backend.onrender.com/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `${firstname} ${surname}`,
        email,
        password,
        institution,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Signup failed';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.warn('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    // Account created successfully
    message.textContent = 'Account created successfully! Redirecting...';
    message.classList.add('success');

    // Send notification email via EmailJS (don't block redirect if this fails)
    try {
      const templateParams = {
        to_email: email,
        to_name: `${firstname} ${surname}`,
        institution,
      };
      await emailjs.send('service_8e47kwk', 'YOUR_TEMPLATE_ID', templateParams);
    } catch (emailError) {
      console.warn('Email notification failed, but signup was successful:', emailError);
      // Don't show error to user since signup succeeded
    }

    // Redirect after delay
    setTimeout(() => {
      window.location.href = '/sellerPage.html';
    }, 2000);

  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
    console.error('Signup Error:', error);
    submitBtn.disabled = false; // Re-enable only on error
  }
});
