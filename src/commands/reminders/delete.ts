import ReminderCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction, Message } from "discord.js";
import User from "../../models/user";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class DeleteCommand extends ReminderCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete a reminder.")
    .addNumberOption(opt =>
      opt.setName("reminder id").setDescription("The ID of your reminder.").setRequired(true))

  async run(interaction: CommandInteraction, userData: DocumentType<User>,) {
    const id = interaction.options.getNumber("reminder id");
    const reminder = userData.reminders.find((x) => x.id == id);
    if (!reminder)
      return interaction.reply({
        embeds: [embeds.error(`I was not able to find a reminder with the ID \`${id}\`.`)]
      });

    userData.reminders = userData.reminders.filter((x) => x.id !== id);
    await userData.save();

    return interaction.reply({
      embeds: [embeds.normal(`Reminder Deleted`, `Reminder \`${id}\` has been deleted.`)]
    });
  }
}
