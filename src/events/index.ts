import { ClientEvents } from "discord.js";
import Client from "..";
import { ModulePrices } from "../models/global";

export type EventNameType = keyof ClientEvents;
export type Groups = keyof ModulePrices;

export default abstract class Event {
  disabled = false;
  
  client: Client;
  constructor(client: Client) {
    this.client = client;
  }
  
  abstract eventName: string;
  abstract groupName: Groups;
  abstract handle(...args: unknown[]): Promise<void>;
}
