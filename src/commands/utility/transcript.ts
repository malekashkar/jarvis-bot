import UtilityCommands from ".";
import { Message, MessageAttachment } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(__dirname, "..", "..", "..") });

export default class TranscriptCommand extends UtilityCommands {
  cmdName = "transcript";
  description = "Create a transcript.";
  permission = "ACCESS";
  aliases = ["trans"];

  async run(message: Message) {
    const msg = await message.channel.messages.fetch({ limit: 100 });
    const text = Array.from(msg.values())
      .reverse()
      .map((value) => {
        const date = new Date(value.createdTimestamp);
        const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        return `${value.author.tag} - ${dateString}\n${value.content}`;
      })
      .join("\n\n");

    if (!fs.existsSync("./transcripts/")) fs.mkdirSync("./transcripts");
    fs.writeFileSync(`./transcripts/${message.channel.id}.txt`, text);
    await message.channel.send(
      new MessageAttachment(`./transcripts/${message.channel.id}.txt`)
    );
  }
}
