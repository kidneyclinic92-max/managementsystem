import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/db";
import sql from "mssql";
import type { AuthUser, UserRole } from "./auth";

interface DbUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  address?: string | null;
  role: UserRole;
}

function mapUser(row: any): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: (row.role as UserRole) ?? "vendor",
    fullName: row.full_name || row.username,
  };
}

export async function findUserByUsernameOrEmail(
  identifier: string
): Promise<DbUser | null> {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("identifier", sql.NVarChar, identifier)
    .query(`
      SELECT TOP 1 *
      FROM users
      WHERE username = @identifier OR email = @identifier
    `);
  return result.recordset[0] || null;
}

export async function authenticateUserDb(
  identifier: string,
  password: string
): Promise<AuthUser | null> {
  const dbUser = await findUserByUsernameOrEmail(identifier);
  if (!dbUser) return null;

  const ok = await bcrypt.compare(password, dbUser.password_hash);
  if (!ok) return null;

  return mapUser(dbUser);
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
}

export async function createUserDb(input: CreateUserInput): Promise<AuthUser> {
  const pool = await getConnection();

  // Uniqueness check
  const existing = await pool
    .request()
    .input("username", sql.NVarChar, input.username)
    .input("email", sql.NVarChar, input.email)
    .query(`
      SELECT username, email FROM users
      WHERE username = @username OR email = @email
    `);
  if (existing.recordset.length > 0) {
    const row = existing.recordset[0];
    const field = row.username === input.username ? "username" : "email";
    throw new Error(`A user with that ${field} already exists`);
  }

  const hash = await bcrypt.hash(input.password, 10);
  const role: UserRole = input.role || "vendor";

  const result = await pool
    .request()
    .input("username", sql.NVarChar, input.username)
    .input("email", sql.NVarChar, input.email)
    .input("password_hash", sql.NVarChar, hash)
    .input("full_name", sql.NVarChar, input.fullName || null)
    .input("company_name", sql.NVarChar, input.companyName || null)
    .input("phone", sql.NVarChar, input.phone || null)
    .input("address", sql.NVarChar, input.address || null)
    .input("role", sql.NVarChar, role)
    .query(`
      INSERT INTO users (
        id, username, email, password_hash, full_name, company_name, phone, address, role, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(), @username, @email, @password_hash, @full_name, @company_name, @phone, @address, @role, GETDATE(), GETDATE()
      )
    `);

  return mapUser(result.recordset[0]);
}

