import Command, { Groups } from "..";

export default abstract class UtilityCommands extends Command {
  groupName: Groups = "utility";
}
