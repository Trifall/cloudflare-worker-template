/**
 * Clouflare worker template
 *
 * - Run `yarn dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `yarn deploy` to publish your worker
 * - Run `yarn delete` to unpublish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy';
import handleRedirect from './redirect';
import apiRouter from './router';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
};

const AddHeadersToResponse = (response: Response) => {
	for (const [key, value] of Object.entries(corsHeaders)) {
		response.headers.set(key, value);
	}
	return response;
};

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL

		if (
			request.headers.get('Origin') !== null &&
			request.headers.get('Access-Control-Request-Method') !== null &&
			request.headers.get('Access-Control-Request-Headers') !== null
		) {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		// You can get pretty far with simple logic like if/switch-statements
		switch (url.pathname) {
			case '/redirect':
				return AddHeadersToResponse(await handleRedirect.fetch(request, env, ctx));

			case '/proxy':
				return AddHeadersToResponse(await handleProxy.fetch(request, env, ctx));
		}

		if (url.pathname.startsWith('/api/')) {
			return AddHeadersToResponse(await apiRouter.handle(request));
		}

		return AddHeadersToResponse(
			new Response(
				`Try making requests to:
      <ul>
      <li><code><a href="/redirect?redirectUrl=https://example.com/">/redirect?redirectUrl=https://example.com/</a></code>,</li>
      <li><code><a href="/proxy?modify&proxyUrl=https://example.com/">/proxy?modify&proxyUrl=https://example.com/</a></code>, or</li>
      <li><code><a href="/api/todos">/api/todos</a></code></li>`,
				{ headers: { 'content-type': 'text/html' } }
			)
		);
	},
};
