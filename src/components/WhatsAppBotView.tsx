import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  MessageSquare,
  ExternalLink,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Lock,
  ArrowRight,
  Radio,
  Loader2,
} from 'lucide-react';

interface WhatsAppBotViewProps {
  currentUser: User | null;
  onNavigateToAuth: () => void;
}

// Target deployment instances (hidden from user until Deploy is triggered)
const BOT_DEPLOY_NODES = [
  'http://78.154.103.51:9372/',
  'http://78.154.103.44:9790/',
  'http://78.154.103.46:9461/',
  'http://78.154.103.43:11254/',
  'http://78.154.103.19:9293/',
];

export const WhatsAppBotView: React.FC<WhatsAppBotViewProps> = ({
  currentUser,
  onNavigateToAuth,
}) => {
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deployStep, setDeployStep] = useState<string>('');

  const handleDeploy = () => {
    setErrorMessage(null);

    // Rule: User must have created an account first / be signed in as BMW CINEMA member
    if (!currentUser) {
      setErrorMessage(
        'Account required: You must create an account or sign in as a BMW CINEMA member before deploying the WhatsApp Bot.'
      );
      return;
    }

    setDeploying(true);
    setDeployStep('Allocating dedicated server node...');

    setTimeout(() => {
      setDeployStep('Balancing cluster load & assigning port...');
    }, 700);

    setTimeout(() => {
      // Pick random instance from the 5 nodes
      const randomIndex = Math.floor(Math.random() * BOT_DEPLOY_NODES.length);
      const chosenNode = BOT_DEPLOY_NODES[randomIndex];

      setDeployedUrl(chosenNode);
      setDeploying(false);
      setDeployStep('Deployment complete!');

      // Auto open the selected server instance
      try {
        const opened = window.open(chosenNode, '_blank', 'noopener,noreferrer');
        if (!opened) {
          // Popup might be blocked, the UI provides direct button
        }
      } catch (err) {
        console.error('Failed to open link automatically:', err);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Official Channel Announcement Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#11231a] to-[#0d1f16] border border-emerald-500/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                Official Channel Announcement
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Join the Official BMW CINEMA WhatsApp Channel
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                Get instant notifications on movie releases, sports livestreams, and WhatsApp bot updates.
              </p>
            </div>
          </div>

          <a
            href="https://whatsapp.com/channel/0029VbCjkJP2P59fBeYUuN1H"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.35)] shrink-0 active:scale-95"
          >
            <span>Join Channel</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. Main WhatsApp Bot Deployment Card */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff6b35]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-xl mx-auto space-y-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35]/20 to-[#1e1e1e] border border-[#ff6b35]/30 flex items-center justify-center mx-auto text-[#ff6b35] shadow-[0_0_20px_rgba(255,107,53,0.2)]">
            <Bot className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WhatsApp Bot Deployment
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
              Automated high-speed deployment system for BMW CINEMA members. Click Deploy below to automatically allocate your dedicated bot server instance.
            </p>
          </div>

          {/* Membership Status Badge */}
          <div className="pt-2">
            {currentUser ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified BMW CINEMA Member: <strong>{currentUser.email || currentUser.displayName || 'Active Account'}</strong></span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>BMW CINEMA membership required before deployment</span>
              </div>
            )}
          </div>
        </div>

        {/* Error message / Auth prompt */}
        {errorMessage && (
          <div className="mb-6 max-w-md mx-auto p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-grow">
              <p className="font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={onNavigateToAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6b35] hover:bg-[#ff8354] text-black font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Create Account / Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. The Single Deploy Button */}
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
          <button
            type="button"
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full sm:w-80 py-4 px-8 rounded-xl bg-gradient-to-r from-[#ff6b35] via-[#ff7a45] to-[#ff5722] hover:from-[#ff7a45] hover:to-[#ff6b35] disabled:opacity-60 text-black font-black text-lg tracking-wide uppercase shadow-[0_0_30px_rgba(255,107,53,0.45)] hover:shadow-[0_0_40px_rgba(255,107,53,0.65)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            {deploying ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 fill-black" />
                <span>Deploy</span>
              </>
            )}
          </button>

          {deploying && (
            <p className="text-xs text-[#ff6b35] animate-pulse font-medium">
              {deployStep}
            </p>
          )}

          {!currentUser && !errorMessage && (
            <p className="text-[11px] text-gray-500 text-center">
              * Must be logged in as a registered BMW CINEMA member to deploy.
            </p>
          )}
        </div>

        {/* 4. Deployed Server Details (Displayed only AFTER user clicks Deploy) */}
        {deployedUrl && (
          <div className="mt-8 max-w-lg mx-auto bg-[#1b1b1b] border border-emerald-500/40 rounded-xl p-5 sm:p-6 space-y-4 animate-fade-in shadow-[0_0_25px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Server Allocated Successfully</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                Online
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-gray-400" />
                <span>Assigned Server Instance:</span>
              </div>
              <div className="p-3 bg-[#0f0f0f] border border-[#2d2d2d] rounded-lg font-mono text-xs sm:text-sm text-emerald-300 break-all select-all flex items-center justify-between gap-2">
                <span>{deployedUrl}</span>
                <span className="text-[10px] text-gray-500 shrink-0">Auto-Assigned</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>Launch Bot Server</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleDeploy}
                className="py-2.5 px-4 rounded-lg bg-[#252525] hover:bg-[#303030] text-gray-300 hover:text-white font-medium text-xs transition-colors"
              >
                Re-Deploy (Random Node)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
