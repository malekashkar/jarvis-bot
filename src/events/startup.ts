import { GlobalModel } from "../models/global";
import Client from "../structures/client";
import Logger from "../util/logger";

export default class startEvent extends Event {
  name: "ready";

  async handle(client: Client) {
    const globalData =
      (await GlobalModel.findOne()) || (await GlobalModel.create());

    client.user.setActivity(globalData.status, { type: "WATCHING" });
    Logger.info("BOT", "The bot has been turned on!");
  }
}
