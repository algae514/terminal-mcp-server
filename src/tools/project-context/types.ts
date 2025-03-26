import { z } from 'zod';

export const RequirementSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']),
    dependencies: z.array(z.string()).optional(),
    technicalNotes: z.string().optional()
});

export const ProjectConfigSchema = z.object({
    name: z.string(),
    location: z.string(),
    summary: z.object({
        description: z.string(),
        stack: z.object({
            frontend: z.array(z.string()).optional(),
            backend: z.array(z.string()).optional(),
            database: z.array(z.string()).optional()
        })
    }),
    requirements: z.object({
        path: z.string(),
        features: z.array(RequirementSchema).optional()
    }).optional(),
    standards: z.object({
        path: z.string(),
        patterns: z.array(z.object({
            name: z.string(),
            description: z.string(),
            example: z.string()
        })).optional()
    }).optional(),
    schema: z.object({
        path: z.string(),
        tables: z.record(z.string(), z.object({
            fields: z.record(z.string(), z.object({
                type: z.string(),
                constraints: z.array(z.string())
            })),
            relationships: z.array(z.object({
                type: z.string(),
                withTable: z.string(),
                throughField: z.string()
            }))
        })).optional()
    }).optional()
});

export const ProjectRequestSchema = z.object({
    command: z.enum(['load', 'query']),
    project: z.string(),
    context: z.string().optional()
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type ProjectRequest = z.infer<typeof ProjectRequestSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;