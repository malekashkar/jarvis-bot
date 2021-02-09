import { ClientEvents } from "discord.js";
import Client from "..";
export type EventNameType = keyof ClientEvents;

export default abstract class Event {
  disabled = false;
  abstract name: string;

  client: Client;
  constructor(client: Client) {
    this.client = client;
  }

  abstract handle(...args: unknown[]): Promise<void>;
}
