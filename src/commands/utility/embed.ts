import UtilityCommands from ".";
import { CommandInteraction, TextChannel } from "discord.js";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { optionsQuestion, stringQuestion } from "../../util/questions";

export default class EmbedCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Send an embed message anywhere");

  async run(interaction: CommandInteraction) {
    const option = await optionsQuestion(
      interaction,
      "Where would you like to send the message?",
      ["here", "guild"]
    );

    const content = await stringQuestion(interaction, "What message would you like to display?");

    if(content) {
      if (option == "here") {
        return interaction.reply({ embeds: [embeds.normal(null, content)] });
      } else {
        const guildId = await stringQuestion(interaction, "What is the ID of the guild?");
        const guild = await this.client.guilds.fetch(guildId);
        if(!guild) return interaction.reply({
          embeds: [embeds.error("The guild ID you provided is invalid!")]
        });

        const channelId = await stringQuestion(interaction, "What is the ID of the channel?");
        const channel = await guild.channels.fetch(channelId);
        if(!channel) return interaction.reply({
          embeds: [embeds.error("The channel ID you provided is invalid!")]
        });

        if(channel instanceof TextChannel) {
          if (channel.permissionsFor(guild.me).has("SEND_MESSAGES"))
          return interaction.reply({
            embeds: [embeds.error("I do not have permission to send messages in that channel!")]
          });
  
          channel.send({ embeds: [embeds.normal(null, content)] });
        }
      }
    }
  }
}
