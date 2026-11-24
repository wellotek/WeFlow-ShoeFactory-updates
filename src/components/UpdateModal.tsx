import React from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react'
import type { UpdateSnapshot } from '@shared/updates'

interface UpdateModalProps {
  snapshot: UpdateSnapshot
  onDismiss: () => void
  onDownload: () => void
  onRestart: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  snapshot,
  onDismiss,
  onDownload,
  onRestart
}) => {
  const { t } = useTranslation()

  const isReady = snapshot.phase === 'ready'
  const isDownloading = snapshot.phase === 'downloading'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#142B45] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F28A27] rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">{t('updates.title')}</h3>
              <p className="text-[11px] text-slate-300">WeFlow ShoeFactory</p>
            </div>
          </div>
          {!isDownloading && (
            <button onClick={onDismiss} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('updates.new_version')}
          </p>

          <div className="bg-[#F4F6F8] p-3 rounded-xl border border-slate-200 flex justify-around text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('updates.current')}</span>
              <span className="text-xs font-mono font-bold text-slate-700">v{snapshot.currentVersion}</span>
            </div>
            <div className="border-r border-slate-300"></div>
            <div>
              <span className="text-[10px] text-[#F28A27] font-bold uppercase block">{t('updates.available')}</span>
              <span className="text-xs font-mono font-bold text-[#142B45]">
                {snapshot.availableVersion ? `v${snapshot.availableVersion}` : 'Dernière'}
              </span>
            </div>
          </div>

          {snapshot.releaseNotes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto text-xs text-slate-700">
              <div className="font-bold text-[11px] mb-1 text-[#142B45]">Nouveautés :</div>
              <div className="whitespace-pre-wrap">{snapshot.releaseNotes}</div>
            </div>
          )}

          {isDownloading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{t('updates.downloading')}</span>
                <span>{snapshot.percent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#F28A27] h-full transition-all duration-300"
                  style={{ width: `${snapshot.percent}%` }}
                ></div>
              </div>
            </div>
          )}

          {isReady && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Mise à jour téléchargée avec succès. Redémarrez l’application pour l’appliquer.</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!isReady ? (
              <>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={onDownload}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#F28A27] hover:bg-[#e07a16] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('updates.download_now')}</span>
                </button>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={onDismiss}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  {t('updates.later')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('updates.restart_now')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
