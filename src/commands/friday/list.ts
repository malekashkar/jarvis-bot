import { Message } from "discord.js";
import Global from "../../models/global";
import { Guild } from "../../models/guild";
import User from "../../models/user";
import FridayCommands from ".";
import ms from "ms";
import { DocumentType } from "@typegoose/typegoose";
import embeds from "../../util/embed";

export default class ListCommand extends FridayCommands {
  cmdName = "list";
  description =
    "List all the roles currently setup and the channels they can use.";

  async run(
    message: Message,
    _args: string[],
    _userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    if (!guildData.roles.length)
      return message.channel.send({
        embeds: [
          embeds.error(`There are no roles setup currently!`)
        ]
      });

    const fields = guildData.roles.map((role) => {
      return {
        name: message.guild.roles.resolve(role.role).name,
        value: `**Channels**: ${role.channels.map((c) => `<#${c}>\n`).join("")}
      **Interval**: ${ms(role.cooldownTime)}
      **Autorole**: ${role.autorole}`,
        inline: true,
      };
    });

    await message.channel.send({
      embeds: [
        embeds.empty().setTitle(`Listed Roles`).addFields(fields)
      ]
    });
  }
}
