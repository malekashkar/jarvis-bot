import ReminderCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import embeds from "../../util/embed";

export default class DeleteCommand extends ReminderCommands {
  cmdName = "delete";
  description = "Delete a reminder.";
  aliases = ["remove"];
  permission = "ACCESS";

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
  ) {
    const question = await message.channel.send({
      embeds: [
        embeds.question(
          `What is the ID of the reminder you would like to delete?`
        )
      ]
    });
    const response = await message.channel.awaitMessages({
      filter: (x) => x.author.id === message.author.id && /[0-9]/gm.test(x.content),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
    if (!response) return;

    if (question.deletable) question.delete();
    if (response.first().deletable) response.first().delete();

    const id = parseInt(response.first().content.match(/[0-9]/gm).join(""));
    const reminder = userData.reminders.find((x) => x.id === id);
    if (!reminder)
      return message.channel.send({
        embeds: [embeds.error(`I was not able to find a reminder with the ID \`${id}\`.`)]
      });

    userData.reminders = userData.reminders.filter((x) => x.id !== id);
    await userData.save();

    await message.channel.send({
      embeds: [embeds.normal(`Reminder Deleted`, `Reminder \`${id}\` has been deleted.`)]
    });
  }
}
