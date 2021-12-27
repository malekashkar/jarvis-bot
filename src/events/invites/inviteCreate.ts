import { Invite } from "discord.js";
import Event, { EventNameType } from "..";

export default class InviteCreate extends Event {
  eventName: EventNameType = "inviteCreate";

  async handle(invite: Invite) {
    if(!this.client.inviteCodes.has(invite.code)) {
      this.client.inviteCodes.set(invite.code, invite);
    }
  }
}
