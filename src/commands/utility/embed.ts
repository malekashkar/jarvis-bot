import UtilityCommands from ".";
import { Message, MessageEmbed } from "discord.js";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class EmbedCommand extends UtilityCommands {
  cmdName = "embed";
  description = "Send an embed somewhere.";
  permission = "ACCESS";

  async run(message: Message) {
    const typeQuestion = await messageQuestion(
      message,
      `Would you like to post an embed in a **server** or **here**?`,
      message.author.id,
      ["server", "here"]
    );
    if (!typeQuestion) return;

    const textQuestion = await messageQuestion(
      message,
      `What would you like the embed text to be? Use **^** to seperate the title from text.`
    );
    if (!textQuestion) return;

    const option = typeQuestion.content;
    const text = textQuestion.content;

    const title = text.includes("^") ? text.split("^")[0] : false;
    const description = text.includes("^") ? text.split("^")[1] : text;

    if (option === "here") {
      let embed = new MessageEmbed()
        .setDescription(description)
        .setColor("RANDOM");
      if (title) embed.setTitle(title);
      message.channel.send(embed);
    } else {
      const serverQuestion = await message.channel.send(
        embeds.question(`What is the number of the server?`)
      );
      const serverResponse = await message.channel.awaitMessages(
        (x) =>
          x.author.id === message.author.id &&
          parseInt(x.content) <= this.client.guilds.cache.size,
        { max: 1, time: 900000, errors: ["time"] }
      );
      if (!serverResponse) return;

      if (serverQuestion.deletable) serverQuestion.delete();
      if (serverResponse.first().deletable) serverResponse.first().delete();

      const server = this.client.guilds.cache.get(
        this.client.guilds.cache.array()[
          parseInt(serverResponse.first().content) - 1
        ].id
      );
      if (!server)
        return message.channel.send(
          embeds.error(`There is no server with the provided number!`)
        );

      const channelQuestion = await messageQuestion(
        message,
        `What is the name of the channel in the server?`
      );

      const channel = server.channels.cache.find(
        (x) => x.type === "text" && x.name === channelQuestion.content
      );
      if (!channel || !channel.permissionsFor(server.me).has("SEND_MESSAGES"))
        return message.channel.send(
          embeds.error(
            `The channel you provided could not be found or I can't send messages there!`
          )
        );

      const embed = new MessageEmbed().setDescription(description);
      if (title) embed.setTitle(title);
      await message.channel.send(embed);
    }
  }
}
