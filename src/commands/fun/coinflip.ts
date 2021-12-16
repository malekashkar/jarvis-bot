import FunCommands from ".";
import { CommandInteraction, MessageAttachment } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class CoinflipCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin and receive a random side.");
    
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const random = ["heads", "tails"][Math.floor(Math.random() * 2)];

    return interaction.reply({
      attachments: [
        new MessageAttachment(
          random === "heads"
            ? `https://i.imgur.com/YiydiKH.png`
            : `https://i.imgur.com/cHkeN1v.png`
        )
      ]
    });
  }
}
