export interface IUser {
  name: string;
  email: string;
  password: string | null;
  id: string;
  role: "USER" | "AUTHOR" | "ADMIN";
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegistration {
  name: string;
  email: string;
  password: string;
}
