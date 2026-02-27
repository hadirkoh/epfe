import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Plateforme premium de biens immobiliers – Trouvez votre bien idéal et planifiez vos visites via Telegram." />
        <meta name="keywords" content="immobilier, appartement, villa, location, vente, Tunisie" />
        <meta property="og:title" content="LuxImmo – Biens Immobiliers Premium" />
        <meta property="og:description" content="Découvrez les meilleurs biens immobiliers disponibles." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
