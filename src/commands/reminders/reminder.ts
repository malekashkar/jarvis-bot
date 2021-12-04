import ReminderCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import User from "../../models/user";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export default class ReminderCommand extends ReminderCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Check a reminder or get a list of them.")
    .addNumberOption(opt =>
      opt.setName("reminder id").setDescription("The ID of the reminder"));
  permission = "ACCESS";

  async run(interaction: CommandInteraction, userData: DocumentType<User>) {
    const id = interaction.options.getNumber("reminder id");
    if(id) {
      const reminder = userData.reminders.find((x) => x.id === id);
      if (!reminder)
        return interaction.reply({
          embeds: [embeds.error(`No reminder was found with the specified ID.`)]
        });
  
      interaction.reply({
        embeds: [
          embeds.normal(
            `Reminder Found`,
            `**Server:** ${
              this.client.guilds.resolve(reminder.guildId).name
            }\n**Name:** ${reminder.name}\n**Message:** ${reminder.message}`
          )
        ]
      });
    } else {
      const reminders = userData.reminders
        .map(
          (x) =>
            `**Server:** ${
              this.client.guilds.resolve(x.guildId).name
            }\n**Name:** ${x.name}\n**ID:** ${x.id}`
        )
        .join("\n\n");
  
      await interaction.reply({
        embeds: [
          embeds.normal(
            `List of reminders`,
            reminders && reminders.length
              ? reminders
              : `You don't have any reminders`
          )
        ]
      });
    }
  }
}
