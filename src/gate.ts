import { ParentHandshake, WindowMessenger } from "post-me";
import type { Connection } from "post-me";
import { SkynetClient } from "skynet-js";
import urljoin from "url-join";

import { createIframe, ensureUrl, popupCenter } from "./utils";
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
  url: string;

  relativeConnectorPath: string;
  connectorName: string;
  connectorW: number;
  connectorH: number;
};

export type SkappInfo = {
  name: string;
  domain: string;
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

  async connectProvider(skappInfo: SkappInfo): Promise<ProviderStatus> {
    const connection = await this.bridgeConnection;

    // Register an event listener for connectionComplete.

    const promise: Promise<ProviderStatus> = new Promise((resolve) => {
      const remoteHandle = connection.remoteHandle();
      const handleEvent = (status: ProviderStatus) => {
        remoteHandle.removeEventListener("connectionComplete", handleEvent);

        resolve(status);
      };

      remoteHandle.addEventListener('connectionComplete', handleEvent);
    });

    // Launch the connector.

    const result = await this.launchConnector(skappInfo);
    if (result === "closed") {
      // User closed the connector. Don't show error message screen, just silently return the current provider info without changes.
      return this.providerStatus;
    } else if (result !== "success") {
      throw new Error(result);
    }

    // Wait for provider to receive connection info.

    this.providerStatus = await promise;

    return this.providerStatus;
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

    // TODO: We should wait on a one-time emitted "providerReceived" event here.
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
   * Creates window with connector and waits for a response.
   */
  protected async launchConnector(skappInfo: SkappInfo): Promise<string> {
    // Set the connector URL.
    const metadata = this.providerStatus.metadata;
    if (!metadata) {
      throw new Error("Provider not loaded, possible logic error");
    }
    const providerUrl = ensureUrl(metadata.url);
    let connectorUrl = urljoin(providerUrl, metadata.relativeConnectorPath);
    // Send the iframe name to the connector so the iframe knows where to send the provider URL.
    connectorUrl = `${connectorUrl}?bridgeFrameName=${this.bridgeUrl}&skappName=${skappInfo.name}&skappDomain=${skappInfo.domain}`;

    // Wait for result.
    const promise: Promise<string> = new Promise((resolve, reject) => {
      // Register a message listener.
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== providerUrl)
          return;

        window.removeEventListener("message", handleMessage);

        // Resolve or reject the promise.
        if (!event.data) {
          reject("Connector did not send response");
        }
        resolve(event.data);
      };

      window.addEventListener("message", handleMessage);
    });

    // Open the connector.
    const connectorWindow = popupCenter(connectorUrl, metadata.connectorName, metadata.connectorW, metadata.connectorH);

    return promise;
  }

  // TODO: should check periodically if window is still open.
  /**
   * Creates window with router and waits for a response.
   */
  protected async launchRouter(): Promise<string> {
    // Set the router URL.
    const bridgeMetadata = await this.bridgeMetadata;
    const routerUrl = urljoin(this.bridgeUrl, bridgeMetadata.relativeRouterUrl);

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
    const bridgeUrl = ensureUrl(this.bridgeUrl);
    this.childFrame = createIframe(bridgeUrl, bridgeUrl)
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
