import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction, Message } from "discord.js";
import User from "../models/user";
import Global, { ModulePrices } from "../models/global";
import Client from "..";
import { Guild } from "../models/guild";
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders";

export type Groups = keyof ModulePrices;
export enum Permissions { 
  OWNER = 2,
  ACCESS = 1,
  NONE = 0
};

export default abstract class Command {
  permission: Permissions;
  disabled = false;
  client: Client;
    
  constructor(client: Client) {
    this.client = client;
  }
  
  abstract groupName: Groups;
  abstract slashCommand: SlashCommandBuilder |
    SlashCommandSubcommandsOnlyBuilder |
    SlashCommandOptionsOnlyBuilder |
    Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

  abstract run(
    _interaction: CommandInteraction,
    _userData?: DocumentType<User>,
    _globalData?: DocumentType<Global>,
    _guildData?: DocumentType<Guild>
  ): Promise<void | Message>;
}
