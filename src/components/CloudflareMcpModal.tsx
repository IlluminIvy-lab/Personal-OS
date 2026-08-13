import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Search,
  Code2,
  Copy,
  Check,
  Globe,
  Terminal,
  Cpu,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { CloudflareMcpConfig } from '../types';
import { getApiUrl } from '../lib/api';

interface CloudflareMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudflareMcpConfig;
  onSaveConfig: (newConfig: CloudflareMcpConfig) => void;
}

export const CloudflareMcpModal: React.FC<CloudflareMcpModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [workerUrl, setWorkerUrl] = useState(config.workerUrl || '');
  const [apiToken, setApiToken] = useState(config.apiToken || '');
  const [protocolMode, setProtocolMode] = useState<'mcp' | 'rest' | 'vectorize'>(
    config.protocolMode || 'mcp'
  );
  const [httpMethod, setHttpMethod] = useState<'auto' | 'POST' | 'GET'>(
    config.httpMethod || 'auto'
  );
  const [isEnabled, setIsEnabled] = useState(config.isEnabled ?? false);
  const [autoAiContext, setAutoAiContext] = useState(config.autoAiContext ?? true);
  const [showToken, setShowToken] = useState(false);

  // Testing State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status?: number;
    usedMethod?: string;
    message?: string;
    error?: string;
    details?: any;
  } | null>(null);

  // Live Query State inside Modal
  const [testQuery, setTestQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryOutput, setQueryOutput] = useState<any>(null);

  // Template Code Toggle
  const [showWorkerTemplate, setShowWorkerTemplate] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTestConnection = async () => {
    if (!workerUrl.trim()) {
      setTestResult({
        ok: false,
        error: 'Please enter your Cloudflare Worker URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(getApiUrl('/api/cloudflare/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode,
          httpMethod,
        }),
      });

      const data = await res.json();
      setTestResult(data);

      if (data.ok) {
        const effectiveMethod = data.recommendedMethod || data.usedMethod || httpMethod;
        if (data.recommendedMethod && data.recommendedMethod !== httpMethod) {
          setHttpMethod(data.recommendedMethod);
        }

        const updatedConfig: CloudflareMcpConfig = {
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode,
          httpMethod: effectiveMethod,
          isEnabled: true,
          autoAiContext,
          lastConnectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastStatus: 'connected',
        };
        setIsEnabled(true);
        onSaveConfig(updatedConfig);
      } else {
        onSaveConfig({
          ...config,
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode,
          httpMethod,
          lastStatus: 'error',
          lastErrorDetails: data.error || data.message || 'Connection failed',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err.message || 'Failed to reach server testing endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoFix405 = async () => {
    setHttpMethod('GET');
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(getApiUrl('/api/cloudflare/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode: 'rest',
          httpMethod: 'GET',
        }),
      });

      const data = await res.json();
      setTestResult(data);
      setProtocolMode('rest');

      if (data.ok) {
        const updatedConfig: CloudflareMcpConfig = {
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode: 'rest',
          httpMethod: 'GET',
          isEnabled: true,
          autoAiContext,
          lastConnectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastStatus: 'connected',
        };
        setIsEnabled(true);
        onSaveConfig(updatedConfig);
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err.message || 'Failed to auto-resolve connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunTestQuery = async () => {
    if (!testQuery.trim() || !workerUrl.trim()) return;

    setIsQuerying(true);
    setQueryOutput(null);

    try {
      const res = await fetch(getApiUrl('/api/cloudflare/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerUrl: workerUrl.trim(),
          apiToken: apiToken.trim(),
          protocolMode,
          httpMethod,
          query: testQuery.trim(),
        }),
      });

      const data = await res.json();
      setQueryOutput(data);
    } catch (err: any) {
      setQueryOutput({ error: err.message || 'Failed to execute query' });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSaveAndClose = () => {
    const updated: CloudflareMcpConfig = {
      workerUrl: workerUrl.trim(),
      apiToken: apiToken.trim(),
      protocolMode,
      httpMethod,
      isEnabled,
      autoAiContext,
      lastConnectedAt: config.lastConnectedAt,
      lastStatus: config.lastStatus || (isEnabled && workerUrl ? 'connected' : 'untested'),
    };
    onSaveConfig(updated);
    onClose();
  };

  const WORKER_TEMPLATE_CODE = `// Production-Ready Cloudflare Worker for MCP & Second Brain
// Supports POST (MCP JSON-RPC), GET (REST Queries), and CORS OPTIONS

export default {
  async fetch(request, env, ctx) {
    // 1. Universal CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, User-Agent",
    };

    // 2. Preflight OPTIONS request handler (Fixes 405 Method Not Allowed)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 3. Optional Authorization check
    const authHeader = request.headers.get("Authorization");
    // if (authHeader !== "Bearer YOUR_SECRET_TOKEN") {
    //   return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    // }

    try {
      const url = new URL(request.url);
      
      // Extract search query from GET parameters or POST body
      let searchQuery = url.searchParams.get("query") || url.searchParams.get("q") || "";
      let isMcpCall = false;

      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        
        // Handle MCP JSON-RPC 2.0 (tools/list & tools/call)
        if (body.jsonrpc === "2.0") {
          isMcpCall = true;
          
          if (body.method === "tools/list") {
            return new Response(JSON.stringify({
              jsonrpc: "2.0",
              id: body.id || 1,
              result: {
                tools: [
                  {
                    name: "search_notes",
                    description: "Search Cloudflare Second Brain D1/Vectorize notes",
                    inputSchema: {
                      type: "object",
                      properties: { query: { type: "string" } }
                    }
                  }
                ]
              }
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          if (body.method === "tools/call") {
            searchQuery = body.params?.arguments?.query || searchQuery;
          }
        } else {
          searchQuery = body.query || body.search || body.prompt || searchQuery;
        }
      }

      // Sample dataset (Replace with env.DB (D1) or env.VECTORIZE index)
      const allNotes = [
        { id: "note-1", title: "Cloudflare Second Brain Setup", excerpt: "Deploy on Cloudflare Workers with D1 or Vectorize index." },
        { id: "note-2", title: "MCP Protocol Integration", excerpt: "Supports JSON-RPC 2.0 tools/list and tools/call." },
        { id: "note-3", title: "Personal OS Architecture", excerpt: "Syncs tasks, calendar, and second brain notes." }
      ];

      const results = allNotes.filter(
        (n) =>
          !searchQuery ||
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const responsePayload = isMcpCall
        ? {
            jsonrpc: "2.0",
            id: Date.now(),
            result: { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] }
          }
        : {
            ok: true,
            status: "online",
            query: searchQuery,
            count: results.length,
            results,
            timestamp: new Date().toISOString()
          };

      return new Response(JSON.stringify(responsePayload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(WORKER_TEMPLATE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0c16] border border-orange-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Cloudflare Second Brain Connector
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold">
                  MCP Protocol
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect your Cloudflare Worker / D1 / Vectorize second brain endpoint
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto font-sans">
          {/* Active Status Badge Bar */}
          <div className="p-3 rounded-xl border bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Connection Status:</span>
              {isEnabled && config.lastStatus === 'connected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
                </span>
              ) : isEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Active (Untested)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold">
                  Disconnected
                </span>
              )}
            </div>

            {config.lastConnectedAt && (
              <span className="text-slate-400 text-[11px]">
                Last tested: <span className="text-slate-200">{config.lastConnectedAt}</span>
              </span>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Worker URL */}
            <div>
              <label className="block text-xs font-mono font-bold text-orange-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                Cloudflare Worker URL *
              </label>
              <input
                type="url"
                value={workerUrl}
                onChange={(e) => setWorkerUrl(e.target.value)}
                placeholder="https://second-brain.your-subdomain.workers.dev"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-orange-500/30 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your deployed Cloudflare Worker endpoint URL (e.g. Workers & Pages, custom domain, or Cloudflare Tunnel).
              </p>
            </div>

            {/* Bearer Token / API Key */}
            <div>
              <label className="block text-xs font-mono font-bold text-orange-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                Authorization Token / API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Bearer your-secret-token"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/60 border border-orange-500/30 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Passed in <code className="text-orange-300 font-mono">Authorization: Bearer ...</code> header if your worker requires authentication.
              </p>
            </div>

            {/* Protocol & HTTP Method Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Protocol Mode Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-orange-300 mb-1.5">
                  Protocol & Payload Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setProtocolMode('mcp')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      protocolMode === 'mcp'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono flex items-center justify-center gap-1">
                      <Cpu className="w-3 h-3 text-orange-400" /> MCP
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProtocolMode('rest')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      protocolMode === 'rest'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono flex items-center justify-center gap-1">
                      <Terminal className="w-3 h-3 text-amber-400" /> REST
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProtocolMode('vectorize')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      protocolMode === 'vectorize'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> Vector
                    </div>
                  </button>
                </div>
              </div>

              {/* HTTP Method Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-orange-300 mb-1.5 flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-orange-400" />
                  HTTP Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHttpMethod('auto')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      httpMethod === 'auto'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono">Auto</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHttpMethod('POST')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      httpMethod === 'POST'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono">POST</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHttpMethod('GET')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      httpMethod === 'GET'
                        ? 'bg-orange-950/60 border-orange-500/80 text-orange-200 font-bold'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-mono">GET</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-white">Enable Cloudflare Second Brain</div>
                  <div className="text-[11px] text-slate-400">
                    Active connection state for your Cloudflare Worker integration.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-white">Auto-Inject Context into AI Assistant</div>
                  <div className="text-[11px] text-slate-400">
                    Automatically query Second Brain notes when asking Gemini AI Assistant questions.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoAiContext}
                  onChange={(e) => setAutoAiContext(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Test Connection Action Button & Result Display */}
          <div className="space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !workerUrl.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-200" />
                  <span>Testing Connection to Cloudflare Worker...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-orange-200" />
                  <span>Test Connection Now</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                  testResult.ok
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.ok ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        Connection Successful! (HTTP {testResult.status || 200}{' '}
                        {testResult.usedMethod ? `via ${testResult.usedMethod}` : ''})
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Connection Error (HTTP {testResult.status || 500})</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  {testResult.message || testResult.error}
                </p>

                {/* HTTP 405 Specific Troubleshooting & 1-Click Resolution */}
                {testResult.status === 405 && (
                  <div className="mt-2.5 p-3 rounded-xl bg-orange-950/90 border border-orange-500/50 text-[11px] text-orange-200 space-y-2.5 font-sans">
                    <div className="font-bold flex items-center justify-between">
                      <span className="font-mono text-orange-300 flex items-center gap-1.5">
                        ⚡ Quick Fix for HTTP 405:
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFix405}
                        disabled={isTesting}
                        className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-[11px] flex items-center gap-1 shadow-md shadow-orange-950/50 transition-all cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-black" />
                        <span>Switch to GET & Connect</span>
                      </button>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Your Cloudflare Worker rejected <code className="text-orange-300 font-mono">POST</code> requests because its code only handles <code className="text-orange-300 font-mono">GET</code> or is missing CORS preflight. Click <strong>Switch to GET & Connect</strong> above to adapt instantly, or copy the updated Worker template below to support full MCP POST endpoints.
                    </p>
                  </div>
                )}

                {testResult.details && (
                  <pre className="mt-2 p-2 rounded bg-black/60 border border-white/10 text-[10px] text-slate-300 overflow-x-auto max-h-24 font-mono">
                    {typeof testResult.details === 'string'
                      ? testResult.details
                      : JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Second Brain Live Query Tester */}
          <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-950/10 space-y-3">
            <h3 className="text-xs font-mono font-bold text-orange-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-orange-400" />
              Test Query Second Brain Live
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTestQuery()}
                placeholder="Type a test query (e.g., project notes, architecture)..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={handleRunTestQuery}
                disabled={isQuerying || !testQuery.trim() || !workerUrl.trim()}
                className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-40 transition-all"
              >
                {isQuerying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                )}
                <span>Search</span>
              </button>
            </div>

            {queryOutput && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <div className="text-[10px] text-slate-400 mb-1">Response from Cloudflare Worker:</div>
                <pre className="text-[11px] text-emerald-300 overflow-x-auto max-h-36">
                  {JSON.stringify(queryOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Cloudflare Worker Template Accordion */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30">
            <button
              onClick={() => setShowWorkerTemplate(!showWorkerTemplate)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-400" />
                Free Cloudflare Worker Starter Code Template (POST + GET + CORS)
              </span>
              <span className="text-[10px] text-orange-400 font-normal">
                {showWorkerTemplate ? 'Hide Template' : 'View Code Template'}
              </span>
            </button>

            {showWorkerTemplate && (
              <div className="p-4 border-t border-white/10 bg-black/60 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Copy and paste this into your Cloudflare Worker (<code className="text-orange-300">workers.dev</code>) to support both MCP JSON-RPC and REST queries with CORS preflight.
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 text-[11px] font-mono flex items-center gap-1 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-[#050508] border border-white/10 text-[10px] text-orange-200 font-mono overflow-x-auto max-h-52 leading-relaxed select-all">
                  {WORKER_TEMPLATE_CODE}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-orange-500/20 bg-black/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            100% Free • Hosted on Cloudflare Workers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs font-mono transition-all shadow-lg shadow-orange-950/50"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
