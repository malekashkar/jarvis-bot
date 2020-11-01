import { Client, Collection } from "discord.js";
import Command from "../commands";

export default class Main extends Client {
  commands: Collection<string, Command> = new Collection();
}
