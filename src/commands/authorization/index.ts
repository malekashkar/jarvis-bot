import Command, { Groups, Permissions } from "..";

export default abstract class AuthCommands extends Command {
  groupName: Groups = "authorization";
}
