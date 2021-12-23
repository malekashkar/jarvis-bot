import Command, { Groups, Permissions } from "..";

export default abstract class FunCommands extends Command {
  groupName: Groups = "fun";
  permission = Permissions.ACCESS;
}
