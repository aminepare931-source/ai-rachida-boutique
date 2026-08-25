// Rendu headless pour les sites dont le contenu est chargé en JavaScript côté client
// (ex: "Chargement..." dans le HTML brut, produits injectés après coup).
// Utilisé UNIQUEMENT en repli, quand le scan rapide (fetch simple) ne trouve rien —
// c'est lent (5-15s par page) et plus lourd, donc on l'évite quand ce n'est pas nécessaire.
//
// puppeteer-core + @sparticuz/chromium-min : le duo standard pour faire tourner un
// Chromium headless sur une fonction serverless (Vercel/Lambda) sans dépasser les
// limites de taille de déploiement. Le binaire Chromium est téléchargé à la volée
// depuis les releases GitHub du projet (mis en cache par l'environnement d'exécution
// entre deux appels "à chaud").
//
// IMPORTANT — si ça ne fonctionne pas après déploiement, la cause la plus probable est
// un timeout de fonction Vercel trop court. Augmente "Function Max Duration" dans
// Project Settings > Functions (Vercel) — le rendu JS peut prendre 10-15s par page.

const CHROMIUM_VERSION = "149.0.0";
const CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.x64.tar`;

let browserPromise: Promise<import("puppeteer-core").Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
        import("@sparticuz/chromium-min"),
        import("puppeteer-core"),
      ]);
      return puppeteer.launch({
        args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
        executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
        headless: "shell",
        defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false, isLandscape: true },
      });
    })().catch((err) => {
      browserPromise = null; // on retentera un lancement au prochain appel
      throw err;
    });
  }
  return browserPromise;
}

/**
 * Rend une page en exécutant son JavaScript, renvoie le HTML final.
 * Renvoie null en cas d'échec (timeout, page introuvable, etc.) — l'appelant doit
 * simplement continuer sans cette page plutôt que de faire échouer tout le scan.
 */
export async function renderPageHtml(url: string, timeoutMs = 12000): Promise<string | null> {
  let page: import("puppeteer-core").Page | null = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; RachidaBot/1.0; +https://ai-rachida-boutique.vercel.app)");
    await page.goto(url, { waitUntil: "networkidle2", timeout: timeoutMs });
    // Petit délai supplémentaire pour les rendus React/Vue qui finissent de peindre
    // juste après l'événement réseau.
    await new Promise((r) => setTimeout(r, 800));
    return await page.content();
  } catch (err) {
    console.error("[headless-render] Échec du rendu", url, err instanceof Error ? err.message : err);
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

/** À appeler en fin de traitement d'une requête pour libérer le navigateur. */
export async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // rien à faire, la fonction va de toute façon se terminer
  } finally {
    browserPromise = null;
  }
}
