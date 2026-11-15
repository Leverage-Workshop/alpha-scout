import { PromptBox } from "@/components/prompt-box";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">Alpha Scout</h1>
      <PromptBox />
    </main>
  );
}
