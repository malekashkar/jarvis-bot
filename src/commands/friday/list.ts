import Global from "../../models/global";
import { Guild } from "../../models/guild";
import User from "../../models/user";
import FridayCommands from ".";
import ms from "ms";
import { DocumentType } from "@typegoose/typegoose";
import embeds from "../../util/embed";
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class ListCommand extends FridayCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("list")
    .setDescription("List all the roles currently setup and the channels they can use.");

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    if (!guildData.roles.length)
      return interaction.reply({
        embeds: [
          embeds.error(`There are no roles setup currently!`)
        ]
      });

    const fields = guildData.roles.map((role) => {
      return {
        name: interaction.guild.roles.resolve(role.role).name,
        value: `**Channels**: ${role.channels.map((c) => `<#${c}>\n`).join("")}
      **Interval**: ${ms(role.cooldownTime)}
      **Autorole**: ${role.autorole}`,
        inline: true,
      };
    });

    await interaction.reply({
      embeds: [
        embeds.empty().setTitle(`Listed Roles`).addFields(fields)
      ]
    });
  }
}
