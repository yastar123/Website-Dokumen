# Overview

SecureDocs is a comprehensive document management system built with Next.js 15, designed to provide secure document upload, storage, and organization capabilities. The application features role-based access control with three user levels (KARYAWAN, ADMIN, SUPER_ADMIN), AI-powered document summarization, and a modern, responsive interface built with Tailwind CSS and shadcn/ui components.

The system enables users to upload various document types (PDF, DOCX, images, etc.), organize them into folders, and leverage AI to generate document summaries. Administrators can manage users, monitor system activity, and control access permissions across the platform.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with App Router for modern React server components
- **Styling**: Tailwind CSS with custom design system using slate blue (#778DA9) primary colors
- **UI Components**: shadcn/ui component library with Radix UI primitives for accessibility
- **State Management**: React Context API for authentication state, React hooks for local state
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **File Upload**: React Dropzone for drag-and-drop file upload functionality

## Backend Architecture
- **API Routes**: Next.js API routes following RESTful conventions
- **Authentication**: JWT-based authentication with HTTP-only cookies for security
- **Authorization**: Role-based access control (RBAC) with middleware protection
- **Password Security**: bcryptjs for password hashing and comparison
- **File Storage**: Local filesystem storage with validation for file types and sizes
- **Validation**: Zod schemas for runtime type checking and input validation

## Database Layer
- **ORM**: Prisma Client for type-safe database operations
- **Schema Design**: Relational database with User, Document, Folder, and ActivityLog entities
- **User Roles**: Hierarchical role system (KARYAWAN < ADMIN < SUPER_ADMIN)
- **Data Relations**: Foreign key relationships with proper cascade handling

## Authentication & Security
- **JWT Implementation**: JSON Web Tokens with configurable expiration
- **Middleware Protection**: Route-level authentication and authorization checks
- **Session Management**: HTTP-only cookies for secure token storage
- **File Upload Security**: File type validation, size limits, and secure storage paths
- **Role-Based Access**: Granular permissions based on user roles

## AI Integration
- **AI Framework**: Google's Genkit for AI workflow orchestration
- **Document Processing**: AI-powered document summarization using Gemini models
- **Content Extraction**: Support for PDF and DOCX text extraction for AI processing
- **Asynchronous Processing**: Non-blocking AI operations for better user experience

# External Dependencies

## Core Framework Dependencies
- **Next.js 15**: React framework with App Router and server components
- **React 18**: Frontend library with concurrent features
- **TypeScript**: Type safety throughout the application stack

## Database & ORM
- **Prisma**: Database toolkit and ORM for type-safe database access
- **@prisma/client**: Prisma client for database operations

## AI & Machine Learning
- **@genkit-ai/googleai**: Google AI integration for Genkit
- **@genkit-ai/next**: Next.js adapter for Genkit workflows
- **genkit**: Core Genkit framework for AI orchestration

## Authentication & Security
- **jose**: JWT implementation for token signing and verification
- **bcryptjs**: Password hashing and comparison utilities

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating component variants

## Form Handling & Validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation

## File Processing
- **mammoth**: DOCX file processing and text extraction
- **pdf-parse**: PDF file processing and text extraction
- **react-dropzone**: File upload with drag-and-drop functionality

## Development Tools
- **patch-package**: Runtime patching for npm packages
- **dotenv**: Environment variable management for development

## External Services
- **Firebase**: Hosting and deployment platform (mentioned in README)
- **Google AI (Gemini)**: AI model for document summarization
- **File System**: Local storage for uploaded documents