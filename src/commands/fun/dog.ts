import { CommandInteraction, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class DogCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("dog")
    .setDescription("Looks like you can use some dog pics.");
    
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    await interaction.reply({ embeds: [new MessageAttachment(await imgurImage("dog"))] });
  }
}
