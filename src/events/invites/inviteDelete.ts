import { Invite } from "discord.js";
import Event, { EventNameType } from "..";

export default class InviteDelete extends Event {
  eventName: EventNameType = "inviteDelete";

  async handle(invite: Invite) {
    if(this.client.inviteCodes.has(invite.code)) {
      this.client.inviteCodes.delete(invite.code);
    }
  }
}
