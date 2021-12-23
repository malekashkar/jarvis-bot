import Command, { Groups, Permissions } from "..";

export default abstract class FridayCommands extends Command {
  groupName: Groups = "friday";
  permission = Permissions.ACCESS;
}