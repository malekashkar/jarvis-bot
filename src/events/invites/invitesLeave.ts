import { GuildMember } from "discord.js";
import Event, { EventNameType, Groups } from "..";
import { InviteModel } from "../../models/invite";

export default class InvitesLeave extends Event {
  eventName: EventNameType = "guildMemberRemove";
  groupName: Groups = "default";

  async handle(member: GuildMember) {
    const dbInvite = await InviteModel.findOne({ guildId: member.guild.id, invitedId: member.id, left: false });
    if(dbInvite) {
       dbInvite.left = true;
       await dbInvite.save();
    }
  }
}
