import { Message } from "discord.js";
import { UserModel } from "../models/user";
import { GlobalModel } from "../models/global";
import { GuildModel, Guild as DbGuild } from "../models/guild";
import settings from "../settings";
import Event, { Groups } from ".";
import { permissionCheck } from "../util";
import { DocumentType } from "@typegoose/typegoose";

export default class CommandHandler extends Event {
  eventName = "message";
  groupName: Groups = "default";

  async handle(message: Message) {
    if (message.author.bot && settings.vision_id !== message.author.id) return;

    const userData =
      (await UserModel.findOne({ userId: message.author.id })) ||
      (await UserModel.create({ userId: message.author.id }));

    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    let guildData: DocumentType<DbGuild>;
    if (message.guild) {
      guildData =
        (await GuildModel.findOne({ guildId: message.guild.id })) ||
        (await GuildModel.create({ guildId: message.guild.id }));
    }

    if (message.content.indexOf(globalData.prefix) === 0) {
      const args = message.content
        .slice(globalData.prefix.length)
        .trim()
        .replace(/ /g, "\n")
        .split(/\n+/g);
      const command = args.shift().toLowerCase();

      for (const commandObj of this.client.commands.array()) {
        if (commandObj.disabled) continue;
        if (
          commandObj.cmdName.toLowerCase() === command.toLowerCase() ||
          commandObj.aliases
            .map((x) => x.toLowerCase())
            .includes(command.toLowerCase())
        ) {
          if (
            commandObj.permission &&
            !permissionCheck(
              userData,
              commandObj.permission,
              commandObj.groupName
            )
          )
            return;
          if (message.channel.type === "text") message.delete();
          commandObj.run(message, args, userData, globalData, guildData);
        }
      }
    }
  }
}
