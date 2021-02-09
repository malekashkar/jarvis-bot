import { Message, TextChannel } from "discord.js";
import FridayCommands from ".";
import embeds from "../../util/embed";
import { messageQuestion } from "../../util/questions";

export default class LockdownCommand extends FridayCommands {
  cmdName = "lockdown";
  description =
    "Lockdown either the entire server or the current channel you're in.";

  async run(message: Message) {
    const typeQuestion = await messageQuestion(
      message,
      `Would you like to lockdown the **server** or just **here**?`,
      message.author.id,
      ["server", "here"]
    );
    if (!typeQuestion) return;

    if (typeQuestion.content.toUpperCase() === "SERVER") {
      message.guild.channels.cache.forEach(
        async (c) =>
          await c.updateOverwrite(message.guild.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false,
          })
      );
      await message.channel.send(embeds.lockdown("SERVER"));
    } else {
      (message.channel as TextChannel).updateOverwrite(message.guild.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: false,
      });
      await message.channel.send(embeds.lockdown("HERE"));
    }
  }
}
