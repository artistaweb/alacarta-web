import LoginForm from "./ui/LoginForm";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await Promise.resolve(searchParams ?? {});
  const sentParam = sp.sent;
  const sent = (Array.isArray(sentParam) ? sentParam[0] : sentParam) === "1";

  const errorParam = sp.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg items-center px-4 py-12">
      <LoginForm sent={sent} error={typeof error === "string" ? error : null} />
    </main>
  );
}
