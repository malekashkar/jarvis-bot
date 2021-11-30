import UtilityCommands from ".";
import { Message, TextChannel } from "discord.js";
import embeds from "../../util/embed";

export default class EmbedCommand extends UtilityCommands {
  cmdName = "embed";
  description = "Send an embed somewhere.";
  permission = "ACCESS";

  async run(message: Message, args: string[]) {
    const option =
      args[0]?.toLowerCase() === "server" ||
      args[0]?.toLowerCase() === "servers"
        ? "server"
        : args[0]?.toLowerCase() === "here"
        ? "here"
        : null;
    if (!option)
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide **server/here** as the first argument of your command!`
          )
        ]
      });
    args.shift();

    const serverNumber = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
    if (option === "server" && !serverNumber) {
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide the server number you would like the message to be sent in!`
          )
        ]
      });
    } else if (option === "server" && serverNumber) {
      args.shift();
    }

    const channelName = args[0];
    if (option === "server" && !channelName) {
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide the channel's name you would like the message to be sent in!`
          )
        ]
      });
    } else if (option === "server" && channelName) {
      args.shift();
    }

    const text = args.join(" ");
    if (!text)
      return message.channel.send({
        embeds: [embeds.error(`Please provide the text for the message!`)]
      });

    const title = text.includes("^") ? text.split("^")[0] : false;
    const description = text.includes("^") ? text.split("^")[1] : text;
    const embed = embeds.empty();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);

    if (option === "here") {
      message.channel.send({ embeds: [embed] });
    } else {
      const server = this.client.guilds.cache.get(
        Array.from(this.client.guilds.cache.values())[serverNumber - 1].id
      );
      if (!server)
        return message.channel.send({
          embeds: [embeds.error(`There is no server with the provided number!`)]
        });
      const channel = Array.from(server.channels.cache.values()).find(
        (x) => x.type === "GUILD_TEXT" && x.name === channelName
      ) as TextChannel;
      if (!channel || !channel.permissionsFor(server.me).has("SEND_MESSAGES"))
        return message.channel.send({
          embeds: [embeds.error(`The channel you provided could not be found!`)]
        });

      (channel as TextChannel).send({ embeds: [embed] });
    }
  }
}
