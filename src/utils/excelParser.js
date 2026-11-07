import * as XLSX from 'xlsx';

// Curated modern brand colors
const BRAND_COLORS = [
  '#f97316', // orange
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#e11d48', // rose
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ec4899', // pink
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#14b8a6', // teal
];

/**
 * Format Excel serial or string date into YYYY-MM-DD
 */
export function formatExcelDate(rawDate) {
  if (!rawDate && rawDate !== 0) return '';

  // Case 1: Excel numeric serial (e.g. 46266 -> 2026-09-01)
  if (typeof rawDate === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(rawDate);
      if (d && d.y && d.m && d.d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch {
      // fallback
    }
  }

  // Case 2: Date object
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate.toISOString().slice(0, 10);
  }

  // Case 3: String
  if (typeof rawDate === 'string') {
    const s = rawDate.trim();
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }
    // Try Date.parse
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return '';
}

/**
 * Auto-detect sprint week from day of month if week is not explicitly provided
 */
export function detectWeek(dateStr, explicitWeek) {
  if (explicitWeek && String(explicitWeek).trim()) {
    const str = String(explicitWeek).trim();
    if (/week\s*\d+/i.test(str)) {
      const match = str.match(/week\s*(\d+)/i);
      return `Week ${match[1]}`;
    }
    return str;
  }
  if (!dateStr) return 'Week 1';
  const parts = dateStr.split('-');
  const day = parseInt(parts[2], 10);
  if (isNaN(day)) return 'Week 1';
  if (day <= 7) return 'Week 1';
  if (day <= 14) return 'Week 2';
  if (day <= 21) return 'Week 3';
  return 'Week 4';
}

/**
 * Normalize Content Format
 */
export function normalizeFormat(raw) {
  const str = String(raw || '').toLowerCase().trim();
  if (str.includes('reel') || str.includes('video') || str.includes('short')) return 'Reel';
  if (str.includes('post') || str.includes('static') || str.includes('carousel') || str.includes('graphic')) return 'Post';
  return 'Reel'; // default
}

/**
 * Normalize Workflow Status
 */
export function normalizeStatus(raw) {
  const str = String(raw || '').toLowerCase().trim();
  if (str.includes('sched') || str.includes('ready') || str.includes('approved')) return 'Scheduled';
  if (str.includes('creat') || str.includes('prog') || str.includes('work') || str.includes('edit')) return 'In Creation';
  if (str.includes('post') || str.includes('done') || str.includes('live') || str.includes('publish')) return 'Posted';
  if (str.includes('plan') || str.includes('not started') || str.includes('start') || str.includes('todo') || str.includes('queue') || str.includes('draft')) return 'Planned';
  return 'Planned'; // default
}

/**
 * Parse an Excel Workbook (ArrayBuffer) into clients and deliverables
 */
