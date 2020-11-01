import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Message, TextChannel } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class sayCommand extends Command {
  cmdName = "say";
  description = "Send a message somewhere specific.";
  groupName = "Misc";
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const typeQuestion = await messageQuestion(
      message,
      `Would you like to post the message in a **server** or **here**?`,
      message.author.id,
      ["server", "here"]
    );
    if (!typeQuestion) return;

    const option = typeQuestion.content;

    const msgQuestion = await messageQuestion(
      message,
      `What would you like the message to be?`
    );
    if (!msgQuestion) return;

    const text = msgQuestion.content;

    if (option === "here") message.channel.send(text);
    else {
      const serverQuestion = await message.channel.send(
        embeds.question(`What is the number of the server?`)
      );
      const serverResponse = await message.channel.awaitMessages(
        (x) =>
          x.author.id === message.author.id &&
          parseInt(x.content) <= client.guilds.cache.size,
        { max: 1, time: 900000, errors: ["time"] }
      );
      if (!serverResponse) return;
      if (serverQuestion.deletable) serverQuestion.delete();
      if (serverResponse.first().deletable) serverResponse.first().delete();

      const server = client.guilds.cache.get(
        client.guilds.cache.array()[
          parseInt(serverResponse.first().content) - 1
        ].id
      );
      if (!server)
        return message.channel.send(
          embeds.error(`There is no server with the provided number!`)
        );

      const channelNameQuestion = await messageQuestion(
        message,
        `What is the name of the channel in the server?`
      );
      if (!channelNameQuestion) return;

      const channel = server.channels.cache.find(
        (x) => x.type === "text" && x.name === channelNameQuestion.content
      );
      if (!channel || !channel.permissionsFor(server.me).has("SEND_MESSAGES"))
        return message.channel.send(
          embeds.error(`The channel you provided could not be found!`)
        );

      (channel as TextChannel).send(text);
    }
  }
}
