import { Interaction } from "discord.js";
import Event, { EventNameType, Groups } from ".";

export default class CommandHandler extends Event {
  eventName: EventNameType = "guildMemberAdd";
  groupName: Groups = "default";

  async handle(interaction: Interaction) {
    
  }
}
