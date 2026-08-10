import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma/client.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function registerHandler(request, reply) {
  const data = registerSchema.parse(request.body);
  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return reply.code(409).send({
      error: 'An account with this email address already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = request.server.jwt
    ? request.server.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    : 'mock-jwt-token-' + user.id;

  return reply.code(201).send({
    message: 'Account created successfully',
    user,
    token,
  });
}

export async function loginHandler(request, reply) {
  const data = loginSchema.parse(request.body);
  const normalizedEmail = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return reply.code(401).send({
      error: 'Invalid email or password.',
    });
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    return reply.code(401).send({
      error: 'Invalid email or password.',
    });
  }

  const token = request.server.jwt
    ? request.server.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    : 'mock-jwt-token-' + user.id;

  return reply.send({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  });
}

export async function meHandler(request, reply) {
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: request.user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return reply.send({ user });
}
