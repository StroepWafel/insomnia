import path from 'node:path';

import { app } from 'electron/main';

import { AI_PLUGIN_NAME } from '~/common/constants';
import { ipcMainHandle } from '~/main/ipc/electron';
import * as models from '~/models';
import type { MockServer } from '~/models/mock-server';

async function getLLMs() {
  return await models.llmConfiguration.all();
}

export interface LLMBridgeAPI {
  getLLMs: typeof getLLMs;
  createMockServerFromOpenAPISpec: typeof createMockServerFromOpenAPISpec;
}

async function createMockServerFromOpenAPISpec(
  spec: string,
  options?: {
    useDynamicMockResponses?: boolean;
  },
) {
  const llm = await models.llmConfiguration.getCurrent();
  if (!llm) {
    return Promise.reject(new Error('No LLM configuration found'));
  }
  console.log('llm', llm);
  const config: any = {
    ...llm,
  };
  if (llm.backend === 'gguf') {
    const llmDir = path.join(process.env['INSOMNIA_DATA_PATH'] || app.getPath('userData'), 'llms');
    config.modelDir = llmDir;
  }
  try {
    const { generateMockRouteDataFromOpenAPISpec } = await import(AI_PLUGIN_NAME);
    return generateMockRouteDataFromOpenAPISpec(spec, config, {
      useDynamicMockResponses: options?.useDynamicMockResponses || false,
    });
  } catch (error) {
    console.error('Error creating mock server from open API spec', error);
    return Promise.reject(error);
  }
}

export const registerLLMHandlers = () => {
  ipcMainHandle('llm.getLLMs', async () => getLLMs());
  ipcMainHandle(
    'llm.createMockServerFromOpenAPISpec',
    async (
      _,
      spec: string,
      options?: {
        useDynamicMockResponses?: boolean;
      },
    ) => createMockServerFromOpenAPISpec(spec, options),
  );
};
