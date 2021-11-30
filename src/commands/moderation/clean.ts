import { Message, TextChannel } from "discord.js";
import ModCommands from ".";
import embeds from "../../util/embed";

export default class CleanCommand extends ModCommands {
  cmdName = "clean";
  description = "Delete messages from a channel.";
  aliases = ["purge"];
  permission = "ACCESS";

  async run(message: Message) {
    const userQuestion = await message.channel.send({
      embeds: [
        embeds.question(
          `Would you like to clear a users messages? Say "no" if not.`
        )
      ]
    });
    const userReponse = await message.channel.awaitMessages({
      filter: (x) =>
        (x.author.id === message.author.id && x.content.includes("no")) || x.mentions.users.size > 0,
      max: 1, 
      time: 900000, 
      errors: ["time"]
    });
    if (!userReponse) return;

    const user =
      userReponse.first().content === "no"
        ? false
        : userReponse.first().mentions.users.first();
    if (userQuestion.deletable) userQuestion.delete();
    if (userReponse.first().deletable) userReponse.first().delete();

    const amountQuestion = await message.channel.send({
      embeds: [embeds.question(`How many messages would you like to delete? Up to 100.`)]
    });
    const amountResponse = await message.channel.awaitMessages({
      filter: (x) => x.author.id === message.author.id && /[0-9]/gm.test(x.content),
      max: 1, 
      time: 900 * 1000, 
      errors: ["time"]
    });
    if (!amountResponse) return;

    if (amountQuestion.deletable) amountQuestion.delete();
    if (amountResponse.first().deletable) amountResponse.first().delete();

    const amount =
      parseInt(amountResponse.first().content.match(/[0-9]/gm).join("")) > 100
        ? 100
        : parseInt(amountResponse.first().content.match(/[0-9]/gm).join(""));

    const channel = message.channel as TextChannel;
    const messages = await message.channel.messages.fetch({
      limit: amount,
    });

    if (user)
      channel.bulkDelete(messages.filter((m) => m.author.id === user.id));
    else channel.bulkDelete(messages);
  }
}
