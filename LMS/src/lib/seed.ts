import type { AppState, Role, User } from '../types';

const roles: Array<[Role, string, string]> = [
  ['superadmin', 'Super Administrator', 'superadmin@library.demo'],
  ['committee', 'Library Committee', 'committee@library.demo'],
  ['itadmin', 'IT Administrator', 'itadmin@library.demo'],
  ['custodian', 'Library Custodian', 'custodian@library.demo'],
  ['faculty', 'Faculty Member', 'faculty@library.demo'],
  ['student', 'Student Reader', 'student@library.demo'],
];
export const users: User[] = roles.map(([role, name, email], index) => ({ id: `user-${index + 1}`, role, name, email, active: true }));

export function seedState(): AppState {
  const materials = [
    { id: 'mat-1', title: 'Designing Reliable Systems', author: 'Mara Chen', year: 2024, category: 'Technology', description: 'A practical guide to resilient software and operational design.', accessLevel: 1 as const, keywords: ['systems', 'software'] },
    { id: 'mat-2', title: 'Community Research Methods', author: 'Elena Brooks', year: 2023, category: 'Research', description: 'Approaches for responsible and inclusive community-based research.', accessLevel: 1 as const, keywords: ['methods', 'community'] },
    { id: 'mat-3', title: 'Applied Data Ethics', author: 'Noah Patel', year: 2025, category: 'Data Science', description: 'Case studies in privacy, governance, and responsible data use.', accessLevel: 2 as const, keywords: ['ethics', 'data'] },
    { id: 'mat-4', title: 'Collection Strategy Handbook', author: 'Library Working Group', year: 2022, category: 'Library Science', description: 'Internal guidance for building balanced and useful collections.', accessLevel: 3 as const, keywords: ['collections', 'policy'] },
    { id: 'mat-5', title: 'Foundations of Statistical Thinking', author: 'Iris Morgan', year: 2021, category: 'Statistics', description: 'An accessible introduction to inference and quantitative reasoning.', accessLevel: 1 as const, keywords: ['statistics', 'inference'] },
  ];
  const copies = materials.flatMap((material, i) => [
    { id: `copy-${i + 1}-p`, materialId: material.id, format: 'physical' as const, label: `Shelf ${String.fromCharCode(65 + i)}-${i + 11}`, available: true },
    { id: `copy-${i + 1}-d`, materialId: material.id, format: 'digital' as const, label: 'Browser access', available: true },
  ]);
  const now = '2026-06-01T08:00:00.000Z';
  return {
    version: 1, users, materials, copies,
    requests: [{ id: 'req-seed', userId: 'user-5', materialId: 'mat-1', copyId: 'copy-1-d', format: 'digital', status: 'approved', requestedAt: now, decidedAt: now }],
    audit: [{ id: 'audit-seed', actorId: 'user-1', action: 'demo.initialized', detail: 'Seeded demo data created', createdAt: now }],
    notifications: [{ id: 'note-seed', userId: 'user-5', message: 'Digital access approved for Designing Reliable Systems.', read: false, createdAt: now }],
  };
}
