// Hold all endpoints data here
import { isPageLoadingVar } from './cache';
import { AUTOPILOT_RESOLVERS_MUTATIONS } from './resolvers-autopilot';
import {
  SALESFORCE_RESOLVERS_MUTATIONS,
  SALESFORCE_RESOLVERS_QUERIES,
  PROJECT_PAGE_QUERY,
} from './resolvers-salesforce';

export const resolvers = {
   Mutation: {
    pageLoading: async (root, { loading }) => {
      isPageLoadingVar(loading);
      console.log('Mutation pageLoading loading ', isPageLoadingVar());

      return isPageLoadingVar();
    },
    ...SALESFORCE_RESOLVERS_MUTATIONS,
    ...AUTOPILOT_RESOLVERS_MUTATIONS,
  },
  Query: {
    pageLoading: async (parent, args, context, info) => {
      console.log('QUERY pageLoading isPageLoadingVar ', isPageLoadingVar());

      return isPageLoadingVar();
    },
    ...SALESFORCE_RESOLVERS_QUERIES,
    ...PROJECT_PAGE_QUERY,
  },
};
