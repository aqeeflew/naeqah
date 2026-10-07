import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl leading-tight">Naeqah</h1>
      <p className="mt-3 text-neutral-600">
        Kad kahwin digital. Satu pautan, satu majlis.
      </p>
      {/*
        The gallery is the first step of the paying flow (SPEC.md → "Aliran
        utama"), and until task A7 lands this is the only way in. One link, so
        A6 is reachable rather than a page you have to know the URL of.
      */}
      <p className="mt-8">
        <Link
          href="/templates"
          className="underline underline-offset-4 hover:text-neutral-600"
        >
          Lihat template
        </Link>
      </p>
    </main>
  );
}
