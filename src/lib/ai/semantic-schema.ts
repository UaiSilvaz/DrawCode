import { z } from 'zod';
import type { SemanticComponent, SemanticPage } from './types';

export const semanticComponentTypeSchema = z.enum([
    'page',
    'navbar',
    'hero',
    'section',
    'cardGrid',
    'card',
    'form',
    'field',
    'button',
    'image',
    'text',
    'footer',
    'decorativeShape',
]);

export const semanticComponentSchema: z.ZodType<SemanticComponent> = z.lazy(() => z.object({
    id: z.string(),
    type: semanticComponentTypeSchema,
    label: z.string(),
    confidence: z.number().min(0).max(1),
    props: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        text: z.string().optional(),
        brand: z.string().optional(),
        links: z.array(z.string()).optional(),
        cta: z.string().optional(),
        placeholder: z.string().optional(),
        src: z.string().optional(),
        alt: z.string().optional(),
    }).default({}),
    style: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        backgroundColor: z.string().optional(),
        color: z.string().optional(),
        accentColor: z.string().optional(),
        textAlign: z.string().optional(),
    }).default({}),
    children: z.array(semanticComponentSchema).default([]),
}));

export const semanticPageSchema: z.ZodType<SemanticPage> = z.object({
    pageType: z.enum(['landing', 'login', 'register', 'dashboard', 'portfolio', 'generic']),
    layoutIntent: z.string(),
    theme: z.object({
        name: z.string(),
        backgroundColor: z.string(),
        textColor: z.string(),
        accentColor: z.string(),
        surfaceColor: z.string(),
    }),
    components: z.array(semanticComponentSchema),
});

export const semanticPageJsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['pageType', 'layoutIntent', 'theme', 'components'],
    properties: {
        pageType: {
            type: 'string',
            enum: ['landing', 'login', 'register', 'dashboard', 'portfolio', 'generic'],
        },
        layoutIntent: { type: 'string' },
        theme: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'backgroundColor', 'textColor', 'accentColor', 'surfaceColor'],
            properties: {
                name: { type: 'string' },
                backgroundColor: { type: 'string' },
                textColor: { type: 'string' },
                accentColor: { type: 'string' },
                surfaceColor: { type: 'string' },
            },
        },
        components: {
            type: 'array',
            items: { $ref: '#/$defs/component' },
        },
    },
    $defs: {
        component: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'type', 'label', 'confidence', 'props', 'style', 'children'],
            properties: {
                id: { type: 'string' },
                type: {
                    type: 'string',
                    enum: [
                        'page',
                        'navbar',
                        'hero',
                        'section',
                        'cardGrid',
                        'card',
                        'form',
                        'field',
                        'button',
                        'image',
                        'text',
                        'footer',
                        'decorativeShape',
                    ],
                },
                label: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                props: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['title', 'subtitle', 'text', 'brand', 'links', 'cta', 'placeholder', 'src', 'alt'],
                    properties: {
                        title: { type: 'string' },
                        subtitle: { type: 'string' },
                        text: { type: 'string' },
                        brand: { type: 'string' },
                        links: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        cta: { type: 'string' },
                        placeholder: { type: 'string' },
                        src: { type: 'string' },
                        alt: { type: 'string' },
                    },
                },
                style: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['x', 'y', 'width', 'height', 'backgroundColor', 'color', 'accentColor', 'textAlign'],
                    properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                        width: { type: 'number' },
                        height: { type: 'number' },
                        backgroundColor: { type: 'string' },
                        color: { type: 'string' },
                        accentColor: { type: 'string' },
                        textAlign: { type: 'string' },
                    },
                },
                children: {
                    type: 'array',
                    items: { $ref: '#/$defs/component' },
                },
            },
        },
    },
} as const;
