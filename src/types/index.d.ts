declare interface IUser {
  name: string;
  email: string;
  password: string | null;
  id: string;
  role: "USER" | "AUTHOR" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
