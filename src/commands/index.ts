import Main from "../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../models/user";
import Global from "../models/global";

export default abstract class Command {
  permission: string;
  disabled = false;
  usage = "";
  aliases: string[] = [];

  abstract cmdName: string;
  abstract description: string;
  abstract groupName: string;
  abstract async run(
    _client: Main,
    _message: Message,
    _userData?: DocumentType<User>,
    _globalData?: DocumentType<Global>,
    _command?: string
  ): Promise<Message | void>;
}
