"use client";

import { useState } from "react";
import { agreeToTerms } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;
    setIsLoading(true);
    try {
        await agreeToTerms();
    } catch (e: any) {
        console.error("Agreement error:", e);
        // Display specific error message if available, or generic one
        const msg = e.message || "エラーが発生しました";
        alert(`処理に失敗しました: ${msg}`);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">利用規約とプライバシーポリシー</CardTitle>
          <CardDescription className="text-center">
            本システムを利用する前に、以下の内容をご確認ください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 overflow-y-auto border rounded-md p-4 bg-white text-sm text-gray-700 leading-relaxed">
            <h3 className="font-bold mb-2">1. プライバシーポリシー</h3>
            <p className="mb-4">
              当社は、本システムを通じて収集した個人情報（名刺情報を含みますがこれに限りません）を、厳重に管理し、本来の目的以外には使用しません。
              詳細なプライバシーポリシーについては、社内規定をご参照ください。
            </p>
            
            <h3 className="font-bold mb-2">2. 利用目的</h3>
            <p className="mb-4">
              本システムは、展示会における来場者管理および営業活動の効率化を目的としています。
              登録された情報は、Sansan等の外部サービスと連携し、社内の顧客管理データベースに統合されます。
            </p>

            <h3 className="font-bold mb-2">3. 禁止事項</h3>
            <p className="mb-4">
              - 本システムで得た情報を、当社の許可なく第三者に開示・漏洩すること。
              - 自身の権限を超えて、不正に情報にアクセスすること。
              - その他、法令や社内規定に違反する行為。
            </p>

            <h3 className="font-bold mb-2">4. 免責事項</h3>
            <p>
              本システムの利用により生じた損害について、システム管理者は一切の責任を負いません。
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox 
                id="terms" 
                checked={agreed} 
                onCheckedChange={(c) => setAgreed(!!c)} 
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              上記の内容を理解し、本システムの利用規約に同意します
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full text-lg h-12" 
            onClick={handleSubmit} 
            disabled={!agreed || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            同意して利用を開始する
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
