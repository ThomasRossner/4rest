import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["guest", "rezeption", "redaktion", "administrator"]>>;
    userType: z.ZodOptional<z.ZodEnum<["explorer", "guest_in_house", "observer", "advocate"]>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    name?: string;
    role?: "guest" | "rezeption" | "redaktion" | "administrator";
    password?: string;
    userType?: "explorer" | "guest_in_house" | "observer" | "advocate";
}, {
    email?: string;
    name?: string;
    role?: "guest" | "rezeption" | "redaktion" | "administrator";
    password?: string;
    userType?: "explorer" | "guest_in_house" | "observer" | "advocate";
}>;
//# sourceMappingURL=auth.schema.d.ts.map