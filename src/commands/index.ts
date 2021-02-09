import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../models/user";
import Global, { ModulePrices } from "../models/global";
import Client from "..";
import { Guild } from "../models/guild";

export type Groups = keyof ModulePrices;

export default abstract class Command {
  permission: string;
  disabled = false;
  usage = "";
  aliases: string[] = [];
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  abstract cmdName: string;
  abstract description: string;
  abstract groupName: Groups;
  abstract run(
    _message: Message,
    _userData?: DocumentType<User>,
    _globalData?: DocumentType<Global>,
    _guildData?: DocumentType<Guild>
  ): Promise<Message | void>;
}
