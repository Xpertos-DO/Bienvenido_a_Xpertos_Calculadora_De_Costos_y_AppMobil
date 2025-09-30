/**
 * Xpertos Leads Collector (Google Apps Script)
 * Modo recomendado: Adjuntar a una Hoja de Cálculo (Spreadsheet).
 * Crea una hoja llamada 'Leads' con encabezados automáticos.
 * Despliega como Aplicación web -> Acceso: Cualquiera.
 */
function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = {};
    try { data = JSON.parse(body); } catch (err) {}

    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');

    // Encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'timestamp', 'name', 'email', 'consent', 'source',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'page', 'ua', 'tz'
      ]);
    }

    var utm = data.utm || {};
    var row = [
      new Date(),
      data.name || '',
      data.email || '',
      data.consent === true ? 'yes' : 'no',
      data.source || '',
      utm.utm_source || '',
      utm.utm_medium || '',
      utm.utm_campaign || '',
      utm.utm_content || '',
      data.page || '',
      data.ua || '',
      data.tz || ''
    ];

    sheet.appendRow(row);

    var out = ContentService.createTextOutput(JSON.stringify({ ok: true }));
    out.setMimeType(ContentService.MimeType.JSON);
    return out;
  } catch (error) {
    var outErr = ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) }));
    outErr.setMimeType(ContentService.MimeType.JSON);
    return outErr;
  }
}

Version 1 on Sep 29, 2025, 8:11 PM
Deployment ID: AKfycby60u-SGpgHgFHqhiOU-xHAjrlexzQWuKNTbRfU7zSZjHEvbNt1FVrw-_rgoz3bszsNgw

Web app
URL: https://script.google.com/macros/s/AKfycby60u-SGpgHgFHqhiOU-xHAjrlexzQWuKNTbRfU7zSZjHEvbNt1FVrw-_rgoz3bszsNgw/exec

Si luego editas el script, recuerda: Deploy → Manage deployments → Edit → Deploy (si no, no se actualiza)