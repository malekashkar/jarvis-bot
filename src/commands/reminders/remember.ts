import ReminderCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import User from "../../models/user";
import { CommandInteraction } from "discord.js";
import embeds from "../../util/embed";
import { numberQuestion, optionsQuestion, stringQuestion } from "../../util/questions";
import ms from "ms";
import { Reminder } from "../../models/user";
import { SlashCommandBuilder } from "@discordjs/builders";
import { parseToInteger } from "../../util";

export default class RememberCommand extends ReminderCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("remember")
    .setDescription("Create a new reminder for yourself.")
  
  async run(interaction: CommandInteraction, userData: DocumentType<User>) {
    const reaction = await optionsQuestion(
        interaction,
        "Please select one of the emojis below!\n\n🕐 Clock\n⏱️ Stopwatch\n🔒 Permanent",
        ["🕐", "⏱️", "🔒"]
      );

    if (reaction == "🕐") {
      const id = await numberQuestion(interaction, "What is the ID of the reminder you would like to be reminded with?");
      if(!id) return;

      const timeResponse = await stringQuestion(interaction, "When would you like to be reminded? (ex. 2020/02/07 15:13:06)");
      if(!timeResponse) return;

      const time = Date.now() - new Date(timeResponse).getTime();

      const reminder = userData.reminders.find((x) => x.id == id);
      if (!reminder) return interaction.reply({
          embeds: [embeds.error(`There is no reminder with that ID available!`)]
        });

      setTimeout(() => {
        interaction.user.send({
          embeds: [
            embeds
            .normal(`Reminder!`, `Reminder: **${reminder.message}**`)
            .addField(
              "Guild",
              this.client.guilds.resolve(reminder.guildId).name,
              true
            )
            .addField("Name", reminder.name, true)
            .addField("ID", reminder.id.toString(), true)
          ]
        });
      }, time);

      interaction.editReply({
        embeds: [
          embeds.normal(
            "Reminder Saved - Stopwatch",
            `In **${ms(time)}**, reminder **${id}** will be sent to you!`
          )
        ]
      });
    } else if (reaction == "⏱️") {
      const id = await numberQuestion(interaction, "What is the ID of the reminder you would like to be reminded with?");
      if(!id) return;

      const reminder = userData.reminders.find((x) => x.id == id);
      if (!reminder) return interaction.reply({
          embeds: [embeds.error(`There is no reminder with that ID available!`)]
        });

      const time = await stringQuestion(interaction, `In how long should you be notified? (2d / 2w / 10h / 40s)`);
      if (!time) return;

      const timeMs = parseToInteger(time);
      if (!timeMs) return interaction.reply({
          embeds: [embeds.error(`The time you provided is invalid!`)]
        });

      setTimeout(() => {
        interaction.user.send({
          embeds: [
            embeds
            .normal(`Reminder!`, `Reminder: **${reminder.message}**`)
            .addField(
              "Server",
              this.client.guilds.resolve(reminder.guildId).name,
              true
            )
            .addField("Name", reminder.name, true)
            .addField("ID", reminder.id.toString(), true)
          ]
        });
      }, timeMs);

      interaction.editReply({
        embeds: [
          embeds.normal(
            "Reminder Saved - Stopwatch",
            `In **${ms(timeMs)}**, reminder **${id}** will be sent to you!`
          )
        ]
      });
    } else if (reaction == "🔒") {
      const guildId = await stringQuestion(interaction, "What is the ID of the guild?");
      if (!guildId) return;

      const reminderName = await stringQuestion(interaction, `What should the name of the reminder be?`);
      if (!reminderName) return;

      const reminder = await stringQuestion(interaction, `What message would you like to remember?`);
      if (!reminder) return;

      const guild = await this.client.guilds.fetch(guildId);
      if (!guild)
        return interaction.reply({
          embeds: [embeds.error(`This bot does not have access to the guild ID provided.`)]
        });
      const id = Math.floor(Math.random() * 10000);

      interaction.editReply({
        embeds: [
          embeds
          .normal(`Reminder Saved - Permanent`, `Reminder: **${reminder}**`)
          .addField("Server", `**${guild.name}**`, true)
          .addField("Name", `**${reminderName}**`, true)
          .addField("ID", `**${id}**`, true)
        ]
      });

      userData.reminders.push(new Reminder(id, guild.id, reminderName, reminder));
      await userData.save();
    }
  }
}
