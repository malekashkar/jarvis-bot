import FunCommands from ".";
import { CommandInteraction, Message, MessageAttachment } from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class CreateMemeCommand extends FunCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("creatememe")
    .setDescription("Crease a custom meme by yourself!");
    
  async run(interaction: CommandInteraction) {
    registerFont("./src/util/arimo.ttf", { family: "Arimo" });

    function place(height: number, choice: string) {
      if (choice == "top+") return height / 12;
      if (choice == "top") return height / 4;
      if (choice == "middle") return height / 2;
      if (choice == "down") return height - height / 4;
      if (choice == "down+") return height - height / 12;
    }

    const imgQuestion = await interaction.channel.send(
      `Please provide me with an image for the meme.`
    );
    const imgResponse = await interaction.channel.awaitMessages({ 
      filter: (m: Message) => m.author.id == interaction.user.id && m.attachments.size > 0,
      max: 1 
    });
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

    const memeQuestion = await interaction.channel.send(
      `What would you like the meme text to be?`
    );
    const text = await interaction.channel.awaitMessages({
      filter: (m) => m.author.id == interaction.user.id && m.content.length < 100,
      max: 1
    });
    if (memeQuestion.deletable) memeQuestion.delete();
    if (text.first().deletable) text.first().delete();

    const placeQuestion = await interaction.channel.send(
      `Where would you like the meme to be placed? (top+, top, middle, down, down+)`
    );
    const placement = await interaction.channel.awaitMessages({
      filter: (m) =>
        m.author.id == interaction.user.id &&
        ["top+", "top", "middle", "down", "down+"].includes(m.content),
      max: 1
    });
    if (placeQuestion.deletable) placeQuestion.delete();
    if (placement.first().deletable) placement.first().delete();

    const size = await interaction.channel.send(
      `What should the text size be? (default is 20)`
    );
    const text_size = await interaction.channel.awaitMessages({
      filter: (m) =>
        m.author.id == interaction.user.id &&
        parseInt(m.content) > 10 &&
        parseInt(m.content) < 100,
      max: 1
    });
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

    return interaction.reply({
      attachments: [new MessageAttachment(canvas.toBuffer(), "meme.png")]
    });
  }
}
