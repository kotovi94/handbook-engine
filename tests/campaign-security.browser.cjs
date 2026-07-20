const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const baseUrl = process.env.CAMPAIGN_TEST_URL || 'http://127.0.0.1:5500/campaigns/?local=1';
const screenshotPath = process.env.CAMPAIGN_TEST_SCREENSHOT || 'campaign-security-browser.png';
const recoveryScreenshotPath = process.env.CAMPAIGN_TEST_RECOVERY_SCREENSHOT || '';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    assert.ok((await page.locator('body').innerText()).trim().length > 100, 'la página no debe estar vacía');

    await page.locator('#open-campaign-form').click();
    assert.equal(await page.locator('#campaign-security-title').innerText(), 'Sin protección');
    await page.locator('#configure-protection').click();
    assert.equal(await page.locator('#campaign-security-badge').textContent(), 'Pendiente');
    assert.equal(await page.locator('#save-campaign').innerText(), 'Guardar y activar protección');

    await page.locator('#campaign-name').fill('Campaña de seguridad');
    await page.locator('#campaign-password').fill('clave-segura');
    await page.locator('#campaign-password-confirm').fill('clave-distinta');
    await page.locator('#save-campaign').click();
    assert.match(await page.locator('#toast').innerText(), /no coinciden/i);
    assert.equal(await page.locator('#campaign-modal').isVisible(), true);

    await page.locator('#campaign-password-confirm').fill('clave-segura');
    await page.locator('#save-campaign').click();
    assert.equal(await page.locator('#recovery-result-title').innerText(), 'Campaña protegida correctamente');
    const firstRecoveryCode = await page.locator('#recovery-code-result').innerText();
    assert.match(firstRecoveryCode, /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/);
    assert.equal(await page.locator('#finish-recovery').isDisabled(), true);
    if (recoveryScreenshotPath) await page.screenshot({ path: recoveryScreenshotPath, fullPage: true });
    await page.locator('#recovery-code-saved').check();
    assert.equal(await page.locator('#finish-recovery').isEnabled(), true);
    await page.locator('#finish-recovery').click();
    assert.match(await page.locator('#campaign-grid').innerText(), /Protegida/);

    await page.locator('.open-campaign').click();
    assert.equal(await page.locator('#lock-campaign-now').isVisible(), true);
    await page.locator('#lock-campaign-now').click();
    assert.equal(await page.locator('[data-action="unlock-active-campaign"]').innerText(), 'Desbloquear campaña');

    await page.locator('[data-action="unlock-active-campaign"]').click();
    await page.locator('#unlock-password').fill('incorrecta');
    await page.locator('#unlock-form button[type="submit"]').click();
    assert.equal(await page.locator('#unlock-error').isVisible(), true);
    await page.locator('#unlock-password').fill('clave-segura');
    await page.locator('#unlock-form button[type="submit"]').click();
    assert.equal(await page.locator('#lock-campaign-now').isVisible(), true);

    await page.locator('#lock-campaign-now').click();
    await page.locator('[data-action="unlock-active-campaign"]').click();
    await page.locator('#forgot-password').click();
    await page.locator('#recovery-code').fill(firstRecoveryCode);
    await page.locator('#recovery-password').fill('clave-renovada');
    await page.locator('#recovery-password-confirm').fill('clave-renovada');
    await page.locator('#recovery-form button[type="submit"]').click();
    assert.equal(await page.locator('#recovery-result-title').innerText(), 'Contraseña restablecida correctamente');
    const secondRecoveryCode = await page.locator('#recovery-code-result').innerText();
    assert.notEqual(secondRecoveryCode, firstRecoveryCode);
    await page.locator('#recovery-code-saved').check();
    await page.locator('#finish-recovery').click();

    await page.locator('[data-action="campaigns-home"]').first().click();
    await page.locator('.edit-campaign').click();
    assert.equal(await page.locator('#campaign-security-title').innerText(), 'Campaña protegida');
    await page.locator('#remove-protection').click();
    assert.equal(await page.locator('#campaign-security-title').innerText(), 'Protección pendiente de quitar');
    await page.locator('#save-campaign').click();
    assert.doesNotMatch(await page.locator('#campaign-grid').innerText(), /Protegida/);

    const overlay = await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count();
    assert.equal(overlay, 0, 'no debe existir un overlay de error');
    assert.deepEqual(errors, [], `errores de navegador: ${errors.join(' | ')}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(JSON.stringify({ status: 'passed', firstRecoveryCodeFormat: true, recoveryRotated: true, consoleErrors: errors.length }));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
