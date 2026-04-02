(function () {
  const { useState, useEffect } = React;
  const e = React.createElement;
  const mountedRoots = new WeakMap();
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const EMAIL_LINK_KEY = "invoiceflow_signin_email";

  // ---- InvoiceFlow Login Styles ----
  const VF_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .vf-wrapper {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 99999;
      color: #f5f5f5;
      overflow: hidden;
    }
    .vf-wrapper::before {
      content: '';
      position: absolute;
      top: -20%; right: -10%; width: 60%; height: 60%;
      background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .vf-wrapper::after {
      content: '';
      position: absolute;
      bottom: -10%; left: -10%; width: 50%; height: 50%;
      background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .vf-card {
      background: rgba(17, 17, 27, 0.95);
      backdrop-filter: blur(20px);
      width: 100%;
      max-width: 440px;
      border-radius: 20px;
      padding: 44px 40px;
      box-shadow:
        0 40px 80px -20px rgba(0, 0, 0, 0.8),
        0 0 0 1px rgba(255, 255, 255, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      position: relative;
      z-index: 1;
    }
    .vf-header {
      text-align: center;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .vf-logo-box {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05));
      color: #818cf8;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      border: 1px solid rgba(99,102,241,0.25);
      box-shadow: 0 4px 20px rgba(99,102,241,0.15);
    }
    .vf-title {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #f1f1f1;
      letter-spacing: -0.02em;
    }
    .vf-subtitle {
      font-size: 0.875rem;
      color: #71717a;
      margin: 0;
      line-height: 1.5;
    }
    .vf-tabs {
      display: flex;
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 28px;
      gap: 4px;
    }
    .vf-tab {
      flex: 1;
      text-align: center;
      padding: 10px 0;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      color: #71717a;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    .vf-tab.active {
      color: #f1f1f1;
      background: rgba(255,255,255,0.08);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .vf-form-group {
      margin-bottom: 18px;
      text-align: left;
    }
    .vf-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 8px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .vf-input-wrap {
      position: relative;
    }
    .vf-input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #52525b;
      width: 18px;
      height: 18px;
      pointer-events: none;
    }
    .vf-input {
      width: 100%;
      padding: 13px 14px 13px 44px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      font-size: 0.95rem;
      color: #f1f1f1;
      background: rgba(255,255,255,0.04);
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
    }
    .vf-input::placeholder { color: #3f3f46; }
    .vf-input:focus {
      outline: none;
      border-color: rgba(99,102,241,0.5);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
      background: rgba(255,255,255,0.06);
    }
    .vf-submit {
      width: 100%;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
      transition: all 0.2s ease;
      letter-spacing: 0.01em;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 15px rgba(99,102,241,0.3);
    }
    .vf-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #7c7ffc, #6366f1);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
    }
    .vf-submit:active:not(:disabled) {
      transform: translateY(0);
    }
    .vf-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .vf-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 24px 0;
      color: #3f3f46;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .vf-divider::before, .vf-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .vf-divider::before { margin-right: 14px; }
    .vf-divider::after { margin-left: 14px; }
    .vf-btn-social {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 13px 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      color: #e4e4e7;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.01em;
    }
    .vf-btn-social:hover:not(:disabled) {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.14);
      transform: translateY(-1px);
    }
    .vf-btn-social:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .vf-message {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      text-align: center;
      font-weight: 500;
      line-height: 1.5;
    }
    .vf-message.error {
      background: rgba(239, 68, 68, 0.08);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.15);
    }
    .vf-message.success {
      background: rgba(16, 185, 129, 0.08);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.15);
    }
    .vf-message.info {
      background: rgba(99, 102, 241, 0.08);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.15);
    }
    .vf-footer-text {
      text-align: center;
      font-size: 0.75rem;
      color: #52525b;
      margin-top: 24px;
      line-height: 1.6;
    }
    .vf-footer-text a {
      color: #818cf8;
      text-decoration: none;
      font-weight: 500;
    }
    .vf-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: vf-spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes vf-spin { to { transform: rotate(360deg); } }
  `;

  // ---- Icons ----
  const InvoiceIcon = e("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
    e("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    e("polyline", { points: "14 2 14 8 20 8" }),
    e("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
    e("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
    e("polyline", { points: "10 9 9 9 8 9" })
  );

  const EnvelopeIcon = e("svg", { className: "vf-input-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    e("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
    e("polyline", { points: "22,6 12,13 2,6" })
  );

  const ArrowIcon = e("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
    e("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
    e("polyline", { points: "12 5 19 12 12 19" })
  );

  // Google G logo SVG
  const GoogleIcon = e("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none" },
    e("path", { d: "M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z", fill: "#4285F4" }),
    e("path", { d: "M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z", fill: "#34A853" }),
    e("path", { d: "M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z", fill: "#FBBC05" }),
    e("path", { d: "M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z", fill: "#EA4335" })
  );

  function getAuth() {
    return window.firebaseAuth;
  }

  async function requestJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    let body = {};
    if (text) {
      try { body = JSON.parse(text); } catch (_) { body = {}; }
    }
    if (!response.ok) {
      throw new Error(body.error || "Request failed.");
    }
    return body;
  }

  function BillingLogin(props) {
    const [email, setEmail] = useState("");
    const [tab, setTab] = useState("signin");
    const [linkSent, setLinkSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [message, setMessage] = useState("");
    const [messageTone, setMessageTone] = useState("");

    const normalizedEmail = email.trim().toLowerCase();
    const emailValid = EMAIL_PATTERN.test(normalizedEmail);
    const anyLoading = sending || googleLoading || completing;

    function showMessage(text, tone) {
      setMessage(text);
      setMessageTone(tone || "");
    }

    // ---- Handle Firebase email-link completion on page load ----
    useEffect(() => {
      const auth = getAuth();
      if (!auth) return;

      const { isSignInWithEmailLink, signInWithEmailLink } = window.firebaseAuthFns;
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      let savedEmail = window.localStorage.getItem(EMAIL_LINK_KEY);
      if (!savedEmail) {
        savedEmail = window.prompt("Please enter your email address to complete sign-in:");
      }
      if (!savedEmail) return;

      setCompleting(true);
      showMessage("Completing secure sign-in...", "info");

      signInWithEmailLink(auth, savedEmail, window.location.href)
        .then((result) => result.user.getIdToken())
        .then((idToken) => requestJson("/api/auth/firebase-verify", { idToken }))
        .then((response) => {
          window.localStorage.removeItem(EMAIL_LINK_KEY);
          window.history.replaceState({}, document.title, window.location.pathname);
          showMessage("Signed in successfully! Loading...", "success");
          if (typeof props.onAuthenticated === "function") {
            props.onAuthenticated(response);
          }
        })
        .catch((err) => {
          showMessage(err.message || "Sign-in failed. Please request a new link.", "error");
          setCompleting(false);
        });
    }, []);

    // ---- Email magic link ----
    async function handleEmailSignIn(event) {
      event.preventDefault();

      if (!emailValid) {
        showMessage("Enter a valid email address.", "error");
        return;
      }

      const auth = getAuth();
      if (!auth) {
        showMessage("Firebase is not connected. Please refresh.", "error");
        return;
      }

      setSending(true);
      showMessage("", "");

      const { sendSignInLinkToEmail } = window.firebaseAuthFns;
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true
      };

      try {
        await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
        window.localStorage.setItem(EMAIL_LINK_KEY, normalizedEmail);
        setLinkSent(true);
        showMessage("✉️ Magic link sent to " + normalizedEmail + ". Check your inbox and spam folder.", "success");
      } catch (err) {
        showMessage(err.message || "Failed to send link. Try again.", "error");
      } finally {
        setSending(false);
      }
    }

    // ---- Google Sign-In ----
    async function handleGoogleSignIn() {
      const auth = getAuth();
      if (!auth) {
        showMessage("Firebase is not connected. Please refresh.", "error");
        return;
      }

      setGoogleLoading(true);
      showMessage("", "");

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const result = await auth.signInWithPopup(provider);
        const idToken = await result.user.getIdToken();

        const response = await requestJson("/api/auth/firebase-verify", { idToken });
        showMessage("Signed in successfully! Loading...", "success");

        if (typeof props.onAuthenticated === "function") {
          props.onAuthenticated(response);
        }
      } catch (err) {
        if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
          showMessage("Sign-in was cancelled.", "");
        } else if (err.code === "auth/popup-blocked") {
          showMessage("Popup was blocked. Please allow popups for this site and try again.", "error");
        } else {
          showMessage(err.message || "Google sign-in failed. Please try again.", "error");
        }
      } finally {
        setGoogleLoading(false);
      }
    }

    return e(
      "div",
      { className: "vf-wrapper" },
      e("style", null, VF_STYLES),

      e(
        "div",
        { className: "vf-card" },

        // Header
        e("div", { className: "vf-header" },
          e("div", { className: "vf-logo-box" }, InvoiceIcon),
          e("h1", { className: "vf-title" }, "InvoiceFlow Pro"),
          e("p", { className: "vf-subtitle" },
            tab === "signin"
              ? "Sign in to access your billing workspace."
              : "Create your InvoiceFlow account."
          )
        ),

        // Tabs
        e("div", { className: "vf-tabs" },
          e("div", {
            className: "vf-tab " + (tab === "signin" ? "active" : ""),
            onClick: () => { setTab("signin"); showMessage("", ""); setLinkSent(false); }
          }, "Sign In"),
          e("div", {
            className: "vf-tab " + (tab === "signup" ? "active" : ""),
            onClick: () => { setTab("signup"); showMessage("", ""); setLinkSent(false); }
          }, "Sign Up")
        ),

        // Google Sign-In Button
        e("button", {
          type: "button",
          className: "vf-btn-social",
          onClick: handleGoogleSignIn,
          disabled: anyLoading,
          style: { marginBottom: "0" }
        },
          googleLoading ? e("span", { className: "vf-spinner" }) : GoogleIcon,
          googleLoading ? "Signing in with Google..." : "Continue with Google"
        ),

        // Divider
        e("div", { className: "vf-divider" }, "or use email magic link"),

        // Email form
        e("form", { onSubmit: handleEmailSignIn },
          e("div", { className: "vf-form-group" },
            e("label", { className: "vf-label" }, "Email Address"),
            e("div", { className: "vf-input-wrap" },
              EnvelopeIcon,
              e("input", {
                type: "email",
                className: "vf-input",
                placeholder: "name@company.com",
                value: email,
                onChange: ev => setEmail(ev.target.value),
                disabled: anyLoading || linkSent,
                autoComplete: "email"
              })
            )
          ),

          e("button", {
            type: "submit",
            className: "vf-submit",
            disabled: anyLoading || linkSent
          },
            sending
              ? e("span", { className: "vf-spinner" })
              : null,
            completing
              ? "Completing sign-in..."
              : linkSent
              ? "✓ Link sent — check your inbox"
              : sending
              ? "Sending magic link..."
              : tab === "signup"
              ? "Create account & send link"
              : "Send magic link",
            (!sending && !completing && !linkSent) ? ArrowIcon : null
          ),

          // status message
          message && e("div", { className: "vf-message " + messageTone }, message)
        ),

        // Footer
        e("p", { className: "vf-footer-text" },
          "By continuing, you agree to InvoiceFlow's ",
          e("a", { href: "#" }, "Terms of Service"), " and ",
          e("a", { href: "#" }, "Privacy Policy"), "."
        )
      )
    );
  }

  window.renderBillingLogin = function renderBillingLogin(container, props) {
    if (!container) return;
    let root = mountedRoots.get(container);
    if (!root) {
      root = ReactDOM.createRoot(container);
      mountedRoots.set(container, root);
    }
    root.render(e(BillingLogin, props || {}));
  };
})();
