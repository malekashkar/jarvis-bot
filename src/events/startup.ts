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
  }
}
