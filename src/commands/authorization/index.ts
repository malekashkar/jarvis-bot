import Command, { Groups } from "..";

export default abstract class AuthCommands extends Command {
  groupName: Groups = "Authorization";
}
