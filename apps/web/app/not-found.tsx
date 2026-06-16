export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f4efe7_0%,_#efe4d8_100%)] px-6 py-12">
      <section className="max-w-xl rounded-[2rem] border border-stone-200 bg-white/80 p-8 text-center shadow-[0_24px_60px_rgba(57,35,44,0.12)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          EmprendeX
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-stone-950">
          No encontramos esta página.
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
          El recurso que buscas no está disponible o fue movido. Si llegaste
          desde un enlace compartido, solicita una nueva invitación.
        </p>
      </section>
    </main>
  );
}
