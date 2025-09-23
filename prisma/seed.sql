-- Seed data for a default SUPER_ADMIN account
-- The password is 'admin123' hashed with bcrypt.
-- You should replace this with a secure, randomly generated password in production.
INSERT INTO "users" ("id", "name", "email", "password", "role", "isActive", "createdAt", "updatedAt") VALUES (
  'clxjo20h3000008l4fsc16v9w', -- A sample CUID
  'Super Admin',
  'admin@company.com',
  '$2a$10$wL/aPneH1P2pb41YxX2XreEJIx9S7OAe3j69p0p44m3wVSfl8zC7G',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);
