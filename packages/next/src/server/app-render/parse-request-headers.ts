import type { IncomingHttpHeaders } from 'http'
import {
  NEXT_FAST_REFRESH_HEADER,
  NEXT_ROUTER_PREFETCH_HEADER,
  NEXT_ROUTER_STATE_TREE_HEADER,
  RSC_HEADER,
} from '../../client/components/app-router-headers'
import { getScriptNonceFromHeader } from './get-script-nonce-from-header'
import { parseAndValidateFlightRouterState } from './parse-and-validate-flight-router-state'
import type { FlightRouterState } from './types'

export interface ParseRequestHeadersOptions {
  readonly isRoutePPREnabled: boolean
}

export interface ParsedRequestHeaders {
  /**
   * Router state provided from the client-side router. Used to handle rendering
   * from the common layout down. This value will be undefined if the request is
   * not a client-side navigation request, or if the request is a prefetch
   * request.
   */
  readonly flightRouterState: FlightRouterState | undefined
  readonly isPrefetchRequest: boolean
  readonly isFastRefresh: boolean
  readonly isRSCRequest: boolean
  readonly nonce: string | undefined
}

// We read these values from the request object as, in certain cases,
// base-server will strip them to opt into different rendering behavior.
export function parseRequestHeaders(
  headers: IncomingHttpHeaders,
  options: ParseRequestHeadersOptions
): ParsedRequestHeaders {
  const isPrefetchRequest =
    headers[NEXT_ROUTER_PREFETCH_HEADER.toLowerCase()] !== undefined

  const isFastRefresh =
    headers[NEXT_FAST_REFRESH_HEADER.toLowerCase()] !== undefined

  const isRSCRequest = headers[RSC_HEADER.toLowerCase()] !== undefined

  const shouldProvideFlightRouterState =
    isRSCRequest && (!isPrefetchRequest || !options.isRoutePPREnabled)

  const flightRouterState = shouldProvideFlightRouterState
    ? parseAndValidateFlightRouterState(
        headers[NEXT_ROUTER_STATE_TREE_HEADER.toLowerCase()]
      )
    : undefined

  const csp =
    headers['content-security-policy'] ||
    headers['content-security-policy-report-only']

  const nonce =
    typeof csp === 'string' ? getScriptNonceFromHeader(csp) : undefined

  return {
    flightRouterState,
    isPrefetchRequest,
    isFastRefresh,
    isRSCRequest,
    nonce,
  }
}
