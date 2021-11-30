import { Message, TextChannel, VoiceChannel, Permissions } from "discord.js";
import embeds from "../../util/embed";
import ModCommands from ".";

export default class LockdownCommand extends ModCommands {
  cmdName = "lockdown";
  description = "Lockdown a channels or a server.";
  permission = "ACCESS";

  async run(message: Message, args: string[]) {
    if (!message.guild) return;

    const option =
      args[0]?.toLowerCase() === "server" ||
      args[0]?.toLowerCase() === "servers"
        ? "server"
        : args[0]?.toLowerCase() === "channel"
        ? "channel"
        : null;
    if (!option)
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide **server/channel** as your first argument.`
          )
        ]
      });

    if (option === "server") {
      for (const channel of message.guild.channels.cache) {
        if (channel instanceof TextChannel || channel instanceof VoiceChannel)
          await lockChannel(channel);
      }
      return message.channel.send({
        embeds: [embeds.normal(`Operation Complete`, `The server has been locked down!`)]
      });
    } else {
      await lockChannel(message.channel as TextChannel);
      return message.channel.send({
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