export function parseExcelWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  const sheetNames = wb.SheetNames;

  const clients = [];
  const deliverables = [];
  const deliverablesByClient = {};
  const clientMap = new Map();
  const seenDeliverables = new Map();

  // Step 1: Scan all sheets for client quotas table (Master, Dashboard, Summary, Overview, etc.)
  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    for (let r = 0; r < Math.min(30, rows.length); r++) {
      const row = rows[r].map(c => String(c).trim().toLowerCase());
      const hasClientCol = row.some(c => c === 'client' || c.includes('client name') || c === 'brand');
      const hasPostsCol = row.some(c => c.includes('post'));
      const hasReelsCol = row.some(c => c.includes('reel'));

      // Quota table header found
      if (hasClientCol && (hasPostsCol || hasReelsCol)) {
        const clientColIdx = row.findIndex(c => c === 'client' || c.includes('client name') || c === 'brand');
        const postsColIdx = row.findIndex(c => c.includes('post'));
        const reelsColIdx = row.findIndex(c => c.includes('reel'));
        const w1ColIdx = row.findIndex(c => /w(k|eek)?\s*1/i.test(c));
        const w2ColIdx = row.findIndex(c => /w(k|eek)?\s*2/i.test(c));
        const w3ColIdx = row.findIndex(c => /w(k|eek)?\s*3/i.test(c));
        const w4ColIdx = row.findIndex(c => /w(k|eek)?\s*4/i.test(c));

        for (let cr = r + 1; cr < rows.length; cr++) {
          const clientRow = rows[cr];
          if (!clientRow || clientRow.length === 0) continue;
          const name = String(clientRow[clientColIdx] || '').trim();
          if (!name || name.toLowerCase().includes('total') || name.startsWith('=') || name.toLowerCase().includes('schedule policy')) {
            break;
          }

          const posts = postsColIdx !== -1 ? (parseInt(clientRow[postsColIdx]) || 0) : 0;
          const reels = reelsColIdx !== -1 ? (parseInt(clientRow[reelsColIdx]) || 0) : 0;
          const w1 = w1ColIdx !== -1 ? (parseInt(clientRow[w1ColIdx]) || 0) : 0;
          const w2 = w2ColIdx !== -1 ? (parseInt(clientRow[w2ColIdx]) || 0) : 0;
          const w3 = w3ColIdx !== -1 ? (parseInt(clientRow[w3ColIdx]) || 0) : 0;
          const w4 = w4ColIdx !== -1 ? (parseInt(clientRow[w4ColIdx]) || 0) : 0;

          const clientKey = name.toLowerCase();
          if (!clientMap.has(clientKey)) {
            const color = BRAND_COLORS[clients.length % BRAND_COLORS.length];
            const clientObj = {
              id: `c_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              name,
              color,
              postsQuota: posts,
              reelsQuota: reels,
              weeks: [w1, w2, w3, w4]
            };
            clients.push(clientObj);
            clientMap.set(clientKey, clientObj);
          } else {
            const existingClient = clientMap.get(clientKey);
            if (posts > 0) existingClient.postsQuota = posts;
            if (reels > 0) existingClient.reelsQuota = reels;
          }
        }
        break;
      }
    }
    if (clients.length > 0) break;
  }

  // Step 2: Iterate through all sheets to find Deliverables tables
  for (const sheetName of sheetNames) {
    const isMaster = sheetName.toLowerCase().includes('master') || sheetName.toLowerCase().includes('summary') || sheetName.toLowerCase().includes('all');
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    // Search for deliverable header row
    let headerRowIdx = -1;
    let colMap = {};

    for (let r = 0; r < Math.min(35, rows.length); r++) {
      const row = rows[r].map(c => String(c).trim().toLowerCase());
      const hasDate = row.some(c => c.includes('date'));
      const hasTitle = row.some(c => c.includes('title') || c.includes('hook') || c.includes('content') || c.includes('angle') || c.includes('topic'));
      const hasFormat = row.some(c => c.includes('content type') || c === 'format' || c === 'type');

      if ((hasDate && hasTitle) || (hasTitle && hasFormat)) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          const colClean = col.toLowerCase().trim();
          if (colClean.includes('client') || colClean.includes('brand')) colMap.client = idx;
          else if (colClean.includes('date') || colClean === 'publish date') colMap.date = idx;
          else if (colClean.includes('week')) colMap.week = idx;
          else if (colClean.includes('content type') || colClean === 'format' || colClean === 'type') colMap.format = idx;
          else if (colClean.includes('caption') || colClean.includes('copy') || colClean.includes('message')) colMap.caption = idx;
          else if (colClean.includes('title') || colClean.includes('headline') || colClean.includes('topic') || colClean === 'content') colMap.title = idx;
          else if (colClean.includes('hook')) {
            if (colMap.title === undefined) colMap.title = idx;
            else if (colMap.caption === undefined) colMap.caption = idx;
          }
          else if (colClean.includes('shot list') || colClean.includes('brief') || colClean.includes('asset') || colClean.includes('media') || colClean.includes('visual')) colMap.asset = idx;
          else if (colClean === 'cta' || colClean.includes('call to action')) colMap.cta = idx;
          else if (colClean.includes('status')) colMap.status = idx;
        });
        break;
      }
    }

    // If table header found
    if (headerRowIdx !== -1 && colMap.title !== undefined) {
      const inferredClient = isMaster ? null : sheetName.trim();

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const titleVal = String(row[colMap.title] || '').trim();
        // Ignore empty rows, totals, or notes
        if (!titleVal || titleVal.toLowerCase().includes('total') || titleVal.startsWith('📅') || titleVal.startsWith('=')) {
          continue;
        }

        // Determine client
        let rowClient = inferredClient;
        if (colMap.client !== undefined && row[colMap.client]) {
          rowClient = String(row[colMap.client]).trim();
        }
        if (!rowClient) rowClient = inferredClient || 'General Client';

        // Format Date
        let dateStr = '';
        if (colMap.date !== undefined && row[colMap.date] !== undefined && row[colMap.date] !== '') {
          dateStr = formatExcelDate(row[colMap.date]);
        }

        // Detect Week
        const explicitWeek = colMap.week !== undefined ? row[colMap.week] : '';
        const weekStr = detectWeek(dateStr, explicitWeek);

        // Format, Asset, Caption, Status
        const formatVal = normalizeFormat(colMap.format !== undefined ? row[colMap.format] : '');
        const assetVal = colMap.asset !== undefined ? String(row[colMap.asset] || '').trim() : '';
        
        let captionVal = colMap.caption !== undefined ? String(row[colMap.caption] || '').trim() : '';
        if (colMap.cta !== undefined && row[colMap.cta]) {
          const ctaVal = String(row[colMap.cta]).trim();
          if (ctaVal && !captionVal.toLowerCase().includes(ctaVal.toLowerCase())) {
            captionVal = captionVal ? `${captionVal} • [CTA: ${ctaVal}]` : ctaVal;
          }
        }

        const statusVal = normalizeStatus(colMap.status !== undefined ? row[colMap.status] : '');

        // Deduplication signature across multiple sheets
        const normTitle = titleVal.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dedupeKey = `${rowClient.toLowerCase().trim()}|${dateStr}|${formatVal}|${normTitle}`;

        if (seenDeliverables.has(dedupeKey)) {
          // Deliverable already captured from another sheet (e.g. Master vs Client tab)
          // Enrich any missing caption or asset information and skip duplicate!
          const existingItem = seenDeliverables.get(dedupeKey);
          if (existingItem) {
            if (!existingItem.caption && captionVal) existingItem.caption = captionVal;
            if ((!existingItem.asset || existingItem.asset.includes('Asset')) && assetVal) existingItem.asset = assetVal;
          }
          continue; // Skip duplicate!
        }

        const item = {
          id: `d_${rowClient.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${r}_${Math.random().toString(36).slice(2, 6)}`,
          client: rowClient,
          date: dateStr || new Date().toISOString().slice(0, 10),
          week: weekStr,
          format: formatVal,
          title: titleVal,
          asset: assetVal || (formatVal === 'Reel' ? '9:16 Video Asset' : '1:1 Graphic Post'),
          caption: captionVal,
          status: statusVal
        };

        seenDeliverables.set(dedupeKey, item);
        deliverables.push(item);

        if (!deliverablesByClient[rowClient]) {
          deliverablesByClient[rowClient] = [];
        }
        deliverablesByClient[rowClient].push(item);

        // Ensure client exists in clientMap
        const clientKey = rowClient.toLowerCase();
        if (!clientMap.has(clientKey)) {
          const newColor = BRAND_COLORS[clients.length % BRAND_COLORS.length];
          const newClient = {
            id: `c_${clientKey.replace(/[^a-z0-9]/g, '_')}`,
            name: rowClient,
            color: newColor,
            postsQuota: 0,
            reelsQuota: 0,
            weeks: [0, 0, 0, 0]
          };
          clients.push(newClient);
          clientMap.set(clientKey, newClient);
        }
      }
    }
  }

  // Step 3: Update client quotas dynamically if client was not in quota table
  clients.forEach(c => {
    const items = deliverablesByClient[c.name] || [];
    if (c.postsQuota === 0 && c.reelsQuota === 0 && items.length > 0) {
      c.postsQuota = items.filter(i => i.format === 'Post').length;
      c.reelsQuota = items.filter(i => i.format === 'Reel').length;
    }
    if (!c.weeks || c.weeks.every(w => w === 0)) {
      c.weeks = [
        items.filter(i => i.week === 'Week 1').length,
        items.filter(i => i.week === 'Week 2').length,
        items.filter(i => i.week === 'Week 3').length,
        items.filter(i => i.week === 'Week 4').length
      ];
    }
  });

  // Calculate summary metrics
  const dates = deliverables.map(d => d.date).filter(Boolean).sort();
  const dateRange = dates.length > 0 ? `${dates[0]} to ${dates[dates.length - 1]}` : 'N/A';

  const summary = {
    totalClients: clients.length,
    totalDeliverables: deliverables.length,
    totalReels: deliverables.filter(d => d.format === 'Reel').length,
    totalPosts: deliverables.filter(d => d.format === 'Post').length,
    scheduled: deliverables.filter(d => d.status === 'Scheduled').length,
    inCreation: deliverables.filter(d => d.status === 'In Creation').length,
    planned: deliverables.filter(d => d.status === 'Planned').length,
    posted: deliverables.filter(d => d.status === 'Posted').length,
    dateRange
  };

  return {
    sheetNames,
    clients,
    deliverables,
    deliverablesByClient,
    summary
  };
}
