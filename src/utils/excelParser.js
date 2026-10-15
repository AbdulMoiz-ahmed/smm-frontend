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
  if (str.includes('sched')) return 'Scheduled';
  if (str.includes('creat') || str.includes('prog') || str.includes('work')) return 'In Creation';
  if (str.includes('post') || str.includes('done') || str.includes('live')) return 'Posted';
  if (str.includes('plan')) return 'Planned';
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

  // Step 1: Check for Master Planner sheet to extract brand quotas
  const masterSheetName = sheetNames.find(s => s.toLowerCase().includes('master') || s.toLowerCase().includes('quota') || s.toLowerCase().includes('summary'));
  if (masterSheetName) {
    const ws = wb.Sheets[masterSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const firstCell = String(row[0] || '').trim().toLowerCase();
      if (firstCell.includes('client name') || firstCell === 'client' || firstCell.includes('brand')) {
        for (let cr = r + 1; cr < rows.length; cr++) {
          const clientRow = rows[cr];
          const name = String(clientRow[0] || '').trim();
          if (!name || name.toLowerCase().includes('total') || name.startsWith('=')) break;

          const posts = parseInt(clientRow[1]) || 0;
          const reels = parseInt(clientRow[2]) || 0;
          const w1 = parseInt(clientRow[4]) || 0;
          const w2 = parseInt(clientRow[5]) || 0;
          const w3 = parseInt(clientRow[6]) || 0;
          const w4 = parseInt(clientRow[7]) || 0;

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
          clientMap.set(name.toLowerCase(), clientObj);
        }
        break;
      }
    }
  }

  // Step 2: Iterate through all sheets to find Deliverables tables
  for (const sheetName of sheetNames) {
    const isMaster = sheetName.toLowerCase().includes('master') || sheetName.toLowerCase().includes('summary');
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    // Search for deliverable header row
    let headerRowIdx = -1;
    let colMap = {};

    for (let r = 0; r < Math.min(35, rows.length); r++) {
      const row = rows[r].map(c => String(c).trim().toLowerCase());
      const hasDate = row.some(c => c.includes('date'));
      const hasTitle = row.some(c => c.includes('hook') || c.includes('title') || c.includes('content') || c.includes('angle') || c.includes('topic'));
      const hasFormat = row.some(c => c.includes('content type') || c === 'format' || c === 'type');

      if ((hasDate && hasTitle) || (hasTitle && hasFormat)) {
        headerRowIdx = r;
        row.forEach((col, idx) => {
          if (col.includes('client') || col.includes('brand')) colMap.client = idx;
          else if (col.includes('date')) colMap.date = idx;
          else if (col.includes('week')) colMap.week = idx;
          else if (col.includes('content type') || col === 'format' || col === 'type') colMap.format = idx;
          else if (col.includes('hook') || col.includes('title') || col.includes('creative angle') || col.includes('topic')) colMap.title = idx;
          else if (col.includes('visual asset') || col.includes('asset') || col.includes('media')) colMap.asset = idx;
          else if (col.includes('caption') || col.includes('message') || col.includes('copy')) colMap.caption = idx;
          else if (col.includes('status')) colMap.status = idx;
        });
        break;
      }
    }

    // If table header found
    if (headerRowIdx !== -1 && colMap.title !== undefined) {
      // If this is a client-specific sheet (not Master Planner)
      const inferredClient = isMaster ? null : sheetName.trim();

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const titleVal = String(row[colMap.title] || '').trim();
        // Ignore empty rows or divider rows
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
        const captionVal = colMap.caption !== undefined ? String(row[colMap.caption] || '').trim() : '';
        const statusVal = normalizeStatus(colMap.status !== undefined ? row[colMap.status] : '');

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

  // Update client quotas dynamically if client was not in Master Planner
  clients.forEach(c => {
    const items = deliverablesByClient[c.name] || [];
    if (c.postsQuota === 0 && c.reelsQuota === 0 && items.length > 0) {
      c.postsQuota = items.filter(i => i.format === 'Post').length;
      c.reelsQuota = items.filter(i => i.format === 'Reel').length;
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
