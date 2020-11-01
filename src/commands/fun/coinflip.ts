import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message, MessageAttachment } from "discord.js";
import User from "../../models/user";

export default class CoinflipCommand extends Command {
  cmdName = "coinflip";
  description = "Flip a coin and receive a random side.";
  groupName = "Fun";
  aliases = ["flip"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const random = ["heads", "tails"][Math.floor(Math.random() * 2)];

    await message.channel.send(
      new MessageAttachment(
        random === "heads"
          ? `https://i.imgur.com/YiydiKH.png`
          : `https://i.imgur.com/cHkeN1v.png`
      )
    );
  }
}
