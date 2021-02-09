import { GuildMember } from "discord.js";
import Event from ".";
import { GuildModel } from "../models/guild";

// Friday event

export default class joinRoles extends Event {
  eventName = "guildMemberAdd";
  group = "friday";

  async handle(member: GuildMember) {
    const guildData = await GuildModel.findOne({ guildId: member.guild.id });
    if (guildData?.roles?.length) {
      guildData.roles.forEach((role) => {
        if (role.autorole) member.roles.add(role.role);
      });
    }
  }
}
