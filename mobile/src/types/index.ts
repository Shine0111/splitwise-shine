export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse extends User {
  token: string;
}
