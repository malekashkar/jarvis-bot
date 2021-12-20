import { Invite } from "discord.js";
import Event, { EventNameType, Groups } from "..";

export default class InviteCreate extends Event {
  eventName: EventNameType = "inviteCreate";
  groupName: Groups = "default";

  async handle(invite: Invite) {
    if(!this.client.inviteCodes.has(invite.code)) {
      this.client.inviteCodes.set(invite.code, invite);
    }
  }
}
