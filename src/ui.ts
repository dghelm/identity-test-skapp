import type { ProviderStatus } from "./gate";

const uiIdentityBridgeError = document.getElementById("identity-bridge-error");
const uiIdentityConnected = document.getElementById("identity-connected");
const uiIdentityError = document.getElementById("identity-error");
const uiIdentityFetching = document.getElementById("identity-fetching");
const uiIdentityLoaded = document.getElementById("identity-loaded");
const uiIdentityNotLoaded = document.getElementById("identity-not-loaded");

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
export function setUIStateConnected(providerStatus: ProviderStatus, identity: string) {
  if (!providerStatus.metadata) {
    throw new Error("logic bug");
  }

  setAllScreensInvisible();
  uiIdentityConnected!.style.display = "block";

  document.getElementById("identity-connected-identity")!.textContent = identity;
  document.getElementById("identity-connected-provider")!.textContent = providerStatus.metadata.name;
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
 * @param providerStatus
 */
export function setUIStateLoaded(providerStatus: ProviderStatus) {
  if (!providerStatus.metadata) {
    throw new Error("logic bug");
  }

  setAllScreensInvisible();
  uiIdentityLoaded!.style.display = "block";

  document.getElementById("identity-loaded-provider")!.textContent = providerStatus.metadata.name;
}

/**
 *
 */
export function setUIStateNotLoaded() {
  setAllScreensInvisible();
  uiIdentityNotLoaded!.style.display = "block";
}

/**
 *
 */
function setAllScreensInvisible() {
  uiIdentityBridgeError!.style.display = "none";
  uiIdentityConnected!.style.display = "none";
  uiIdentityError!.style.display = "none";
  uiIdentityFetching!.style.display = "none";
  uiIdentityLoaded!.style.display = "none";
  uiIdentityNotLoaded!.style.display = "none";
}
