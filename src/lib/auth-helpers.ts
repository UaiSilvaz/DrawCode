import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Gera hash bcrypt de uma senha com salt 12
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara senha plana com hash bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Retorna objeto User sem campos sensíveis
 */
export function createSafeUser(user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
    };
}
