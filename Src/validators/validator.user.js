import z from "zod";
export const createUserScema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    phone: z.string().min(10, "Phone number must be at least 10 digits long"),
});
export const createUserSchema = createUserScema.partial();
