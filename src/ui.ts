import type { ProviderStatus } from "./gate";

const uiIdentityBridgeError = document.getElementById("identity-bridge-error");
const uiIdentityError = document.getElementById("identity-error");
const uiIdentityFetching = document.getElementById("identity-fetching");
const uiIdentityLoggedIn = document.getElementById("identity-logged-in");
const uiIdentityNotLoggedIn = document.getElementById("identity-not-logged-in");

/**
 *
 */
export function activateUI() {
  document.getElementById("darkLayer")!.style.display = "none";
}

/**
 *
 */
export function deactivateUI() {
  document.getElementById("darkLayer")!.style.display = "";
}

/**
 * Set the UI state to indicate that the bridge could not be loaded.
 */
export function setUIStateBridgeError() {
  setAllScreensInvisible();
  uiIdentityBridgeError!.style.display = "block";
}

/**
 * @param providerStatus
 * @param identity
 */
export function setUIStateLoggedIn(providerStatus: ProviderStatus, identity: string) {
  if (!providerStatus.metadata) {
    throw new Error("Provider metadata not found");
  }

  setAllScreensInvisible();
  uiIdentityLoggedIn!.style.display = "block";

  document.getElementById("identity-logged-in-identity")!.textContent = identity;
  document.getElementById("identity-logged-in-provider")!.textContent = providerStatus.metadata.name;
}

/**
 */
export function setUIStateNotLoggedIn() {
  setAllScreensInvisible();
  uiIdentityNotLoggedIn!.style.display = "block";
}

export function setUIStateError(error: Error): void {
  let message = error.message;
  const prefix = "Error: ";
  if (message.startsWith(prefix)) {
    message = message.slice(prefix.length);
  }

  setAllScreensInvisible();
  uiIdentityError!.style.display = "block";
  document.getElementById("identity-error-message")!.textContent = message;
}

/**
 *
 */
export function setUIStateFetching() {
  setAllScreensInvisible();
  uiIdentityFetching!.style.display = "block";
}

/**
 *
 */
function setAllScreensInvisible() {
  uiIdentityBridgeError!.style.display = "none";
  uiIdentityError!.style.display = "none";
  uiIdentityFetching!.style.display = "none";
  uiIdentityLoggedIn!.style.display = "none";
  uiIdentityNotLoggedIn!.style.display = "none";
}
