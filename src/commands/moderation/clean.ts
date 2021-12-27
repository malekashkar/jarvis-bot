import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, TextChannel } from "discord.js";
import ModCommands from ".";
import embeds from "../../util/embed";
import { getTaggedUsersOrCancel, numberQuestion } from "../../util/questions";

export default class CleanCommand extends ModCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("clean")
    .setDescription("Delete messages from a channel.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user you would like to purge messages for.").setRequired(false));

  async run(interaction: CommandInteraction) {
    const user = interaction.options.getUser("user", false);
    const amount = await numberQuestion(interaction,"How many messages would you like to delete? Up to 100.");
    if(!amount) return interaction.reply({
      embeds: [embeds.error("Enter the number of messages you would like to delete.")]
    });

    const channel = interaction.channel as TextChannel;
    const messages = (await interaction.channel.messages.fetch({ limit: amount }))
      ?.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

    if(user) channel.bulkDelete(messages.filter((m) => m.author.id == user.id));
    else channel.bulkDelete(messages);
  }
}