/*
Author: Jake Mathai
Purpose: Apollo subgraph client
*/

const gql = require('graphql-tag')
const ApolloClient = require('apollo-boost').ApolloClient
const fetch = require('cross-fetch/polyfill').fetch
const createHttpLink = require('apollo-link-http').createHttpLink
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache

// Subgraph client built on Apollo. Allows individual queries and polling
const TheGraphClient = () => {
    let clients = {}

    // Subgraph config - add an entry for each subgraph, and add entries for each of the subgraph's entities of interest, along with the desired fields
    const SUBGRAPHS = {
        'UniswapV2': {
            'url': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
            'entities': {
                'Bundle': {
                    'name': 'bundles',
                    'query': `
                        query getBundles {
                            bundles{} {
                                id
                                ethPrice
                            }
                        }
                    `
                },
                'Token': {
                    'name': 'tokens',
                    'query': `
                        query getTokens {
                            tokens{} {
                                id
                                symbol
                                decimals
                                tradeVolume
                                totalLiquidity
                                derivedETH
                            }
                        }
                    `
                },
                'Pair': {
                    'name': 'pairs',
                    'query': `
                        query getPairs {
                            pairs{} {
                                id
                                token0 {
                                    id 
                                    symbol 
                                    decimals
                                }
                                token1 {
                                    id 
                                    symbol 
                                    decimals
                                }
                                reserve0
                                reserve1
                            }
                        }
                    `
                }
            }
        }
    }

    const buildQuery = (subgraph, entity, filterString=null) => {
        const config = SUBGRAPHS[subgraph]
        let client = clients[subgraph]
        if (client == null) {
            client = new ApolloClient({
                'link': createHttpLink({
                    'uri': config['url'],
                    fetch
                }),
                'cache': new InMemoryCache(),
                'queryDeduplication': false
            })
            clients[subgraph] = client
        }
        let query = config['entities'][entity]['query']
        if (filterString != null)
            query = query.replace('{}', '(' + filterString + ')')
        else
            query = query.replace('{}', '')
        return gql(query)
    }

    const querySubgraph = async(subgraph, entity, filterString=null) => {
        const query = buildQuery(subgraph, entity, filterString)
        const entityName = SUBGRAPHS[subgraph]['entities'][entity]['name']
        return (await clients[subgraph].query({'query': query})).data[entityName]
    }

    const watchQuery = (subgraph, entity, filterString=null, interval=null) => {
        const query = buildQuery(subgraph, entity, filterString)
        return clients[subgraph].watchQuery({
            'query': query,
            'fetchPolicy': 'no-cache',
            'pollInterval': interval
        })
    }

    return {
        querySubgraph,
        watchQuery
    }
}

module.exports = {
    TheGraphClient
}
