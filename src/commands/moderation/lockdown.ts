import { TextChannel, VoiceChannel, Permissions, CommandInteraction } from "discord.js";
import embeds from "../../util/embed";
import ModCommands from ".";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class LockdownCommand extends ModCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Lockdown multiple channels or the entire guild.")
    .addStringOption(sub =>
      sub.setName("lockdown type").setDescription("The type of lockdown you would like to initiate.").setRequired(true)
        .addChoice("Guild", "guild")
        .addChoice("Channel", "channel"));

  async run(interaction: CommandInteraction) {
    if (!interaction.guild) return;

    const option = interaction.options.getString("lockdown type");
    if (option === "guild") {
      for (const channel of interaction.guild.channels.cache) {
        if (channel instanceof TextChannel || channel instanceof VoiceChannel)
          await lockChannel(channel);
      }
      return interaction.reply({
        embeds: [embeds.normal(`Operation Complete`, `The guild has been locked down!`)]
      });
    } else {
      await lockChannel(interaction.channel as TextChannel);
      return interaction.reply({
        embeds: [
          embeds.normal(
            `Operation Complete`,
            `This channel has been locked down!`
          )
        ]
      });
    }
  }
}

async function lockChannel(channel: TextChannel | VoiceChannel) {
  if (channel instanceof TextChannel) {
    await channel.permissionOverwrites.set([{
      id: channel.guild.roles.everyone,
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.SEND_MESSAGES]
    }]);
  } else if (channel instanceof VoiceChannel) {
    await channel.permissionOverwrites.set([{
      id: channel.guild.roles.everyone,
      allow: [Permissions.FLAGS.VIEW_CHANNEL],
      deny: [Permissions.FLAGS.SPEAK]
    }]);
  }
}
