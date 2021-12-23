import FunCommands from ".";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class ColorCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("color")
    .setDescription("Receive a random HEX color.");
    
  async run(interaction: CommandInteraction) {
    const color = Math.floor(Math.random()*16777215).toString(16);
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(color)
          .setColor(parseInt(color))
      ]
    });
  }
}
