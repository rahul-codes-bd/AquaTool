import React, { useState } from 'react';
import { CryptoTools, DecodedJwt } from '../../services/cryptoTools';
import { CopyButton } from '../common/CopyButton';
import { ErrorAlert } from '../common/ErrorAlert';
import { Shield, Key, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const JwtDecoderTool: React.FC = () => {
  const [token, setToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFxdWFUb29scyBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4zC4m_P4xVjM9uUuHqS2y_xVq5q8n3m0_4xVjM9uUuH'
  );
  const [decoded, setDecoded] = useState<DecodedJwt | null>(() => {
    try {
      return CryptoTools.decodeJwt(token);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleDecode = (val: string) => {
    setToken(val);
    setError(null);
    if (!val.trim()) {
      setDecoded(null);
      return;
    }
    try {
      const res = CryptoTools.decodeJwt(val);
      setDecoded(res);
    } catch (err: any) {
      setError(err.message || 'Invalid JWT structure.');
      setDecoded(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Decoding vs Verification Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>100% Client-Side Privacy:</strong> Tokens are decoded purely in your local browser sandbox via base64url parsing. Zero network requests are made.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">Decoding vs. Verification:</strong>
            <span className="text-amber-300/90">
              <strong>Decoding</strong> reads the public claims in the header & payload without a secret. <strong>Verification</strong> cryptographically checks that the signature was signed by the server's private/secret key. This offline tool decodes claims; it does <em>not</em> verify authenticity.
            </span>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300 uppercase">
            Encoded JWT String
          </span>
          <button
            type="button"
            onClick={() => handleDecode('')}
            className="text-xs text-slate-400 hover:text-rose-400"
          >
            Clear
          </button>
        </div>
        <textarea
          value={token}
          onChange={(e) => handleDecode(e.target.value)}
          rows={4}
          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          placeholder="Paste JWT string (header.payload.signature)..."
        />
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Decoded Structure */}
      {decoded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-rose-400 font-mono">HEADER: ALGORITHM & TOKEN TYPE</span>
              <CopyButton textToCopy={JSON.stringify(decoded.header, null, 2)} />
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-rose-300 text-xs font-mono border border-slate-800 overflow-x-auto">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-cyan-400 font-mono">PAYLOAD: DATA CLAIMS</span>
              <CopyButton textToCopy={JSON.stringify(decoded.payload, null, 2)} />
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 text-xs font-mono border border-slate-800 overflow-x-auto">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>

          {/* Timing & Expiration summary */}
          {(decoded.expiresAt || decoded.issuedAt) && (
            <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Token Timestamp Breakdown</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {decoded.issuedAt && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px]">Issued At (iat)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {new Date(decoded.issuedAt).toUTCString()}
                    </p>
                  </div>
                )}
                {decoded.expiresAt && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px]">Expires At (exp)</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-semibold text-slate-200">
                        {new Date(decoded.expiresAt).toUTCString()}
                      </p>
                      {decoded.isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-teal-950 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid (Active)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signature Details */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  SIGNATURE: BASE64URL HASH (UNVERIFIED OFFLINE)
                </span>
              </div>
              <CopyButton textToCopy={decoded.signature} />
            </div>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 break-all select-all">
              {decoded.signature || '(empty signature)'}
            </div>
            <p className="text-[11px] text-slate-400">
              Note: Verifying this cryptographic signature requires the secret key (for HMAC algorithms like HS256) or public certificate (for RSA/ECDSA algorithms like RS256/ES256). In accordance with zero-trust privacy, offline decoders inspect claims without requiring or storing secrets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
