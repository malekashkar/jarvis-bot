import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import User from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";

export default class SetstatusCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("setstatus")
    .setDescription("Set the status of the bot.")
    .addStringOption(sub => 
      sub.setName("status").setDescription("Enter the new status you would like to set.").setRequired(true));
    
  permission = "OWNER";

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const status = interaction.options.getString("status");
    if (!status)
      return interaction.reply({
        embeds: [
          embeds.error(
            `Please provide the message you would like to set the status to!`
          )
        ]
      });

    globalData.status = status;
    await globalData.save();

    this.client.user.setActivity(status, { type: "WATCHING" });
    return interaction.reply({
      embeds: [
        embeds.normal(
          `Status Changed`,
          `The status of the bot has been changed to: **${status}**`
        )
      ]
    });
  }
}
