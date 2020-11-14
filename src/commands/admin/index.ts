import Command, { Groups } from "..";

export default abstract class AdminCommands extends Command {
  groupName: Groups = "Administration";
}
