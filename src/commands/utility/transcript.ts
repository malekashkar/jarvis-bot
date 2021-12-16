import UtilityCommands from ".";
import { CommandInteraction, MessageAttachment } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { SlashCommandBuilder } from "@discordjs/builders";

dotenv.config({ path: path.join(__dirname, "..", "..", "..") });

export default class TranscriptCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("transcript")
    .setDescription("Create a transcrit file of the message in a channel.");

  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const msg = await interaction.channel.messages.fetch({ limit: 100 });
    const text = Array.from(msg.values())
      .reverse()
      .map((value) => {
        const date = new Date(value.createdTimestamp);
        const dateString = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        return `${value.author.tag} - ${dateString}\n${value.content}`;
      })
      .join("\n\n");

    if (!fs.existsSync("./transcripts/")) fs.mkdirSync("./transcripts");
    fs.writeFileSync(`./transcripts/${interaction.channel.id}.txt`, text);
    return interaction.reply({
      attachments: [new MessageAttachment(`./transcripts/${interaction.channel.id}.txt`)]
    });
  }
}
