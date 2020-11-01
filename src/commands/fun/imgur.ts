import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message } from "discord.js";
import User from "../../models/user";
import { uploadImage } from "../../util";
import embeds from "../../util/embed";

export default class ImgurLink extends Command {
  cmdName = "imgur";
  description = "Create a imgur link with an image.";
  groupName = "Misc";
  aliases = ["imlink", "image"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const question = await message.channel.send(
      embeds.question(`Upload an image to upload to imgur.`)
    );
    const response = await message.channel.awaitMessages(
      (m) => m.author.id === message.author.id && m.attachments,
      { max: 1 }
    );

    if (question.deletable) question.delete();
    const imageLink = await uploadImage(
      response.first().attachments.first().url
    );
    if (!imageLink)
      return message.channel.send(
        embeds.error(`There was an issue uploading the image to imgur!`)
      );

    if (response.first().deletable) response.first().delete();
    await message.channel.send(imageLink);
  }
}
