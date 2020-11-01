import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import User from "../../models/user";
import { Message } from "discord.js";
import embeds from "../../util/embed";
import { react } from "../../util";
import { messageQuestion } from "../../util/questions";
import ms from "ms";
import { Reminder } from "../../models/user";

export default class RememberCommand extends Command {
  cmdName = "remember";
  description = "Create a new reminder.";
  groupName = "Reminder";
  aliases = ["rem"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
  ) {
    const typeQuestion = await message.channel.send(
      embeds.normal(
        "Reminder Settings",
        `Please select one of the emojis below!\n\n🕐 Clock\n⏱️ Stopwatch\n🔒 Permanent`
      )
    );
    await react(typeQuestion, ["🕐", "⏱️", "🔒"]);

    const reactionCollector = await typeQuestion.awaitReactions(
      (r, u) =>
        ["🕐", "⏱️", "🔒"].includes(r.emoji.name) && u.id === message.author.id,
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!reactionCollector) return;

    const reaction = reactionCollector.first();

    if (reaction.emoji.name === "🕐") {
      const idQuestion = await message.channel.send(
        embeds.question(
          `What reminder would you like to be reminded with? (Provide the ID)`
        )
      );
      const idResponse = await message.channel.awaitMessages(
        (x) =>
          x.author.id === message.author.id && x.content.match(/[0-9]{4}/gm),
        { max: 1, time: 900000, errors: ["time"] }
      );
      if (!idResponse) return;

      if (idQuestion.deletable) idQuestion.delete();
      const timeQuestion = await message.channel.send(
        embeds.question(
          `When would you like to be reminded? (ex. 2020/02/07 15:13:06)`
        )
      );
      const timeResponse = await message.channel.awaitMessages(
        (x) => x.author.id === message.author.id,
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );
      if (!timeResponse) return;
      if (timeQuestion.deletable) timeQuestion.delete();

      const time =
        Date.now() - new Date(timeResponse.first().content).getTime();

      const id = parseInt(idResponse.first().content);
      const reminder = userData.reminders.find((x) => x.id === id);
      if (!reminder)
        return message.channel.send(
          embeds.error(`There is no reminder with that ID available!`)
        );

      setTimeout(() => {
        message.author.send(
          embeds
            .normal(`Reminder!`, `Reminder: **${reminder.message}**`)
            .addField(
              "Server",
              client.guilds.resolve(reminder.guildId).name,
              true
            )
            .addField("Name", reminder.name, true)
            .addField("ID", reminder.id, true)
        );
      }, time);

      message.channel.send(
        embeds.normal(
          "Reminder Saved - Stopwatch",
          `In **${ms(time)}**, reminder **${id}** will be sent to you!`
        )
      );
    } else if (reaction.emoji.name === "⏱️") {
      const idQuestion = await messageQuestion(
        message,
        `What reminder would you like to be reminded with? (Provide the ID)`
      );
      if (!idQuestion) return;

      const id = parseInt(idQuestion.content);
      const reminder = userData.reminders.find((x) => x.id === id);
      if (!id || !reminder)
        return message.channel.send(
          embeds.error(`There is no reminder with that ID available!`)
        );

      const time = await messageQuestion(
        message,
        `In how long should you be notified? (2d / 2w / 10h / 40s)`
      );
      if (!time) return;

      const timeMs = ms(time.content) || null;
      if (!timeMs)
        return message.channel.send(
          embeds.error(`The time you provided is invalid!`)
        );

      setTimeout(() => {
        message.author.send(
          embeds
            .normal(`Reminder!`, `Reminder: **${reminder.message}**`)
            .addField(
              "Server",
              client.guilds.resolve(reminder.guildId).name,
              true
            )
            .addField("Name", reminder.name, true)
            .addField("ID", reminder.id, true)
        );
      }, timeMs);

      message.channel.send(
        embeds.normal(
          "Reminder Saved - Stopwatch",
          `In **${ms(timeMs)}**, reminder **${id}** will be sent to you!`
        )
      );
    } else if (reaction.emoji.name === "🔒") {
      const serverNumberQuestion = await messageQuestion(
        message,
        `What is the server number?`
      );
      if (!serverNumberQuestion) return;

      const reminderNameQuestion = await messageQuestion(
        message,
        `What should the name of the reminder be?`
      );
      if (!reminderNameQuestion) return;

      const msgQuestion = await messageQuestion(
        message,
        `What message would you like to remember?`
      );
      if (!msgQuestion) return;

      const server = serverNumberQuestion.content;
      const name = reminderNameQuestion.content;
      const msg = msgQuestion.content;

      const guild = client.guilds.cache.array()[parseInt(server) - 1];
      if (!guild)
        return message.channel.send(
          embeds.error(
            `This bot does not have access to a server with number ${server}`
          )
        );
      const id = Math.floor(Math.random() * 10000);

      message.channel.send(
        embeds
          .normal(`Reminder Saved - Permanent`, `Reminder: **${msg}**`)
          .addField("Server", `**${guild.name}**`, true)
          .addField("Name", `**${name}**`, true)
          .addField("ID", `**${id}**`, true)
      );

      userData.reminders.push(new Reminder(id, guild.id, name, msg));
      await userData.save();
    }
  }
}
