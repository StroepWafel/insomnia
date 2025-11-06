import { href, redirect, type ShouldRevalidateFunctionArgs } from 'react-router';

import { userSession } from '~/models';
import { isScratchpadOrganizationId, type Organization } from '~/models/organization';
import { insomniaFetch } from '~/ui/insomniaFetch';
import { createFetcherLoadHook } from '~/utils/router';

import type { Route } from './+types/organization.$organizationId.permissions';
import type { Billing, FeatureList } from './organization';

export const fallbackFeatures = Object.freeze<FeatureList>({
  bulkImport: { enabled: true, reason: 'All features available for free' },
  gitSync: { enabled: true, reason: 'All features available for free' },
  orgBasicRbac: { enabled: true, reason: 'All features available for free' },
  aiMockServers: { enabled: true, reason: 'All features available for free' },
  aiCommitMessages: { enabled: true, reason: 'All features available for free' },
});

// If network unreachable assume user has paid for the current period
export const fallbackBilling = Object.freeze<Billing>({
  isActive: true,
  expirationWarningMessage: '',
  expirationErrorMessage: '',
  accessDenied: false,
});

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { organizationId } = params;
  const { id: sessionId, accountId } = await userSession.getOrCreate();

  if (isScratchpadOrganizationId(organizationId)) {
    return {
      featuresPromise: Promise.resolve(fallbackFeatures),
      billingPromise: Promise.resolve(fallbackBilling),
    };
  }

  // Always return enabled features - no account required
  // Use default accountId if none exists
  const defaultAccountId = accountId || 'default';
  const organizations = JSON.parse(localStorage.getItem(`${defaultAccountId}:organizations`) || '[]') as Organization[];
  const organization = organizations.find(o => o.id === organizationId);

  if (!organization) {
    // Don't redirect - allow access without organization
    // throw redirect(href('/organization'));
  }

  // Always return enabled features - all features available for free
  return {
    featuresPromise: Promise.resolve(fallbackFeatures),
    billingPromise: Promise.resolve(fallbackBilling),
  };

  // Original code commented out - always return enabled features
  // try {
  //   const featuresResponse = insomniaFetch<{ features: FeatureList; billing: Billing } | undefined>({
  //     method: 'GET',
  //     path: `/v1/organizations/${organizationId}/features`,
  //     sessionId,
  //   });

  //   return {
  //     featuresPromise: featuresResponse.then(res => res?.features || fallbackFeatures),
  //     billingPromise: featuresResponse.then(res => res?.billing || fallbackBilling),
  //   };
  // } catch {
  //   return {
  //     featuresPromise: Promise.resolve(fallbackFeatures),
  //     billingPromise: Promise.resolve(fallbackBilling),
  //   };
  // }
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return args.currentParams.organizationId !== args.nextParams.organizationId;
}

export const useOrganizationPermissionsLoaderFetcher = createFetcherLoadHook(
  load =>
    ({ organizationId }: { organizationId: string }) => {
      return load(
        href('/organization/:organizationId/permissions', {
          organizationId,
        }),
      );
    },
  clientLoader,
);
