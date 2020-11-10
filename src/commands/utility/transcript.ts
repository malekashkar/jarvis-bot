import Command from "..";
import Client from "../../structures/client";
import { Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";
import embeds from "../../util/embed";

dotenv.config({ path: path.join(__dirname, "..", "..", "..") });

export default class TranscriptCommand extends Command {
  cmdName = "transcript";
  description = "Create a transcript.";
  groupName = "Misc";
  permission = "ACCESS";
  aliases = ["trans"];

  async run(client: Client, message: Message) {
    const msg = await message.channel.messages.fetch({ limit: 100 });
    const text = Array.from(msg.values())
      .reverse()
      .map((value) => {
        const date = new Date(value.createdTimestamp);
        const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        return `**${value.author.tag}**  ${dateString}\n${value.content}`;
      })
      .join("\n\n");

    const response = await fetch("https://hastebin.com/documents", {
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
      body: text,
      method: "POST",
    });
    if (!response.ok)
      return message.channel.send(
        embeds.error(`There was an error posting the text onto the hastebin!`)
      );

    await message.channel.send(`https://hastebin.com/${(await response.json()).key}`);
  }
}
