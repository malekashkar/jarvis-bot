import { GlobalModel } from "../models/global";
import Logger from "../util/logger";
import Event from ".";

export default class startEvent extends Event {
  eventName = "ready";
  group = "default";

  async handle() {
    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    this.client.user.setActivity(globalData.status, { type: "WATCHING" });
    Logger.info("BOT", "The bot has been turned on!");
  }
}
