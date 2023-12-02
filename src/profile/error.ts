import { ErrorWithStatusCode } from "../ErrorHandler";

export class UserNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("User Not Found");
    this.name = "UserNotFoundError";
  }
}
export class ProfileNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("Profile Not Found");
    this.name = "ProfileNotFoundError";
  }
}
