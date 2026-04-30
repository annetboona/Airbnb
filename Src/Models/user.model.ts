export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    phone: string;
}

export const Users: User[] = [
    {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        phone: "123-456-7890",
    },
];