import { GlobalModel } from "../models/global";
import Logger from "../util/logger";
import Event, { Groups } from ".";

export default class startEvent extends Event {
  eventName = "ready";
  groupName: Groups = "default";

  async handle() {
    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    this.client.user.setActivity(globalData.status, { type: "WATCHING" });
    this.client.loadSlashCommands(this.client);
    Logger.info("BOT", "The bot has been turned on!");

    // Register invites - Use redis
    for(const gCache of this.client.guilds.cache.values()) {
      const guild = await gCache.fetch();
      const invites = await guild.invites.fetch();
      for(const [inviteCode, invite] of invites) {
        if(!this.client.inviteCodes.has(inviteCode)) {
          this.client.inviteCodes.set(inviteCode, invite);
        }
      }
    }
  }
}
