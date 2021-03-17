import { Message, TextChannel } from "discord.js";
import embeds from "../../util/embed";
import UtilityCommands from ".";

export default class sayCommand extends UtilityCommands {
  cmdName = "say";
  description = "Send a message somewhere specific.";
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
      return message.channel.send(
        embeds.error(
          `Please provide **server/here** as the first argument of your command!`
        )
      );
    args.shift();

    const serverNumber = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
    if (option === "server" && !serverNumber) {
      return message.channel.send(
        embeds.error(
          `Please provide the server number you would like the message to be sent in!`
        )
      );
    } else if (option === "server" && serverNumber) {
      args.shift();
    }

    const channelName = args[0];
    if (option === "server" && !channelName) {
      return message.channel.send(
        embeds.error(
          `Please provide the channel's name you would like the message to be sent in!`
        )
      );
    } else if (option === "server" && channelName) {
      args.shift();
    }

    const text = args.join(" ");
    if (!text)
      return message.channel.send(
        embeds.error(`Please provide the text for the message!`)
      );

    if (option === "here") {
      message.channel.send(text);
    } else {
      const server = this.client.guilds.cache.get(
        this.client.guilds.cache.array()[serverNumber - 1].id
      );
      if (!server)
        return message.channel.send(
          embeds.error(`There is no server with the provided number!`)
        );
      const channel = server.channels.cache.find(
        (x) => x.type === "text" && x.name === channelName
      ) as TextChannel;
      if (!channel || !channel.permissionsFor(server.me).has("SEND_MESSAGES"))
        return message.channel.send(
          embeds.error(`The channel you provided could not be found!`)
        );

      (channel as TextChannel).send(text);
    }
  }
}
