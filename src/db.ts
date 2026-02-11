import Dexie, { type EntityTable } from 'dexie';
import type { Evaluation } from './types';

const db = new Dexie('inrs-evaluations') as Dexie & {
  evaluations: EntityTable<Evaluation, 'id'>;
};

db.version(1).stores({
  evaluations: '++id, project.companyName, createdAt, updatedAt',
});

export { db };
