import { ClientEvents } from "discord.js";
import Client from "..";
export type EventNameType = keyof ClientEvents;

export default abstract class Event {
  disabled = false;
  
  client: Client;
  constructor(client: Client) {
    this.client = client;
  }
  
  abstract eventName: string;
  abstract group: string;
  abstract handle(...args: unknown[]): Promise<void>;
}
