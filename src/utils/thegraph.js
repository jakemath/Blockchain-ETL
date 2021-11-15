/*
Author: Jake Mathai
Purpose: The Graph client
*/

const axios = require('axios')

// Subgraph config - add an entry for each subgraph, and add entries for each of the subgraph's entities of interest, along with the desired fields
const SUBGRAPHS = {
    'UniswapV2': {
        'url': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
        'entities': {
            'Token': {
                'name': 'tokens',
                'fields': [
                    'id',
                    'symbol',
                    'decimals'
                ]
            },
            'Pair': {
                'name': 'pairs',
                'fields': [
                    'id',
                    'token0 {id}',
                    'token1 {id}',
                ]
            }
        }
    }
}

const requestConfig = {
    'headers': {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}

const querySubgraph = async(subgraph, entity, filterString=null) => {
    const config = SUBGRAPHS[subgraph]
    const schema = config['entities'][entity]
    const entityName = schema['name']
    let queryString = '{' + entityName
    if (filterString != null)
        queryString += '(' + filterString + ')'
    const body = {
        'query': queryString + `{${schema['fields'].join(' ')}}}`
    }
    try {
        const response = (await axios.post(config['url'], body, requestConfig)).data
        try {
            return response.data[entityName]
        }
        catch {
            console.log(response)
            return []
        }
    }
    catch(e) {
        console.log(`QUERY_SUBGRAPH: ${e}`)
        return []
    }
}

module.exports = {
    querySubgraph
}
