import { ErrorWithStatusCode } from "../ErrorHandler";

export class TeamNotFoundError extends ErrorWithStatusCode {
  statusCode!: number;
  constructor() {
    super("No Team Exist");
    this.name = "TeamNotFoundError";
    this.statusCode = 404;
  }
}
