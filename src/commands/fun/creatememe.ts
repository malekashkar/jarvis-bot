import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message, MessageAttachment, MessageEmbed } from "discord.js";
import User from "../../models/user";
import { createCanvas, loadImage, registerFont } from "canvas";
import Global from "../../models/global";

export default class CreateMemeCommand extends Command {
  cmdName = "creatememe";
  description = "Create a meme by yourself!";
  groupName = "Fun";
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    registerFont("./util/arimo.ttf", { family: "Arimo" });

    function place(height: number, choice: string) {
      if (choice === "top+") return height / 12;
      if (choice === "top") return height / 4;
      if (choice === "middle") return height / 2;
      if (choice === "down") return height - height / 4;
      if (choice === "down+") return height - height / 12;
    }

    const imgQuestion = await message.channel.send(
      `Please provide me with an image for the meme.`
    );
    const imgResponse = await message.channel.awaitMessages(
      (m) => m.author.id === message.author.id && m.attachments,
      { max: 1 }
    );
    if (imgQuestion.deletable) imgQuestion.delete();

    const canvas = createCanvas(
      imgResponse.first().attachments.first().width,
      imgResponse.first().attachments.first().height
    );
    const ctx = canvas.getContext("2d");
    const background = await loadImage(
      imgResponse.first().attachments.first().url
    );
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    if (imgResponse.first().deletable) imgResponse.first().delete();

    const memeQuestion = await message.channel.send(
      `What would you like the meme text to be?`
    );
    const text = await message.channel.awaitMessages(
      (m) => m.author.id === message.author.id && m.content.length < 100,
      { max: 1 }
    );
    if (memeQuestion.deletable) memeQuestion.delete();
    if (text.first().deletable) text.first().delete();

    const placeQuestion = await message.channel.send(
      `Where would you like the meme to be placed? (top+, top, middle, down, down+)`
    );
    const placement = await message.channel.awaitMessages(
      (m) =>
        m.author.id === message.author.id &&
        ["top+", "top", "middle", "down", "down+"].includes(m.content),
      { max: 1 }
    );
    if (placeQuestion.deletable) placeQuestion.delete();
    if (placement.first().deletable) placement.first().delete();

    const size = await message.channel.send(
      `What should the text size be? (default is 20)`
    );
    const text_size = await message.channel.awaitMessages(
      (m) =>
        m.author.id === message.author.id &&
        parseInt(m.content) > 10 &&
        parseInt(m.content) < 100,
      { max: 1 }
    );
    if (size.deletable) size.delete();
    if (text_size.first().deletable) text_size.first().delete();

    ctx.lineWidth = 5;
    ctx.font = `${parseInt(
      text_size.first().content.match(/[0-9]/gm).join("")
    )}pt Arimo`;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.lineJoin = "round";

    const x = canvas.width / 2;
    const y = place(canvas.height, placement.first().content);
    ctx.strokeText(text.first().content.toUpperCase(), x, y);
    ctx.fillText(text.first().content.toUpperCase(), x, y);

    await message.channel.send(
      new MessageEmbed()
        .attachFiles([
          {
            attachment: canvas.toBuffer(),
            name: "meme.png",
          },
        ])
        .setImage("attachment://meme.png")
    );
  }
}
