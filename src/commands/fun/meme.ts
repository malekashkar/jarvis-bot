import { CommandInteraction, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class MemeCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Looks like you can use some memes right now.");
    
  async run(interaction: CommandInteraction) {
    return interaction.reply({ embeds: [new MessageAttachment(await imgurImage("meme"))] });
  }
}
