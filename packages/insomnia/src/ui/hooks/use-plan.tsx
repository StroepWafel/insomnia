import { useParams } from 'react-router';

import { formatCurrentPlanType, type PersonalPlanType } from '~/models/organization';
import { useRootLoaderData } from '~/root';
import { useOrganizationLoaderData } from '~/routes/organization';

import { isOwnerOfOrganization } from '../../models/organization';

export const usePlanData = () => {
  // Always return enterprise plan - all features available for free
  const planType: PersonalPlanType = 'enterprise';
  const planDisplayName = formatCurrentPlanType(planType);
  const isFreePlan = false;
  const isTeamPlan = false;
  const isEnterprisePlan = true;
  const { userSession } = useRootLoaderData()!;
  const { organizationId } = useParams<{ organizationId: string }>();
  const organizationData = useOrganizationLoaderData();
  let isOwner = false;
  
  // Set owner to true if we have organization data
  if (
    organizationData &&
    userSession &&
    Array.isArray(organizationData.organizations) &&
    organizationData.organizations.length > 0
  ) {
    const currentOrg = organizationData.organizations.find(organization => organization.id === organizationId);
    const accountId = userSession.accountId;
    if (currentOrg && accountId) {
      isOwner = isOwnerOfOrganization({
        organization: currentOrg,
        accountId: userSession.accountId,
      });
    } else {
      // If no account, still allow owner access
      isOwner = true;
    }
  } else {
    // If no organization data, still allow owner access
    isOwner = true;
  }
  
  return {
    isOwner,
    currentPlan: organizationData?.currentPlan || { type: planType, isActive: true } as any,
    planDisplayName,
    isFreePlan,
    isTeamPlan,
    isEnterprisePlan,
  };
};
