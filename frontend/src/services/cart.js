const CART_SESSION_KEY = "cart_session_id";

export function getCartSessionId() {
  let sessionId = localStorage.getItem(CART_SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();

    localStorage.setItem(
      CART_SESSION_KEY,
      sessionId
    );
  }

  return sessionId;
}