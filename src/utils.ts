/**
 * Creates an invisible iframe with the given src and adds it to the page.
 */
export function createIframe(srcUrl: string) {
  if (!srcUrl.startsWith("https://")) {
    srcUrl = `https://${srcUrl}`;
  }

  const childFrame = document.createElement("iframe")!;
  childFrame.src = srcUrl;
  childFrame.style.display = "none";
  // Add the frame to the page.
  if (document.readyState === "complete" || document.readyState === "interactive") {
    document.body.appendChild(childFrame);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(childFrame);
    });
  }

  return childFrame;
}
