// تصدير قائمة الألعاب إلى ملف Excel (.xls بصيغة SpreadsheetML 2003)
// بدون أي مكتبات خارجية — يفتح مباشرة في Excel و Word و LibreOffice
// يدعم العربية (RTL) والتصنيفات وأحجام التخزين

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// خلية بتنسيق معرّف نمط معرّف في قسم Styles
const styledCell = (v, styleId, opts = {}) => {
  const { number: isNumber = false, span } = opts;
  const spanAttr = span ? ` ss:MergeAcross="${span}"` : '';
  if (isNumber) {
    return `<Cell ss:StyleID="${styleId}"${spanAttr}><Data ss:Type="Number">${num(v)}</Data></Cell>`;
  }
  return `<Cell ss:StyleID="${styleId}"${spanAttr}><Data ss:Type="String">${esc(v)}</Data></Cell>`;
};

const headerRow = (labels) =>
  `<Row>${labels.map(l => styledCell(l, 'Header')).join('')}</Row>`;

const sheet = (name, rowsXml, colsXml) => `
  <Worksheet ss:Name="${esc(name)}">
    <Table>
      ${colsXml || ''}
      ${rowsXml}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft/>
      <FreezePanes/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>`;

const buildXml = (sheets) => `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:office"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
      <Font ss:FontName="Cairo" ss:Size="11"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/>
      <Font ss:FontName="Cairo" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#14b8a6" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="CatHeader">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
      <Font ss:FontName="Cairo" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#7C3AED" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="SizeHeader">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
      <Font ss:FontName="Cairo" ss:Size="11" ss:Bold="1" ss:Color="#065F46"/>
      <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="CellRight">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
    </Style>
    <Style ss:ID="Num">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
      <NumberFormat ss:Format="#,##0.##"/>
    </Style>
  </Styles>
  ${sheets.join('\n')}
</Workbook>`;

// تجميع الحجم إلى فئات: <10، 10-49، 50-99، 100-149، 150-199، 200+
function sizeBucket(sizeGb) {
  const s = num(sizeGb);
  if (s <= 0) return 'غير محدد';
  if (s < 10) return 'أقل من 10 GB';
  if (s < 50) return '10 – 49 GB';
  if (s < 100) return '50 – 99 GB';
  if (s < 150) return '100 – 149 GB';
  if (s < 200) return '150 – 199 GB';
  return '200 GB فأكثر';
}

const BUCKET_ORDER = ['أقل من 10 GB', '10 – 49 GB', '50 – 99 GB', '100 – 149 GB', '150 – 199 GB', '200 GB فأكثر', 'غير محدد'];

/**
 * يصدّر كل الألعاب إلى ملف Excel مقسّم حسب التصنيف وحجم التخزين.
 * @param {Array} games - مصفوفة ألعاب (title, size_gb, category_id, genre, series, price)
 * @param {Array} categories - مصفوفة تصنيفات (id, name)
 */
