import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          CogEvo
          <br />
          <span className="text-2xl text-gray-600">Event Connect</span>
        </h1>
        <p className="text-gray-500">
          展示会・学会専用セールス支援ツール
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Link href="/preset" className="block w-full">
          <Button className="w-full" size="lg">
            ログイン
          </Button>
        </Link>
        <p className="text-center text-xs text-gray-400">
          ※ デモ版のため認証はスキップされます
        </p>
      </div>
    </div>
  );
}
