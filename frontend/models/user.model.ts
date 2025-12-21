export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  password?: string; // Optional in frontend as it shouldn't be sent back
  profilePicture: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}
