import { Message, TextChannel, VoiceChannel } from "discord.js";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";
import ModCommands from ".";

export default class LockdownCommand extends ModCommands {
  cmdName = "lockdown";
  description = "Lockdown a channels or a server.";
  permission = "ACCESS";

  async run(message: Message) {
    if (!message.guild) return;

    const typeQuestion = await messageQuestion(
      message,
      `Would you like to lockdown this entire **server**, or just this **channel**?`,
      message.author.id,
      ["server", "channel"]
    );
    if (!typeQuestion) return;

    const option = typeQuestion.content;
    if (option === "server") {
      for (const channel of message.guild.channels.cache) {
        if (channel instanceof TextChannel) {
          channel.updateOverwrite(message.guild.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false,
          });
        } else if (channel instanceof VoiceChannel) {
          channel.updateOverwrite(message.guild.id, {
            VIEW_CHANNEL: true,
            SPEAK: false,
          });
        }
      }
      message.channel.send(
        embeds.normal(`Operation Complete`, `The server has been locked down!`)
      );
    } else {
      (message.channel as TextChannel).updateOverwrite(message.guild.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false,
      });
      message.channel.send(
        embeds.normal(
          `Operation Complete`,
          `This channel has been locked down!`
        )
      );
    }
  }
}
