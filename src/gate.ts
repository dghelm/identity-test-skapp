import { connectToChild } from "penpal";
import { Connection } from "penpal/lib/types";

import { createIframe } from "./utils";

export type ProviderInfo = {
  providerInterface: Record<string, Array<string>>;
  isProviderConnected: boolean;
  isProviderLoaded: boolean;
  metadata: ProviderMetadata;
};

type ProviderMetadata = {
  name: string;
  domain: string;
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
  providerInfo: ProviderInfo;

  private bridgeConnection: Connection;

  /**
   * Load a bridge, returning the gate to the bridge.
   */
  static async loadBridge(bridgeUrl: string, skappInfo: SkappInfo): Promise<Gate> {
    if (typeof Storage == "undefined") {
      throw new Error("Browser does not support web storage");
    }

    // Create the iframe.
    const childFrame = createIframe(bridgeUrl);

    // Connect to the iframe.
    const connection = connectToChild({
      iframe: childFrame,
      timeout: 5_000,
    });

    const gate = new Gate;
    gate.bridgeConnection = connection;

    return gate.bridgeConnection.promise
      .then((child) => child.setSkappInfo(skappInfo));
  }

  async callInterface(method: string): Promise<unknown> {
    if (!Object.prototype.hasOwnProperty.call(this.providerInfo, method)) {
      throw new Error(`interface does not have method '${method}'`);
    }

    return this.bridgeConnection.promise.then(async (child) => child.callInterface(method));
  }

  // TODO: Verify return value from child has correct fields.
  async connectProvider(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.connectProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async disconnectProvider(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.disconnectProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async fetchStoredProvider(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.fetchStoredProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async getProviderInfo(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.getProviderInfo())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async loadNewProvider(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.loadNewProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  /**
   * Set the skapp info for subsequent bridge calls.
   */
  async setSkappInfo(): Promise<void> {
    return this.bridgeConnection.promise
      .then(async (child) => child.setSkappInfo());
  }

  async unloadProvider(): Promise<void> {
    return this.bridgeConnection.promise.then(async (child) => child.unloadProvider());
  }
}
