import { connectToChild } from "penpal";

export type ProviderInfo = {
  providerInterface: Record<string, Array<string>>;
  isProviderConnected: boolean;
  isProviderLoaded: boolean;
  providerName: string;
};

export class Gate {
  providerInfo: ProviderInfo;

  private bridgeHandshake;

  constructor(bridgeUrl: string) {
    if (typeof Storage == "undefined") {
      throw new Error("Browser does not support web storage");
    }

    // Create the iframe.

    const childFrame = document.createElement("iframe")!;
    childFrame.src = bridgeUrl;
    childFrame.style.display = "none";
    // Add the frame to the page.
    if (document.readyState === "complete" || document.readyState === "interactive") {
      document.body.appendChild(childFrame);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(childFrame);
      });
    }

    // Connect to the iframe.

    const connection = connectToChild({
      iframe: childFrame,
      timeout: 5_000,
    });

    this.bridgeHandshake = connection.promise;
    // TODO: Update interface whenever child updates provider info (child should send event)
    // Should more generally update ALL provider info?
    // this.providerInterface = this.getInterface();
  }

  async callInterface(method: string): Promise<unknown> {
    if (!Object.prototype.hasOwnProperty.call(this.providerInfo, method)) {
      throw new Error(`interface does not have method '${method}'`);
    }

    return this.bridgeHandshake.then(async (child) => child.callInterface(method));
  }

  // TODO: Verify return value from child has correct fields.
  async connectProvider(): Promise<ProviderInfo> {
    return this.bridgeHandshake
      .then(async (child) => child.connectProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async disconnectProvider(): Promise<ProviderInfo> {
    return this.bridgeHandshake
      .then(async (child) => child.disconnectProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async fetchStoredProvider(): Promise<ProviderInfo> {
    return this.bridgeHandshake
      .then(async (child) => child.fetchStoredProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async getProviderInfo(): Promise<ProviderInfo> {
    return this.bridgeHandshake
      .then(async (child) => child.getProviderInfo())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async loadProvider(): Promise<ProviderInfo> {
    return this.bridgeHandshake
      .then(async (child) => child.loadProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async unloadProvider(): Promise<void> {
    return this.bridgeHandshake.then(async (child) => child.unloadProvider());
  }
}
