'use strict';

(function () {
  const els = {
    envBadge: document.getElementById('env-badge'),
    connection: document.getElementById('connection-status'),
    connectionLabel: document.querySelector('#connection-status .connection-label'),
    cardAppStatus: document.getElementById('card-app-status'),
    cardEnvironment: document.getElementById('card-environment'),
    cardRegion: document.getElementById('card-region'),
    cardUptime: document.getElementById('card-uptime'),
    healthBtn: document.getElementById('health-btn'),
    apiHttpStatus: document.getElementById('api-http-status'),
    apiResponseTime: document.getElementById('api-response-time'),
    apiRequestState: document.getElementById('api-request-state'),
    apiError: document.getElementById('api-error'),
    apiResponse: document.getElementById('api-response'),
    activityList: document.getElementById('activity-list'),
    activityEmpty: document.getElementById('activity-empty'),
  };

  const NOT_AVAILABLE = 'Not available';

  function formatUptime(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
      return NOT_AVAILABLE;
    }

    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  function setConnection(state, label) {
    els.connection.classList.remove(
      'connection--online',
      'connection--offline',
      'connection--checking'
    );
    els.connection.classList.add(`connection--${state}`);
    els.connectionLabel.textContent = label;
  }

  function setEnvBadge(environment, label) {
    els.envBadge.classList.remove(
      'env-badge--local',
      'env-badge--lambda',
      'env-badge--pending',
      'env-badge--error'
    );

    if (environment === 'aws-lambda-web-function') {
      els.envBadge.classList.add('env-badge--lambda');
      els.envBadge.textContent = label || 'AWS LAMBDA WEB FUNCTION';
      return;
    }

    if (environment === 'local') {
      els.envBadge.classList.add('env-badge--local');
      els.envBadge.textContent = label || 'LOCAL EXPRESS SERVER';
      return;
    }

    els.envBadge.classList.add('env-badge--error');
    els.envBadge.textContent = label || 'UNKNOWN';
  }

  function setCardValue(el, value, modifier) {
    el.textContent = value;
    el.classList.remove(
      'status-card-value--skeleton',
      'status-card-value--ok',
      'status-card-value--error'
    );
    if (modifier) {
      el.classList.add(`status-card-value--${modifier}`);
    }
  }

  function showApiError(message) {
    els.apiError.hidden = false;
    els.apiError.textContent = message;
  }

  function clearApiError() {
    els.apiError.hidden = true;
    els.apiError.textContent = '';
  }

  function renderJson(payload) {
    const code = els.apiResponse.querySelector('code') || els.apiResponse;
    code.textContent = JSON.stringify(payload, null, 2);
  }

  function addActivityEntry({ timeLabel, ok, detail }) {
    if (els.activityEmpty) {
      els.activityEmpty.remove();
    }

    const item = document.createElement('li');
    item.className = 'activity-item';

    const time = document.createElement('span');
    time.className = 'activity-time';
    time.textContent = timeLabel;

    const result = document.createElement('span');
    result.className = `activity-result activity-result--${ok ? 'ok' : 'error'}`;
    result.textContent = ok ? 'SUCCESS' : 'FAILED';

    const detailEl = document.createElement('span');
    detailEl.className = 'activity-detail';
    detailEl.textContent = detail;

    item.append(time, result, detailEl);
    els.activityList.prepend(item);

    // Keep the panel readable on camera — retain the latest entries only.
    const items = els.activityList.querySelectorAll('.activity-item');
    items.forEach((entry, index) => {
      if (index >= 12) {
        entry.remove();
      }
    });
  }

  async function loadStatus() {
    setConnection('checking', 'Checking connection…');

    try {
      const response = await fetch('/api/status', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Status request failed (${response.status})`);
      }

      const data = await response.json();

      setEnvBadge(data.environment, data.environmentLabel);
      setConnection('online', 'API connected');

      const appOk = data.status === 'ok';
      setCardValue(
        els.cardAppStatus,
        appOk ? 'Healthy' : String(data.status || NOT_AVAILABLE),
        appOk ? 'ok' : 'error'
      );

      const envDisplay =
        data.environment === 'aws-lambda-web-function'
          ? 'AWS Lambda Web Function'
          : data.environment === 'local'
            ? 'Local Express Server'
            : NOT_AVAILABLE;
      setCardValue(els.cardEnvironment, envDisplay);

      setCardValue(
        els.cardRegion,
        data.region ? String(data.region) : NOT_AVAILABLE
      );

      setCardValue(els.cardUptime, formatUptime(data.uptimeSeconds));
    } catch (error) {
      setEnvBadge(null, 'UNAVAILABLE');
      setConnection('offline', 'API unavailable');
      setCardValue(els.cardAppStatus, 'Unavailable', 'error');
      setCardValue(els.cardEnvironment, NOT_AVAILABLE);
      setCardValue(els.cardRegion, NOT_AVAILABLE);
      setCardValue(els.cardUptime, NOT_AVAILABLE);
      console.error('Failed to load /api/status:', error);
    }
  }

  async function runHealthCheck() {
    clearApiError();
    els.healthBtn.disabled = true;
    els.apiRequestState.textContent = 'Running…';
    els.apiHttpStatus.textContent = '—';
    els.apiResponseTime.textContent = '—';

    const code = els.apiResponse.querySelector('code') || els.apiResponse;
    code.textContent = '// Request in progress…';

    const startedAt = performance.now();
    const wallClock = new Date();

    try {
      const response = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      const durationMs = Math.round(performance.now() - startedAt);
      let payload = null;
      let parseError = null;

      try {
        payload = await response.json();
      } catch (err) {
        parseError = err;
      }

      els.apiHttpStatus.textContent = String(response.status);
      els.apiResponseTime.textContent = `${durationMs} ms`;

      if (!response.ok) {
        els.apiRequestState.textContent = 'Error';
        showApiError(`Health check returned HTTP ${response.status}.`);
        renderJson(
          payload || {
            status: 'error',
            message: `Unexpected HTTP status ${response.status}`,
          }
        );
        addActivityEntry({
          timeLabel: wallClock.toLocaleTimeString(),
          ok: false,
          detail: `HTTP ${response.status} · ${durationMs} ms`,
        });
        return;
      }

      if (parseError || !payload) {
        els.apiRequestState.textContent = 'Error';
        showApiError('Health check succeeded but the response was not valid JSON.');
        code.textContent = '// Invalid JSON response';
        addActivityEntry({
          timeLabel: wallClock.toLocaleTimeString(),
          ok: false,
          detail: `Invalid JSON · ${durationMs} ms`,
        });
        return;
      }

      els.apiRequestState.textContent = 'Success';
      renderJson(payload);
      addActivityEntry({
        timeLabel: wallClock.toLocaleTimeString(),
        ok: true,
        detail: `HTTP ${response.status} · ${durationMs} ms`,
      });

      // Refresh status cards so uptime stays current after a check.
      loadStatus();
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);
      els.apiHttpStatus.textContent = '—';
      els.apiResponseTime.textContent =
        Number.isFinite(durationMs) ? `${durationMs} ms` : '—';
      els.apiRequestState.textContent = 'Error';
      showApiError(
        error && error.message
          ? `Request failed: ${error.message}`
          : 'Request failed. The API may be unavailable.'
      );
      code.textContent = '// Request failed — no response received';
      addActivityEntry({
        timeLabel: wallClock.toLocaleTimeString(),
        ok: false,
        detail:
          Number.isFinite(durationMs)
            ? `Network error · ${durationMs} ms`
            : 'Network error',
      });
      setConnection('offline', 'API unavailable');
      console.error('Health check failed:', error);
    } finally {
      els.healthBtn.disabled = false;
    }
  }

  els.healthBtn.addEventListener('click', runHealthCheck);
  loadStatus();
})();
