import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../models/user";
import Global from "../models/global";
import Client from "..";

export type Groups =
  | "Default"
  | "Administration"
  | "Authorization"
  | "Fun"
  | "Moderation"
  | "Reminders"
  | "Utility";

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
  abstract async run(
    _message: Message,
    _userData?: DocumentType<User>,
    _globalData?: DocumentType<Global>
  ): Promise<Message | void>;
}
