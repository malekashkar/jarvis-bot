import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message, TextChannel } from "discord.js";
import Command from "..";
import Global from "../../models/global";
import User from "../../models/user";
import Client from "../../structures/client";
import embeds from "../../util/embed";
import { getTaggedUser } from "../../util/questions";

export default class CleanCommand extends Command {
  cmdName = "clean";
  description = "Delete messages from a channel.";
  groupName = "Moderation";
  aliases = ["purge"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const userQuestion = await message.channel.send(
      embeds.question(
        `Would you like to clear a users messages? Say "no" if not.`
      )
    );
    const userReponse = await message.channel.awaitMessages(
      (x) =>
        (x.author.id === message.author.id && x.content.includes("no")) ||
        x.mentions.users,
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!userReponse) return;

    const user =
      userReponse.first().content === "no"
        ? false
        : userReponse.first().mentions.users.first();
    if (userQuestion.deletable) userQuestion.delete();
    if (userReponse.first().deletable) userReponse.first().delete();

    const amountQuestion = await message.channel.send(
      embeds.question(`How many messages would you like to delete? Up to 100.`)
    );
    const amountResponse = await message.channel.awaitMessages(
      (x) => x.author.id === message.author.id && x.content.match(/[0-9]/gm),
      { max: 1, time: 900000, errors: ["time"] }
    );
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
