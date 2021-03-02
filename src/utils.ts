/**
 * Creates an invisible iframe with the given src and adds it to the page.
 */
export function createIframe(srcUrl: string, name: string): HTMLIFrameElement {
  srcUrl = ensureUrl(srcUrl);

  const childFrame = document.createElement("iframe")!;
  childFrame.src = srcUrl;
  childFrame.name = name;
  childFrame.style.display = "none";

  // Set sandbox permissions.
  // TODO: Enable sandboxing?
  // childFrame.sandbox.add("allow-same-origin");
  // childFrame.sandbox.add("allow-scripts");

  document.body.appendChild(childFrame);
  return childFrame;
}

export function ensurePrefix(s: string, prefix: string): string {
  if (!s.startsWith(prefix)) {
    s = `${prefix}${s}`;
  }
  return s;
}

export function ensureUrl(url: string): string {
  return ensurePrefix(url, "https://");
}

/**
 * From SkyID.
 */
export function popupCenter(url: string, title: string, w: number, h: number): Window {
  url = ensureUrl(url);

  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
scrollbars=yes,
width=${w / systemZoom},
height=${h / systemZoom},
top=${top},
left=${left}
`
  );
  if (!newWindow) {
    throw new Error("could not open window");
  }

  if (newWindow.focus) newWindow.focus();
  return newWindow;
}
