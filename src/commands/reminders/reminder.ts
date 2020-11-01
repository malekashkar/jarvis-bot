import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import embeds from "../../util/embed";

export default class ReminderCommand extends Command {
  cmdName = "reminder";
  description = "Check a reminder or get a list of them.";
  groupName = "Reminder";
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
  ) {
    const question = await message.channel.send(
      embeds.question(
        `Say **list** to list out the reminders or provide a **number** to get a specific reminder.`
      )
    );
    const response = await message.channel.awaitMessages(
      (x) =>
        (x.author.id === message.author.id && x.content === "list") ||
        parseInt(x.content) <= client.guilds.cache.size,
      { max: 1, time: 900000, errors: ["time"] }
    );

    if (question.deletable) question.delete();
    if (response.first().deletable) response.first().delete();

    const option =
      response.first().content === "list"
        ? `list`
        : parseInt(response.first().content.match(/[0-9]/gm).join(""));

    if (option === `list`) {
      const reminders = userData.reminders
        .map(
          (x) =>
            `**Server:** ${client.guilds.resolve(x.guildId).name}\n**Name:** ${
              x.name
            }\n**ID:** ${x.id}`
        )
        .join("\n\n");

      await message.channel.send(
        embeds.normal(
          `List of reminders`,
          reminders && reminders.length
            ? reminders
            : `You don't have any reminders`
        )
      );
    } else {
      const reminder = userData.reminders.find((x) => x.id === option);
      if (!reminder)
        return message.channel.send(
          embeds.error(`No reminder was found with the specified ID.`)
        );

      message.channel.send(
        embeds.normal(
          `Reminder Found`,
          `**Server:** ${
            client.guilds.resolve(reminder.guildId).name
          }\n**Name:** ${reminder.name}\n**Message:** ${reminder.message}`
        )
      );
    }
  }
}
