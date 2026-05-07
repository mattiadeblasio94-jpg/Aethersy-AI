import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head />
      <body className="bg-bg text-slate-100 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
