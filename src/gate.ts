import { ParentHandshake, WindowMessenger } from "post-me";
import type { Connection } from "post-me";
import { SkynetClient } from "skynet-js";
import urljoin from "url-join";

import { createIframe, popupCenter } from "./utils";
import { handshakeAttemptsInterval, handshakeMaxAttempts } from "./consts";

type Interface = Record<string, Array<string>>;

type BridgeMetadata = {
  minimumInterface: Interface;
  relativeRouterUrl: string;
  routerName: string;
  routerW: number;
  routerH: number;
}

export type ProviderStatus = {
  providerInterface: Interface | null;
  isProviderConnected: boolean;
  isProviderLoaded: boolean;
  metadata: ProviderMetadata | null;
};

const emptyProviderStatus = {
  providerInterface: null,
  isProviderConnected: false,
  isProviderLoaded: false,
  metadata: null,
};

type ProviderMetadata = {
  name: string;
  domain: string;
  relativeConnectUrl: string;
};

export class SkappInfo {
  name: string;
  domain: string;

  constructor(name: string) {
    this.name = name;
    this.domain = location.hostname;
  }
}

export class Gate {
  bridgeConnection!: Promise<Connection>;
  bridgeMetadata!: Promise<BridgeMetadata>;
  bridgeUrl: string;
  providerStatus!: ProviderStatus;

  protected childFrame?: HTMLIFrameElement;
  protected client!: SkynetClient;

  // ===========
  // Constructor
  // ===========

  constructor(client: SkynetClient, bridgeUrl: string) {
    if (typeof Storage == "undefined") {
      throw new Error("Browser does not support web storage");
    }

    this.bridgeUrl = bridgeUrl;
    this.client = client;

    this.start();
  }

  // ===============
  // Public Gate API
  // ===============

  async callInterface(method: string): Promise<unknown> {
    if (!this.providerStatus.isProviderConnected) {
      throw new Error("Provider not connected, cannot access interface");
    }
    if (!this.providerStatus.providerInterface) {
      throw new Error("Provider interface not present despite being connected. Possible logic bug");
    }

    // TODO: This check doesn't work.
    // if (method in this.providerStatus.providerInterface) {
    //   throw new Error(
    //     `Unsupported method for this provider interface. Method: '${method}', Interface: ${this.providerStatus.providerInterface}`
    //   );
    // }

    const connection = await this.bridgeConnection;
    return connection.remoteHandle().call("callInterface", method);
  }

  // TODO: Verify return value from child has correct fields.
  async connectProvider(skappInfo: SkappInfo): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("connectProvider", skappInfo);

    this.providerStatus = info;
    return info;
  }

  /**
   * Destroys the bridge by: 1. unloading the provider on the bridge, 2. closing the bridge connection, 3. closing the child iframe
   */
  async destroyBridge(): Promise<void> {
    if (this.providerStatus.isProviderLoaded) {
      try {
        await this.unloadProvider();
      } catch (error) {
        console.log(error);
      }
    }

    this.providerStatus = emptyProviderStatus;

    const connection = await this.bridgeConnection;
    connection.close();

    // Close the child iframe.
    if (this.childFrame) {
      this.childFrame.parentNode!.removeChild(this.childFrame);
    }
  }

  async disconnectProvider(): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("disconnectProvider");

    this.providerStatus = info;
    return info;
  }

  async fetchStoredProvider(skappInfo: SkappInfo): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("fetchStoredProvider", skappInfo);

    this.providerStatus = info;
    return info;
  }

  async getBridgeMetadata(): Promise<BridgeMetadata> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("getBridgeMetadata");

    return info;
  }

  async getProviderStatus(): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("getProviderStatus");

    this.providerStatus = info;
    return info;
  }

  async loadNewProvider(skappInfo: SkappInfo): Promise<ProviderStatus> {
    const result = await this.launchRouter();
    if (result === "closed") {
      // User closed the router. Don't show error message screen, just silently return the current provider info without changes.
      return this.providerStatus;
    } else if (result !== "success") {
      throw new Error(result);
    }

    // TODO: Wait for bridge to receive provider URL?
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("loadNewProvider", skappInfo);

    this.providerStatus = info;
    return info;
  }

  /**
   * Restarts the bridge by destroying it and starting it again.
   */
  async restartBridge(): Promise<void> {
    await this.destroyBridge();
    this.start();
  }

  async unloadProvider(): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("unloadProvider");

    this.providerStatus = info;
    return info;
  }

  // =====================
  // Internal Gate Methods
  // =====================

  // TODO: should check periodically if window is still open.
  /**
   * Creates window with router and waits for a response.
   */
  protected async launchRouter(): Promise<string> {
    // Set the router URL.
    const bridgeMetadata = await this.bridgeMetadata;
    const relativeRouterUrl = bridgeMetadata.relativeRouterUrl;
    const routerUrl = urljoin(this.bridgeUrl, relativeRouterUrl);

    // Open the router.
    const routerWindow = popupCenter(routerUrl, bridgeMetadata.routerName, bridgeMetadata.routerW, bridgeMetadata.routerH);

    // Establish a connection with the router.
    const messenger = new WindowMessenger({
      localWindow: window,
      remoteWindow: routerWindow,
      remoteOrigin: "*",
    });
    const routerConnection = await ParentHandshake(messenger, {}, handshakeMaxAttempts, handshakeAttemptsInterval);
    const remoteHandle = routerConnection.remoteHandle();

    // Send the bridge iframe name to the router so it knows where to send the provider URL.
    if (!this.childFrame) {
      throw new Error("Bridge iframe not found");
    }
    remoteHandle.call("setFrameName", this.bridgeUrl);

    // Wait for result.
    const result: string = await new Promise((resolve) => {
      remoteHandle.addEventListener("result", (payload: string) => resolve(payload));
    });

    // Close the connection.
    routerConnection.close();

    return result;
  }

  protected start(): void {
    // Initialize state.
    this.providerStatus = emptyProviderStatus;

    // Create the iframe.
    this.childFrame = createIframe(this.bridgeUrl, this.bridgeUrl)
    const childWindow = this.childFrame.contentWindow!;

    // Connect to the iframe.
    const messenger = new WindowMessenger({
      localWindow: window,
      remoteWindow: childWindow,
      remoteOrigin: "*",
    });
    this.bridgeConnection = ParentHandshake(messenger, {}, handshakeMaxAttempts, handshakeAttemptsInterval);

    this.bridgeMetadata = this.getBridgeMetadata();
  }
}
