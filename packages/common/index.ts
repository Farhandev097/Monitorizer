import {z} from 'zod'

export const CreateUserSchema = z.object({
    email : z.string().min(3).max(30),
    password : z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {message : "Password must contain uppercase, lowercase, number, and special character"}),
    name : z.string().min(3).max(10)
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>; 

export const SigninSchema = z.object({
    email : z.string().min(3).max(30),
    password : z.string()
})

export type SigninInput = z.infer<typeof SigninSchema>
