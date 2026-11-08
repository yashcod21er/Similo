import { DemoRequestModel } from './demo-request.model.js';
import type { CreateDemoRequestInput } from './demo-request.schemas.js';

export type NewDemoRequest = Omit<CreateDemoRequestInput, 'consent' | 'website'>;

/** Storage boundary. The service depends on this interface, so tests can use a fake. */
export interface DemoRequestRepository {
  create(data: NewDemoRequest): Promise<{ id: string }>;
}

export const mongoDemoRequestRepository: DemoRequestRepository = {
  async create(data) {
    const document = await DemoRequestModel.create(data);
    return { id: document.id as string };
  },
};
