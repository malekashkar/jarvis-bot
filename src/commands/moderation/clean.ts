import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, TextChannel } from "discord.js";
import ModCommands from ".";
import embeds from "../../util/embed";
import { getTaggedUsersOrCancel, numberQuestion } from "../../util/questions";

export default class CleanCommand extends ModCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("clean")
    .setDescription("Delete messages from a channel.");

  async run(interaction: CommandInteraction) {
    const userQuestion = await getTaggedUsersOrCancel(interaction, "Tag the user messages you would like to delete.");
    const amount = await numberQuestion(interaction,"How many messages would you like to delete? Up to 100.");
    if(!amount) return interaction.reply({
      embeds: [embeds.error("Enter the number of messages you would like to delete.")]
    });

    const channel = interaction.channel as TextChannel;
    const messages = (await interaction.channel.messages.fetch({ limit: amount }))
      ?.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

    if(userQuestion) channel.bulkDelete(messages.filter((m) => m.author.id === userQuestion[0].id));
    else channel.bulkDelete(messages);
  }
}