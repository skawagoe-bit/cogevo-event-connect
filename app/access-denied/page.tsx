import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-red-100">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">アクセスが許可されていません</CardTitle>
          <CardDescription>
            このシステムを利用するには、管理者の許可（招待）が必要です。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-600">
          <p>
            あなたのメールアドレスは現在登録されていません。
            心当たりがある場合は、管理者にお問い合わせください。
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <SignOutButton>
                <Button variant="outline">サインアウト</Button>
            </SignOutButton>
        </CardFooter>
      </Card>
    </div>
  );
}
