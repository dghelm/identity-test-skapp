/**
 * Creates an invisible iframe with the given src and adds it to the page.
 */
export function createIframe(srcUrl: string): HTMLIFrameElement {
  if (!srcUrl.startsWith("https://")) {
    srcUrl = `https://${srcUrl}`;
  }

  const childFrame = document.createElement("iframe")!;
  childFrame.src = srcUrl;
  childFrame.style.display = "none";

  // Set sandbox permissions.
  // TODO: Uncomment this, we can sandbox the bridge.
  // childFrame.sandbox.add("allow-same-origin");
  // childFrame.sandbox.add("allow-scripts");
  // // TODO: remove this permission
  // childFrame.sandbox.add("allow-popups");

  document.body.appendChild(childFrame);
  return childFrame;
}
