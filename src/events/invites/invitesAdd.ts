import { GuildMember } from "discord.js";
import Event, { EventNameType, Groups } from "..";
import { DbInvite, InviteModel } from "../../models/invite";

export default class InvitesAdd extends Event {
  eventName: EventNameType = "guildMemberAdd";
  groupName: Groups = "default";

  async handle(member: GuildMember) {
    const guild = member.guild;
    const gInvites = await guild.invites.fetch();

    for(const cachedInvite of this.client.inviteCodes.values()) {
        if(cachedInvite.guild.id == guild.id) {
            for(const currentInvite of gInvites.values()) {
                if(cachedInvite.uses < currentInvite.uses) {
                    const dbInvite = await InviteModel.findOne({ 
                        inviterId: cachedInvite.inviter.id, 
                        guildId: member.guild.id, 
                        invitedId: member.id
                    });

                    if(cachedInvite.inviter.id != member.id) {
                        if(dbInvite) {
                            if(dbInvite.left) {
                                dbInvite.left = false;
                                await dbInvite.save();
                            }
                        } else {
                            await InviteModel.create(
                                new DbInvite(
                                    cachedInvite.inviter.id, // Inviter ID
                                    cachedInvite.guild.id, // Guild ID
                                    member.id, // Invited ID
                                    member.joinedTimestamp // Timestamp
                                )
                            );
                        }
                    }

                    this.client.inviteCodes.set(currentInvite.code, currentInvite);
                }
            }
        }
    }
  }
}
