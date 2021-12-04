import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";

export default class CatCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Looks like you can use some cat pics.");
  
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    await interaction.reply({
      attachments: [
        new MessageAttachment(await imgurImage("cat"))
      ]
    });
  }
}
