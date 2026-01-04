import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["guest", "employee", "stakeholder", "administrator"]>>;
    userType: z.ZodOptional<z.ZodEnum<["explorer", "guest_in_house", "observer", "advocate"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    role?: "guest" | "employee" | "stakeholder" | "administrator" | undefined;
    userType?: "explorer" | "guest_in_house" | "observer" | "advocate" | undefined;
}, {
    email: string;
    name: string;
    password: string;
    role?: "guest" | "employee" | "stakeholder" | "administrator" | undefined;
    userType?: "explorer" | "guest_in_house" | "observer" | "advocate" | undefined;
}>;
//# sourceMappingURL=auth.schema.d.ts.map