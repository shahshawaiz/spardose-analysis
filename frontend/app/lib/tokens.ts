// Token addresses for different blockchains
export interface Token {
  symbol: string;
  name: string;
  addresses: {
    [chain: string]: string;
  };
}

export const TOKENS: Token[] = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    addresses: {
      ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      arbitrum: '0x82aF49447D8a07e3BD95BD0d56f35241523fBab1',
      optimism: '0x4200000000000000000000000000000000000006',
      base: '0x4200000000000000000000000000000000000006',
      polygon: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    },
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    addresses: {
      ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      arbitrum: '0xAf88d065e77c8cC2239327C5EDb3A432268e5831',
      optimism: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    },
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    addresses: {
      ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      optimism: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    addresses: {
      ethereum: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      arbitrum: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      optimism: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      polygon: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    },
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    addresses: {
      ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      arbitrum: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      optimism: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      polygon: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    addresses: {
      arbitrum: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    },
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    addresses: {
      optimism: '0x4200000000000000000000000000000000000042',
    },
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    addresses: {
      polygon: '0x0000000000000000000000000000000000001010',
    },
  },
];

export const BLOCKCHAINS = [
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'base', label: 'Base' },
];

export const EXCHANGES = [
  { value: 'uniswapv3', label: 'Uniswap V3' },
  { value: 'uniswapv2', label: 'Uniswap V2' },
  { value: 'pancakeswap', label: 'PancakeSwap' },
  { value: 'sushiswap', label: 'SushiSwap' },
];

