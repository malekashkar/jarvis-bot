import { Invite } from "discord.js";
import Event, { EventNameType, Groups } from "..";

export default class InviteDelete extends Event {
  eventName: EventNameType = "inviteDelete";
  groupName: Groups = "default";

  async handle(invite: Invite) {
    if(this.client.inviteCodes.has(invite.code)) {
      this.client.inviteCodes.delete(invite.code);
    }
  }
}
