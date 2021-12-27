import { ClientEvents } from "discord.js";
import Client from "..";
import { ModulePrices } from "../models/global";

export type EventNameType = keyof ClientEvents;
export type Groups = keyof ModulePrices;

export default abstract class Task {
  disabled = false;
  
  client: Client;
  constructor(client: Client) {
    this.client = client;
  }
  
  abstract taskName: string;
  abstract interval: number;
  abstract execute(...args: unknown[]): Promise<void>;
}
