/**
 * The carousel's static-copy panel.
 *
 * Static copy — the section slugs, "meanwhile", "you, not here", the receipt
 * footer, the whole back cover — reads the same in every issue, so it is not
 * typed on a slide. It is edited here, and it lives in the carousel's own
 * store rather than in the product's copy pack: the two catalogs stay apart.
 *
 * The editor is PivotVoicePage itself, handed an injected source. That is why
 * the search, the filter to overridden, the ICU-aware editor and the save
 * confirmation behave identically to the Voice tab — it is the same component.
 *
 * Two layers, which map onto the ones that component already understands:
 *   this deck  -> its `tenant` layer, inheriting the city
 *   city voice -> its `platform` layer, inheriting the manifest default
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authenticatedRequest } from '../../../../hooks/useFetch';
import Popup from '../../../../components/Popup/Popup';
import PivotVoicePage from '../PivotVoicePage';

const SCOPES = [
  { key: 'deck', label: 'this deck', voiceScope: 'tenant' },
  { key: 'city', label: 'city voice', voiceScope: 'platform' },
];

export default function PivotCarouselVoicePanel({
  tenantKey,
  cityDisplayName,
  deckId,
  open,
  onClose,
  onSaved,
}) {
  const [scope, setScope] = useState('deck');
  const [catalogResponse, setCatalogResponse] = useState(null);
  const [layersResponse, setLayersResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  const base = `/admin/pivot/tenants/${encodeURIComponent(tenantKey)}/carousel-voice`;

  const loadLayers = useCallback(async () => {
    const query = deckId ? `?deckId=${encodeURIComponent(deckId)}` : '';
    const res = await authenticatedRequest(`${base}${query}`);
    setLayersResponse(res.data || null);
    onSaved?.();
  }, [base, deckId, onSaved]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [cat, layers] = await Promise.all([
        authenticatedRequest('/admin/pivot/carousel-voice/catalog'),
        authenticatedRequest(`${base}${deckId ? `?deckId=${encodeURIComponent(deckId)}` : ''}`),
      ]);
      if (cancelled) return;
      setCatalogResponse(cat.data || null);
      setLayersResponse(layers.data || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, base, deckId]);

  const active = SCOPES.find((s) => s.key === scope) || SCOPES[0];

  const source = useMemo(
    () => ({
      catalogResponse,
      layersResponse,
      loading,
      error: null,
      refetch: loadLayers,
      paths: {
        catalog: null,
        layers: null,
        write: `${base}?scope=${active.key}${deckId ? `&deckId=${encodeURIComponent(deckId)}` : ''}`,
        canWrite: active.key === 'city' || Boolean(deckId),
      },
    }),
    [catalogResponse, layersResponse, loading, loadLayers, base, active.key, deckId],
  );

  if (!open) return null;

  return (
    <Popup isOpen={open} onClose={onClose} customClassName="jgz-voicepopup">
      <div className="jgz-voice">
        <header className="jgz-voice__head">
          <div>
            <h2>Carousel voice</h2>
            <p>
              The copy that reads the same in every issue. Everything that changes
              week to week is typed on the slide instead.
            </p>
          </div>
          <div className="jgz__switch" role="group" aria-label="Voice layer">
            {SCOPES.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={scope === option.key}
                onClick={() => setScope(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <PivotVoicePage
          key={active.key}
          scope={active.voiceScope}
          tenantKey={tenantKey}
          cityDisplayName={cityDisplayName}
          source={source}
          scopeLabel={active.key === 'deck' ? 'This deck' : `${cityDisplayName || tenantKey} voice`}
          embedded
        />
      </div>
    </Popup>
  );
}
