import FunCommands from ".";
import { Message, MessageAttachment } from "discord.js";

export default class CoinflipCommand extends FunCommands {
  cmdName = "coinflip";
  description = "Flip a coin and receive a random side.";
  aliases = ["flip"];
  permission = "ACCESS";

  async run(message: Message) {
    const random = ["heads", "tails"][Math.floor(Math.random() * 2)];

    await message.channel.send({
      attachments: [
        new MessageAttachment(
          random === "heads"
            ? `https://i.imgur.com/YiydiKH.png`
            : `https://i.imgur.com/cHkeN1v.png`
        )
      ]
    });
  }
}
