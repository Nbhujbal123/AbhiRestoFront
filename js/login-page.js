document.addEventListener("DOMContentLoaded", () => {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  let loginEmailForOtp = "";

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (document.getElementById("loginEmail")?.value || "").trim();
      const password = document.getElementById("loginPassword")?.value || "";

      if (!isValidEmail(email)) {
        alert("Please enter a valid email address");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          loginEmailForOtp = email;
          document.getElementById("loginStep1").style.display = "none";
          document.getElementById("loginOtpStep").style.display = "block";
          alert("OTP sent to your email! Check your inbox.");
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        alert(error.message || "Login failed. Please try again.");
      }
    });
  }

  window.verifyLoginOTP = async function () {
    const otp = (document.getElementById("loginOtp")?.value || "").trim();

    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmailForOtp, otp }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data?.access_token && typeof auth !== "undefined") {
          auth.setSession(
            data.data.user,
            data.data.access_token,
            data.data.refresh_token,
          );
        }
        const user = data.data?.user;
        if (user && user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "home.html";
        }
      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (error) {
      alert(error.message || "Verification failed. Please try again.");
    }
  };

  window.resendLoginOTP = async function () {
    const passwordField = document.getElementById("loginPassword");
    const password = passwordField?.value || "";

    if (!loginEmailForOtp || !password) {
      document.getElementById("loginStep1").style.display = "block";
      document.getElementById("loginOtpStep").style.display = "none";
      alert("Please enter your credentials again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmailForOtp, password }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        alert("OTP resent to your email!");
      } else {
        alert(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      alert(error.message || "Failed to resend OTP. Please try again.");
    }
  };

  window.resetLoginOtpStep = function () {
    loginEmailForOtp = "";
    const step1 = document.getElementById("loginStep1");
    const otpStep = document.getElementById("loginOtpStep");
    if (step1) step1.style.display = "block";
    if (otpStep) otpStep.style.display = "none";
    const otpInput = document.getElementById("loginOtp");
    if (otpInput) otpInput.value = "";
  };

  window.attachRegisterFormHandler = function () {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm || registerForm.dataset.bound === "1") return;

    // OTP flow is handled inline in index.html
    if (registerForm.dataset.otpFlow === "1") return;

    registerForm.dataset.bound = "1";

    const mobileInput = document.getElementById("registerMobile");
    if (mobileInput) {
      mobileInput.addEventListener("input", () => {
        mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
      });
    }

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = registerForm
        .querySelector('input[type="text"]')
        .value.trim();
      const email = registerForm
        .querySelector('input[type="email"]')
        .value.trim();
      const mobileInput = document.getElementById("registerMobile");
      const passwordInput = document.getElementById("registerPassword");
      const confirmInput = document.getElementById("registerConfirmPassword");

      const mobile = (mobileInput?.value || "").replace(/\D/g, "");
      if (!/^\d{10}$/.test(mobile)) {
        alert("Mobile number must be exactly 10 digits");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email address");
        return;
      }

      if (
        !passwordInput ||
        !confirmInput ||
        passwordInput.value !== confirmInput.value
      ) {
        alert("New Password and Confirm Password must be same");
        return;
      }

      const nameParts = name.split(" ");
      const firstName = nameParts.shift() || name;
      const lastName = nameParts.join(" ");

      try {
        await auth.signup({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: mobile,
          password: passwordInput.value,
        });
        window.location.href = "home.html";
      } catch (error) {
        alert(error.message || "Signup failed");
      }
    });
  };

  attachRegisterFormHandler();
});
