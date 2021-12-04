import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import User from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js";

export default class PrefixCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Set the prefix of the bot.")
    .addStringOption(sub =>
      sub.setName("prefix").setDescription("The new prefix you want to set.").setRequired(true));

  aliases = ["status"];
  permission = "OWNER";

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const prefix = interaction.options.getString("prefix");
    if (!prefix)
      return interaction.reply({
        embeds: [
          embeds.error(`Please provide the prefix you would like to change to.`)
        ]
      });

    globalData.prefix = prefix;
    await globalData.save();

    await interaction.reply({
      embeds: [
        embeds.normal(
          `Prefix Changed`,
          `The prefix of the bot has been changed to: **${prefix}**`
        )
      ]
    });
  }
}
