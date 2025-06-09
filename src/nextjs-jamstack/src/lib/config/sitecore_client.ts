// lib/sitecore-client.ts
import { GraphQLClient } from 'graphql-request';

export function getSitecoreClient() {
  if (!process.env.SITECORE_GRAPHQL_ENDPOINT || !process.env.SITECORE_GRAPHQL_API_KEY) {
    throw new Error('Missing SITECORE_GRAPHQL_ENDPOINT or SITECORE_GRAPHQL_API_KEY');
  }

  return new GraphQLClient(process.env.SITECORE_GRAPHQL_ENDPOINT, {
    headers: {
      // Experience Edge expects “sc_apikey”
      sc_apikey: process.env.SITECORE_GRAPHQL_API_KEY,
    },
  });
}