export function exportGamesToExcel(games, categories) {
  const catName = (id) => categories.find(c => c.id === id)?.name || 'بدون تصنيف';

  // تجميع حسب التصنيف ثم حجم التخزين
  const byCategory = new Map();
  for (const g of games) {
    const cat = catName(g.category_id);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(g);
  }

  const catNames = Array.from(byCategory.keys()).sort((a, b) => String(a).localeCompare(String(b), 'ar'));

  const cols = '<Column ss:AutoFitWidth="0" ss:Width="45"/><Column ss:Width="220"/><Column ss:Width="90"/><Column ss:Width="80"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="80"/>';

  // ── Sheet 1: ملخص حسب التصنيف ──
  let summaryRows = headerRow(['التصنيف', 'عدد الألعاب', 'إجمالي الحجم (GB)', 'متوسط الحجم (GB)', 'إجمالي السعر (د.ل)']);
  for (const cat of catNames) {
    const list = byCategory.get(cat);
    const totalSize = list.reduce((s, g) => s + num(g.size_gb), 0);
    const totalPrice = list.reduce((s, g) => s + num(g.price), 0);
    summaryRows += `<Row>${styledCell(cat, 'CellRight')}${styledCell(list.length, 'Num', { number: true })}${styledCell(totalSize, 'Num', { number: true })}${styledCell(list.length ? Math.round(totalSize / list.length * 10) / 10 : 0, 'Num', { number: true })}${styledCell(totalPrice, 'Num', { number: true })}</Row>`;
  }
  const grandTotal = games.reduce((s, g) => s + num(g.size_gb), 0);
  const grandPrice = games.reduce((s, g) => s + num(g.price), 0);
  summaryRows += `<Row>${styledCell('الإجمالي العام', 'Header')}${styledCell(games.length, 'Header', { number: true })}${styledCell(grandTotal, 'Header', { number: true })}${styledCell('', 'Header')}${styledCell(grandPrice, 'Header', { number: true })}</Row>`;

  // ── Sheet 2: حسب التصنيف ثم حجم التخزين ──
  let groupedRows = headerRow(['التصنيف / حجم التخزين', 'اسم اللعبة', 'الحجم (GB)', 'النوع', 'السلسلة', 'السعر (د.ل)']);
  for (const cat of catNames) {
    const list = byCategory.get(cat);
    groupedRows += `<Row>${styledCell(`▼ ${cat} (${list.length} لعبة)`, 'CatHeader', { span: 5 })}${styledCell('', 'CatHeader')}</Row>`;
    // تجميع داخل التصنيف حسب فئة الحجم
    const byBucket = new Map();
    for (const g of list) {
      const b = sizeBucket(g.size_gb);
      if (!byBucket.has(b)) byBucket.set(b, []);
      byBucket.get(b).push(g);
    }
    const buckets = BUCKET_ORDER.filter(b => byBucket.has(b));
    for (const bucket of buckets) {
      const blist = byBucket.get(bucket).sort((a, b2) => num(b2.size_gb) - num(a.size_gb));
      groupedRows += `<Row>${styledCell(`  ${bucket} — ${blist.length} لعبة`, 'SizeHeader', { span: 5 })}${styledCell('', 'SizeHeader')}</Row>`;
      for (const g of blist) {
        groupedRows += `<Row>${styledCell('', 'CellRight')}${styledCell(g.title, 'CellRight')}${styledCell(num(g.size_gb), 'Num', { number: true })}${styledCell(g.genre || '', 'CellRight')}${styledCell(g.series || '', 'CellRight')}${styledCell(num(g.price), 'Num', { number: true })}</Row>`;
      }
    }
  }

  // ── Sheet 3: كل الألعاب (قائمة مسطحة مرتبة حسب التصنيف ثم الحجم) ──
  let allRows = headerRow(['#', 'اسم اللعبة', 'التصنيف', 'الحجم (GB)', 'فئة الحجم', 'النوع', 'السلسلة', 'السعر (د.ل)']);
  let idx = 0;
  for (const cat of catNames) {
    const list = byCategory.get(cat).sort((a, b2) => num(b2.size_gb) - num(a.size_gb));
    for (const g of list) {
      idx++;
      allRows += `<Row>${styledCell(idx, 'Num', { number: true })}${styledCell(g.title, 'CellRight')}${styledCell(cat, 'CellRight')}${styledCell(num(g.size_gb), 'Num', { number: true })}${styledCell(sizeBucket(g.size_gb), 'CellRight')}${styledCell(g.genre || '', 'CellRight')}${styledCell(g.series || '', 'CellRight')}${styledCell(num(g.price), 'Num', { number: true })}</Row>`;
    }
  }

  const xml = buildXml([
    sheet('ملخص حسب التصنيف', summaryRows, '<Column ss:Width="140"/><Column ss:Width="90"/><Column ss:Width="110"/><Column ss:Width="110"/><Column ss:Width="110"/>'),
    sheet('حسب التصنيف والحجم', groupedRows, cols),
    sheet('كل الألعاب', allRows, '<Column ss:AutoFitWidth="0" ss:Width="45"/><Column ss:Width="220"/><Column ss:Width="100"/><Column ss:Width="80"/><Column ss:Width="110"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="90"/>')
  ]);

  const blob = new Blob(['﻿' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ألعاب-النفار-${date}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
