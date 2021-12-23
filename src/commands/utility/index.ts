import Command, { Groups, Permissions } from "..";

export default abstract class UtilityCommands extends Command {
  groupName: Groups = "utility";
  permission = Permissions.ACCESS;
}
