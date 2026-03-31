(function () {
  const { useState } = React;
  const e = React.createElement;
  const mountedRoots = new WeakMap();
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const OTP_PATTERN = /^\d{6}$/;

  async function requestJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let body = {};

    if (text) {
      try {
        body = JSON.parse(text);
      } catch (_error) {
        body = {};
      }
    }

    if (!response.ok) {
      throw new Error(body.error || "Request failed.");
    }

    return body;
  }

  function BillingLogin(props) {
    const [email, setEmail] = useState(String(props.initialEmail || ""));
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [message, setMessage] = useState("");
    const [messageTone, setMessageTone] = useState("");

    const normalizedEmail = email.trim().toLowerCase();
    const emailValid = EMAIL_PATTERN.test(normalizedEmail);
    const otpValid = OTP_PATTERN.test(String(otp).trim());

    function showMessage(text, tone) {
      setMessage(text);
      setMessageTone(tone);
    }

    async function handleSendOtp(event) {
      event.preventDefault();

      if (!emailValid) {
        showMessage("Enter a valid email address before requesting an OTP.", "error");
        return;
      }

      setSendingOtp(true);
      showMessage("", "");

      try {
        const response = await requestJson("/send-otp", { email: normalizedEmail });
        setOtpSent(true);
        if (response.developmentOtp) {
          setOtp(String(response.developmentOtp));
        }
        showMessage(response.message || "OTP sent successfully.", "success");
      } catch (error) {
        showMessage(error.message, "error");
      } finally {
        setSendingOtp(false);
      }
    }

    async function handleVerifyOtp(event) {
      event.preventDefault();

      if (!emailValid) {
        showMessage("Enter a valid email address before verifying the OTP.", "error");
        return;
      }

      if (!otpValid) {
        showMessage("Enter the 6-digit OTP from your email.", "error");
        return;
      }

      setVerifyingOtp(true);
      showMessage("", "");

      try {
        const response = await requestJson("/verify-otp", {
          email: normalizedEmail,
          otp: String(otp).trim()
        });

        showMessage(response.message || "OTP verified successfully.", "success");

        if (typeof props.onAuthenticated === "function") {
          await props.onAuthenticated(response);
        }
      } catch (error) {
        showMessage(error.message, "error");
      } finally {
        setVerifyingOtp(false);
      }
    }

    function resetOtpState() {
      setOtp("");
      setOtpSent(false);
      showMessage("", "");
    }

    return e(
      "div",
      { className: "auth-wrapper" },
      e("div", { className: "bg-orb orb-1", "aria-hidden": "true" }),
      e("div", { className: "bg-orb orb-2", "aria-hidden": "true" }),
      e("div", { className: "bg-orb orb-3", "aria-hidden": "true" }),
      e(
        "div",
        { className: "auth-container" },
        e(
          "div",
          { className: "auth-glass-card" },
          e(
            "div",
            { className: "auth-header" },
            e(
              "div",
              { className: "logo" },
              e("i", { className: "bx bxs-polygon", "aria-hidden": "true" }),
              e("span", null, props.appName || "InvoiceFlow Pro")
            ),
            e("h1", null, props.heading || "Welcome back"),
            e(
              "p",
              null,
              props.subheading ||
                "Enter your email to receive a one-time password and access your workspace."
            )
          ),
          e(
            "form",
            { className: "auth-form", onSubmit: handleSendOtp },
            e(
              "div",
              { className: "input-group" },
              e("label", { htmlFor: "otp-email" }, "Email address"),
              e(
                "div",
                { className: "input-wrapper" },
                e("i", { className: "bx bx-envelope", "aria-hidden": "true" }),
                e("input", {
                  id: "otp-email",
                  type: "email",
                  value: email,
                  placeholder: "name@company.com",
                  autoComplete: "email",
                  disabled: sendingOtp || verifyingOtp,
                  onChange: (event) => setEmail(event.target.value)
                })
              )
            ),
            e(
              "div",
              { className: "form-actions" },
              e(
                "label",
                { className: "checkbox-container" },
                e("input", { type: "checkbox", checked: otpSent, readOnly: true }),
                e("span", { className: "checkmark" }),
                otpSent ? "OTP sent to your email" : "OTP expires in 5 minutes"
              ),
              otpSent
                ? e(
                    "button",
                    {
                      type: "button",
                      className: "forgot-link",
                      onClick: resetOtpState
                    },
                    "Change email"
                  )
                : e(
                    "span",
                    { className: "forgot-link", role: "note" },
                    "Free email-based login"
                  )
            ),
            e(
              "div",
              { className: "auth-otp-actions" },
              e(
                "button",
                {
                  type: "submit",
                  className: "auth-btn-primary",
                  disabled: sendingOtp || verifyingOtp
                },
                sendingOtp
                  ? e(
                      React.Fragment,
                      null,
                      e("span", { className: "auth-spinner", "aria-hidden": "true" }),
                      e("span", null, "Sending OTP...")
                    )
                  : e(
                      React.Fragment,
                      null,
                      e("span", null, otpSent ? "Resend OTP" : "Send OTP"),
                      e("i", { className: "bx bx-right-arrow-alt", "aria-hidden": "true" })
                    )
              )
            )
          ),
          e(
            "form",
            { className: "auth-form", onSubmit: handleVerifyOtp },
            e(
              "div",
              { className: "input-group" },
              e("label", { htmlFor: "otp-code" }, "OTP"),
              e(
                "div",
                { className: "input-wrapper" },
                e("i", { className: "bx bx-shield-quarter", "aria-hidden": "true" }),
                e("input", {
                  id: "otp-code",
                  type: "text",
                  inputMode: "numeric",
                  maxLength: 6,
                  value: otp,
                  placeholder: "Enter 6-digit OTP",
                  autoComplete: "one-time-code",
                  disabled: !otpSent || sendingOtp || verifyingOtp,
                  onChange: (event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(digitsOnly);
                  }
                })
              )
            ),
            e(
              "button",
              {
                type: "submit",
                className: "auth-btn-primary",
                disabled: !otpSent || verifyingOtp || !emailValid || !otpValid
              },
              verifyingOtp
                ? e(
                    React.Fragment,
                    null,
                    e("span", { className: "auth-spinner", "aria-hidden": "true" }),
                      e("span", null, "Verifying...")
                    )
                : e(
                    React.Fragment,
                    null,
                    e("span", null, "Verify OTP"),
                    e("i", { className: "bx bx-right-arrow-alt", "aria-hidden": "true" })
                  )
            )
          ),
          message
            ? e(
                "div",
                {
                  className: `auth-message ${messageTone ? `is-${messageTone}` : ""}`,
                  role: "status",
                  "aria-live": "polite"
                },
                message
              )
            : null,
          e(
            "div",
            { className: "auth-footer-copy" },
            e(
              "p",
              null,
              otpSent
                ? `A 6-digit code was sent to ${normalizedEmail}. Enter it above to continue.`
                : "We only store your verified email and creation timestamp in Firebase."
            ),
            e(
              "p",
              null,
              "No paid SMS provider, Firebase, or third-party auth service required."
            )
          )
        )
      )
    );
  }

  window.renderBillingLogin = function renderBillingLogin(container, props) {
    if (!container) {
      return;
    }

    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }

    root.render(e(BillingLogin, props || {}));
  };
})();
