import {
  calculateAssetMetricsUrl,
  handleAssetMetricsMessage,
  WsAssetMetricsEndpointTypes,
  WsAssetMetricsErrorResponse,
  WsAssetMetricsSuccessResponse,
  WsAssetMetricsWarningResponse,
} from '../../src/endpoint/price-ws'
import * as queryString from 'querystring'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../src/config'
import { buildAdapterConfig } from '@chainlink/external-adapter-framework/config'
import process from 'process'

const EXAMPLE_SUCCESS_MESSAGE: WsAssetMetricsSuccessResponse = {
  time: Date.now().toString(),
  asset: 'eth',
  height: 99999,
  hash: 'nwiiwefepnfpnwiwiwfi',
  parent_hash: 'iriwwfnpfpuffp',
  type: 'price',
  cm_sequence_id: 9,
  ReferenceRateUSD: '1500',
}

const EXAMPLE_WARNING_MESSAGE: WsAssetMetricsWarningResponse = {
  warning: {
    type: 'warning',
    message: 'This is a warning message',
  },
}
const EXAMPLE_ERROR_MESSAGE: WsAssetMetricsErrorResponse = {
  error: {
    type: 'error',
    message: 'This is an error message',
  },
}
const EXAMPLE_REORG_MESSAGE = {
  ...EXAMPLE_SUCCESS_MESSAGE,
  type: 'reorg',
}

const EXAMPLE_CONTEXT: EndpointContext<WsAssetMetricsEndpointTypes> = {
  endpointName: 'price-ws',
  inputParameters: {},
  adapterConfig: buildAdapterConfig({ customSettings }),
}

describe('price-ws url generator', () => {
  let oldEnv: NodeJS.ProcessEnv
  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'someKey'
  })
  afterAll(() => {
    process.env = oldEnv
  })

  it('should correct casing in url', async () => {
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'ETH'.toUpperCase(), //Deliberately use the wrong case
        quote: 'usd'.toLowerCase(), //Deliberately use the wrong case
      },
    ])

    expect(url).toContain(queryString.stringify({ assets: 'eth' }))
    expect(url).toContain(queryString.stringify({ metrics: 'ReferenceRateUSD' }))
  })
  it('should compose the url using all desired subs', async () => {
    const url = await calculateAssetMetricsUrl(EXAMPLE_CONTEXT, [
      {
        base: 'btc', //Deliberately use the wrong case
        quote: 'usd', //Deliberately use the wrong case
      },
      {
        base: 'eth', //Deliberately use the wrong case
        quote: 'EUR', //Deliberately use the wrong case
      },
    ])

    expect(url).toContain(new URLSearchParams({ assets: 'btc,eth' }).toString())
    expect(url).toContain(
      new URLSearchParams({ metrics: 'ReferenceRateUSD,ReferenceRateEUR' }).toString(),
    )
  })
})
describe('price-ws message handler', () => {
  it('success message results in value', () => {
    const res = handleAssetMetricsMessage({ ...EXAMPLE_SUCCESS_MESSAGE })
    expect(res).toBeDefined()
    expect(res?.length).toEqual(1)
    expect(res?.[0].value).toEqual(1500)
  })

  it('warning message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_WARNING_MESSAGE)
    expect(res).toBeUndefined()
  })
  it('error message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_ERROR_MESSAGE)
    expect(res).toBeUndefined()
  })
  it('reorg message results in undefined', () => {
    const res = handleAssetMetricsMessage(EXAMPLE_REORG_MESSAGE)
    expect(res).toBeUndefined()
  })
})
