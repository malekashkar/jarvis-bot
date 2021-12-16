import { DocumentType } from "@typegoose/typegoose";
import AuthCommands from ".";
import Global from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export default class AuthCommand extends AuthCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("auth")
    .setDescription("Authorize yourself to get access to the bot.")
    .addStringOption(sub =>
      sub.setName("code").setDescription("Enter your authentication code.").setRequired(true));
  
  async run(
    interaction: CommandInteraction,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const code = interaction.options.getString("code");
    if (!code)
      return interaction.reply({
        embeds: [
          embeds.error(`Please provide the code you would like to redeem!`)
        ]
      });
    else if (!globalData.codes.some((x) => x.code === code))
      return interaction.reply({
        embeds: [
          embeds.error(`The code you provided is either invalid or outdated.`)
        ]
      });

    const modules = globalData.codes.find((x) => x.code === code)?.modules;
    globalData.codes = globalData.codes.filter((x) => x.code !== code);
    await globalData.save();

    userData.access = true;
    userData.modules = modules;
    await userData.save();

    return interaction.reply({
      embeds: [
        embeds.normal(
          `Welcome To Jarvis`,
          `Welcome master ${interaction.user}. I am **${this.client.user.username}**, how can I be of assistance?`
        )
      ]
    });
  }
}
