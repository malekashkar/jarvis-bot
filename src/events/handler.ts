import { Interaction } from "discord.js";
import { UserModel } from "../models/user";
import { GlobalModel } from "../models/global";
import { GuildModel, Guild as DbGuild, Guild } from "../models/guild";
import Event, { Groups } from ".";
import { permissionCheck } from "../util";
import { DocumentType } from "@typegoose/typegoose";
import { StatsModel } from "../models/stats";

export default class CommandHandler extends Event {
  eventName = "interactionCreate";
  groupName: Groups = "default";

  async handle(interaction: Interaction) {
    if(!interaction.isCommand()) return;

    const userData =
      (await UserModel.findOne({ userId: interaction.user.id })) ||
      (await UserModel.create({ userId: interaction.user.id }));

    const statsData =
      (await StatsModel.findOne({
        userId: interaction.user.id,
        guildId: interaction.guildId,
      })) ||
      (await StatsModel.create({
        userId: interaction.user.id,
        guildId: interaction.guildId,
      }));

    statsData.messages += 1;
    await statsData.save();

    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    let guildData: DocumentType<DbGuild>;
    if (interaction.guild) {
      guildData =
        (await GuildModel.findOne({ guildId: interaction.guildId })) ||
        (await GuildModel.create(new Guild(interaction.guildId)));
    }

    const command = interaction.commandName;
    for (const commandObj of Array.from(this.client.commands.values())) {
      if (commandObj.disabled) continue;
      if (commandObj.slashCommand.name.toLowerCase() === command.toLowerCase()) {
        if (
          commandObj.permission &&
          !permissionCheck(
            userData,
            commandObj.permission,
            commandObj.groupName
          )
        )
          return;
        commandObj.run(interaction, userData, globalData, guildData);
      }
    }
  }
}
