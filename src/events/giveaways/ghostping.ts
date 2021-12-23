import { GuildMember } from "discord.js";
import Event, { EventNameType, Groups } from "..";
import { GiveawayModel } from "../../models/giveaway";
import { GuildModel } from "../../models/guild";

export default class GiveawayRequirements extends Event {
  groupName: Groups = "friday";
  eventName: EventNameType = "guildMemberAdd";

  async handle(member: GuildMember) {
    const guildData = await GuildModel.findOne({ guildId: member.guild.id });
    if(guildData.ghostPing.type == "MEMBER") {
      const giveaway = await GiveawayModel.findOne({ "location.guildId": member.guild.id });
      if(giveaway?.location?.channelId) {
        const guild = await member.guild.fetch();
        const channel = await guild.channels.fetch(giveaway.location.channelId);
        if(channel.type == "GUILD_TEXT") {
          const ping = await channel.send(member.user.toString());
          setTimeout(ping.delete, 1000);
        }
      }
    }
  }
}
