import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="w-full" size="lg">
              ログインして開始
            </Button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <Link href="/dashboard" className="block w-full">
            <Button className="w-full" size="lg">
              ダッシュボードへ <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </SignedIn>

        <p className="text-center text-xs text-gray-400">
          Powered by Supabase & Clerk
        </p>
      </div>
    </div>
  );
}
