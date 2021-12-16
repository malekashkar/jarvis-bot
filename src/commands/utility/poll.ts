import UtilityCommands from ".";
import { CommandInteraction, Message } from "discord.js";
import { emojis } from "../../util";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { stringQuestion } from "../../util/questions";

export default class PollCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a new poll interface.");
    
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const pollQuestion = await stringQuestion(interaction, "What would you like the poll question to be?");
    if(!pollQuestion) return interaction.reply({
      embeds: [embeds.error("Please provide a question for the poll!")]
    });

    const optionsQuestion = await stringQuestion(interaction, "Please enter all poll options seperated by a **^**.");
    if(!optionsQuestion) return interaction.reply({
      embeds: [embeds.error("Please provide the options for the poll.")]
    });

    const pollOptions = optionsQuestion
      .split("^")
      .map((option, i) => emojis[i] + " " + option.trim())
      .join("\n");

    const pollEmbed = await interaction.reply({
      embeds: [embeds.normal(`Jarvis Polls`, pollQuestion + "\n\n" + pollOptions)],
      fetchReply: true
    });

    if(pollEmbed instanceof Message) {
      for (const emoji of emojis.slice(0, pollOptions.length)) {
        await pollEmbed.react(emoji);
      }
    }
  }
}
